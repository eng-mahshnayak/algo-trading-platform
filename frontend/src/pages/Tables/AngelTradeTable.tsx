
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { Select, DatePicker, Button } from "antd";
import dayjs from "dayjs";
import "antd/dist/reset.css";
// import { getSocket } from "../../socket/Socket";
import { useNavigate } from "react-router-dom";


/** ====== Live Tick type (from your socket) ====== **/
// type Tick = {
//   mode: 1 | 2 | 3;
//   exchangeType: number;
//   token: string;              // e.g. "47667"
//   sequenceNumber: number;
//   exchangeTimestamp: string;  // ISO
//   ltpPaiseOrRaw: number;      // e.g. 10225
//   ltp: number;                // e.g. 102.25
// };

/** ====== Trade row type (from API) ====== **/
type Trade = {
  exchange: string;
  producttype: string;
  token: string;
  tradingsymbol: string;
  instrumenttype: string;
  symbolgroup: string;
  strikeprice: string;
  optiontype: string;
  expirydate: string;
  marketlot: string;
  precision: string;
  multiplier: string;
  tradevalue: string;
  transactiontype: string; // "BUY" | "SELL"
  fillprice: string;
  fillsize: string;
  orderid: string;
  fillid: string;
  filltime: string;
};

function useDebounced<T>(value: T, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v as T;
}

const PAGE_SIZE_DEFAULT = 10;

const td: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 14,
  color: "#0f172a",
  whiteSpace: "nowrap",
  verticalAlign: "top",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontSize: 13,
  color: "#475569",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
  position: "sticky",
  top: 0,
  background: "#f8fafc",
  zIndex: 1,
};

const btn = (disabled: boolean): React.CSSProperties => ({
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  background: disabled ? "#f1f5f9" : "white",
  color: disabled ? "#94a3b8" : "#0f172a",
  cursor: disabled ? "not-allowed" : "pointer",
});

/** Soft row color based on transaction type */
const rowBg = (txn: string): React.CSSProperties => {
  const s = (txn || "").toLowerCase();
  if (s === "buy")
    return { backgroundColor: "rgba(22,163,74,0.08)" }; // soft green
  if (s === "sell")
    return { backgroundColor: "rgba(239,68,68,0.08)" }; // soft red
  return {};
};

/** Status pill color example (you can use it for buttons if needed) */
// const statusColor = (status: string) => {
//   const s = (status || "").toLowerCase();
//   if (s === "complete" || s === "filled" || s === "success") return "#16a34a";
//   if (s === "rejected" || s === "cancelled" || s === "canceled") return "#ef4444";
//   if (s === "pending" || s === "open" || s === "queued") return "#f59e0b";
//   return "#64748b";
// };

