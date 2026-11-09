const form = document.getElementById('search-form');
const tickerInput = document.getElementById('ticker');
const statusBox = document.getElementById('status');
const results = document.getElementById('results');
const saveButton = document.getElementById('save-btn');
let currentSymbol = '';
let financialChart = null;

const text = (id, value) => { document.getElementById(id).textContent = value ?? '—'; };
const money = value => Number.isFinite(Number(value)) ? '$' + Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—';
const compactMoney = value => Number.isFinite(Number(value)) ? '$' + (Number(value) / 1e9).toFixed(1) + 'B' : '—';
const count = value => Number.isFinite(Number(value)) ? Number(value).toLocaleString('en-US') : '—';

async function request(type, symbol) {
  const response = await fetch(`/api/stockfit?type=${encodeURIComponent(type)}&symbol=${encodeURIComponent(symbol)}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function showCompany(data, symbol) {
  // Company profile fields depend on the StockFit response schema.
  const company = data.data && !Array.isArray(data.data) ? data.data : data;
  text('company-name', company.name || company.companyName || symbol);
  text('company-subtitle', company.description || 'Public company research overview');
  text('metric-symbol', symbol);
  text('metric-sector', company.sector || 'Not provided');
  text('metric-industry', company.industry || 'Not provided');
}

function showFinancials(data) {
  const rows = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
  const points = rows.map(item => ({
    period: String(item.period || item.fiscalYear || item.date || ''),
    revenue: Number(item.facts?.revenue ?? item.revenue),
    profit: Number(item.facts?.netIncome ?? item.netIncome)
  })).filter(item => item.period && Number.isFinite(item.revenue) && Number.isFinite(item.profit)).sort((a,b)=>a.period.localeCompare(b.period));

  if (!points.length) { text('financial-message', 'No annual financial data available for this company.'); return; }
  if (typeof Chart === 'undefined') { text('financial-message', 'The chart library did not load. Check your internet connection.'); return; }
  text('financial-message', 'Values shown in billions of U.S. dollars.');
  if (financialChart) financialChart.destroy();
  financialChart = new Chart(document.getElementById('financial-chart'), {
    type: 'bar',
    data: { labels: points.map(p=>p.period), datasets: [
      { label: 'Revenue', data: points.map(p=>p.revenue/1e9), backgroundColor:'#67b68c' },
      { label: 'Net income', data: points.map(p=>p.profit/1e9), backgroundColor:'#a7d7b7' }
    ] },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { title: {display:true,text:'USD billions'} } } }
  });
}

function showTrades(data) {
  const trades = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
  const tbody = document.getElementById('trades-body');
  tbody.replaceChildren();
  if (!trades.length) { text('trades-message', 'No reported transactions found for this symbol.'); return; }
  for (const trade of trades) {
    const tr = document.createElement('tr');
    const action = trade.transactionCode === 'P' ? 'Buy' : trade.transactionCode === 'S' ? 'Sell' : (trade.transactionCode || 'Other');
    const fields = [trade.transactionDate || '—', trade.ownerName || '—', action, count(trade.shares), money(trade.transactionValue)];
    for (const value of fields) { const td = document.createElement('td'); td.textContent = value; tr.append(td); }
    const filingTd = document.createElement('td');
    if (typeof trade.filingUrl === 'string' && /^https:\/\/(www\.)?sec\.gov\//.test(trade.filingUrl)) {
      const link = document.createElement('a'); link.href = trade.filingUrl; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'View'; filingTd.append(link);
    } else filingTd.textContent = '—';
    tr.append(filingTd); tbody.append(tr);
  }
  text('trades-message', `Showing ${trades.length} reported transactions.`);
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const symbol = tickerInput.value.trim().toUpperCase();
  if (!/^[A-Z0-9.-]{1,12}$/.test(symbol)) { statusBox.textContent = 'Please enter a valid ticker symbol.'; return; }
  currentSymbol = symbol;
  results.classList.add('hidden');
  statusBox.textContent = `Loading ${symbol}...`;
  text('financial-message', ''); text('trades-message', '');
  document.getElementById('trades-body').replaceChildren();
  if (financialChart) { financialChart.destroy(); financialChart = null; }

  try {
    const profile = await request('company', symbol);
    showCompany(profile, symbol);
    results.classList.remove('hidden');
    statusBox.textContent = `Company loaded. Checking financials and insider transactions...`;
    const [financials, insiders] = await Promise.allSettled([request('financials', symbol), request('insiders', symbol)]);
    if (financials.status === 'fulfilled') showFinancials(financials.value);
    else text('financial-message', `Could not load financials: ${financials.reason.message}`);
    if (insiders.status === 'fulfilled') showTrades(insiders.value);
    else text('trades-message', `Could not load insider trades: ${insiders.reason.message}`);
    statusBox.textContent = `Finished loading ${symbol}.`;
  } catch (error) {
    statusBox.textContent = `Could not load ${symbol}: ${error.message}`;
  }
});

saveButton.addEventListener('click', async () => {
  if (!currentSymbol) return;
  try {
    const response = await fetch('/api/saved', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({symbol:currentSymbol}) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error);
    text('saved-message', `${currentSymbol} saved.`); loadSaved();
  } catch (error) { text('saved-message', error.message); }
});

async function loadSaved() {
  try {
    const response = await fetch('/api/saved');
    const data = await response.json(); if (!response.ok) throw new Error(data.error);
    const target = document.getElementById('saved-list'); target.replaceChildren();
    if (!data.length) { text('saved-message', 'No saved companies yet.'); return; }
    text('saved-message', '');
    for (const entry of data) {
      const group = document.createElement('span');
      const choose = document.createElement('button'); choose.textContent = entry.symbol;
      choose.addEventListener('click', () => { tickerInput.value = entry.symbol; form.requestSubmit(); window.scrollTo({top:0,behavior:'smooth'}); });
      const remove = document.createElement('button'); remove.className = 'remove'; remove.textContent = '×'; remove.setAttribute('aria-label', `Remove ${entry.symbol}`);
      remove.addEventListener('click', async () => { await fetch(`/api/saved?symbol=${encodeURIComponent(entry.symbol)}`, {method:'DELETE'}); loadSaved(); });
      group.append(choose, remove); target.append(group);
    }
  } catch (error) { text('saved-message', error.message); }
}
loadSaved();
