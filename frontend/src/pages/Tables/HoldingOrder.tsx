import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "antd/dist/reset.css";
import { toast } from "react-toastify";
import { getSocket } from "../../socket/Socket";
import { useBrokerApi } from "../../api/brokers/brokerSelector";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { 
  FiSearch, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiRefreshCw,
  FiPieChart,
  FiArrowUp,
  FiArrowDown
} from "react-icons/fi";

type Tick = {
  mode: 1 | 2 | 3;
  exchangeType: number;
  token: string | number;
  sequenceNumber: number;
  exchangeTimestamp: string;
  ltpPaiseOrRaw: number;
  ltp: number;
};

type Order = {
  variety: string;
  ordertype: string;
  producttype: string;
  duration: string;
  price: number | string;
  triggerprice: number | string;
  quantity: string | number;
  disclosedquantity: string | number;
  squareoff: number | null;
  stoploss: number | null;
  trailingstoploss: number | null;
  tradingsymbol: string;
  transactiontype: string;
  exchange: string;
  symboltoken: string | number;
  ordertag: string | null;
  instrumenttype: string;
  strikeprice: number | null;
  optiontype: string | null;
  expirydate: string | null;
  lotsize: string | number;
  cancelsize: string | number | null;
  averageprice: number | string;
  filledshares: string | number | null;
  unfilledshares: string | number | null;
  orderid: string;
  text: string | null;
  status: string | null;
  orderstatus: string | null;
  updatetime: string | null;
  exchtime: string | null;
  exchorderupdatetime: string | null;
  fillid: string;
  filltime: string;
  fillprice: number | string;
  fillsize: number | string;
  parentorderid: string | null;
  uniqueorderid: string;
  exchangeorderid: string | null;
  updatedAt: any;
  createdAt: any;
};

function useDebounced<T>(value: T, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v as T;
}

const statusColor = (status: string) => {
  const s = status?.toLowerCase();
  if (s === "complete" || s === "filled" || s === "success") return "#10b981";
  if (s === "rejected" || s === "cancelled" || s === "canceled") return "#ef4444";
  if (s === "pending" || s === "open" || s === "queued") return "#f59e0b";
  return "#64748b";
};

const StatusBadge = ({ status }: { status: string }) => (
  <span
    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize"
    style={{
      backgroundColor: `${statusColor(status)}15`,
      color: statusColor(status),
      border: `1px solid ${statusColor(status)}30`,
    }}
  >
    <span
      className="w-1.5 h-1.5 rounded-full mr-1.5"
      style={{ backgroundColor: statusColor(status) }}
    />
    {status || "-"}
  </span>
);

const TransactionBadge = ({ type }: { type: string }) => {
  const isBuy = type === "BUY";
  const isSell = type === "SELL";

  const config = isBuy
    ? {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
        icon: <FiArrowUp size={12} className="mr-1" />
      }
    : isSell
    ? {
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
        dot: "bg-rose-500",
        icon: <FiArrowDown size={12} className="mr-1" />
      }
    : {
        bg: "bg-gray-100",
        text: "text-gray-700",
        border: "border-gray-200",
        dot: "bg-gray-500",
        icon: null
      };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-2 h-2 rounded-full mr-2 ${config.dot}`} />
      {config.icon}
      {type || "-"}
    </span>
  );
};

const pnlPill = (val: number | null | undefined) => {
  const n = Number(val);
  const isPositive = n > 0;
  const isNegative = n < 0;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium ${
      isPositive ? "bg-green-100 text-green-700" : 
      isNegative ? "bg-red-100 text-red-700" : 
      "bg-gray-100 text-gray-600"
    }`}>
      {isPositive && <FiTrendingUp size={12} />}
      {isNegative && <FiTrendingDown size={12} />}
      {Number.isFinite(n) ? (isPositive ? `+${n.toFixed(2)}` : n.toFixed(2)) : "—"}
    </span>
  );
};

