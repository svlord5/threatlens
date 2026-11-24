import https from 'https';

// The Wazuh manager commonly uses a self-signed certificate. Trust is opt-in and scoped to
// requests made by this module only (never process-wide via NODE_TLS_REJECT_UNAUTHORIZED).
// Prefer pinning the CA with WAZUH_CA_CERT (PEM contents); WAZUH_TLS_INSECURE=true skips
// verification for local lab use only.
const WAZUH_URL = process.env.WAZUH_API_URL || 'https://127.0.0.1:55000';

function wazuhCredentials() {
  const user = process.env.WAZUH_API_USER;
  const pass = process.env.WAZUH_API_PASSWORD;
  if (!user || !pass) {
    throw new Error('WAZUH_API_USER and WAZUH_API_PASSWORD must be set');
  }
  return { user, pass };
}

const wazuhAgent = new https.Agent({
  ca: process.env.WAZUH_CA_CERT || undefined,
  rejectUnauthorized: process.env.WAZUH_TLS_INSECURE !== 'true',
});

interface WazuhResponse {
  ok: boolean;
  status: number;
  statusText: string;
  text: () => Promise<string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: () => Promise<any>;
}

/** Minimal fetch replacement that uses the module-scoped TLS agent. */
function wazuhFetch(
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string } = {}
): Promise<WazuhResponse> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      { method: init.method || 'GET', headers: init.headers, agent: wazuhAgent, timeout: 10000 },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          const status = res.statusCode || 0;
          resolve({
            ok: status >= 200 && status < 300,
            status,
            statusText: res.statusMessage || '',
            text: async () => body,
            json: async () => JSON.parse(body),
          });
        });
      }
    );
    req.on('timeout', () => req.destroy(new Error('Wazuh request timed out')));
    req.on('error', reject);
    if (init.body) req.write(init.body);
    req.end();
  });
}

/**
 * Gets a JWT authentication token from the Wazuh Manager API.
 */
export async function getWazuhAuthToken(): Promise<string> {
  const { user, pass } = wazuhCredentials();
  const response = await wazuhFetch(`${WAZUH_URL}/security/user/authenticate`, {
    method: 'GET', // Wazuh 4.x requires GET for authentication
    headers: {
      'Authorization': `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`
    }
  });

  if (!response.ok) {
    throw new Error(`Wazuh Authentication Failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data.token;
}

/**
 * Triggers an Active Response command on a specific agent.
 * 
 * @param token The JWT auth token
 * @param machineName The name of the machine (Agent name)
 * @param command The AR command to run (e.g., 'firewall-drop', 'isolate-host')
 * @param args Array of arguments for the command
 */
export async function triggerActiveResponse(
  machineName: string, 
  command: string, 
  args: string[] = []
): Promise<{ success: boolean; message?: string }> {
  try {
    const token = await getWazuhAuthToken();

    // 1. Get the Agent ID from the machine name
    const agentsResponse = await wazuhFetch(`${WAZUH_URL}/agents?q=${encodeURIComponent(`name=${machineName}`)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!agentsResponse.ok) {
      throw new Error("Failed to query Wazuh agents");
    }

    const agentsData = await agentsResponse.json();
    const agents = agentsData.data.affected_items;

    if (!agents || agents.length === 0) {
      return { success: false, message: `No Wazuh agent found with name: ${machineName}` };
    }

    const agentId = agents[0].id;

    // 2. Trigger Active Response
    const arResponse = await wazuhFetch(`${WAZUH_URL}/active-response`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        command: command,
        arguments: args,
        agents_list: [agentId]
      })
    });

    if (!arResponse.ok) {
      const err = await arResponse.text();
      throw new Error(`Failed to trigger Active Response: ${err}`);
    }

    return { success: true, message: `Active response '${command}' sent to agent ${agentId}.` };
  } catch (error: any) {
    console.error("Wazuh API Error:", error);
    return { success: false, message: error.message };
  }
}
