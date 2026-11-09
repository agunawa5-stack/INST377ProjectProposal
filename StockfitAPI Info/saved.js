// Simple shared demo list. There is no user login: do not use for private data.
const apiBase = () => `${process.env.SUPABASE_URL?.replace(/\/$/, '')}/rest/v1/saved_companies`;

export default async function handler(req, res) {
  if (!['GET', 'POST', 'DELETE'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!process.env.SUPABASE_URL || !key) return res.status(503).json({ error: 'Supabase is not configured yet.' });

  const symbol = String(req.method === 'DELETE' ? req.query.symbol : req.body?.symbol || '').trim().toUpperCase();
  if (req.method !== 'GET' && !/^[A-Z0-9.-]{1,12}$/.test(symbol)) return res.status(400).json({ error: 'Invalid ticker symbol.' });

  let url = apiBase();
  let method = req.method;
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
  let body;
  if (method === 'GET') url += '?select=symbol,created_at&order=created_at.desc&limit=100';
  if (method === 'POST') { headers.Prefer = 'resolution=merge-duplicates,return=representation'; body = JSON.stringify({ symbol }); headers['Content-Profile'] = 'public'; }
  if (method === 'DELETE') url += `?symbol=eq.${encodeURIComponent(symbol)}`;
  try {
    const response = await fetch(url, { method, headers, body, signal: AbortSignal.timeout(10000) });
    const data = await response.json().catch(() => []);
    if (!response.ok) return res.status(502).json({ error: 'Database operation failed. Check the Supabase table and settings.' });
    return res.status(200).json(data);
  } catch (error) {
    return res.status(502).json({ error: 'Could not connect to Supabase.' });
  }
}
