import WebSocket from "ws";

let kiteWs;
const kiteUserSockets = new Map(); // agar per-user track karna ho


function buildTokenList(trades) {

  // group tokens by exchangeType
  const buckets = new Map(); // key: exchangeType -> Set(tokens)

  for (const t of trades) {
    const exch = (t.exchange || "").toUpperCase().trim();
    const exchangeType = EXCHANGE_TYPE[exch];
    const token = t.symboltoken && String(t.symboltoken).trim();

    if (!exchangeType || !token) continue;

    if (!buckets.has(exchangeType)) buckets.set(exchangeType, new Set());
    buckets.get(exchangeType).add(token);
  }

  // turn into [{ exchangeType, tokens: [...] }, ...]
  return Array.from(buckets.entries()).map(([exchangeType, set]) => ({
    exchangeType,
    tokens: Array.from(set), // unique tokens per exchangeType
  }));
}

export const getOrderFunction = async function () {
  try {

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

       const tradesData = await Trade.findAll({
        where: {
          createdAt: {
            [Op.between]: [startOfToday, endOfToday],
          },
        },
        raw: true, // plain JS objects
      });


            const uniqueTrades = [
        ...new Map(
            tradesData.map(item => [`${item.angelOneSymbol}-${item.angelOneToken}`, item])
          ).values()
        ];

      const tokenList = buildTokenList(uniqueTrades);
 
      return tokenList
           
  } catch (error) {
    console.error("getOrderFunction error:", error.message);
    return { status: false, data: [], tokens: [] };
  }
};


export function connectKiteSocket({ userId=3, apiKey='kjxhagw7nl1ypg3t', accessToken='DBX9lexLhVbhT7KSqpIuxb3EcRyOoQwy' }) {

  const WS_URL = `wss://ws.kite.trade?api_key=${apiKey}&access_token=${accessToken}`;

  kiteWs = new WebSocket(WS_URL, {
    // Zerodha ko generally extra headers ki zaroorat nahi, sab query-param se hota hai
    headers: {
      "X-Kite-Version": "3",
    },
  });

  const now = new Date();

  kiteUserSockets.set(userId, {
    ws: kiteWs,
    apiKey,
    accessToken,
    connectedAt: now.toISOString(),
    connectedDate: now.toLocaleDateString(),
    connectedTime: now.toLocaleTimeString(),
  });

  kiteWs.on("open", async () => {
    console.log("✅ Kite WS connected");

   
    const tokens = await getOrderFunction(); 

    // Zerodha ka token format: "EXCHANGE:INSTRUMENT_TOKEN"
    // e.g. "NFO:12345", "NSE:26009"
    const subscribeList = tokens.map(
      (t) => `${t.exchange || "NFO"}:${t.token}`
    );

    console.log("Subscribing tokens:", subscribeList);

    const subscribeMessage = [
      1,
      {
        tokens: subscribeList,
        mode: "quote", // ya "full" / "ltp" as per requirement
      },
    ];

    kiteWs.send(JSON.stringify(subscribeMessage));

   
  });

  kiteWs.on("message", (data) => {
   
    try {
      // Example if you want to log raw:
      console.log("Kite tick raw len:", data.length);

      // Yahan tum khud ka parseKiteTick function bana sakte ho
      const tick = parseKiteTick(data); // 👈 implement separately

      if (tick) {


        console.log(tick);
        
        // Jaise tum emitTick use kar rahe ho, waise hi:
        // emitTickFromKite(tick);
      }
    } catch (e) {
      console.error("Kite WS parse error:", e.message);
    }
  });

  kiteWs.on("error", (err) => {
    console.error("⚠️ Kite WS error:", err);
  });

  kiteWs.on("close", () => {
    console.warn("❌ Kite WS closed");

    
  });
}


// connectKiteSocket(3, 'kjxhagw7nl1ypg3t', 'DBX9lexLhVbhT7KSqpIuxb3EcRyOoQwy')