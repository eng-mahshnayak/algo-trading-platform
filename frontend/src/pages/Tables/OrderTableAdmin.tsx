// ===================== last update sl and target fields updated code with ReBuy and Group Indicators =====================

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "antd/dist/reset.css";

import { toast } from "react-toastify";
import { getSocket } from "../../socket/Socket";
import { useNavigate } from "react-router";

import { AgGridReact } from "ag-grid-react";
import type {
  ColDef,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  RowHeightParams,
} from "ag-grid-community";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { 
  FiSearch, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiRefreshCw,

  FiXCircle,
  FiActivity
} from "react-icons/fi";

/** ---------------- TYPES ---------------- */

type Tick = {
  mode: 1 | 2 | 3;
  exchangeType: number;
  token: string;
  sequenceNumber: number;
  exchangeTimestamp: string;
  ltpPaiseOrRaw: number;
  ltp: number;
};

type ClientOrder = {
  id?: number;
  userId?: number;
  userNameId?: any;
  broker?: string;

  variety?: string;
  ordertype?: string;
  producttype?: string;
  duration?: any;

  price?: number;
  triggerprice?: any;

  quantity?: any;
  disclosedquantity?: any;

  squareoff?: any; // ✅ use as TARGET price in UI
  stoploss?: any;  // ✅ use as SL price in UI
  trailingstoploss?: any;

  tradingsymbol?: string;
  transactiontype?: string;
  exchange?: string;
  symboltoken?: string;

  ordertag?: any;
  instrumenttype?: string;

  strikeprice?: any;
  optiontype?: any;
  expirydate?: any;
  lotsize?: any;

  cancelsize?: any;

  averageprice?: any;
  filledshares?: any;
  unfilledshares?: any;

  orderid?: string;
  uniqueorderid?: string;
  parentorderid?: any;

  exchangeorderid?: any;

  text?: any;
  status?: string;
  orderstatus?: any;
  orderstatuslocaldb?: any;

  updatetime?: any;
  exchtime?: any;
  exchorderupdatetime?: any;

  fillid?: any;
  filltime?: any;
  fillprice?: any;
  fillsize?: any;

  createdAt?: any;
  updatedAt?: any;

  totalPrice?: any;
  actualQuantity?: any;

  strategyUniqueId?: string;
  strategyName?: string;
  angelOneToken?: string;
};

type Order = ClientOrder & {
  client_data?: ClientOrder[];
  __rowType?: "MASTER" | "DETAIL";
  __isExpanded?: boolean;
  __isGroupTrade?: boolean; // Flag to identify group trades
};

type DetailRow = {
  __rowType: "DETAIL";
  id: string;
  parentId: number | string;
  parentStrategyUniqueId?: string;
  client_data: ClientOrder[];
};

type RowItem = (Order & { __rowType?: "MASTER" }) | DetailRow;

/** ---------------- HELPERS ---------------- */

const statusColor = (status: string) => {
  const s = String(status || "").toLowerCase();
  if (s === "complete" || s === "filled" || s === "success") return "#10b981";
  if (s === "rejected" || s === "cancelled" || s === "canceled") return "#ef4444";
  if (s === "pending" || s === "open" || s === "queued") return "#f59e0b";
  return "#64748b";
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

const NumInlineInput = ({
  value,
  placeholder,
  disabled,
  onChangeValue,
}: {
  value: any;
  placeholder?: string;
  disabled?: boolean;
  onChangeValue: (val: number | null, rawText: string) => void;
}) => {
  const [v, setV] = useState<string>(
    value === null || value === undefined ? "" : String(value)
  );

  const isTypingRef = useRef(false);

  useEffect(() => {
    if (isTypingRef.current) return;
    setV(value === null || value === undefined ? "" : String(value));
  }, [value]);

  const commit = useCallback(() => {
    const raw = String(v || "").trim();
    const num = raw === "" ? null : Number(raw);

    // invalid number → don't commit
    if (raw !== "" && !Number.isFinite(num)) return;

    onChangeValue(num, raw);
    isTypingRef.current = false;
  }, [v, onChangeValue]);

  return (
    <input
      value={v}
      onFocus={() => {
        isTypingRef.current = true;
      }}
      onChange={(e) => {
        // ✅ ONLY local typing (NO parent update here)
        isTypingRef.current = true;
        setV(e.target.value);
      }}
      onBlur={commit}  // ✅ parent update ONLY here
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.currentTarget as HTMLInputElement).blur(); // triggers commit
        }
        if (e.key === "Escape") {
          e.preventDefault();
          isTypingRef.current = false;
          setV(value === null || value === undefined ? "" : String(value));
          (e.currentTarget as HTMLInputElement).blur();
        }
      }}
      disabled={disabled}
      placeholder={placeholder || "—"}
      className="border border-gray-200 px-2 py-1 rounded-lg w-full text-sm focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
      style={{ maxWidth: 100 }}
      inputMode="decimal"
      autoComplete="off"
    />
  );
};

/** Expand icon cell (only for MASTER rows) */
const ExpandCellRenderer = (props: ICellRendererParams) => {
  const data = props.data as any;
  if (data?.__rowType === "DETAIL") return null;

  const isExpanded = !!data?.__isExpanded;
  const toggleRow = props.context?.toggleRow;
  const isGroupTrade = data?.__isGroupTrade;

  return (
    <div className="flex items-center h-full">
      <button
        onClick={() => toggleRow?.(data)}
        className={`p-1 rounded hover:bg-gray-100 transition-colors ${
          isGroupTrade ? 'border-l-4 border-purple-500' : ''
        }`}
        title={isExpanded ? "Collapse" : "Expand"}
      >
        {isExpanded ? (
          <FaChevronDown className="w-3 h-3 text-gray-500" />
        ) : (
          <FaChevronRight className="w-3 h-3 text-gray-500" />
        )}
      </button>
      {isGroupTrade && (
        <span className="ml-1 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
          {data.client_data?.length || 0}
        </span>
      )}
    </div>
  );
};

/** Sell button */
const SellButton = ({ disabled, onClick }: { disabled: boolean; onClick: () => void }) => {
  return (
    <button
      onClick={() => !disabled && onClick()}
      disabled={disabled}
      className={`
        inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold
        transition-all duration-200
        ${disabled 
          ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
          : "bg-red-500 hover:bg-red-600 text-white shadow-sm hover:shadow"
        }
      `}
      title={disabled ? "Already Sold" : "Click to Sell"}
    >
      <span className="text-xs">⬇</span>
      SELL
    </button>
  );
};