export default function HoldingOrder() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { api } = useBrokerApi();
  const [profitAndLossData, setProfitAndLossData] = useState<number>(0);

  console.log(profitAndLossData);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 50);
  const [ltpByToken, setLtpByToken] = useState<Record<string, number>>({});
  const [isMobile, setIsMobile] = useState(false);
  const [paginationPageSize, setPaginationPageSize] = useState(10);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const onTick = (tick: Tick) => {
      setLtpByToken((prev) => {
        const curr = prev[tick.token];
        if (curr === tick.ltp) return prev;
        return { ...prev, [tick.token]: tick.ltp };
      });
    };

    socket.on("tick", onTick);

    let cancelled = false;

    async function fetchOrders() {
      try {
        const { data } = await axios.get(`${apiUrl}/order/user/common/holding`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            AngelOneToken: localStorage.getItem("angel_token") || "",
          },
        });

        if (data.status === true) {
          const raw = data.data || [];
          const normalized: Order[] = (raw as any[]).map((item: any) => {
            if (item && typeof item === "object" && "0" in item) {
              return item[0];
            }
            if (Array.isArray(item)) {
              return item[0];
            }
            return item;
          });
          setOrders(normalized);
        } else if (data.status === false && data.message === "Unauthorized") {
          toast.error("Unauthorized User");
          localStorage.clear();
        } else {
          setError("Something went wrong");
        }
      } catch (err: any) {
        console.log(err);
        toast.error(err?.message || "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }

      const tradeRes = await api.getTodayTrade();
      setProfitAndLossData(tradeRes.data.pnl || 0);
    }

    fetchOrders();
    setPaginationPageSize(10);

    return () => {
      cancelled = true;
      socket.off("tick", onTick);
    };
  }, [apiUrl, api]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return orders;

    return orders.filter((o) => {
      const haystack =
        [
          o.orderid,
          o.uniqueorderid,
          o.tradingsymbol,
          o.transactiontype,
          o.instrumenttype,
          o.ordertype,
          o.producttype,
          o.status,
          o.exchange,
          o.text,
          o.updatetime,
          o.exchangeorderid,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase() +
        ` ${o.price ?? ""} ${o.quantity ?? ""} ${o.averageprice ?? ""}`;
      return haystack.includes(q);
    });
  }, [orders, debouncedSearch]);

  // Calculate total PNL
  const totalPNL = useMemo(() => {
    return filtered.reduce((sum, order) => {
      const token = order.symboltoken;
      const live = token ? ltpByToken[String(token)] : undefined;
      const price = Number(order.fillprice ?? 0);
      const qty = Number(order.fillsize ?? 0);
      if (live !== undefined && price && qty) {
        return sum + ((live - price) * qty);
      }
      return sum;
    }, 0);
  }, [filtered, ltpByToken]);

  const columnDefs: ColDef<Order>[] = useMemo(
    () => [
      {
        headerName: "Symbol",
        field: "tradingsymbol",
        cellRenderer: (params: any) => {
          const order = params.data as Order;
          return (
            <div className="py-2">
              <div className="font-semibold text-gray-900">
                {order.tradingsymbol}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {order.exchange}
              </div>
            </div>
          );
        },
        width: 200,
        minWidth: 160,
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
      {
        headerName: "Instrument",
        field: "instrumenttype",
        cellRenderer: (params: any) => {
          return <div className="py-2 text-sm">{params.value || "—"}</div>;
        },
        width: 120,
        minWidth: 100,
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
      {
        headerName: "Type",
        field: "transactiontype",
        cellRenderer: (params: any) => {
          return (
            <div className="py-2">
              <TransactionBadge type={params.value} />
            </div>
          );
        },
        width: 100,
        minWidth: 90,
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
      {
        headerName: "Buy Price",
        field: "fillprice",
        cellRenderer: (params: any) => {
          return <div className="py-2 font-medium">₹{Number(params.value || 0).toFixed(2)}</div>;
        },
        width: 110,
        minWidth: 100,
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
      {
        headerName: "LTP",
        width: 100,
        sortable: false,
        filter: false,
        valueGetter: (p) => {
          const d: any = p.data;
          if (d?.__rowType === "DETAIL") return undefined;
          const t = d?.symboltoken;
          return t ? ltpByToken[t] : undefined;
        },
        cellRenderer: (p: any) => (
          <div className="py-2 font-medium">₹{p.value !== undefined ? p.value.toFixed(2) : "—"}</div>
        ),
      },
      {
        headerName: "PnL",
        width: 120,
        sortable: false,
        filter: false,
        valueGetter: (p) => {
          const d: any = p.data;
          if (d?.__rowType === "DETAIL") return null;
          const token = d?.symboltoken;
          const live = token ? ltpByToken[token] : undefined;
          const price = Number(d?.fillprice ?? 0);
          const qty = Number(d?.fillsize ?? 0);
          if (live === undefined || !Number.isFinite(price) || !Number.isFinite(qty)) return null;
          return (live - price) * qty;
        },
        cellRenderer: (p: any) => pnlPill(p.value),
      },
      {
        headerName: "Qty",
        field: "fillsize",
        cellRenderer: (params: any) => {
          return <div className="py-2 text-center font-medium">{params.value || 0}</div>;
        },
        width: 80,
        minWidth: 70,
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
      {
        headerName: "Order ID",
        field: "orderid",
        cellRenderer: (params: any) => {
          return (
            <div className="py-2">
              <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600">
                {params.value}
              </code>
            </div>
          );
        },
        width: 180,
        minWidth: 160,
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
      {
        headerName: "Status",
        field: "status",
        cellRenderer: (params: any) => {
          const status = params.data.status || params.data.orderstatus;
          return (
            <div className="py-2">
              <StatusBadge status={status} />
            </div>
          );
        },
        width: 120,
        minWidth: 100,
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
      {
        headerName: "Message",
        field: "text",
        cellRenderer: (params: any) => {
          return (
            <div className="py-2">
              {params.value ? (
                <span className="text-xs text-gray-500 line-clamp-2" title={params.value}>
                  {params.value}
                </span>
              ) : (
                <span className="text-gray-300 text-xs">—</span>
              )}
            </div>
          );
        },
        width: 200,
        minWidth: 160,
        flex: 1,
      },
    ],
    [ltpByToken]
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      suppressMovable: true,
      cellStyle: {
        borderRight: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
      },
    }),
    []
  );

  const getRowStyle = () => {
    return {
      height: "65px",
      display: "flex",
      alignItems: "center",
      borderBottom: "1px solid #e2e8f0",
    };
  };

  const MobileOrderCard = ({ order }: { order: Order }) => {
    const live = order.symboltoken
      ? ltpByToken[String(order.symboltoken)]
      : undefined;

    const fillPrice = Number(order.fillprice ?? 0);
    const fillSize = Number(order.fillsize ?? 0);
    const pnlValue = live !== undefined && fillSize ? (live - fillPrice) * fillSize : null;

    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-3 shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">
              {order.tradingsymbol}
            </h3>
            <p className="text-xs text-gray-500">{order.exchange}</p>
          </div>
          <TransactionBadge type={order.transactiontype} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          <div>
            <span className="text-gray-400 text-xs">Buy Price</span>
            <p className="font-medium">₹{fillPrice.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-gray-400 text-xs">LTP</span>
            <p className="font-medium">₹{live ? live.toFixed(2) : "—"}</p>
          </div>
          <div>
            <span className="text-gray-400 text-xs">PnL</span>
            <p className="font-medium">{pnlValue !== null ? pnlPill(pnlValue) : "—"}</p>
          </div>
          <div>
            <span className="text-gray-400 text-xs">Quantity</span>
            <p className="font-medium">{order.fillsize || 0}</p>
          </div>
        </div>

        <div className="border-t border-gray-50 pt-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs">Order ID</span>
            <span className="font-mono text-xs">{order.orderid}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs">Status</span>
            <StatusBadge status={order.status || order.orderstatus || ""} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 md:px-6 lg:px-8 py-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-[#FB3800] to-orange-500 rounded-xl">
              <FiPieChart className="text-white" size={24} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Holding Positions</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            Monitor your current holding positions in real-time
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Total Holdings</p>
                <p className="text-2xl font-bold text-gray-800">{filtered.length}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <FiPieChart className="text-blue-500" size={20} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Total PnL</p>
                <p className={`text-2xl font-bold ${totalPNL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalPNL >= 0 ? `+${totalPNL.toFixed(2)}` : totalPNL.toFixed(2)}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${totalPNL >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                {totalPNL >= 0 ? (
                  <FiTrendingUp className="text-green-500" size={20} />
                ) : (
                  <FiTrendingDown className="text-red-500" size={20} />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Buy Orders</p>
                <p className="text-2xl font-bold text-gray-800">
                  {filtered.filter(o => o.transactiontype === "BUY").length}
                </p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <FiArrowUp className="text-green-500" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Sell Orders</p>
                <p className="text-2xl font-bold text-gray-800">
                  {filtered.filter(o => o.transactiontype === "SELL").length}
                </p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <FiArrowDown className="text-red-500" size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search by symbol, order ID, status..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                />
              </div>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200"
            >
              <FiRefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Table/Mobile View */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {isMobile ? (
            <div className="p-4">
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FB3800]" />
                </div>
              )}
              {error && !loading && (
                <div className="text-center py-8 text-red-500 bg-red-50 rounded-lg">
                  {error}
                </div>
              )}
              {!loading && !error && filtered.length === 0 && (
                <div className="text-center py-12">
                  <FiPieChart className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No holdings found</h3>
                  <p className="mt-2 text-gray-500">Try adjusting your search criteria</p>
                </div>
              )}
              {!loading && !error && filtered.map((order) => (
                <MobileOrderCard key={order.orderid} order={order} />
              ))}
            </div>
          ) : (
            <div className="ag-theme-alpine" style={{ height: "550px", width: "100%" }}>
              <AgGridReact
                rowData={filtered}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                loading={loading}
                getRowStyle={getRowStyle}
                rowHeight={55}
                headerHeight={48}
                pagination={true}
                paginationPageSize={paginationPageSize}
                paginationPageSizeSelector={[10, 25, 50, 100]}
                enableCellTextSelection={true}
                ensureDomOrder={true}
                suppressCellFocus={true}
                animateRows={true}
                enableRangeSelection={true}
                rowClass="ag-row-custom"
                overlayLoadingTemplate={
                  '<div class="flex justify-center items-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FB3800]"></div><span class="ml-3 text-gray-500">Loading holdings...</span></div>'
                }
                overlayNoRowsTemplate={
                  '<div class="flex flex-col items-center justify-center h-full text-gray-400"><svg class="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>No holdings match your search criteria</div>'
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}