import { io, Socket } from "socket.io-client";

type Tick = {
  mode: 1 | 2 | 3;
  exchangeType: number;
  token: string;
  sequenceNumber: number;
  exchangeTimestamp: string; // ISO date
  ltpPaiseOrRaw: number;
  ltp: number;
};

type ServerToClientEvents = {
  "server_ready": { ok: boolean; id: string; ts: number };
  "feed_status": { connected: boolean; error?: string; ts?: number };
  "orders:count": { total: number };
  //  tick: (tick: Tick) => void;
  // "tick": Tick; // 👈 add this

   tick: (tick: Tick) => void;       
  "niftyreal": Tick;

  "order:oco:update": (payload: {
    orderId: string;
    targetPrice?: number;
    stoplossPrice?: number;
    userId: number;
    ts: number;
  }) => void;

  // ✅ NEW EVENT
  "risk_alert": (payload: {
    type: string;
    userId: number;
    username: string;
    totalPnL: number;
    maxLoss: number;
    message: string;
    ts: number;
  }) => void;

  
};

type ClientToServerEvents = {
  "ping_server": void;
  "subscribe": (rooms: string[]) => void;
  "unsubscribe": (rooms: string[]) => void;
};

const DEFAULT_URL =  import.meta.env.VITE_API_URL_SOCKET;
const PATH = "/socket.io";


// The single shared socket instance for the whole app, strongly typed to your event maps.
let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

// Guard so we only wire the connection event listeners once (avoid duplicate logs/handlers).
let wired = false;

export function getSocket(url: string = DEFAULT_URL) {

  if (!socket) {
    socket = io(url, {
      path: PATH,
      transports: ["websocket"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      query: { room: "orders" }, // server joins this default room
    });

    if (!wired) {
      wired = true;

      socket.on("connect", () => {
        console.info("🟢 Socket connected:", socket?.id);
       
      });

      socket.on("connect_error", (err) => {
        console.warn("🔴 connect_error:", err);
      });

      socket.on("disconnect", (reason) => {
        console.warn("⚠️ disconnected:", reason);
      });
    }
  }
  return socket;
}


export function closeSocket() {
  if (socket) {
    socket.close();
    socket = null;
    wired = false;
  }
}

export function subscribeRooms(rooms: string[]) {
  getSocket().emit("subscribe", rooms);
}
export function unsubscribeRooms(rooms: string[]) {
  getSocket().emit("unsubscribe", rooms);
}
