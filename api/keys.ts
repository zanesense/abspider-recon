import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const adminClient = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;

type AuthError = { user: null; status: number; body: any };
type AuthSuccess = { user: NonNullable<any>; status: null; body: null };

async function authenticate(request: any): Promise<AuthError | AuthSuccess> {
  const auth = request.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return { user: null, status: 401, body: { error: 'Missing Authorization header' } };
  const token = auth.slice(7);
  if (!adminClient) return { user: null, status: 500, body: { error: 'Server misconfigured' } };
  const { data: { user }, error } = await adminClient.auth.getUser(token);
  if (error || !user) return { user: null, status: 401, body: { error: 'Invalid or expired token' } };
  // Success: return user with null status/body so the caller can distinguish
  return { user, status: null, body: null };
}

export default async function handler(request: any, response: any) {
  const setCors = () => {
    response.setHeader('Access-Control-Allow-Origin', request.headers.origin || '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.setHeader('Access-Control-Allow-Credentials', 'true');
  };
  setCors();

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  if (!adminClient) {
    response.status(500).json({ error: 'Server misconfigured' });
    return;
  }

  const auth = await authenticate(request);
  if (!auth.user) {
    // status is always set when user is null
    response.status(auth.status as number).json(auth.body);
    return;
  }

  const { user } = auth;

  if (request.method === 'GET') {
    const { data, error } = await adminClient
      .from('user_api_keys')
      .select('api_keys')
      .eq('user_id', user.id)
      .single();

    if (error) {
      response.status(200).json({});
      return;
    }
    response.status(200).json(data?.api_keys || {});
    return;
  }

  if (request.method === 'POST') {
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
    if (!body || typeof body !== 'object') {
      response.status(400).json({ error: 'Invalid body' });
      return;
    }

    const { data: existing } = await adminClient
      .from('user_api_keys')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      const { error } = await adminClient
        .from('user_api_keys')
        .update({ api_keys: body })
        .eq('user_id', user.id);
      if (error) {
        response.status(500).json({ error: 'Failed to save API keys' });
        return;
      }
    } else {
      const { error } = await adminClient
        .from('user_api_keys')
        .insert({ user_id: user.id, api_keys: body });
      if (error) {
        response.status(500).json({ error: 'Failed to save API keys' });
        return;
      }
    }

    response.status(200).json({ ok: true });
    return;
  }

  response.status(405).json({ error: 'Method not allowed' });
}