/** ✅ Target+Stoploss Action Icons */
const OcoActionIcons = ({
  disabled,
  title,
  onOk,
  onCancel,
  okLoading,
}: {
  disabled: boolean;
  title?: string;
  onOk: () => void;
  onCancel: () => void;
  okLoading?: boolean;
}) => {
  return (
    <div className="flex items-center gap-2 justify-center">
      <button
        disabled={disabled || !!okLoading}
        onClick={() => !disabled && !okLoading && onOk()}
        title={title || "Submit Target + Stoploss"}
        className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <FaCheckCircle className="w-4 h-4" style={{ color: disabled ? "#9ca3af" : "#10b981" }} />
      </button>

      <button
        disabled={disabled || !!okLoading}
        onClick={() => !disabled && !okLoading && onCancel()}
        title="Clear (reset)"
        className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <FaTimesCircle className="w-4 h-4" style={{ color: disabled ? "#9ca3af" : "#ef4444" }} />
      </button>

      {okLoading ? (
        <span className="text-xs text-gray-400 ml-1">Saving...</span>
      ) : null}
    </div>
  );
};

/** ---------------- MAIN COMPONENT ---------------- */

export default function OrderTableAdmin() {

  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const exitLocksRef = useRef(new Set<string>());

  const gridApiRef = useRef<GridApi | null>(null);

  const [rawOrders, setRawOrders] = useState<Order[]>([]);
  const [rowData, setRowData] = useState<RowItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number | string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  // token -> ltp
  const ltpByTokenRef = useRef<Record<string, number>>({});
  const subGridApiRef = useRef<Record<string, GridApi | null>>({});

  // orderId -> true (already executed)
  const rawOrdersRef = useRef<Order[]>([]);
  const autoExitTriggeredRef = useRef<Record<string, boolean>>({});

  // ================= ReBuy MODAL STATE =================
  const [showReBuyModal, setShowReBuyModal] = useState(false);

  const [reBuyData, setReBuyData] = useState<{
    quantity: number | null;
    strategyUniqueId: string;
    flag: "SINGLE" | "GROUP";
    orderId: string;
    clientData: any[];
    selectedClientIndex: number | "group";
    selectedClientUserName: string;
  } | null>(null);

  // ================= PARTIAL SELL MODAL STATE =================
  const [showPartialModal, setShowPartialModal] = useState(false);

  const [partialData, setPartialData] = useState<{
    quantity: number | null;
    strategyUniqueId: string;
    flag: "MAIN" | "SUB";
    orderId: string;
  } | null>(null);

  // open modal - UPDATED to auto-select group mode for group trades
  const openReBuyModal = (
    strategyUniqueId: string,
    orderId: string,
    fullObject: any
  ) => {
    
    
    // If client_data exists and has items
    const clientData = fullObject.client_data || [];
    const isGroupTrade = clientData.length > 1;
    
    // For group trades (>1 client), default to GROUP mode with "group" selected
    // For single trades, default to SINGLE mode with first client selected
    const selectedClientIndex:any = isGroupTrade ? "group" : (clientData.length > 0 ? 0 : -1);
    const flag = isGroupTrade ? "GROUP" : "SINGLE";
    const selectedClientUserName = isGroupTrade ? "GROUP" : (selectedClientIndex >= 0 ? clientData[selectedClientIndex]?.userNameId || "" : "");
    
    // Get quantity based on selection
    let defaultQuantity = null;
    if (isGroupTrade) {
      // For group trades, default to total quantity of all clients
      defaultQuantity = clientData.reduce((sum:any, client:any) => sum + (Number(client.quantity) || 0), 0);
    } else {
      // For single trades, default to selected client's quantity or main order quantity
      defaultQuantity = selectedClientIndex >= 0 
        ? clientData[selectedClientIndex]?.quantity || fullObject.quantity 
        : fullObject.quantity;
    }

    setReBuyData({
      quantity: defaultQuantity ? Number(defaultQuantity) : null,
      strategyUniqueId,
      flag,
      orderId,
      clientData: clientData,
      selectedClientIndex: selectedClientIndex,
      selectedClientUserName: selectedClientUserName
    });
    setShowReBuyModal(true);
  };

  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  console.log(selectedOrder);
  
const [sellPrice, setSellPrice] = useState("");
const [sellTime, setSellTime] = useState("");
const [showModal, setShowModal] = useState(false);

const openCloneUserForm = async(data: any) => {
  setSelectedOrder(data);


  console.log(data,'======openCloneUserForm========');
  
  setSellPrice("");
  setSellTime("");
  setShowModal(true);
  console.log(showModal,'showModalshowModalshowModal');


        const ok = window.confirm(
        `Do you want to SELL this order !`
      );
      if (!ok) return;



    const payload = {
    ...data,          // 👉 pura order data
    sellPrice: Number(sellPrice),
    sellTime: sellTime,        // ya ISO me convert kar sakte ho
  };

  console.log(payload, "FINAL PAYLOAD");

 let res =  await axios.post(
        `${apiUrl}/admin/manualinstrument/createsell/order`,
        payload,
        { headers: authHeader }
      );

      // ✅ Success Check
    if (res.data?.status) {
      alert("✅ Sell Order Created Successfully");

      setShowModal(false);
      fetchOrders()
    } else {
      alert("❌ " + res.data?.message);
    }
  
};



// clone user submit sell price and sell time

// const handleSubmit = async () => {
//   const payload = {
//     ...selectedOrder,          // 👉 pura order data
//     sellPrice: Number(sellPrice),
//     sellTime: sellTime,        // ya ISO me convert kar sakte ho
//   };

//   console.log(payload, "FINAL PAYLOAD");

//  let res =  await axios.post(
//         `${apiUrl}/admin/manualinstrument/createsell/order`,
//         payload,
//         { headers: authHeader }
//       );

//       // ✅ Success Check
//     if (res.data?.status) {
//       alert("✅ Sell Order Created Successfully");

//       setShowModal(false);
//       fetchOrders()
//     } else {
//       alert("❌ " + res.data?.message);
//     }
// };

  // handle client selection change
 
 
 
  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!reBuyData) return;
    
    const value = e.target.value;
    
    if (value === "group") {
      // GROUP selected - calculate total quantity of all clients
      const totalQuantity = reBuyData.clientData.reduce((sum, client) => sum + (Number(client.quantity) || 0), 0);
      
      setReBuyData({
        ...reBuyData,
        flag: "GROUP",
        selectedClientIndex: "group",
        selectedClientUserName: "GROUP",
        quantity: totalQuantity
      });
    } else {
      // SINGLE client selected
      const selectedIndex = parseInt(value);
      const selectedClient = reBuyData.clientData[selectedIndex];
      
      setReBuyData({
        ...reBuyData,
        flag: "SINGLE",
        selectedClientIndex: selectedIndex,
        selectedClientUserName: selectedClient?.userNameId || "",
        quantity: selectedClient?.quantity ? Number(selectedClient.quantity) : reBuyData.quantity
      });
    }
  };

  // close modal
  const closeReBuyModal = () => {
    setShowReBuyModal(false);
    setReBuyData(null);
  };

  // submit
  const handleReBuy = async () => {
    try {
      if (!reBuyData?.quantity || !reBuyData.strategyUniqueId) {
        toast.error("Quantity required");
        return;
      }

      let payload: any = {
        quantity: reBuyData.quantity,
        strategyUniqueId: reBuyData.strategyUniqueId,
        orderId: reBuyData.orderId,
      };

      console.log(reBuyData.clientData,'================reBuyData.clientData========');
      
      if (reBuyData.selectedClientIndex === "group") {
        // GROUP rebuy
        payload.flag = "GROUP";
        payload.allClients = reBuyData.clientData.map(client => ({
          userId: client.userId,
          orderId: client.orderid,
          userNameId: client.userNameId,
          broker: client.broker,
          originalQuantity: client.quantity
        }));
        
        console.log('GROUP ReBuy payload:', payload);
        toast.success(`Group ReBuy for ${reBuyData.clientData.length} clients`);
        
      } else {
        // SINGLE client rebuy
        if (reBuyData.selectedClientIndex === -1) {
          toast.error("No client selected");
          return;
        }
        
        const selectedClient = reBuyData.clientData[reBuyData.selectedClientIndex];
        payload.flag = "SINGLE";
        payload.selectedClient = {
          userId: selectedClient?.userId,
          userNameId: selectedClient?.userNameId,
          broker: selectedClient?.broker,
          originalQuantity: selectedClient?.quantity
        };
        
        console.log('SINGLE ReBuy payload:', payload);
        toast.success(`Single ReBuy for client ${selectedClient?.userNameId}`);
      }

      // Uncomment when API is ready
     let res =  await axios.post(
        `${apiUrl}/awsadmin/rebuy/place/order`,
        payload,
        { headers: authHeader }
      );
      
      console.log(res,'==========res=============');
      closeReBuyModal();
      fetchOrders();
    } catch (e) {
      console.error(e);
      toast.error("ReBuy failed");
    }
  };

  // open partial modal
  const openPartialModal = (
    strategyUniqueId: string,
    flag: "MAIN" | "SUB",
    orderId: string
  ) => {
    setPartialData({
      quantity: null,
      strategyUniqueId,
      flag,
      orderId,
    });
    setShowPartialModal(true);
  };

  // close partial modal
  const closePartialModal = () => {
    setShowPartialModal(false);
    setPartialData(null);
  };

  // submit partial sell
  const handlePartialSell = async () => {
    try {
      if (!partialData?.quantity || !partialData.strategyUniqueId) {
        toast.error("Quantity required");
        return;
      }

      console.log('quantity :', partialData.quantity);
      console.log('strategyUniqueId :', partialData.strategyUniqueId);
      console.log('flag :', partialData.flag);
      console.log('orderId :', partialData.orderId);

      await axios.post(
        `${apiUrl}/awsadmin/sequareoff/partial`,
        {
          quantity: partialData.quantity,
          strategyUniqueId: partialData.strategyUniqueId,
          flag: partialData.flag,
          orderId: partialData.orderId,
        },
        { headers: authHeader }
      );

      toast.success("Partial Sell Placed");
      closePartialModal();
      fetchOrders();
    } catch (e) {
      console.error(e);
      toast.error("Partial sell failed");
    }
  };

  const shouldAutoExit = ({
    transactionType,
    cmp,
    target,
    stoploss,
  }: {
    transactionType: string;
    cmp: number;
    target?: number | null;
    stoploss?: number | null;
  }): false | "TARGET" | "STOPLOSS" => {
    if (!Number.isFinite(cmp)) return false;

    const t = Number(target);
    const sl = Number(stoploss);

    const hasTarget = Number.isFinite(t) && t > 0;
    const hasSL = Number.isFinite(sl) && sl > 0;

    // ❌ nothing set
    if (!hasTarget && !hasSL) return false;

    const isBuy = transactionType === "BUY";

    if (isBuy) {
      // 🎯 TARGET HIT
      if (hasTarget && cmp >= t) return "TARGET";
      // 🛑 STOPLOSS HIT
      if (hasSL && cmp <= sl) return "STOPLOSS";
    } else {
      // future SELL logic
      if (hasTarget && cmp <= t) return "TARGET";
      if (hasSL && cmp >= sl) return "STOPLOSS";
    }

    return false;
  };

  const callAutoExitAPI = async ({
    orderId,
    strategyUniqueId,
    reason,
  }: {
    orderId: string;
    strategyUniqueId: string;
    reason: "TARGET" | "STOPLOSS";
  }) => {
    try {
      // 🚫 already exiting
      if (exitLocksRef.current.has(strategyUniqueId)) {
        console.log("Auto exit already in progress for", strategyUniqueId);
        return;
      }

      // 🔒 lock this order
      exitLocksRef.current.add(strategyUniqueId);

      await axios.post(
        `${apiUrl}/admin/targetstoplosscheck`,
        { orderId, strategyUniqueId, reason },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      toast.success(`Auto ${reason} executed for Order ${orderId}`);
      fetchOrders();
    } catch (err: any) {
      console.error("Auto exit failed", err);
      // ❗ allow retry on failure
      exitLocksRef.current.delete(strategyUniqueId);
    }
  };

  // ✅ Draft state for OCO inputs (orderId -> {targetPrice, stoplossPrice, ...payload})
  const [ocoDraft, setOcoDraft] = useState<Record<string, any>>({});
  const [ocoSavingKey, setOcoSavingKey] = useState<string | null>(null);

  const authHeader = useMemo(
    () => ({
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      userid: localStorage.getItem("userID") || "",
    }),
    []
  );

  /** ---------------- DETAIL ROW (SUBTABLE) ---------------- */
  const DetailRowRenderer = (props: any) => {
    const row = props.data as DetailRow;
    const { onSellFromSub, ocoDraft, setOcoDraft, submitOcoDraft, clearOcoDraft, ocoSavingKey } =
      props.context || {};

    const subColumnDefs: ColDef<ClientOrder>[] = [

       {
        headerName: "Action",
        width: 120,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const r: ClientOrder = params.data;
          if (!r) return null;

          const disabled = String(r.transactiontype || "").toUpperCase() === "SELL";
          return <SellButton disabled={disabled} onClick={() => onSellFromSub?.(r, row.parentStrategyUniqueId)} />;
        },
      },

    
      {
        headerName: "Partial Sell",
        width: 120,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const r: Order = params.data;
          const disabled = String(r.transactiontype) === "SELL";

          return (
            <button
              disabled={disabled}
              onClick={() => openPartialModal(r.strategyUniqueId!, "SUB", r.orderid!)}
              className={`
                inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold
                transition-all duration-200
                ${disabled 
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                  : "bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow"
                }
              `}
              title={disabled ? "Already Sold" : "Click to Partial Sell"}
            >
              <span className="text-xs">⬇</span>
              PARTIAL
            </button>
          );
        },
      },
      {
        headerName: "ReBuy",
        width: 90,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const r: Order = params.data;
          const isBuy = String(r.transactiontype || "").toUpperCase() === "BUY";
          const disabled = !isBuy;

          return (
            <button
              disabled={disabled}
              onClick={() => {
                const wrapperObject = {
                  ...r,
                  client_data: [r]
                };
                openReBuyModal(r.strategyUniqueId!, r.orderid!, wrapperObject);
              }}
              className={`
                inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold
                transition-all duration-200
                ${disabled 
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                  : "bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow"
                }
              `}
              title={!isBuy ? "Only BUY orders can be rebought" : "Click to ReBuy"}
            >
              ReBuy
            </button>
          );
        },
      },
      { headerName: "UserId", field: "userNameId", width: 120 },
      { headerName: "Broker", field: "broker", width: 130 },
      { headerName: "StrategyUniqueId", field: "strategyUniqueId", width: 220, minWidth: 200 },
      { headerName: "SYMBOL", field: "tradingsymbol", width: 160 },
      { headerName: "Instrument", field: "instrumenttype", width: 140 },
      {
        headerName: "Type",
        field: "transactiontype",
        width: 110,
        cellRenderer: (params: any) => {
          const isBuy = params.value === "BUY";
          const isSell = params.value === "SELL";
          const txnBg = isBuy ? "bg-green-100" : isSell ? "bg-red-100" : "bg-gray-200";
          const txnColor = isBuy ? "text-green-700" : isSell ? "text-red-700" : "text-gray-600";

          return (
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${txnBg} ${txnColor}`}>
              {params.value || "-"}
            </span>
          );
        },
      },
      { headerName: "OrderType", field: "ordertype", width: 130 },
      { headerName: "ProductType", field: "producttype", width: 130 },
      { headerName: "Price", field: "price", width: 110 },
      // ✅ Target input (draft only)
      {
        headerName: "Target",
        width: 120,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const r: ClientOrder = params.data;
          if (!r?.orderid) return null;

          const isBuy = String(r.transactiontype || "").toUpperCase() === "BUY";
          const key = String(r.orderid);

          const draft = ocoDraft?.[key] || {};
          const value = draft.targetPrice ?? r.squareoff ?? "";

          return (
            <NumInlineInput
              value={value}
              placeholder="Target"
              disabled={!isBuy}
              onChangeValue={(val) => {
                if (!isBuy) return;
                setOcoDraft?.((prev: any) => ({
                  ...(prev || {}),
                  [key]: {
                    ...(prev?.[key] || {}),
                    targetPrice: val,
                    stoplossPrice: prev?.[key]?.stoplossPrice ?? (r.stoploss ?? null),
                    orderId: r.orderid,
                    strategyUniqueId: row.parentStrategyUniqueId || r.strategyUniqueId || "",
                    userId: r.userNameId,
                    broker: r.broker,
                  },
                }));
              }}
            />
          );
        },
      },
      // ✅ Stoploss input (draft only)
      {
        headerName: "Stoploss",
        width: 120,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const r: ClientOrder = params.data;
          if (!r?.orderid) return null;

          const isBuy = String(r.transactiontype || "").toUpperCase() === "BUY";
          const key = String(r.orderid);

          const draft = ocoDraft?.[key] || {};
          const value = draft.stoplossPrice ?? r.stoploss ?? "";

          return (
            <NumInlineInput
              value={value}
              placeholder="SL"
              disabled={!isBuy}
              onChangeValue={(val) => {
                if (!isBuy) return;
                setOcoDraft?.((prev: any) => ({
                  ...(prev || {}),
                  [key]: {
                    ...(prev?.[key] || {}),
                    stoplossPrice: val,
                    targetPrice: prev?.[key]?.targetPrice ?? (r.squareoff ?? null),
                    orderId: r.orderid,
                    strategyUniqueId: row.parentStrategyUniqueId || r.strategyUniqueId || "",
                    userId: r.userNameId,
                    broker: r.broker,
                  },
                }));
              }}
            />
          );
        },
      },
      // ✅ ✅/❌ column (submit both together)
      {
        headerName: "OCO",
        width: 90,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const r: ClientOrder = params.data;
          if (!r?.orderid) return null;

          const isBuy = String(r.transactiontype || "").toUpperCase() === "BUY";
          const key = String(r.orderid);

          const draft = ocoDraft?.[key] || {};
          const t = draft.targetPrice ?? null;
          const sl = draft.stoplossPrice ?? null;

          const canSubmit =
            isBuy &&
            Number.isFinite(Number(t)) &&
            Number.isFinite(Number(sl)) &&
            Number(t) > 0 &&
            Number(sl) > 0;

          const saving = ocoSavingKey === key;

          return (
            <OcoActionIcons
              disabled={!canSubmit}
              okLoading={saving}
              title={!canSubmit ? "Fill both Target and Stoploss first" : "Submit Target+Stoploss"}
              onOk={() => submitOcoDraft?.(key)}
              onCancel={() => clearOcoDraft?.(key)}
            />
          );
        },
      },
      {
        headerName: "CMP",
        colId: "cmp",
        width: 110,
        sortable: false,
        filter: false,
        valueGetter: (p: any) => {
          const t = p.data?.angelOneToken;
          return t ? ltpByTokenRef.current[t] : undefined;
        },
        cellRenderer: (p: any) => (p.value !== undefined ? `₹${p.value.toFixed(2)}` : "—"),
      },
      {
        headerName: "PnL",
        colId: "pnl",
        width: 140,
        sortable: false,
        filter: false,
        valueGetter: (p: any) => {
          const token = p.data?.angelOneToken;
          const live = token ? ltpByTokenRef.current[token] : undefined;
          const price = Number(p.data?.price ?? 0);
          const qty = Number(p.data?.fillsize ?? p.data?.quantity ?? 0);

          if (live === undefined || !Number.isFinite(price) || !Number.isFinite(qty)) return null;
          return (live - price) * qty;
        },
        cellRenderer: (p: any) => pnlPill(p.value),
      },
      { headerName: "OrderQty", field: "quantity", width: 120 },
      { headerName: "TradedQty", field: "fillsize", width: 120 },
      { headerName: "OrderID", field: "orderid", width: 190 },
      { headerName: "TradeID", field: "fillid", width: 140 },
      {
        headerName: "Status",
        field: "status",
        width: 140,
        cellRenderer: (params: any) => {
          const status = params.value || params.data?.orderstatus || params.data?.orderstatuslocaldb;
          const color = statusColor(status);
          return (
            <span
              className="inline-block px-2.5 py-1 rounded-full text-xs font-medium text-white capitalize"
              style={{ backgroundColor: color }}
              title={status}
            >
              {status || "-"}
            </span>
          );
        },
      },
      {
        headerName: "Message",
        field: "text",
        width: 470,
        minWidth: 350,
        wrapText: true,
        autoHeight: true,
        cellStyle: { whiteSpace: "normal", lineHeight: "1.35" },
      },

       { headerName: "Created Time", field: "filltime", width: 290 },
     
      // { headerName: "Updated Time", field: "updatedAt", width: 290 },
      // { headerName: "Created Time", field: "createdAt", width: 290 },
    ];

    const subDefaultColDef = useMemo(
      () => ({
        resizable: true,
        sortable: true,
        filter: true,
      }),
      []
    );

    return (
      <div className="p-3 bg-gray-50 rounded-lg mx-2 my-2">
        <div className="text-sm font-semibold text-gray-600 mb-2">
          Client Orders ({row.client_data?.length || 0})
        </div>

        <div className="ag-theme-alpine" style={{ width: "100%", height: "280px" }}>
          <AgGridReact<ClientOrder>
            onGridReady={(params) => {
              subGridApiRef.current[row.id] = params.api;
            }}
            rowData={row.client_data || []}
            columnDefs={subColumnDefs}
            defaultColDef={subDefaultColDef}
            pagination={true}
            paginationPageSize={10}
            rowHeight={45}
            headerHeight={40}
            enableCellTextSelection={true}
            ensureDomOrder={true}
            suppressCellFocus={true}
            animateRows={true}
          />
        </div>
      </div>
    );
  };

  // ---------------- SOCKET ----------------
  useEffect(() => {
    const socket = getSocket();

    const onTick = (tick: Tick) => {
      ltpByTokenRef.current[tick.token] = tick.ltp;

      // 🔥 Only refresh required columns
      gridApiRef.current?.refreshCells({
        columns: ["cmp", "pnl"],
        force: true,
      });

      // refresh subgrids
      Object.values(subGridApiRef.current).forEach((api) => {
        api?.refreshCells({
          columns: ["cmp", "pnl"],
          force: true,
        });
      });

      // 🔥 AUTO TARGET / SL CHECK
      rawOrdersRef.current.forEach((master) => {
        const ordersToCheck = master.client_data?.length
          ? master.client_data
          : [master];

        ordersToCheck.forEach((o: any) => {
          const token = o?.angelOneToken;
          if (!token || token !== tick.token) return;

          const orderId = String(o.orderid);
          if (!orderId) return;

          const cmp = tick.ltp;
          const result = shouldAutoExit({
            transactionType: o.transactiontype,
            cmp,
            target: o.squareoff,
            stoploss: o.stoploss,
          });

          if (!result) return;

          // ✅ mark executed FIRST (important)
          autoExitTriggeredRef.current[orderId] = true;

          callAutoExitAPI({
            orderId,
            strategyUniqueId: o.strategyUniqueId,
            reason: result,
          });
        });
      });
    };

    // ✅ DEFINE HERE
  const onRiskAlert = (payload: any) => {
    console.log("🚨 RISK ALERT RECEIVED:", payload);

    // 🔥 Example 1: Simple Alert
    // alert(payload.message);
     toast.success(payload?.message||" Successful Loss Order is Book!");

    // 🔥 Example 2: If using toast
    // toast.error(payload.message);

    // 🔥 Example 3: Open modal
    // setRiskModal(payload);
  };

    const handlerTargetAndStoploss = (payload: any) => {
      // 🔁 Simply re-fetch latest orders
      fetchOrders();
      console.log(payload, '========handlerTargetAndStoploss payload============');
    };

    socket.on("tick", onTick);
    socket.on("order:oco:update", handlerTargetAndStoploss);

    socket.on("risk_alert", onRiskAlert); // new code for notification
    // return () => socket.off("tick", onTick);

    // ✅ VERY IMPORTANT cleanup
  return () => {
    socket.off("tick", onTick);
    socket.off("order:oco:update", handlerTargetAndStoploss);
    socket.off("risk_alert", onRiskAlert);
  };
  }, []);

  // ---------------- AUTH FAIL ----------------
  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("termsAccepted");
    localStorage.removeItem("feed_token");
    localStorage.removeItem("refresh_token");
    toast.error("Unauthorized User");
    navigate("/");
  }, [navigate]);

  // ---------------- FETCH ORDERS ----------------
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.get(`${apiUrl}/admin/get/table/order`, {
        headers: authHeader,
      });

      if (data?.status === true) {
        const list = Array.isArray(data.data) ? data.data : [];
        
        // Add group trade flag to orders with multiple clients
        const enhancedList = list.map((order: Order) => ({
          ...order,
          __isGroupTrade: order.client_data && order.client_data.length > 1
        }));
        
        setRawOrders(enhancedList);
        setExpandedIds(new Set());
        rawOrdersRef.current = enhancedList;
      } else if (data?.status === false && data?.message === "Unauthorized") {
        handleUnauthorized();
      } else {
        toast.error(data?.message || "Something went wrong");
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, authHeader, handleUnauthorized]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /** ✅ API: Submit Target+SL together (only on ✅ click) */
  const submitOcoDraft = useCallback(
    async (orderIdKey: string) => {
      const d = ocoDraft?.[orderIdKey];
      if (!d?.orderId) return;

      const targetPrice = d?.targetPrice;
      const stoplossPrice = d?.stoplossPrice;

      if (!Number.isFinite(Number(targetPrice)) || !Number.isFinite(Number(stoplossPrice))) {
        toast.error("Fill valid Target & Stoploss");
        return;
      }

      const payload = {
        orderId: String(d.orderId),
        strategyUniqueId: String(d.strategyUniqueId || ""),
        targetPrice: Number(targetPrice),
        stoplossPrice: Number(stoplossPrice),
        userId: d.userId,
        broker: d.broker,
      };

      // console.log('=================payload target and stoploss update !', payload);

      try {
        setOcoSavingKey(orderIdKey);

        const res = await axios.post(`${apiUrl}/admin/multiple/targetstoploss/order`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
        });

        if (res.data?.status === true) {
          toast.success(res.data?.message || "OCO updated");
          // clear draft for this orderId
          setOcoDraft((prev) => {
            const next = { ...(prev || {}) };
            delete next[orderIdKey];
            return next;
          });
          fetchOrders();
        } else if (res.data?.status === false && res.data?.message === "Unauthorized") {
          handleUnauthorized();
        } else {
          toast.error(res.data?.message || "Failed to update OCO");
        }
      } catch (err: any) {
        toast.error(err?.message || "Failed to update OCO");
      } finally {
        setOcoSavingKey(null);
      }
    },
    [apiUrl, fetchOrders, handleUnauthorized, ocoDraft]
  );

  /** ❌ Clear draft for an orderId */
  const clearOcoDraft = useCallback((orderIdKey: string) => {
    setOcoDraft((prev) => {
      const next = { ...(prev || {}) };
      delete next[orderIdKey];
      return next;
    });
  }, []);

  /** build rows with DETAIL row after expanded master */
  const buildRows = useCallback((orders: Order[], expanded: Set<number | string>) => {
    const rows: RowItem[] = [];

    for (const o of orders) {
      const masterId = (o.id ?? o.uniqueorderid ?? o.orderid) as any;
      const isExpanded = expanded.has(masterId);
      const isGroupTrade = o.client_data && o.client_data.length > 1;

      rows.push({
        ...o,
        __rowType: "MASTER",
        __isExpanded: isExpanded,
        __isGroupTrade: isGroupTrade
      });

      if (isExpanded) {
        rows.push({
          __rowType: "DETAIL",
          id: `detail-${String(masterId)}`,
          parentId: masterId,
          parentStrategyUniqueId: o.strategyUniqueId,
          client_data: Array.isArray(o.client_data) ? o.client_data : [],
        });
      }
    }

    return rows;
  }, []);

  useEffect(() => {
    setRowData(buildRows(rawOrders, expandedIds));
  }, [rawOrders, expandedIds, buildRows]);

  const toggleRow = useCallback((masterRow: Order) => {
    const masterId = (masterRow.id ?? masterRow.uniqueorderid ?? masterRow.orderid) as any;

    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(masterId)) next.delete(masterId);
      else next.add(masterId);
      return next;
    });
  }, []);

  // ---------------- ACTIONS ----------------
  const handleSquareButton = useCallback(async () => {
    const ok = window.confirm("Do you want to Square Off this order?");
    if (!ok) return;

    try {
      const res = await axios.get(`${apiUrl}/awsadmin/sequareoff`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });

      if (res.data?.status === true) {
        toast.success(res.data?.message || "Square off done");
        fetchOrders();
      } else if (res.data?.status === false && res.data?.message === "Unauthorized") {
        handleUnauthorized();
      } else {
        toast.error(res.data?.message || "Something went wrong");
      }
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
    }
  }, [apiUrl, fetchOrders, handleUnauthorized]);



  /** ✅ MAIN SELL */
  const handleSellMain = useCallback(
    async (row: Order) => {
      if (!row?.orderid) {
        toast.error("Order ID not found");
        return;
      }

      const strategyUniqueId = row?.strategyUniqueId || "";

      const ok = window.confirm(
        `Do you want to SELL this order?\nOrder ID: ${row.orderid}\nStrategy: ${strategyUniqueId || "-"}`
      );
      if (!ok) return;

      try {
        const res = await axios.post(
          `${apiUrl}/awsadmin/sell/multiple/place/order`,
          { orderId: row.orderid, strategyUniqueId },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } }
        );

        if (res.data?.status === true) {
          toast.success(`Order ${row.orderid} squared off successfully`);
          fetchOrders();
        } else if (res.data?.status === false && res.data?.message === "Unauthorized") {
          handleUnauthorized();
        } else {
          toast.error(res.data?.message || "Failed to square off");
        }
      } catch (err: any) {
        toast.error(err?.message || "Something went wrong");
      }
    },
    [apiUrl, fetchOrders, handleUnauthorized]
  );

  /** ✅ SUB SELL */
  const handleSellFromSub = useCallback(
    async (clientRow: ClientOrder, parentStrategyUniqueId?: string) => {
      if (!clientRow?.orderid) {
        toast.error("Order ID not found");
        return;
      }

      const strategyUniqueId = parentStrategyUniqueId || clientRow.strategyUniqueId || "";

      const ok = window.confirm(
        `Do you want to SELL this order?\nOrder ID: ${clientRow.orderid}\nStrategy: ${strategyUniqueId || "-"}`
      );
      if (!ok) return;

      try {
        const res = await axios.post(
          `${apiUrl}/admin/single/squareoff`,
          { orderId: clientRow.orderid, strategyUniqueId },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } }
        );

        if (res.data?.status === true) {
          toast.success(`Order ${clientRow.orderid} squared off successfully`);
          fetchOrders();
        } else if (res.data?.status === false && res.data?.message === "Unauthorized") {
          handleUnauthorized();
        } else {
          toast.error(res.data?.message || "Failed to square off");
        }
      } catch (err: any) {
        toast.error(err?.message || "Something went wrong");
      }
    },
    [apiUrl, fetchOrders, handleUnauthorized]
  );

  // ---------------- GRID ----------------
  const defaultColDef = useMemo<ColDef<RowItem>>(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
    }),
    []
  );

  const columnDefs = useMemo<ColDef<RowItem>[]>(
    () => [
      {
        headerName: "",
        width: 60,
        minWidth: 60,
        maxWidth: 65,
        cellRenderer: ExpandCellRenderer,
        sortable: false,
        filter: false,
        resizable: false,
      },

      {
        headerName: "Action",
        width: 100,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const row: any = params.data;
          if (!row || row.__rowType === "DETAIL") return null;

          const disabled = String(row.transactiontype || "").toUpperCase() === "SELL";

                 
           const handleClick = () => {
            console.log(row.ordertag ,'r.ordertag r.ordertag r.ordertag ');
            
    if (row.ordertag === "CLONE-USER") {
      // 👉 yaha form open karo
      openCloneUserForm(row);   // apna function bana lena
    } else {
      // 👉 normal flow
      handleSellMain?.(row);
    }
   
  };

    return (
    <SellButton
      disabled={disabled}
      onClick={handleClick}
    />
  );

        },
      },

      {
        headerName: "Partial",
        width: 95,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const r: Order = params.data;
          const disabled = String(r.transactiontype) === "SELL";

          return (
            <button
              disabled={disabled}
              onClick={() => openPartialModal(r.strategyUniqueId!, "MAIN", r.orderid!)}
              className={`
                inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold
                transition-all duration-200
                ${disabled 
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                  : "bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow"
                }
              `}
              title={disabled ? "Already Sold" : "Click to Partial Sell"}
            >
              <span className="text-xs">⬇</span>
              Sell
            </button>
          );
        },
      },
      {
        headerName: "ReBuy",
        width: 105,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const r: Order = params.data;
          const isBuy = String(r.transactiontype || "").toUpperCase() === "BUY";
          const disabled = !isBuy;
          const isGroupTrade = r.client_data && r.client_data.length > 1;

          return (
            <button
              disabled={disabled}
              onClick={() => openReBuyModal(r.strategyUniqueId!, r.orderid!, r)}
              className={`
                inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold
                transition-all duration-200
                ${disabled 
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                  : "bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow"
                }
              `}
              title={
                !isBuy 
                  ? "Only BUY orders can be rebought" 
                  : isGroupTrade 
                    ? "Click for Group ReBuy"
                    : "Click for Single ReBuy"
              }
            >
              ReBuy
            </button>
          );
        },
      },
      { headerName: "SYMBOL", field: "tradingsymbol", width: 195 },
      { headerName: "Price", field: "price", width: 85 },
      // ✅ Target (draft only) + API only on ✅
      {
        headerName: "Target",
        width: 80,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const row: any = params.data;
          if (!row || row.__rowType === "DETAIL") return null;
          if (!row?.orderid) return null;

          const isBuy = String(row.transactiontype || "").toUpperCase() === "BUY";
          const key = String(row.orderid);

          const draft = ocoDraft?.[key] || {};
          const value = draft.targetPrice ?? row.squareoff ?? "";

          return (
            <NumInlineInput
              value={value}
              placeholder="Target"
              disabled={!isBuy}
              onChangeValue={(val) => {
                if (!isBuy) return;
                setOcoDraft((prev) => ({
                  ...(prev || {}),
                  [key]: {
                    ...(prev?.[key] || {}),
                    targetPrice: val,
                    stoplossPrice: prev?.[key]?.stoplossPrice ?? (row.stoploss ?? null),
                    orderId: row.orderid,
                    strategyUniqueId: row.strategyUniqueId || "",
                    userId: row.userId,
                    broker: row.broker,
                  },
                }));
              }}
            />
          );
        },
      },
      // ✅ Stoploss (draft only)
      {
        headerName: "SL",
        width: 80,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const row: any = params.data;
          if (!row || row.__rowType === "DETAIL") return null;
          if (!row?.orderid) return null;

          const isBuy = String(row.transactiontype || "").toUpperCase() === "BUY";
          const key = String(row.orderid);

          const draft = ocoDraft?.[key] || {};
          const value = draft.stoplossPrice ?? row.stoploss ?? "";

          return (
            <NumInlineInput
              value={value}
              placeholder="SL"
              disabled={!isBuy}
              onChangeValue={(val) => {
                if (!isBuy) return;
                setOcoDraft((prev) => ({
                  ...(prev || {}),
                  [key]: {
                    ...(prev?.[key] || {}),
                    stoplossPrice: val,
                    targetPrice: prev?.[key]?.targetPrice ?? (row.squareoff ?? null),
                    orderId: row.orderid,
                    strategyUniqueId: row.strategyUniqueId || "",
                    userId: row.userId,
                    broker: row.broker,
                  },
                }));
              }}
            />
          );
        },
      },
      // ✅ ✅/❌ icons column for MAIN row also
      {
        headerName: "OCO",
        width: 80,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const row: any = params.data;
          if (!row || row.__rowType === "DETAIL") return null;
          if (!row?.orderid) return null;

          const key = String(row.orderid);
          const draft = ocoDraft?.[key] || {};

          const t = draft.targetPrice ?? null;
          const sl = draft.stoplossPrice ?? null;

          const hasTarget = Number.isFinite(Number(t)) && Number(t) > 0;
          const hasSL = Number.isFinite(Number(sl)) && Number(sl) > 0;
          const canSubmit = (hasTarget || hasSL);

          const saving = ocoSavingKey === key;

          return (
            <OcoActionIcons
              disabled={!canSubmit}
              okLoading={saving}
              title={!canSubmit ? "Fill both Target and Stoploss first" : "Submit Target+Stoploss"}
              onOk={() => submitOcoDraft(key)}
              onCancel={() => clearOcoDraft(key)}
            />
          );
        },
      },
      {
        headerName: "CMP",
        colId: "cmp",
        width: 105,
        sortable: false,
        filter: false,
        valueGetter: (p) => {
          const d: any = p.data;
          if (d?.__rowType === "DETAIL") return undefined;
          const t = d?.angelOneToken;
          return t ? ltpByTokenRef.current[t] : undefined;
        },
        cellRenderer: (p: any) => (p.value !== undefined ? `₹${p.value.toFixed(2)}` : "—"),
      },
      {
        headerName: "PnL",
        colId: "pnl",
        width: 130,
        sortable: false,
        filter: false,
        valueGetter: (p) => {
          const d: any = p.data;
          if (d?.__rowType === "DETAIL") return null;

          const token = d?.angelOneToken;
          const live = token ? ltpByTokenRef.current[token] : undefined;
          const price = Number(d?.price ?? 0);
          const qty = Number(d?.quantity ?? 0);

          if (live === undefined || !Number.isFinite(price) || !Number.isFinite(qty)) return null;
          return (live - price) * qty;
        },
        cellRenderer: (p: any) => pnlPill(p.value),
      },
      { headerName: "Strategy", field: "strategyName", width: 160, minWidth: 140 },
      { headerName: "O Qty", field: "quantity", width: 80 },
      { headerName: "StrategyUniqueId", field: "strategyUniqueId", width: 220, minWidth: 200 },
      {
        headerName: "Type",
        field: "transactiontype",
        width: 110,
        cellRenderer: (params: any) => {
          const row: any = params.data;
          if (row?.__rowType === "DETAIL") return null;

          const isBuy = params.value === "BUY";
          const isSell = params.value === "SELL";
          const txnBg = isBuy ? "bg-green-100" : isSell ? "bg-red-100" : "bg-gray-200";
          const txnColor = isBuy ? "text-green-700" : isSell ? "text-red-700" : "text-gray-600";

          // Show group indicator for group trades
          const isGroupTrade = row?.__isGroupTrade;

          return (
            <div className="flex items-center gap-1">
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${txnBg} ${txnColor}`}>
                {params.value || "-"}
              </span>
              {isGroupTrade && (
                <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full" title="Group Trade">
                  {row.client_data?.length || 0}
                </span>
              )}
            </div>
          );
        },
      },
      // { headerName: "Instrument", field: "instrumenttype", width: 140 },
      // { headerName: "TradedQty", field: "fillsize", width: 120 },
      { headerName: "OrderID", field: "orderid", width: 190 },
      {
        headerName: "Status",
        field: "status",
        width: 140,
        cellRenderer: (params: any) => {
          const row: any = params.data;
          if (row?.__rowType === "DETAIL") return null;

          const status = params.value || row?.orderstatus || row?.orderstatuslocaldb;
          const color = statusColor(status);
          return (
            <span
              className="inline-block px-2.5 py-1 rounded-full text-xs font-medium text-white capitalize"
              style={{ backgroundColor: color }}
              title={status}
            >
              {status || "-"}
            </span>
          );
        },
      },
      { headerName: "OrderType", field: "ordertype", width: 130 },
      { headerName: "ProductType", field: "producttype", width: 130 },
      { headerName: "TradeID", field: "fillid", width: 140 },
      {
        headerName: "Message",
        field: "text",
        width: 170,
        minWidth: 150,
        wrapText: true,
        autoHeight: true,
        cellStyle: { whiteSpace: "normal", lineHeight: "1.35" },
      },

        { headerName: "Created Time", field: "filltime", width: 290 },

      // { headerName: "Updated Time", field: "updatedAt", width: 290 },
      // { headerName: "Created Time", field: "createdAt", width: 290 },
    ],
    [handleSellMain, ocoDraft, ocoSavingKey, submitOcoDraft, clearOcoDraft]
  );

  const onGridReady = useCallback((params: GridReadyEvent) => {
    gridApiRef.current = params.api;
  }, []);

  // ✅ Search: min 3 chars -> quick filter
  const onSearchKeyUp = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const q = e.currentTarget.value.trim();
    if (!gridApiRef.current) return;

    if (!q) {
      (gridApiRef.current as any)?.setQuickFilter("");
      return;
    }
    if (q.length < 3) return;

    (gridApiRef.current as any).setQuickFilter(q);
  }, []);

  const getRowId = useCallback((params: any) => {
    const d: any = params.data;
    if (d?.__rowType === "DETAIL") return d.id;
    return String(d?.id ?? d?.uniqueorderid ?? d?.orderid);
  }, []);

  const isFullWidthRow = useCallback((params: any) => {
    return params?.rowNode?.data?.__rowType === "DETAIL";
  }, []);

  const fullWidthCellRenderer = useCallback((props: any) => {
    return <DetailRowRenderer {...props} />;
  }, []);

  const getRowHeight = useCallback((params: RowHeightParams) => {
    const d: any = params.data;
    if (d?.__rowType === "DETAIL") return 330;
    return 50;
  }, []);

  // Apply row styling for group trades
  const getRowStyle = useCallback((params: any) => {
    const d: any = params.data;
    if (d?.__rowType === "MASTER" && d?.__isGroupTrade) {
      return {
        background: "linear-gradient(90deg, #f3e8ff 0%, #ffffff 100%)",
        borderLeft: "4px solid #9333ea",
        fontWeight: 500
      };
    }
    return undefined;
  }, []);

  return (
<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-0">
  <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-[#FB3800] to-orange-500 rounded-xl">
              <FiActivity className="text-white" size={24} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Current Positions</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            Monitor and manage your active trading positions
          </p>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={handleSquareButton}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow"
            >
              <FiXCircle size={16} />
              Square Off All
            </button>

            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search (min 3 chars)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyUp={onSearchKeyUp}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                />
              </div>
            </div>

            <button
              onClick={fetchOrders}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200"
            >
              <FiRefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-[#FB3800]/20 rounded-full"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-[#FB3800] rounded-full animate-spin border-t-transparent"></div>
            </div>
            <p className="mt-4 text-gray-500">Loading positions...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-3">
              <FiXCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium text-red-800">Error</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* AG Grid Table */}
        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="ag-theme-alpine" 
            style={{ height: "600px", width: "100%" }}>
              <AgGridReact<RowItem>
                onGridReady={onGridReady}
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                context={{
                  toggleRow,
                  onSellFromSub: handleSellFromSub,
                  ltpByToken: ltpByTokenRef.current,
                  ocoDraft,
                  setOcoDraft,
                  submitOcoDraft,
                  clearOcoDraft,
                  ocoSavingKey,
                }}
                getRowId={getRowId}
                isFullWidthRow={isFullWidthRow}
                fullWidthCellRenderer={fullWidthCellRenderer}
                getRowHeight={getRowHeight}
                getRowStyle={getRowStyle}
                pagination={true}
                paginationPageSize={20}
                paginationPageSizeSelector={[10, 20, 50, 100]}
                suppressCellFocus={true}
                animateRows={true}
                enableCellTextSelection={true}
                ensureDomOrder={true}
                headerHeight={48}
                rowHeight={50}
                overlayLoadingTemplate={
                  '<div class="flex justify-center items-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FB3800]"></div><span class="ml-3 text-gray-500">Loading positions...</span></div>'
                }
                overlayNoRowsTemplate={
                  '<div class="flex justify-center items-center h-full text-gray-400">No orders found</div>'
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* Partial Sell Modal */}
      {showPartialModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Partial Sell</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Strategy ID</label>
                <input
                  value={partialData?.strategyUniqueId || ""}
                  disabled
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  value={partialData?.quantity || ""}
                  onChange={(e) =>
                    setPartialData((prev) =>
                      prev ? { ...prev, quantity: Number(e.target.value) } : prev
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter Quantity"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={closePartialModal}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePartialSell}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ReBuy Modal */}
      {showReBuyModal && reBuyData && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        >
          <div className={`bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden ${reBuyData.selectedClientIndex === "group" ? "border-t-4 border-purple-500" : "border-t-4 border-green-500"}`}>
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">
                  {reBuyData.selectedClientIndex === "group" ? (
                    <span className="text-purple-700">👥 Group ReBuy</span>
                  ) : (
                    <span className="text-green-700">👤 Single ReBuy</span>
                  )}
                </h3>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  reBuyData.selectedClientIndex === "group" 
                    ? "bg-purple-100 text-purple-700" 
                    : "bg-green-100 text-green-700"
                }`}>
                  {reBuyData.selectedClientIndex === "group" ? "GROUP MODE" : "SINGLE MODE"}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Strategy ID</label>
                  <div className="font-mono text-sm font-semibold mt-1 break-all">
                    {reBuyData.strategyUniqueId}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Order ID</label>
                  <div className="font-mono text-sm font-semibold mt-1 break-all">
                    {reBuyData.orderId}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Client</label>
                <select
                  value={reBuyData.selectedClientIndex}
                  onChange={handleClientChange}
                  className="w-full border border-gray-200 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="group" className="font-bold text-purple-700 bg-purple-50">
                    👥 GROUP - All Clients ({reBuyData.clientData?.length || 0})
                  </option>
                  <option disabled style={{ backgroundColor: '#f3f4f6', color: '#9ca3af' }}>──────────</option>
                  {reBuyData.clientData && reBuyData.clientData.length > 0 ? (
                    reBuyData.clientData.map((client, index) => (
                      <option key={index} value={index}>
                        👤 {client.userNameId} {client.broker ? `(${client.broker})` : ''} - Qty: {client.quantity || 0}
                      </option>
                    ))
                  ) : (
                    <option value={-1}>No clients available</option>
                  )}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  {reBuyData.selectedClientIndex === "group" ? (
                    <>⚠️ Group rebuy will create orders for ALL {reBuyData.clientData.length} clients</>
                  ) : (
                    <>Select a specific client for single rebuy</>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity to ReBuy</label>
                <input
                  type="number"
                  value={reBuyData?.quantity || ""}
                  onChange={(e) =>
                    setReBuyData((prev) =>
                      prev ? { ...prev, quantity: Number(e.target.value) } : prev
                    )
                  }
                  className="w-full border border-gray-200 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter Quantity"
                  min="1"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={closeReBuyModal}
                className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReBuy}
                className={`px-5 py-2 rounded-lg text-white transition shadow-sm ${
                  reBuyData.selectedClientIndex === "group" 
                    ? "bg-purple-600 hover:bg-purple-700" 
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {reBuyData.selectedClientIndex === "group" ? "🚀 Group ReBuy" : "✨ Single ReBuy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clone User Sell Modal */}


      {/* {showModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">🔴 Sell Order</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                ✖
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500">Order ID</div>
                <div className="font-semibold mt-1">{selectedOrder?.orderid}</div>
                <div className="text-xs text-gray-500 mt-2">Symbol</div>
                <div className="font-semibold mt-1">{selectedOrder?.tradingsymbol}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sell Price</label>
                <input
                  type="number"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  placeholder="Enter Sell Price"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sell Time</label>
                <input
                  type="datetime-local"
                  value={sellTime}
                  onChange={(e) => setSellTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition shadow-sm"
              >
                Confirm Sell
              </button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
}