# FinSight — INST377 starter project

A basic HTML/CSS/JavaScript company research website, with secure Vercel serverless functions for StockFit and Supabase.

## Files
- `index.html`, `about.html`, `help.html` — pages
- `style.css` — light-green theme
- `script.js` — frontend search, chart, insider trades and saved symbols
- `api/stockfit.js` — secure StockFit API proxy
- `api/saved.js` — Supabase saved-ticker endpoints (shared class demo)
- `supabase.sql` — saved ticker table

## Setup
1. Copy these files into the root of your existing GitHub repository.
2. Obtain a StockFit API token from the StockFit dashboard. The insiders endpoint may need a paid tier.
3. Create a Supabase project. Run `supabase.sql` in its SQL editor. Saved companies are shared by all visitors; no authentication is included.
4. Create a Vercel project linked to your GitHub repo. Set `STOCKFIT_API_TOKEN`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` in Vercel project Environment Variables. Never commit secrets.
5. Deploy on Vercel. You can also run locally via `npm install`, then `npx vercel login`, `npx vercel link`, `npx vercel env pull .env.local`, `npx vercel dev`. Vercel CLI setup prompts may vary.
6. Visit the deployed site, search `AAPL`, and check the status text and browser console. Check the `api/stockfit` function logs if API calls fail.

**Important:** Opening index.html directly or with VS Code Live Server shows the HTML/CSS, but the `/api/*` routes won't work. Run through Vercel (local `vercel dev` or deployed URL).

## Important limitations
- StockFit may require a paid plan for insider-trade data. Errors will be displayed.
- The provided excerpt documents an example company detail response, annual income-statement response, and an insider transaction response on StockFit's public site. Exact field shapes should be checked using your account after deployment.
- No live API calls were made using a token. The starter has not been end-to-end tested against your account.
- The app does not yet include price-history charts, account-specific bookmark authentication, or side-by-side company comparison. Those are future features.
- Financial information is for educational purposes and not investment advice.