export default function AngelTradeTable () {

  const apiUrl = import.meta.env.VITE_API_URL;

  const navigate = useNavigate();


  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live ticks: keep a token -> current LTP map
  // const [ltpByToken, setLtpByToken] = useState<Record<string, number>>({});

  // simple UI states
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 50);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_DEFAULT);
  const [page, setPage] = useState<number>(1);
  const [selectedScrip, setSelectedScrip] = useState<string>("LOCAL_TABLE");
  const [selectedStrategy, setSelectedStrategy] = useState<string>("Transaction Type");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  // Socket: listen to "tick" and update the LTP map
  useEffect(() => {
    // const socket = getSocket();

    // const onTick = (tick: Tick) => {
    //   // Update single token's price; cheap & simple
    //   setLtpByToken((prev) => {
    //     const curr = prev[tick.token];
    //     if (curr === tick.ltp) return prev; // avoid useless re-render
    //     return { ...prev, [tick.token]: tick.ltp };
    //   });
    // };

    // socket.on("tick", onTick);

    // return () => {
    //   socket.off("tick", onTick);
    // };
  }, []);

  // Fetch table data
  useEffect(() => {
    let cancelled = false;

    async function fetchTrades() {
      try {
        const res = await axios.get(`${apiUrl}/order/get/trade/book`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            AngelOneToken: localStorage.getItem("angel_token") || "",
          },
        });

        if (!cancelled) {
          if (res.data?.status === true) {
            setTrades(res.data.data || []);
            setLoading(false);
          } else {
            setLoading(false);
            toast.error(res.data?.message || "Something went wrong");
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setLoading(false);
          setError(err?.message || "Failed to load trades");
        }
      }
    }

    fetchTrades();
    return () => {
      cancelled = true;
    };
  }, [apiUrl]);

  // reset to page 1 on search or page size change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  // filter by search
  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return trades;

    return trades.filter((t) => {
      const haystack =
        [
          t.fillid,
          t.orderid,
          t.tradingsymbol,
          t.transactiontype,
          t.producttype,
          t.exchange,
          t.instrumenttype,
          t.symbolgroup,
          t.optiontype,
          t.expirydate,
          t.filltime,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase() +
        ` ${t.fillprice ?? ""} ${t.fillsize ?? ""} ${t.tradevalue ?? ""} ${t.strikeprice ?? ""}`;
      return haystack.includes(q);
    });
  }, [trades, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const handleExcelDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(trades);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Trades");
    XLSX.writeFile(workbook, "trades.xlsx");
  };

  const handleScripChange = (value: string) => {

    setSelectedScrip(value);

        if(value=='ANGEL_TABLE') {
      
        navigate(`/angel/trades`);
     }else{
       navigate(`/admin/trades`);
     }

}
  const handleStrategyChange = (value: string) => setSelectedStrategy(value);

  const handleGetDates = async () => {
    const res = await axios.post(`${apiUrl}/order/gettradedatawithfilter/book`, dateRange, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        AngelOneToken: localStorage.getItem("angel_token") || "",
      },
    });

    if (res.data?.status === true) {
      setTrades(res.data.data || []);
      toast.success(res.data.message || "Loaded");
    } else if (res.data?.status === false && res.data?.message === "Unauthorized") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("termsAccepted");
      localStorage.removeItem("feed_token");
      localStorage.removeItem("refresh_token");
    } else {
      toast.error(res.data?.message || "Something went wrong");
    }
  };

  // const handleUpdateClick = (row: Trade) => {
  //   // Example: you can open a modal/place order/etc.
  //   console.log("Update clicked for", row);
  // };

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif" }}>
      <h2 style={{ marginBottom: 12 }}>Trades</h2>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <Select
          value={selectedScrip}
          style={{ width: 180 }}
          onChange={handleScripChange}
          options={[
            { label: "Angel Table", value: "ANGEL_TABLE" },
             { label: "Local Table", value: "LOCAL_TABLE" },
         
          ]}
        />

        <Select
          value={selectedStrategy}
          style={{ width: 180 }}
          onChange={handleStrategyChange}
          options={[
            { label: "Buy", value: "buy" },
            { label: "Sell", value: "sell" },
          ]}
        />

        <DatePicker.RangePicker
          style={{ width: 300 }}
          value={dateRange}
          onChange={(val) => setDateRange(val as [dayjs.Dayjs, dayjs.Dayjs])}
          // format="DD MMM YYYY hh:mm A"
          // showTime={{ format: "hh:mm A" }}
          ranges={{
            Today: [dayjs().startOf("day"), dayjs().endOf("day")],
            Yesterday: [
              dayjs().subtract(1, "day").startOf("day"),
              dayjs().subtract(1, "day").endOf("day"),
            ],
            "Last 7 Days": [dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")],
            "Last 30 Days": [dayjs().subtract(29, "day").startOf("day"), dayjs().endOf("day")],
            "This Month": [dayjs().startOf("month"), dayjs().endOf("month")],
            "Last Month": [
              dayjs().subtract(1, "month").startOf("month"),
              dayjs().subtract(1, "month").endOf("month"),
            ],
          }}
        />
        <Button onClick={handleGetDates}>Get Dates</Button>
      </div>

      {/* Search + controls */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by Fill ID, Order ID, Symbol, Txn, Product, Exchange..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: "1 1 320px",
            minWidth: 240,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            outline: "none",
          }}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#475569" }}>
          Rows per page
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #e5e7eb" }}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={handleExcelDownload}
          style={{
            padding: "10px 16px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
        >
          Excel Download
        </button>
      </div>

      {/* Table */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                {[
                  // "Action",
                  "Fill ID",
                  "Order ID",
                  "Symbol",
                  // "Token",
                  "Txn Type",
                  "Product",
                  "Exchange",
                  "Fill Price",
                  // "Current Price",
                  // "PnL",
                  "Fill Size",
                  "Trade Value",
                  "Trade Time",
                ].map((h) => (
                  <th key={h} style={thStyle}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={13} style={{ padding: 16, textAlign: "center" }}>
                    Loading trades…
                  </td>
                </tr>
              )}

              {error && !loading && (
                <tr>
                  <td colSpan={13} style={{ padding: 16, color: "#ef4444" }}>
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && current.length === 0 && (
                <tr>
                  <td colSpan={13} style={{ padding: 16, textAlign: "center", color: "#64748b" }}>
                    No trades found.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                current.map((t) => {
                  // const live = t.token ? ltpByToken[t.token] : undefined;
                  return (
                    <tr key={t.fillid} style={{ borderBottom: "1px solid #f1f5f9", ...rowBg(t.transactiontype) }}>
                      {/* <td style={td}>
                        <button
                          onClick={() => handleUpdateClick(t)}
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: 999,
                            fontSize: 12,
                            color: "white",
                            background: statusColor("complete"),
                            textTransform: "capitalize",
                          }}
                        >
                          Sell
                        </button>
                      </td> */}
                      <td style={td}>{t.fillid}</td>
                      <td style={td}>{t.orderid}</td>
                      <td style={td}>{t.tradingsymbol}</td>
                      {/* <td style={td}>{t.token}</td> */}
                      <td style={td} title={t.transactiontype}>
                        <strong>{t.transactiontype}</strong>
                      </td>
                      <td style={td}>{t.producttype}</td>
                      <td style={td}>{t.exchange}</td>
                      <td style={td}>{t.fillprice}</td>
                      {/* <td style={{ ...td, fontWeight: 600 }}>
                        {live !== undefined ? live.toFixed(2) : "—"}
                      </td>
                        <td style={td}>    {live !== undefined ? live.toFixed(2) : "—"}</td> */}
                      <td style={td}>{t.fillsize}</td>
                      <td style={td}>{t.tradevalue}</td>
                      <td style={td}>{t.filltime}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Footer / pagination */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12 }}>
          <div style={{ fontSize: 13, color: "#475569" }}>
            Showing <strong>{current.length}</strong> of <strong>{filtered.length}</strong> filtered (
            {trades.length} total)
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={btn(page === 1)}>
              Prev
            </button>
            <span style={{ fontSize: 13 }}>
              Page <strong>{page}</strong> / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={btn(page >= totalPages)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
