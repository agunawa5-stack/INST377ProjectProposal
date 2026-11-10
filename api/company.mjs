// retreives company details from the Stockfit API based on the provided symbol
export async function GET(request) {

    // Get the symbol from the query parameters
    const url = new URL(request.url);
    const symbol = url.searchParams.get("symbol");

    // If the symbol is not provided, return a 400 error
    if (!symbol) {
        return Response.json(
            { error: "Missing company symbol" },
            { status: 400 }
        );
    }

    // Construct the Stockfit API URL with the provided symbol
    const stockfitURL =
        `https://api.stockfit.io/v1/api/company/details?symbol=${encodeURIComponent(symbol)}`;

    // Fetch the company details from the Stockfit API with the authorization header
    const response = await fetch(stockfitURL, {
        headers: {
            //used to access the Stockfit API and hide the API key from the client side
            Authorization: `Bearer ${process.env.STOCKFIT_API_KEY}`
        }
    });

    const data = await response.json();

    return Response.json(data, {
        status: response.status
    });
}
