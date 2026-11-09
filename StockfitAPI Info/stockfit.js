// Vercel serverless endpoint. Keep your STOCKFIT_API_TOKEN on the server.
const endpoints = {
  company: '/api/company/details',
  financials: '/api/financials/income-statement',
  insiders: '/api/insider-transactions'
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const symbol = String(req.query.symbol || '').trim().toUpperCase();
  const type = String(req.query.type || 'company');
  if (!/^[A-Z0-9.-]{1,12}$/.test(symbol)) return res.status(400).json({ error: 'Enter a valid ticker symbol.' });
  if (!Object.hasOwn(endpoints, type)) return res.status(400).json({ error: 'Invalid data type.' });
  if (!process.env.STOCKFIT_API_TOKEN) return res.status(503).json({ error: 'StockFit token is not configured on the server.' });

  const params = new URLSearchParams({ symbol });
  if (type === 'financials') { params.set('period', 'annual'); params.set('limit', '5'); }
  if (type === 'insiders') { params.set('pageSize', '15'); params.set('filter', 'significant'); }

  try {
    const upstream = await fetch(`https://api.stockfit.io/v1${endpoints[type]}?${params}`, {
      headers: { Authorization: `Bearer ${process.env.STOCKFIT_API_TOKEN}` },
      signal: AbortSignal.timeout(12000)
    });
    if (!upstream.ok) {
      const reason = upstream.status === 401 ? 'Check your StockFit token.'
        : upstream.status === 403 ? 'Your StockFit plan may not include this endpoint.'
        : upstream.status === 429 ? 'StockFit rate limit reached. Try again later.'
        : `StockFit returned HTTP ${upstream.status}.`;
      return res.status(upstream.status).json({ error: reason });
    }
    const data = await upstream.json();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(data);
  } catch (error) {
    return res.status(502).json({ error: 'Could not reach StockFit. Check the network or try again.' });
  }
}
