import React, { useState, useEffect } from "react";
import { Send, ChevronDown } from "lucide-react";

type Message = {
  id: number;
  content: string;
  strategy: string;
  licenseStatus: string;
  sentAt: Date;
  visibleFor: number;
  remaining: number;
};

const Broadcast: React.FC = () => {
  const [strategy, setStrategy] = useState("All");
  const [licenseStatus, setLicenseStatus] = useState("All");
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(1);
  const [seconds, setSeconds] = useState(0);

  const visibleFor = hours * 3600 + minutes * 60 + seconds;

  const handleSend = () => {
    if (!messageText.trim() || visibleFor <= 0) return;
    const newMsg: Message = {
      id: Date.now(),
      content: messageText,
      strategy,
      licenseStatus,
      sentAt: new Date(),
      visibleFor,
      remaining: visibleFor,
    };
    setMessages((prev) => [newMsg, ...prev]);
    setMessageText("");
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setMessages((prev) =>
        prev
          .map((msg) =>
            msg.remaining > 0
              ? { ...msg, remaining: msg.remaining - 1 }
              : null
          )
          .filter((msg): msg is Message => msg !== null)
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCountdown = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full h-screen p-6 bg-gray-50 flex flex-col justify-between">
      <div className="flex-1 flex items-center justify-center relative">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 absolute top-1/3">
            <div className="text-4xl mb-2"></div>
            <p className="text-lg font-semibold">No Message Sent!</p>
          </div>
        ) : (
          <div className="w-full max-w-full mx-auto">
            <h2 className="text-xl font-semibold mb-4">Message History</h2>
            <table className="w-full border border-gray-300 text-sm bg-white shadow">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2 text-left">Message</th>
                  <th className="border px-4 py-2">Strategy</th>
                  <th className="border px-4 py-2">License Status</th>
                  <th className="border px-4 py-2">Sent At</th>
                  <th className="border px-4 py-2">Time Remaining</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg) => (
                  <tr key={msg.id}>
                    <td className="border px-4 py-2">{msg.content}</td>
                    <td className="border px-4 py-2">{msg.strategy}</td>
                    <td className="border px-4 py-2">{msg.licenseStatus}</td>
                    <td className="border px-4 py-2">
                      {msg.sentAt.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                      })}
                    </td>
                    <td className="border px-4 py-2 font-mono text-blue-600">
                      {formatCountdown(msg.remaining)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="w-full max-w-full mx-auto bg-white p-4 rounded-t-lg shadow border-t flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="w-full relative">
            <label className="block text-sm font-medium mb-1">Choose Strategy</label>
            <div className="relative">
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full appearance-none border rounded px-3 py-2 pr-10"
              >
                <option>All</option>
                <option>Strategy A</option>
                <option>Strategy B</option>
                <option>Strategy C</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
          </div>

          <div className="w-full relative">
            <label className="block text-sm font-medium mb-1">Choose License Status</label>
            <div className="relative">
              <select
                value={licenseStatus}
                onChange={(e) => setLicenseStatus(e.target.value)}
                className="w-full appearance-none border rounded px-3 py-2 pr-10"
              >
                <option>All</option>
                <option>Active</option>
                <option>Expired</option>
                <option>Pending</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
          <div className="">
            <label className="block text-sm font-medium mb-1">Visible For (hh:mm:ss)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={hours}
                onChange={(e) => setHours(Math.max(0, +e.target.value))}
                className="w-1/3 border rounded px-2 py-1 text-center"
                placeholder="hh"
                min={0}
              />
              <span className="text-sm">:</span>
              <input
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(Math.max(0, +e.target.value))}
                className="w-1/3 border rounded px-2 py-1 text-center"
                placeholder="mm"
                min={0}
                max={59}
              />
              <span className="text-sm">:</span>
              <input
                type="number"
                value={seconds}
                onChange={(e) => setSeconds(Math.max(0, +e.target.value))}
                className="w-1/3 border rounded px-2 py-1 text-center"
                placeholder="ss"
                min={0}
                max={59}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type any message to broadcast"
            className="flex-1 border rounded px-4 py-2"
          />
          <button
            onClick={handleSend}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Broadcast;
