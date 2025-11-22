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
  const response = await fetch(`${BACKEND_URL}/api/sessions/patients/${patientId}/context`);

  if (!response.ok) {
    throw new Error(`Context fetch failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.context_text;
}

/**
 * Connect to Hume WebSocket
 */
export async function connectToHume(configId: string): Promise<WebSocket> {
  const token = await getHumeSessionToken();
  const url = `${HUME_WS_URL}?access_token=${token}&config_id=${configId}`;

  return new WebSocket(url);
}
