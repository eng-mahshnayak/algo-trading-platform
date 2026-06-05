import { Server } from "socket.io";

let io = null

export function initSocket(server) {
  if (io) {
    console.log("⚠️ Socket.IO already initialized");
    return io;
  }

  console.log("🧠 Initializing Socket.IO...");

  io = new Server(server, {
    cors: {
      origin: [
        process.env.CROSS_ORIGIN_APP_1,   // your React/Vite app
        process.env.CROSS_ORIGIN_APP_2,
        process.env.CROSS_ORIGIN_APP_3,
        process.env.CROSS_ORIGIN_APP_4,
      ],
      credentials: true,
    },
    path: "/socket.io", // default path
  });


  // --- Debug connection-level events ---
  io.engine.on("connection_error", (err) => {
    console.error("❌ Engine connection error:", {
      code: err.code,
      message: err.message,
      context: err.context,
    });
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join a default room
    const room = socket.handshake.query?.room || "orders";
   
    const roomName = `risk_management`;
    socket.join(roomName);
    console.log(`👤 Joined risk room: ${roomName}`);
  

    socket.join(room);
    console.log(`📦 Joined room: ${room}`);

    // Send acknowledgment
    socket.emit("server_ready", { ok: true, id: socket.id, ts: Date.now() });

    // Custom events
    socket.on("ping_server", () => {
      socket.emit("pong_server", { msg: "Socket alive ✅", ts: Date.now() });
    });

    socket.on("subscribe", (symbols = []) => {
      symbols.filter(Boolean).forEach((sym) => {
        socket.join(String(sym));
        console.log(`✅ Subscribed to ${sym}`);
      });
    });

    socket.on("unsubscribe", (symbols = []) => {
      symbols.filter(Boolean).forEach((sym) => {
        socket.leave(String(sym));
        console.log(`🚪 Unsubscribed from ${sym}`);
      });
    });

    socket.on("disconnect", (reason) => {
      console.log(`⚠️ Socket disconnected: ${socket.id}, reason: ${reason}`);
    });

    socket.on("error", (err) => {
      console.error(`🔥 Socket error for ${socket.id}:`, err);
    });
  });

  console.log("✅ Socket.IO initialized");
  return io;
}

/**
 * Access the active Socket.IO instance from anywhere
 */
export function getIO() {
  if (!io) throw new Error("❌ Socket.io not initialized yet!");
  return io;
}


/** 🔥 Emit a tick to useful rooms */
export function emitTick(tick) {
  // expected: { token, exchangeType, ltp, ts?, tradingsymbol? }
  try {

    const _io = getIO();

    _io.to("orders").emit("tick", tick); 


  } catch (e) {
    // socket not ready yet — avoid crashing feed
    console.warn("emitTick skipped (socket not ready yet):", e.message);
  }
}

/** (optional) Emit SmartAPI connection status to clients */
export function emitFeedStatus(payload) {
  try {
    getIO().to("orders").emit("feed_status", payload);
  } catch {}
}


export function startSendNifty(data) {
  const io = getIO();

  console.log("📡 Start sending Nifty data...");

}



