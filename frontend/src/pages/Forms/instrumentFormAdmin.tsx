import { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { ModuleRegistry } from "ag-grid-community";
import { AllCommunityModule } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";
import { MdOutlineCancel } from "react-icons/md";
import { 
  FiSearch, 
  FiFilter, 
  FiShoppingCart, 
  FiTrendingUp, 
  FiTrendingDown,
  FiRefreshCw,
  FiDollarSign,
  FiUsers
} from "react-icons/fi";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { useInstrumentStore } from "../../instrumentStore";

// 🔹 Type + Exchange options (Angel share same codes)
type ExchangeOption = {
  code: string;
  fullForm: string;
};

const EXCHANGE_OPTIONS: ExchangeOption[] = [
  { code: "NSE", fullForm: "National Stock Exchange" },
  { code: "BSE", fullForm: "Bombay Stock Exchange" },
  { code: "NFO", fullForm: "NSE Futures & Options Segment" },
  { code: "BFO", fullForm: "BSE Futures & Options Segment" },
  { code: "CDS", fullForm: "Currency Derivatives Segment" },
  { code: "MCX", fullForm: "Multi Commodity Exchange" },
];

export default function InstrumentFormAdmin() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { dataRedish, setDataRedish, shouldFetchRedish } = useInstrumentStore();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isPlacing, setIsPlacing] = useState(false);
  const [ltp, setLtp] = useState(0);
  const [quickFilterText, setQuickFilterText] = useState("");
  const gridApiRef = useRef<GridApi | null>(null);
  const [groupName, setGroupName] = useState("");
  const [strategyList, setStrategyList] = useState<any[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState("");
  const [scriptModalOpen, setScriptModalOpen] = useState(false);
  const [selectedScriptRow, setSelectedScriptRow] = useState<any | null>(null);

  // Quantity validation states
  const [selectedQuantity, setSelectedQuantity] = useState<number>(0);
  const [quantityError, setQuantityError] = useState<string>("");
  const [suggestedQuantity, setSuggestedQuantity] = useState<{min: number, max: number} | null>(null);

  const [scriptProductType, setScriptProductType] = useState<
    "" | "INTRADAY" | "DELIVERY" | "CARRYFORWARD" | "BO" | "MARGIN"
  >("CARRYFORWARD");

  // Clone user fields
  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [buyTime, setBuyTime] = useState<string>("");
  const [users, setUsers] = useState<any[]>([]);
  const [manualUserId, setManualUserId] = useState("");
  const [selectedCloneUserId, setSelectedCloneUserId] = useState<string>("");

  // Clone user related states
  const [userType, setUserType] = useState<"real" | "clone">("real");

  // 🔹 Selected Exchange for filter on top
  const [selectedExchange, setSelectedExchange] = useState<string>("");

  // ========== Quantity Validation Function ==========
  const validateQuantity = (quantity: number, lotSize: number): { 
    isValid: boolean; 
    message: string; 
    suggestions: { min: number; max: number } | null 
  } => {
    if (quantity <= 0) {
      return { 
        isValid: false, 
        message: "Quantity must be greater than 0",
        suggestions: { min: lotSize, max: lotSize * 10 }
      };
    }
    
    if (quantity % lotSize !== 0) {
      const nearestLower = Math.floor(quantity / lotSize) * lotSize;
      const nearestHigher = Math.ceil(quantity / lotSize) * lotSize;
      const suggestedMin = nearestLower > 0 ? nearestLower : lotSize;
      const suggestedMax = nearestHigher;
      
      return {
        isValid: false,
        message: `Quantity must be in multiples of ${lotSize} (1 lot)`,
        suggestions: { min: suggestedMin, max: suggestedMax }
      };
    }
    
    const lots = quantity / lotSize;
    if (lots > 50) {
      return {
        isValid: false,
        message: `Maximum 50 lots (${lotSize * 50} quantity) allowed`,
        suggestions: { min: lotSize, max: lotSize * 50 }
      };
    }
    
    return { isValid: true, message: "", suggestions: null };
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 0) {
      setSelectedQuantity(0);
      setQuantityError("Please enter a valid quantity");
      return;
    }
    
    setSelectedQuantity(value);
    
    if (selectedScriptRow) {
      const validation = validateQuantity(value, selectedScriptRow.lotsize);
      setQuantityError(validation.message);
      setSuggestedQuantity(validation.suggestions);
    }
  };

  // ---------- Common expiry normalizer ----------
  const buildExpiryMeta = (rawExpiry: any) => {
    if (!rawExpiry) return { expiryDateObj: null, expiryLabel: "" };

    const s = String(rawExpiry).trim();
    if (!s) return { expiryDateObj: null, expiryLabel: "" };

    let d: Date | null = null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      d = new Date(s + "T00:00:00");
    } else if (/^\d{2}-[A-Za-z]{3}-\d{2,4}$/.test(s)) {
      const [ddStr, monStrRaw, yyStr] = s.split("-");
      const dd = Number(ddStr);
      const monStr = monStrRaw.toUpperCase();
      const monthMap: Record<string, number> = {
        JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
        JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
      };
      const monthIndex = monthMap[monStr];
      if (monthIndex !== undefined) {
        let yearNum = Number(yyStr);
        if (yyStr.length === 2) yearNum = 2000 + yearNum;
        d = new Date(yearNum, monthIndex, dd);
      }
    } else {
      const t = new Date(s);
      if (!isNaN(t.getTime())) d = t;
    }

    if (!d) return { expiryDateObj: null, expiryLabel: "" };

    const day = d.getDate().toString().padStart(2, "0");
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const label = `${day}-${monthNames[d.getMonth()]}-${d.getFullYear()}`;

    return { expiryDateObj: d, expiryLabel: label };
  };

  const handleSell = async (row: any) => {
    const LtlPayload = {
      exchange: row.exch_seg,
      tradingsymbol: row.symbol,
      symboltoken: row.token,
    };

    const res = await axios.post(
      `${apiUrl}/agnelone/instrument/ltp`,
      LtlPayload,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID"),
        },
      }
    );

    if (res.data.status === true) {
      setLtp(res.data.data.data.ltp || 0);
    } else {
      setLtp(0);
    }
  };

  // ---------- AngelOne Normalizer ----------
  const mapAngelToCommon = (row: any) => {
    const { expiryDateObj, expiryLabel } = buildExpiryMeta(row.expiry);

    return {
      ...row,
      token: String(row.token ?? ""),
      symbol: String(row.symbol ?? ""),
      name: row.name ?? "",
      expiry: row.expiry ?? "",
      strike: row.strike !== undefined ? Number(row.strike) : -1,
      lotsize: row.lotsize !== undefined ? Number(row.lotsize) : 0,
      instrumenttype: row.instrumenttype ?? "",
      exch_seg: row.exch_seg ?? "",
      tick_size: row.tick_size !== undefined ? Number(row.tick_size) : 0,
      syType: row.instrumenttype ?? row.syType ?? "",
      angelToken: String(row.token ?? ""),
      angelSymbol: String(row.symbol ?? ""),
      expiryDateObj,
      expiryLabel,
    };
  };

  const parseExpiryToDate = (expiryStr: string): Date | null => {
    if (!expiryStr) return null;
    const s = String(expiryStr).trim();
    if (!s) return null;

    const match = s.match(/^(\d{2})([A-Za-z]{3})(\d{4})$/);
    if (match) {
      const [, day, monthStr, year] = match;
      const monthMap: Record<string, number> = {
        'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
        'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
      };
      const monthIndex = monthMap[monthStr.toUpperCase()];
      if (monthIndex !== undefined) {
        return new Date(parseInt(year), monthIndex, parseInt(day));
      }
    }
    return null;
  };

  // ---------- Fetch instruments (ONLY AngelOne) ----------
  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      if (!dataRedish || shouldFetchRedish()) {
        const res = await axios.get(`${apiUrl}/agnelone/instrumentnew`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            AngelOneToken: localStorage.getItem("angel_token") || "",
          },
        });

        if (res?.data?.status === true) {
          const rawData = res?.data?.data || [];
          const sortedData = [...rawData].sort((a, b) => {
            const dateA = parseExpiryToDate(a.expiry);
            const dateB = parseExpiryToDate(b.expiry);
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            return dateA.getTime() - dateB.getTime();
          });
          
          const normalized = sortedData.map((row: any) => mapAngelToCommon(row));
          setData(normalized);
          setDataRedish(normalized);
        } else {
          toast.error(res?.data?.message || "Something went wrong");
        }
      } else {
        setData(dataRedish);
      }
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Fetch clone users ----------
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${apiUrl}/admin/clone-users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID") || "",
        },
      });
      if (res.data.status === true) {
        setUsers(res.data.data || []);
      } else {
        toast.error(res.data.message || "Failed to fetch users");
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    }
  };

  // ---------- Fetch strategies ----------
  const fetchStrategies = async () => {
    try {
      const res = await axios.get(`${apiUrl}/admin/strategiesloginuser`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID"),
        },
      });

      if (res.data.status === true) {
        setStrategyList(res.data.data || []);
      } else {
        toast.error(res.data.message);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
    }
  };

  useEffect(() => {
    fetchData();
    fetchUsers();
    fetchStrategies();
    setQuickFilterText("");
  }, []);

  // ========== AG Grid Column Definitions with Row Colors ==========
  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: "Action",
        cellRenderer: (params: any) => (
          <button
            onClick={() => {
              setSelectedScriptRow(params.data);
              setSelectedQuantity(params.data.lotsize);
              setQuantityError("");
              setSuggestedQuantity(null);
              setScriptModalOpen(true);
              handleSell(params.data);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg text-white shadow-sm bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-200"
            title="Click to Buy"
          >
            <FiTrendingUp size={14} />
            BUY
          </button>
        ),
        minWidth: 100,
        sortable: false,
        filter: false,
        cellStyle: (params: any) => {
          const symbol = params.data?.symbol || "";
          if (symbol.includes('CE')) {
            return { backgroundColor: '#dcfce7' };
          } else if (symbol.includes('PE')) {
            return { backgroundColor: '#fee2e2' };
          }
          return { backgroundColor: '#f3f4f6' };
        },
      },
      {
        headerName: "Symbol",
        field: "symbol",
        minWidth: 260,
        filter: "agTextColumnFilter",
        cellStyle: (params: any) => {
          const symbol = params.value || "";
          if (symbol.includes('CE')) {
            return { backgroundColor: '#dcfce7', fontWeight: 'bold', color: '#166534' };
          } else if (symbol.includes('PE')) {
            return { backgroundColor: '#fee2e2', fontWeight: 'bold', color: '#991b1b' };
          }
          return { backgroundColor: '#f3f4f6', color: '#374151' };
        },
      },
      {
        headerName: "Exchange",
        field: "exch_seg",
        minWidth: 150,
        filter: "agTextColumnFilter",
        cellStyle: (params: any) => {
          const symbol = params.data?.symbol || "";
          if (symbol.includes('CE')) {
            return { backgroundColor: '#dcfce7', color: '#166534' };
          } else if (symbol.includes('PE')) {
            return { backgroundColor: '#fee2e2', color: '#991b1b' };
          }
          return { backgroundColor: '#f3f4f6', color: '#374151' };
        },
      },
      {
        headerName: "Expiry",
        field: "expiry",
        minWidth: 150,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "Strike",
        field: "strike",
        minWidth: 120,
        filter: "agNumberColumnFilter",
        valueFormatter: (params: any) => params.value || "-",
      },
      {
        headerName: "Lot Size",
        field: "lotsize",
        minWidth: 100,
        filter: "agNumberColumnFilter",
      },
      {
        headerName: "Instrument",
        field: "instrumenttype",
        minWidth: 150,
        filter: "agTextColumnFilter",
      },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      resizable: true,
      filter: true,
      floatingFilter: false,
      flex: 1,
      minWidth: 100,
    }),
    []
  );

  const onGridReady = (e: GridReadyEvent) => {
    gridApiRef.current = e.api;
    e.api.sizeColumnsToFit();
  };

  const onFilterTextBoxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuickFilterText(e.target.value);
  };

  // 🔹 Main grid data, filtered by exchange
  const filteredData = useMemo(() => {
    let rows = data;
    if (selectedExchange) {
      const selectedCode = selectedExchange.split(" - ")[0].toUpperCase();
      rows = rows.filter(
        (row) => String(row.exch_seg || "").toUpperCase().trim() === selectedCode
      );
    }
    return rows;
  }, [data, selectedExchange]);

  // ---------- Save / Place Order ----------
  const handleScriptSave = async () => {
    if (isPlacing) return;
    
    if (!selectedScriptRow) {
      toast.error("No scrip selected!");
      return;
    }

    if (userType === "real" && !groupName) {
      toast.error("Please Select Strategy!");
      return;
    }

    if (userType === "clone" && !selectedCloneUserId) {
      toast.error("Please Select Clone User!");
      return;
    }

    if (userType === "clone" && (!buyPrice || !buyTime)) {
      toast.error("Please Enter Buy Price and Buy Time");
      return;
    }

    const validation = validateQuantity(selectedQuantity, selectedScriptRow.lotsize);
    if (!validation.isValid) {
      toast.error(validation.message);
      if (validation.suggestions) {
        setSuggestedQuantity(validation.suggestions);
      }
      return;
    }
    
    setIsPlacing(true);
    const startTime = Date.now();

    const payload = {
      token: selectedScriptRow.token,
      symbol: selectedScriptRow.symbol,
      name: selectedScriptRow.name,
      instrumenttype: selectedScriptRow.instrumenttype,
      exch_seg: selectedScriptRow.exch_seg,
      lotsize: selectedScriptRow.lotsize,
      quantity: Number(selectedQuantity),
      transactiontype: "BUY",
      duration: "DAY",
      orderType: "MARKET",
      variety: "NORMAL",
      price: ltp,
      stoploss: 0,
      squareoff: 0,
      productType: scriptProductType,
      strategyId: selectedStrategyId,
      groupName,
      angelOneToken: selectedScriptRow.angelToken,
      angelOneSymbol: selectedScriptRow.angelSymbol,
      kiteToken: selectedScriptRow?.token,
      kiteSymbol: selectedScriptRow?.kiteSymbol,
      finavasiaToken: selectedScriptRow?.finvasiaToken || "",
      finavasiaSymbol: selectedScriptRow?.finvasiaSymbol || "",
      fyersToken: selectedScriptRow?.fyersToken || "",
      fyersSymbol: selectedScriptRow?.fyersSymbol || "",
      upstoxToken: selectedScriptRow?.upstoxToken || "",
      upstoxSymbol: selectedScriptRow?.upstoxSymbol || "",
      growToken: selectedScriptRow?.growwTradingSymbol || "",
      growSymbol: selectedScriptRow?.growwSymbol || "",
      growwTradingSymbol: selectedScriptRow?.growwTradingSymbol || "",
      growwExchange: selectedScriptRow?.growwExchange || "",
      growwSegment: selectedScriptRow?.growwSegment || "",
      kotakExchange: selectedScriptRow?.kotakExchange || "",
      kotakSymobol: selectedScriptRow?.kotakSymbol || "",
    };

    if (userType === 'clone') {
      try {
        const finalUserId = selectedCloneUserId === "manual" ? manualUserId : selectedCloneUserId;
        const clonePayload = {
          ...payload,
          userid: finalUserId,
          buyPrice: buyPrice,
          buyTime: buyTime,
        };

        const res = await axios.post(
          `${apiUrl}/admin/manualinstrument/create/order`,
          clonePayload,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } }
        );

        if (res?.data?.status) {
          toast.success("Order placed successfully!");
          setScriptModalOpen(false);
        } else {
          toast.error(res?.data?.message || "Failed to place order.");
        }
      } catch (err) {
        toast.error("Something went wrong.");
      }
    } else {
      try {
        const res = await axios.post(
          `${apiUrl}/awsadmin/multiple/place/order`,
          payload,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } }
        );

        if (res?.data?.status) {
          toast.success("Order placed successfully!");
          setScriptModalOpen(false);
        } else {
          toast.error(res?.data?.message || "Failed to place order.");
        }
      } catch (err) {
        toast.error("Something went wrong.");
      } finally {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 3000 - elapsed);
        setTimeout(() => setIsPlacing(false), remaining);
      }
    }
  };

  // ---------- JSX ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 md:px-6 lg:px-8 py-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-[#FB3800] to-orange-500 rounded-xl">
              <FiShoppingCart className="text-white" size={24} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Instrument Library</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            Browse and trade instruments across multiple exchanges
          </p>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={quickFilterText}
                  onChange={onFilterTextBoxChange}
                  placeholder='Search by symbol, token, or exchange...'
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                />
              </div>
            </div>

            <div className="min-w-[200px]">
              <div className="relative">
                <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <select
                  value={selectedExchange}
                  onChange={(e) => setSelectedExchange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all bg-white"
                >
                  <option value="">All Exchanges</option>
                  {EXCHANGE_OPTIONS.map((ex) => (
                    <option key={ex.code} value={`${ex.code} - ${ex.fullForm}`}>
                      {ex.code} - {ex.fullForm}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={fetchData}
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
            <p className="mt-4 text-gray-500">Loading instruments...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredData.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <FiShoppingCart className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No instruments found</h3>
            <p className="mt-2 text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* AG Grid Table */}
        {filteredData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="ag-theme-quartz" style={{ height: 550, width: "100%" }}>
              <AgGridReact
                rowData={filteredData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                animateRows
                rowSelection="single"
                pagination
                enableCellTextSelection={true}
                ensureDomOrder={true}
                paginationPageSize={100}
                paginationPageSizeSelector={[25, 50, 100, 250]}
                rowHeight={48}
                headerHeight={48}
                suppressFieldDotNotation
                onGridReady={onGridReady}
                quickFilterText={quickFilterText}
                overlayLoadingTemplate={'<div class="flex justify-center items-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FB3800]"></div><span class="ml-3">Loading...</span></div>'}
                overlayNoRowsTemplate={'<div class="flex justify-center items-center h-full text-gray-400">No data found</div>'}
              />
            </div>
          </div>
        )}
      </div>

      {/* Buy Modal */}
      {scriptModalOpen && selectedScriptRow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-3 overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className={`px-6 py-4 ${
              selectedScriptRow.symbol?.includes("CE")
                ? "bg-gradient-to-r from-green-500 to-green-600"
                : selectedScriptRow.symbol?.includes("PE")
                ? "bg-gradient-to-r from-red-500 to-red-600"
                : "bg-gradient-to-r from-blue-500 to-blue-600"
            } text-white`}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">{selectedScriptRow.symbol}</h3>
                  <p className="text-xs opacity-90 mt-1">Lot Size: {selectedScriptRow.lotsize}</p>
                </div>
                <button onClick={() => setScriptModalOpen(false)} className="hover:text-gray-200 transition">
                  <MdOutlineCancel className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Product Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Type</label>
                <div className="flex flex-wrap gap-4">
                  {["INTRADAY", "DELIVERY", "CARRYFORWARD"].map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={scriptProductType === type}
                        onChange={() => setScriptProductType(type as any)}
                        className="w-4 h-4 text-[#FB3800]"
                      />
                      <span className="text-sm">
                        {type === "INTRADAY" && "Intraday (MIS)"}
                        {type === "DELIVERY" && "Longterm (CNC)"}
                        {type === "CARRYFORWARD" && "Normal (NRML)"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity (Lot Size: {selectedScriptRow.lotsize})
                </label>
                <input
                  type="number"
                  value={selectedQuantity}
                  onChange={handleQuantityChange}
                  min={selectedScriptRow.lotsize}
                  step={selectedScriptRow.lotsize}
                  className={`w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all ${
                    quantityError ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {quantityError && (
                  <p className="text-red-500 text-xs mt-1">{quantityError}</p>
                )}
                {suggestedQuantity && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2 font-medium">Suggested quantities:</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedQuantity(suggestedQuantity.min);
                          setQuantityError("");
                          setSuggestedQuantity(null);
                        }}
                        className="flex-1 px-3 py-2 bg-white border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                      >
                        Min: {suggestedQuantity.min}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedQuantity(suggestedQuantity.max);
                          setQuantityError("");
                          setSuggestedQuantity(null);
                        }}
                        className="flex-1 px-3 py-2 bg-white border border-green-300 text-green-600 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
                      >
                        Max: {suggestedQuantity.max}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Row 1 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">User Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={userType === "real"} onChange={() => setUserType("real")} className="w-4 h-4 text-[#FB3800]" />
                      <span className="text-sm">Real</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={userType === "clone"} onChange={() => setUserType("clone")} className="w-4 h-4 text-[#FB3800]" />
                      <span className="text-sm">Clone</span>
                    </label>
                  </div>
                </div>

                {userType === "real" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Strategy</label>
                    <select
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                      value={selectedStrategyId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedStrategyId(id);
                        const selected = strategyList.find((s) => String(s.id) === id);
                        setGroupName(selected?.strategyName || "");
                      }}
                    >
                      <option value="">Select Strategy</option>
                      {strategyList.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.strategyName}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Market Price</label>
                  <input
                    type="number"
                    value={ltp || 0}
                    onChange={(e) => setLtp(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-700"
                  />
                </div>
                <div className="bg-gray-50 rounded-lg p-3 flex flex-col justify-center border border-gray-100">
                  <span className="text-xs text-gray-500">Required Margin</span>
                  <span className="text-xl font-bold text-[#FB3800]">
                    ₹{(ltp * selectedQuantity).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Clone User Fields */}
              {userType === "clone" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Buy Price</label>
                      <input
                        type="number"
                        value={buyPrice}
                        onChange={(e) => setBuyPrice(Number(e.target.value))}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                        placeholder="Enter buy price"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Buy Time</label>
                      <input
                        type="datetime-local"
                        value={buyTime}
                        onChange={(e) => setBuyTime(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Clone User</label>
                    <select
                      value={selectedCloneUserId}
                      onChange={(e) => setSelectedCloneUserId(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                    >
                      <option value="">Select user</option>
                      <option value="manual">✍️ Enter Manually</option>
                      {users.map((user: any) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} ({user.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCloneUserId === "manual" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Enter User ID</label>
                      <input
                        type="text"
                        value={manualUserId}
                        onChange={(e) => setManualUserId(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                        placeholder="Enter user id"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setScriptModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScriptSave}
                  disabled={isPlacing || selectedQuantity === 0 || quantityError !== ""}
                  className={`px-5 py-2.5 rounded-lg text-white font-medium transition-all ${
                    isPlacing || selectedQuantity === 0 || quantityError
                      ? "bg-gray-400 cursor-not-allowed"
                      : selectedScriptRow.symbol?.includes("CE")
                      ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      : selectedScriptRow.symbol?.includes("PE")
                      ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                      : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  }`}
                >
                  {isPlacing ? "Placing..." : "Place Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}