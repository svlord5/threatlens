/* eslint-disable @typescript-eslint/no-explicit-any */
import { clip } from "@/lib/limits";

export interface DiscordLogInput {
  action: string;
  // Supabase user object (shape differs between callers)
  user?: any;
  metadata?: string;
}

/** Posts a security event embed to the DISCORD_WEBHOOK. Throws on failure. */
export async function sendDiscordLog(input: DiscordLogInput): Promise<void> {
  const action = clip(input.action, 40);
  const user = input.user;
  const metadata = input.metadata === undefined ? undefined : clip(input.metadata, 500);
  const webhookUrl = process.env.DISCORD_WEBHOOK;
  if (!webhookUrl) {
    console.warn("DISCORD_WEBHOOK is not set in environment variables.");
    throw new Error("Webhook not configured");
  }

  // Determine embed color based on action type
  let color = 16711680; // Red for severe violations (Screenshots, Access Denied)
  if (action === 'SESSION_EXPIRED') color = 16753920; // Orange
  if (action === 'COPY_ATTEMPT') color = 16776960; // Yellow
  if (action === 'PAGE_VISIT' || action === 'ACTION_PERFORMED') color = 3447003; // Blue for info
  if (action === 'LOGIN') color = 3066993; // Green
  if (action === 'LOGOUT') color = 9807270; // Gray

  let title = "Security Event Detected";
  switch (action) {
    case 'UNAUTHORIZED_ACCESS':
      title = "🚨 Unauthorized Access Attempt";
      break;
    case 'SCREENSHOT_BLOCKED':
      title = "📸 OS Screenshot Blocked";
      break;
    case 'COPY_ATTEMPT':
      title = "📋 Data Exfiltration Attempt (Copy)";
      break;
    case 'SESSION_EXPIRED':
      title = "⏱️ Access Session Expired";
      break;
    case 'PAGE_VISIT':
      title = "👣 Page Visit Logged";
      break;
    case 'ACTION_PERFORMED':
      title = "⚡ Analyst Action Recorded";
      break;
    case 'LOGIN':
      title = "✅ Authentication Successful";
      break;
    case 'LOGOUT':
      title = "🚪 User Signed Out";
      break;
  }

  const metadataObj = user?.user_metadata || {};
  const identity = user?.identities?.find((i: any) => i.provider === 'discord') || {};
  
  const discordId = clip(identity.id || metadataObj.provider_id || metadataObj.sub || "Unknown ID", 40);
  const discordName = clip(metadataObj.custom_claims?.global_name || metadataObj.full_name || metadataObj.name || user?.email || "Unknown User", 100);
  const rawAvatar = String(metadataObj.avatar_url || metadataObj.picture || "");
  const avatarUrl = /^https:\/\/(cdn\.discordapp\.com|lh3\.googleusercontent\.com)\//.test(rawAvatar)
    ? rawAvatar
    : "https://cdn.discordapp.com/embed/avatars/0.png";

  const payload = {
    username: "ThreatLens Security Bot",
    avatar_url: "https://cdn.discordapp.com/embed/avatars/0.png",
    embeds: [
      {
        title: title,
        color: color,
        thumbnail: {
          url: avatarUrl
        },
        fields: [
          {
            name: "Analyst",
            value: discordName,
            inline: true
          },
          {
            name: "Discord ID",
            value: discordId,
            inline: true
          },
          {
            name: "Email",
            value: clip(user?.email || metadataObj.email || "No Email Provided", 120),
            inline: false
          },
          {
            name: "Supabase UUID",
            value: clip(user?.id || "Unknown UUID", 60),
            inline: false
          },
          {
            name: "Context",
            value: metadata || "No additional context provided",
            inline: false
          }
        ],
        footer: {
          text: "ThreatLens RBAC Engine • " + new Date().toISOString()
        }
      }
    ]
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Discord API responded with ${response.status}`);
  }

}
