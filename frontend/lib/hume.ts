const HUME_WS_URL = 'wss://api.hume.ai/v0/evi/chat';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export interface HumeSessionToken {
  access_token: string;
  expires_in: number;
}

export interface HumeAudioSettings {
  encoding: 'linear16';
  sample_rate: number;
  channels: number;
}

/**
 * Get Hume session token from backend
 */
export async function getHumeSessionToken(): Promise<string> {
  const response = await fetch(`${BACKEND_URL}/api/hume/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`Token generation failed: ${response.statusText}`);
  }

  const data: HumeSessionToken = await response.json();
  return data.access_token;
}

/**
 * Get patient context text for injection
 */
export async function getPatientContext(patientId: string): Promise<string> {
  try {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const response = await fetch(
      `${BACKEND_URL}/api/sessions/patients/${patientId}/context`,
      {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Context fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.context_text;
  } catch (error) {
    console.error('Failed to fetch patient context', error);
    // Fall back to empty context so the Hume connection can still proceed.
    return '';
  }
}

/**
 * Connect to Hume WebSocket
 * Returns a Promise that resolves when the WebSocket connection is established
 */
export async function connectToHume(configId: string): Promise<WebSocket> {
  const token = await getHumeSessionToken();
  const url = `${HUME_WS_URL}?access_token=${token}&config_id=${configId}`;

  // Create WebSocket and wait for it to open
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);

    // Timeout after 10 seconds
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('Hume WebSocket connection timeout'));
    }, 10000);

    ws.onopen = () => {
      clearTimeout(timeout);
      console.log('[Hume] WebSocket opened and ready');
      resolve(ws);
    };

    ws.onerror = (error) => {
      clearTimeout(timeout);
      console.error('[Hume] WebSocket connection error:', error);
      reject(new Error('Failed to connect to Hume WebSocket'));
    };
  });
}
