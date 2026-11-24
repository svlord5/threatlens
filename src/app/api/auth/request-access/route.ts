import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getSupabaseSecretKey } from '@/utils/supabase/keys';
import { requireAuth } from '@/lib/api-auth';
import { rateLimitIp, rateLimitKey } from '@/lib/rate-limit';
import { PREFILL_COOKIE, prefillCookieOptions, readPrefill } from '@/lib/prefill';
import { rejectLargeBody, LIMITS } from '@/lib/limits';
import { DEMO_MESSAGE, isDemoMode } from '@/lib/demo';

// Security: drop every angle bracket (so no HTML tag can be formed, however it is nested)
// and control characters. Output is also escaped by React when displayed.
function sanitizeInput(str: string): string {
  if (!str) return '';
  return str
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = getSupabaseSecretKey();
  if (!supabaseUrl || !secretKey) {
    throw new Error('Supabase service configuration is missing in environment.');
  }
  return createSupabaseClient(supabaseUrl, secretKey);
}

export async function POST(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json({ success: false, error: DEMO_MESSAGE }, { status: 403 });
  }
  // Public endpoint: very strict. 3 requests per IP per hour, tiny body.
  const limited = await rateLimitIp(request, 'access_request', 3, 3600);
  if (limited) return limited;
  const tooBig = rejectLargeBody(request, LIMITS.body.form);
  if (tooBig) return tooBig;
  try {
    const body = await request.json();
    const { turnstileToken } = body;
    let { organization, purpose, website } = body;

    // Name, email and Discord ID are never taken from the request body: they come from the
    // signed cookie the auth callback set after a Google / Discord sign-in (see lib/prefill.ts).
    const verified = readPrefill(request);
    if (!verified?.email || !verified.fullName) {
      return NextResponse.json(
        { success: false, error: 'Please verify your name and email with Google first.' },
        { status: 400 }
      );
    }
    let fullName: string = verified.fullName;
    let email: string = verified.email;
    let discordId: string = verified.discordId || '';

    // 1. Mandatory fields check
    if (!organization || !purpose) {
      return NextResponse.json(
        { success: false, error: 'Organization and Purpose are required.' },
        { status: 400 }
      );
    }

    // 2. Sanitize all inputs to mitigate XSS and injection
    fullName = sanitizeInput(String(fullName));
    email = sanitizeInput(String(email)).toLowerCase();
    organization = sanitizeInput(String(organization));
    purpose = sanitizeInput(String(purpose));
    website = website ? sanitizeInput(String(website)) : '';
    discordId = discordId ? sanitizeInput(String(discordId)) : '';

    // 3. Strict Full Name Validation (prevent numbers and attack strings)
    if (/\d/.test(fullName)) {
      return NextResponse.json(
        { success: false, error: 'Full Name cannot contain numbers. Please enter alphabetic characters only.' },
        { status: 400 }
      );
    }

    const nameRegex = /^[a-zA-Z\s.'-]{2,70}$/;
    if (!nameRegex.test(fullName)) {
      return NextResponse.json(
        { success: false, error: 'Full Name must be 2-70 characters long and contain only letters, spaces, hyphens, or periods.' },
        { status: 400 }
      );
    }

    // 4. Strict Email Validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email) || email.length > 120) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid academic or professional email address.' },
        { status: 400 }
      );
    }

    // 5. Organization & Purpose bounds
    if (organization.length < 2 || organization.length > 150) {
      return NextResponse.json(
        { success: false, error: 'Organization name must be between 2 and 150 characters.' },
        { status: 400 }
      );
    }

    if (purpose.length < 5 || purpose.length > 600) {
      return NextResponse.json(
        { success: false, error: 'Intended purpose must be between 5 and 600 characters.' },
        { status: 400 }
      );
    }

    // 6. Optional Website / LinkedIn Validation
    if (website) {
      if (website.length > 250) {
        return NextResponse.json(
          { success: false, error: 'Website / LinkedIn URL must be under 250 characters.' },
          { status: 400 }
        );
      }
      if (!/^https?:\/\//i.test(website)) {
        return NextResponse.json(
          { success: false, error: 'Website / LinkedIn URL must start with https:// (e.g. https://linkedin.com/in/...)' },
          { status: 400 }
        );
      }
      const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/i;
      if (!urlPattern.test(website)) {
        return NextResponse.json(
          { success: false, error: 'Please provide a valid LinkedIn or website URL starting with https:// (e.g. https://linkedin.com/in/...)' },
          { status: 400 }
        );
      }
    }

    // 7. Optional Discord User ID Validation (Snowflake: 17 to 20 digits)
    if (discordId) {
      const snowflakeRegex = /^\d{17,20}$/;
      if (!snowflakeRegex.test(discordId)) {
        return NextResponse.json(
          { success: false, error: 'Discord User ID must be a 17-20 digit numerical snowflake (e.g. 123456789012345678).' },
          { status: 400 }
        );
      }
    }

    // 8. Cloudflare Turnstile Server Verification (if secret key is configured)
    // The captcha is enforced here, on the server: a missing, invalid or unverifiable token is rejected.
    const turnstileSecret = process.env.CLOUDFLARE_SECRET_TURNSTILE_KEY;
    if (!turnstileSecret) {
      if (process.env.NODE_ENV === 'production') {
        console.error('CLOUDFLARE_SECRET_TURNSTILE_KEY is not set; refusing access requests.');
        return NextResponse.json({ success: false, error: 'Access requests are temporarily unavailable.' }, { status: 503 });
      }
    } else {
      if (typeof turnstileToken !== 'string' || turnstileToken.length === 0 || turnstileToken.length > 2048) {
        return NextResponse.json({ success: false, error: 'Please complete the verification check.' }, { status: 400 });
      }
      try {
        const formData = new URLSearchParams();
        formData.append('secret', turnstileSecret);
        formData.append('response', turnstileToken);
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
        if (ip) formData.append('remoteip', ip);

        const cfRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          signal: AbortSignal.timeout(5000),
        });
        const cfData = await cfRes.json();
        if (!cfData.success) {
          console.warn('Turnstile verification failed:', cfData['error-codes']);
          return NextResponse.json({ success: false, error: 'Verification failed. Please try again.' }, { status: 400 });
        }
      } catch (cfErr) {
        console.error('Turnstile verification error:', cfErr);
        return NextResponse.json({ success: false, error: 'Could not verify the request. Please try again.' }, { status: 503 });
      }
    }

    // One request per email address per day, so a single address cannot be used to flood the admin queue.
    const emailLimited = await rateLimitKey('access_email', email, 1, 86400);
    if (emailLimited) return emailLimited;

    // Extract client IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || null;

    // 9. Persist Access Request into database (audit_logs)
    const requestDetails = {
      fullName,
      email,
      organization,
      website: website || '',
      discordId: discordId || '',
      purpose,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    };

    let logId: string | null = null;
    try {
      const supabase = getServiceClient();
      const { data: inserted, error: dbError } = await supabase
        .from('audit_logs')
        .insert([{
          action: 'ACCESS_REQUEST',
          details: JSON.stringify(requestDetails),
          ip_address: clientIp,
        }])
        .select('id')
        .single();

      if (dbError) {
        console.error('Failed to save access request to audit_logs:', dbError);
      } else if (inserted) {
        logId = inserted.id;
      }
    } catch (dbErr) {
      console.error('Database connection error while saving access request:', dbErr);
    }

    // 10. Notify the configured Discord webhook (optionally pinging ACCESS_NOTIFY_DISCORD_ID)
    const webhookUrl = process.env.DISCORD_WEBHOOK;
    // Optional: Discord user ID to ping on new requests (set ACCESS_NOTIFY_DISCORD_ID).
    const notifyId = /^\d{17,20}$/.test(process.env.ACCESS_NOTIFY_DISCORD_ID || '') ? process.env.ACCESS_NOTIFY_DISCORD_ID! : null;

    if (webhookUrl) {
      // Never ping the applicant-supplied ID: anyone could use the webhook to ping arbitrary users.
      const uniqueMentions = notifyId ? [notifyId] : [];

      const embedFields = [
        {
          name: '👤 Full Name',
          value: fullName,
          inline: true,
        },
        {
          name: '📧 Email Address',
          value: email,
          inline: true,
        },
        {
          name: '🏢 Organization / Affiliation',
          value: organization,
          inline: false,
        },
        {
          name: '🌐 LinkedIn / Portfolio Website',
          value: website ? (website.startsWith('http') ? website : `https://${website}`) : '*None provided*',
          inline: false,
        },
        {
          name: '🎯 Intended Focus / Purpose',
          value: purpose,
          inline: false,
        },
      ];

      if (discordId) {
        embedFields.push({
          name: '🆔 Applicant Discord ID',
          value: `\`${discordId}\``,
          inline: true,
        });
      }

      embedFields.push({
        name: '⏱️ Submission Time (UTC)',
        value: new Date().toUTCString(),
        inline: true,
      });

      const discordPayload = {
        username: 'ThreatLens Access Gateway',
        avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
        content: `${notifyId ? `<@${notifyId}> ` : ''}🚨 **New ThreatLens Access Request Received!**`,
        allowed_mentions: {
          parse: [],
          users: uniqueMentions,
        },
        embeds: [
          {
            title: '🛡️ ThreatLens Platform Access Request',
            description: 'A new applicant has submitted a vetted application for private SOC access. Monitor and authorize from the Admin IAM Console.',
            color: 4351980,
            fields: embedFields,
            footer: {
              text: 'ThreatLens SOC Gateway • surajv5.in',
              icon_url: 'https://surajv5.in/icons/Icon.png',
            },
          },
        ],
      };

      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload),
      }).catch((whErr) => console.error('Discord webhook ping failed:', whErr));
    }

    // The verified identity is single-use: clear it once the application is stored.
    const ok = NextResponse.json({
      success: true,
      id: logId,
      request: requestDetails,
    });
    ok.cookies.set(PREFILL_COOKIE, '', prefillCookieOptions(process.env.NODE_ENV === 'production', 0));
    return ok;
  } catch (error: any) {
    console.error('Request access API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  if (isDemoMode()) {
    // Demo: serve the synthetic access requests (the admin screen reads this).
    const { createDemoDb } = await import('@/lib/demo/data');
    const requests = createDemoDb().audit_logs
      .filter((l) => l.action === 'ACCESS_REQUEST')
      .map((l) => ({ id: l.id, createdAt: l.created_at, ...JSON.parse(l.details) }));
    return NextResponse.json({ success: true, requests });
  }
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim().toLowerCase();
    const discordId = searchParams.get('discordId')?.trim();

    // These values go into a PostgREST .or() filter, where commas and parentheses would
    // inject extra conditions. Accept only strict shapes.
    if (
      (email && !/^[a-z0-9._%+-]{1,64}@[a-z0-9.-]{1,190}\.[a-z]{2,24}$/.test(email)) ||
      (discordId && !/^\d{17,20}$/.test(discordId))
    ) {
      return NextResponse.json({ success: false, error: 'Invalid lookup value.' }, { status: 400 });
    }
    const all = searchParams.get('all') === '1' || searchParams.get('admin') === '1';

    // Listing every request is admin-only; the single-applicant status lookup stays public (and is limited).
    if (email || discordId) {
      const limited = await rateLimitIp(request, 'access_lookup', 15, 60);
      if (limited) return limited;
    }
    if (all && !email && !discordId) {
      const authz = await requireAuth(request, { adminOnly: true });
      if (!authz.ok) return authz.response;
    }

    const supabase = getServiceClient();

    // 1. Single applicant status lookup (for /create-account pending status check)
    if (email || discordId) {
      // First check if user is already whitelisted in iam_discord_invites
      const orConditions: string[] = [];
      if (email) orConditions.push(`discord_id.eq.${email}`);
      if (discordId) orConditions.push(`discord_id.eq.${discordId}`);

      if (orConditions.length > 0) {
        const { data: whitelisted } = await supabase
          .from('iam_discord_invites')
          .select('discord_id, role, valid_until, created_at')
          .or(orConditions.join(','))
          .maybeSingle();

        if (whitelisted) {
          return NextResponse.json({
            success: true,
            request: {
              email: email || whitelisted.discord_id,
              discordId: discordId || '',
              status: 'APPROVED',
              role: whitelisted.role,
              approvedAt: whitelisted.created_at,
            },
            isWhitelisted: true,
          });
        }
      }

      // If not in active invites, check latest ACCESS_REQUEST in audit_logs
      const { data: logs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('action', 'ACCESS_REQUEST')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      let matchedRequest: any = null;
      for (const log of logs || []) {
        try {
          const parsed = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
          if (
            (email && parsed.email?.toLowerCase() === email) ||
            (discordId && parsed.discordId === discordId)
          ) {
            // Public endpoint: status only. No name, organization, purpose, website or IP.
            matchedRequest = {
              id: log.id,
              createdAt: log.created_at,
              status: parsed.status,
              role: parsed.role,
              approvedAt: parsed.approvedAt,
            };
            break;
          }
        } catch {}
      }

      return NextResponse.json({
        success: true,
        request: matchedRequest,
      });
    }

    // 2. Admin monitor lookup: return all access clearance requests
    if (all) {
      const { data: logs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('action', 'ACCESS_REQUEST')
        .order('created_at', { ascending: false })
        .limit(150);

      if (error) throw error;

      const requests = (logs || []).map((log) => {
        let details: any = {};
        try {
          details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
        } catch {
          details = { raw: log.details };
        }
        return {
          id: log.id,
          createdAt: log.created_at,
          ip_address: log.ip_address,
          ...details,
        };
      });

      return NextResponse.json({
        success: true,
        requests,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Provide email or discordId for status, or all=1 for admin listing.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Request access GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const authz = await requireAuth(request, { adminOnly: true });
  if (!authz.ok) return authz.response;
  const tooBig = rejectLargeBody(request, LIMITS.body.small);
  if (tooBig) return tooBig;

  try {
    const body = await request.json();
    const { id, action, role = 'Analyst', allowedPages = ['/dashboard'], validUntil = null } = body;

    if (!id || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Valid id and action ("APPROVE" or "REJECT") are required.' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Fetch the target log record
    const { data: logRecord, error: fetchErr } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !logRecord) {
      return NextResponse.json({ success: false, error: 'Access request record not found.' }, { status: 404 });
    }

    let details: any = {};
    try {
      details = typeof logRecord.details === 'string' ? JSON.parse(logRecord.details) : logRecord.details;
    } catch {
      details = {};
    }

    const reviewedAt = new Date().toISOString();
    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const updatedDetails = {
      ...details,
      status: newStatus,
      reviewedAt,
    };

    // Update audit_logs record
    const { error: updateErr } = await supabase
      .from('audit_logs')
      .update({ details: JSON.stringify(updatedDetails) })
      .eq('id', id);

    if (updateErr) throw updateErr;

    // If APPROVE, insert whitelist entries into iam_discord_invites
    if (action === 'APPROVE') {
      const email = details.email?.trim().toLowerCase();
      const discordId = details.discordId?.trim();

      const invitePayload = {
        role,
        allowed_pages: allowedPages,
        valid_until: validUntil,
        enforce_single_session: true,
        read_only: false,
        disable_copy: false,
        disable_screenshot: false,
        super_admin: false,
      };

      if (email) {
        await supabase.from('iam_discord_invites').upsert({
          ...invitePayload,
          discord_id: email,
        });
      }

      if (discordId && /^\d{17,20}$/.test(discordId)) {
        await supabase.from('iam_discord_invites').upsert({
          ...invitePayload,
          discord_id: discordId,
        });
      }

      // Send Discord notification confirming clearance
      const webhookUrl = process.env.DISCORD_WEBHOOK;
      if (webhookUrl) {
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'ThreatLens SOC Gateway',
            avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
            embeds: [
              {
                title: '✅ ThreatLens SOC Clearance Approved',
                description: `Access clearance granted for **${details.fullName || 'Operator'}** (${details.email}). Identity has been added to active whitelists.`,
                color: 5763719,
                fields: [
                  { name: '📧 Whitelisted Identity', value: details.email, inline: true },
                  { name: '🛡️ Role Assigned', value: role, inline: true },
                  { name: '⏱️ Clearance Time', value: new Date().toUTCString(), inline: true },
                ],
                footer: {
                  text: 'ThreatLens IAM Console • surajv5.in',
                  icon_url: 'https://surajv5.in/icons/Icon.png',
                },
              },
            ],
          }),
        }).catch((err) => console.error('Approval discord webhook error:', err));
      }
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: action === 'APPROVE' ? 'Applicant cleared and whitelisted.' : 'Access request rejected.',
    });
  } catch (error: any) {
    console.error('Request access PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

