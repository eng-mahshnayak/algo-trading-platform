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
  FiTrendingUp, 
  FiTrendingDown, 
  FiRefreshCw,
  FiActivity,
  FiUsers,
  FiDollarSign
} from "react-icons/fi";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { useInstrumentStore, useInstrumentStoreTwo, useLTPStore } from "../../instrumentStore";

export default function WatchList() {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // Store 1: Main instrument data
  const { dataRedish, setDataRedish, shouldFetchRedish } = useInstrumentStore();
  
  // Store 2: Options symbols table data
  const { 
    optionsSymbolsData, 
    setOptionsSymbolsData, 
    shouldFetchOptionsSymbols,
    selectedIndex: storedIndex,
  } = useInstrumentStoreTwo();
  
  // Store 3: LTP data
  const { setLTP, getLTP, shouldFetchLTP } = useLTPStore();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // AG Grid refs for both tables
  const ceGridApiRef = useRef<GridApi | null>(null);
  const peGridApiRef = useRef<GridApi | null>(null);

  // Selected Index
  const [selectedIndex, setSelectedIndex] = useState<"NIFTY" | "BANKNIFTY" | "SENSEX">(
    storedIndex as "NIFTY" | "BANKNIFTY" | "SENSEX" || "NIFTY"
  );
  
  // Index Symbols Data
  const [niftySymbol, setNiftySymbol] = useState<any>(null);
  const [bankNiftySymbol, setBankNiftySymbol] = useState<any>(null);
  const [sensexSymbol, setSensexSymbol] = useState<any>(null);
  const [currentLtp, setCurrentLtp] = useState<number>(0);
  const [ltpLoading, setLtpLoading] = useState(false);

  const [strategyList, setStrategyList] = useState<any[]>([]);

  // Strike Levels
  const [strikeLevels, setStrikeLevels] = useState<any>(null);
  
  // Options Symbols Table Data
  const [optionsSymbols, setOptionsSymbols] = useState<any[]>(optionsSymbolsData || []);
  const [tableLoading, setTableLoading] = useState(false);

  // Modal States
  const [scriptModalOpen, setScriptModalOpen] = useState(false);
  const [selectedScriptRow, setSelectedScriptRow] = useState<any | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  
  // Quantity state
  const [selectedQuantity, setSelectedQuantity] = useState<number>(0);
  const [quantityError, setQuantityError] = useState<string>("");
  const [suggestedQuantity, setSuggestedQuantity] = useState<{min: number, max: number} | null>(null);
  
  // LTP for selected symbol
  const [selectedSymbolLtp, setSelectedSymbolLtp] = useState<number>(0);
  const [ltpFetchLoading, setLtpFetchLoading] = useState(false);

  const [scriptProductType, setScriptProductType] = useState<"INTRADAY" | "DELIVERY" | "CARRYFORWARD">("CARRYFORWARD");

  // Employee selection for buy modal
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>("");

  // ========== Helper Functions ==========
  const parseExpiryToDate = (expiryStr: string): Date | null => {
    if (!expiryStr) return null;
    const s = String(expiryStr).trim();
    
    const match = s.match(/^(\d{2})([A-Za-z]{3})(\d{4})$/);
    if (match) {
      const [, day, monthStr, year] = match;
      const monthMap: Record<string, number> = {
        JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
        JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
      };
      const monthIndex = monthMap[monthStr.toUpperCase()];
      if (monthIndex !== undefined) {
        return new Date(parseInt(year), monthIndex, parseInt(day));
      }
    }
    return null;
  };

  const buildExpiryMeta = (rawExpiry: any) => {
    if (!rawExpiry) return { expiryDateObj: null, expiryLabel: "" };
    const s = String(rawExpiry).trim();
    
    const match = s.match(/^(\d{2})([A-Za-z]{3})(\d{4})$/);
    if (match) {
      return { expiryDateObj: null, expiryLabel: s };
    }
    return { expiryDateObj: null, expiryLabel: s };
  };

  const mapAngelToCommon = (row: any) => {
    const { expiryLabel } = buildExpiryMeta(row.expiry);
    return {
      ...row,
      token: String(row.token ?? ""),
      symbol: String(row.symbol ?? ""),
      name: row.name ?? "",
      expiry: expiryLabel,
      strike: row.strike !== undefined ? Number(row.strike) : -1,
      lotsize: row.lotsize !== undefined ? Number(row.lotsize) : 0,
      instrumenttype: row.instrumenttype ?? "",
      exch_seg: row.exch_seg ?? "",
      angelToken: String(row.token ?? ""),
      angelSymbol: String(row.symbol ?? ""),
    };
  };

  const calculateStrikeLevels = (ltp: number) => {
    let step = 100;
    if (selectedIndex === "SENSEX") {
      step = 250;
    } else if (selectedIndex === "NIFTY") {
      step = 50;
    } else if (selectedIndex === "BANKNIFTY") {
      step = 100;
    }
    const baseStrike = Math.round(ltp / step) * step;
    return {
      twoHundredLess: baseStrike - (step * 2),
      hundredLess: baseStrike - step,
      atmStrike: baseStrike,
      hundredUp: baseStrike + step,
      twoHundredUp: baseStrike + (step * 2)
    };
  };

  const validateQuantity = (quantity: number, lotSize: number): { isValid: boolean; message: string; suggestions: { min: number; max: number } | null } => {
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

  const handleSuggestedClick = (quantity: number) => {
    setSelectedQuantity(quantity);
    setQuantityError("");
    setSuggestedQuantity(null);
  };

  // ========== Data Fetching with Store ==========
  const fetchData = async () => {
    setLoading(true);
    try {
      if (dataRedish && dataRedish.length > 0 && !shouldFetchRedish()) {
        setData(dataRedish);
        findIndexSymbols(dataRedish);
        setLoading(false);
        return;
      }

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
        findIndexSymbols(normalized);
      }
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
      setError(err?.message);
    } finally {
      setLoading(false);
    }
  };

  const findIndexSymbols = (instruments: any[]) => {
    const nifty = instruments.find((item: any) => 
      String(item.token) === "99926000" || String(item.angelToken) === "99926000"
    );
    if (nifty) setNiftySymbol(nifty);

    const bankNifty = instruments.find((item: any) => 
      String(item.token) === "99926009" || String(item.angelToken) === "99926009"
    );
    if (bankNifty) setBankNiftySymbol(bankNifty);

    const sensex = instruments.find((item: any) => 
      String(item.token) === "99919000" || String(item.angelToken) === "99919000"
    );
    if (sensex) setSensexSymbol(sensex);
  };

  const fetchLTP = async () => {
    let currentSymbol = null;
    let exchange = "NSE";
    
    if (selectedIndex === "NIFTY") {
      currentSymbol = niftySymbol;
      exchange = "NSE";
    } else if (selectedIndex === "BANKNIFTY") {
      currentSymbol = bankNiftySymbol;
      exchange = "NSE";
    } else if (selectedIndex === "SENSEX") {
      currentSymbol = sensexSymbol;
      exchange = "BSE";
    }
    
    if (!currentSymbol) {
      toast.error(`${selectedIndex} symbol not found`);
      return;
    }

    const symbolKey = `${selectedIndex}_LTP`;
    const cachedLTP = getLTP(symbolKey);
    
    if (cachedLTP && !shouldFetchLTP(symbolKey)) {
      setCurrentLtp(cachedLTP);
      const levels = calculateStrikeLevels(cachedLTP);
      setStrikeLevels(levels);
      await fetchOptionsSymbols(levels);
      return;
    }

    setLtpLoading(true);
    try {
      const payload = {
        exchange: exchange,
        tradingsymbol: currentSymbol.symbol,
        symboltoken: currentSymbol.token,
      };

      const res = await axios.post(
        `${apiUrl}/agnelone/instrument/ltp`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            AngelOneToken: localStorage.getItem("angel_token") || "",
            userid: localStorage.getItem("userID"),
          },
        }
      );

      if (res.data.status === true) {
        const ltpValue = res.data.data.data.ltp || 0;
        setLTP(symbolKey, ltpValue);
        setCurrentLtp(ltpValue);
        const levels = calculateStrikeLevels(ltpValue);
        setStrikeLevels(levels);
        await fetchOptionsSymbols(levels);
      } else {
        toast.error("Failed to fetch LTP");
      }
    } catch (error) {
      console.error("LTP fetch error:", error);
      toast.error("Error fetching LTP");
    } finally {
      setLtpLoading(false);
    }
  };

  const fetchSelectedSymbolLTP = async (row: any) => {
    const symbolKey = `${row.token}_LTP`;
    const cachedLTP = getLTP(symbolKey);
    
    if (cachedLTP && !shouldFetchLTP(symbolKey)) {
      setSelectedSymbolLtp(cachedLTP);
      return;
    }

    setLtpFetchLoading(true);
    try {
      const payload = {
        exchange: row.exch_seg,
        tradingsymbol: row.symbol,
        symboltoken: row.token,
      };

      const res = await axios.post(
        `${apiUrl}/agnelone/instrument/ltp`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            AngelOneToken: localStorage.getItem("angel_token") || "",
            userid: localStorage.getItem("userID"),
          },
        }
      );
      
      if (res.data.status === true) {
        const ltpValue = res.data.data.data.ltp || 0;
        setLTP(symbolKey, ltpValue);
        setSelectedSymbolLtp(ltpValue);
      } else {
        setSelectedSymbolLtp(0);
      }
    } catch (error) {
      console.error("Symbol LTP fetch error:", error);
      setSelectedSymbolLtp(0);
    } finally {
      setLtpFetchLoading(false);
    }
  };

  const fetchOptionsSymbols = async (levels: any) => {
    if (optionsSymbolsData && 
        optionsSymbolsData.length > 0 && 
        !shouldFetchOptionsSymbols(selectedIndex, "ALL")) {
      setOptionsSymbols(optionsSymbolsData);
      return;
    }

    setTableLoading(true);

    try {
      let strikes: any = [];
      let indexName = "";
      let exchange = "NFO";
      
      if (selectedIndex === "NIFTY") {
        strikes = [levels.twoHundredLess, levels.hundredLess, levels.atmStrike, levels.hundredUp, levels.twoHundredUp];
        indexName = "NIFTY";
        exchange = "NFO";
      } else if (selectedIndex === "BANKNIFTY") {
        strikes = [levels.twoHundredLess, levels.hundredLess, levels.atmStrike, levels.hundredUp, levels.twoHundredUp];
        indexName = "BANKNIFTY";
        exchange = "NFO";
      } else if (selectedIndex === "SENSEX") {
        strikes = [levels.twoHundredLess, levels.hundredLess, levels.atmStrike, levels.hundredUp, levels.twoHundredUp];
        indexName = "SENSEX";
        exchange = "BFO";
      }

      const optionsList: any[] = [];
      const exchangeSymbols = data.filter((item: any) => 
        item.exch_seg === exchange && item.symbol?.includes(indexName)
      );

      strikes.forEach((strike: any) => {
        const ceSymbol = exchangeSymbols.find((item: any) => 
          item.symbol?.includes(String(strike)) && item.symbol?.includes("CE")
        );
        
        if (ceSymbol) {
          optionsList.push({
            ...ceSymbol,
            id: `${ceSymbol.token}-CE`,
            displayStrike: strike,
            optionType: "CE",
            optionTypeDisplay: "CALL",
            status: "Available"
          });
        }

        const peSymbol = exchangeSymbols.find((item: any) => 
          item.symbol?.includes(String(strike)) && item.symbol?.includes("PE")
        );
        
        if (peSymbol) {
          optionsList.push({
            ...peSymbol,
            id: `${peSymbol.token}-PE`,
            displayStrike: strike,
            optionType: "PE",
            optionTypeDisplay: "PUT",
            status: "Available"
          });
        }
      });

      optionsList.sort((a, b) => {
        if (a.displayStrike !== b.displayStrike) return a.displayStrike - b.displayStrike;
        return a.optionType === "CE" ? -1 : 1;
      });

      setOptionsSymbolsData(optionsList, selectedIndex, "ALL");
      setOptionsSymbols(optionsList);
    } catch (error) {
      console.error("Error fetching options:", error);
    } finally {
      setTableLoading(false);
    }
  };

  // Separate CE and PE data
  const ceSymbols = useMemo(() => optionsSymbols.filter(item => item.optionType === "CE"), [optionsSymbols]);
  const peSymbols = useMemo(() => optionsSymbols.filter(item => item.optionType === "PE"), [optionsSymbols]);

  const fetchStrategies = async () => {
    try {
      const res = await axios.get(`${apiUrl}/admin/fetchloginuser`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          userid: localStorage.getItem("userID"),
        },
      });

      if (res.data.status === true) {
        setStrategyList(res.data.generatedUsers || []);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // ========== AG Grid Column Definitions ==========
  const columnDefs = useMemo<any[]>(() => [
    {
      headerName: "Strike",
      width: 100,
      valueGetter: (params: any) => {
        const symbol = params.data.symbol;
        const match = symbol.match(/(\d{5})(?=CE|PE)/);
        return match ? match[1] : "";
      },
      cellStyle: { fontSize: "13px", fontWeight: "bold" },
    },
    {
      headerName: "Expiry",
      field: "expiry",
      width: 100,
      cellStyle: { fontSize: "13px" },
    },
    {
      headerName: "Action",
      width: 100,
      cellRenderer: (params: any) => (
        <button
          onClick={() => handleBuy(params.data)}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all ${
            params.data.optionType === "CE"
              ? "bg-green-500 hover:bg-green-600"
              : "bg-red-500 hover:bg-red-600"
          }`}
        >
          Buy
        </button>
      ),
      filter: false,
      sortable: false,
    },
  ], []);

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    resizable: true,
    filter: true,
    floatingFilter: false,
    cellStyle: { fontSize: "12px" },
  }), []);

  const onCeGridReady = (e: GridReadyEvent) => {
    ceGridApiRef.current = e.api;
    e.api.sizeColumnsToFit();
  };

  const onPeGridReady = (e: GridReadyEvent) => {
    peGridApiRef.current = e.api;
    e.api.sizeColumnsToFit();
  };

  const handleBuy = (row: any) => {
    setSelectedScriptRow(row);
    setSelectedQuantity(row.lotsize);
    setQuantityError("");
    setSuggestedQuantity(null);
    setSelectedSymbolLtp(0);
    setSelectedEmployeeId("");
    setSelectedEmployeeName("");
    fetchSelectedSymbolLTP(row);
    setScriptModalOpen(true);
  };

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const employeeId = e.target.value;
    if (employeeId) {
      const selectedEmp = strategyList.find(emp => emp.id === employeeId);
      setSelectedEmployeeId(employeeId);
      setSelectedEmployeeName(selectedEmp?.firstName || "");
    } else {
      setSelectedEmployeeId("");
      setSelectedEmployeeName("");
    }
  };

  const handleScriptSave = async () => {
    if (isPlacing) return;
    if (!selectedScriptRow) {
      toast.error("No scrip selected!");
      return;
    }

    if (!selectedEmployeeId) {
      toast.error("Please select Customer!");
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
      price: currentLtp,
      stoploss: 0,
      squareoff: 0,
      productType: scriptProductType,
      customerId: selectedEmployeeId,
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
    };

    try {
      const res = await axios.post(
        `${apiUrl}/admin/employeeid/place/order`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      if (res?.data?.status) {
        toast.success(`Order placed for ${selectedEmployeeName}!`);
        setScriptModalOpen(false);
      } else {
        toast.error(res?.data?.message || "Failed to place order.");
      }
    } catch (err) {
      toast.error("Something went wrong.");
    } finally {
      setIsPlacing(false);
    }
  };

  // ========== Effects ==========
  useEffect(() => {
    fetchData();
    fetchStrategies();
  }, []);

  useEffect(() => {
    if (selectedIndex === "NIFTY" && niftySymbol) {
      fetchLTP();
    } else if (selectedIndex === "BANKNIFTY" && bankNiftySymbol) {
      fetchLTP();
    } else if (selectedIndex === "SENSEX" && sensexSymbol) {
      fetchLTP();
    }
  }, [selectedIndex, niftySymbol, bankNiftySymbol, sensexSymbol]);

  useEffect(() => {
    if (optionsSymbolsData) {
      setOptionsSymbols(optionsSymbolsData);
    }
  }, [optionsSymbolsData]);

  const getCurrentSymbol = () => {
    if (selectedIndex === "NIFTY") return niftySymbol;
    if (selectedIndex === "BANKNIFTY") return bankNiftySymbol;
    if (selectedIndex === "SENSEX") return sensexSymbol;
    return null;
  };

  const currentSymbol = getCurrentSymbol();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 md:px-6 lg:px-8 py-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-[#FB3800] to-orange-500 rounded-xl">
              <FiActivity className="text-white" size={24} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Options Chain</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            View and trade options across multiple indices
          </p>
        </div>

        {/* Index Selector Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-gray-500 mb-1 font-medium">Select Index</label>
              <select
                value={selectedIndex}
                onChange={(e) => setSelectedIndex(e.target.value as "NIFTY" | "BANKNIFTY" | "SENSEX")}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
              >
                <option value="NIFTY">NIFTY 50</option>
                <option value="BANKNIFTY">BANKNIFTY</option>
                <option value="SENSEX">SENSEX</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500">Current LTP</span>
                <p className="text-lg font-bold text-gray-800">
                  {ltpLoading ? "..." : currentLtp > 0 ? `₹${currentLtp.toFixed(2)}` : "—"}
                </p>
              </div>
              
              <button
                onClick={fetchLTP}
                disabled={ltpLoading || !currentSymbol}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 shadow-sm"
              >
                <FiRefreshCw className={ltpLoading ? "animate-spin" : ""} size={16} />
                Refresh
              </button>
            </div>
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

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Two Column Layout for CE and PE */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CE Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-5 py-3">
                <div className="flex items-center gap-2">
                  <FiTrendingUp className="text-white" size={18} />
                  <h2 className="text-white font-semibold text-lg">CALL OPTIONS (CE)</h2>
                </div>
              </div>
              {tableLoading ? (
                <div className="p-8 text-center text-gray-400">Loading CE options...</div>
              ) : (
                <div className="ag-theme-quartz" style={{ height: 500 }}>
                  <AgGridReact
                    rowData={ceSymbols}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    animateRows={true}
                    rowSelection="single"
                    pagination={true}
                    paginationPageSize={50}
                    enableCellTextSelection={true}
                    ensureDomOrder={true}
                    onGridReady={onCeGridReady}
                    rowHeight={42}
                    headerHeight={45}
                  />
                </div>
              )}
            </div>

            {/* PE Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-5 py-3">
                <div className="flex items-center gap-2">
                  <FiTrendingDown className="text-white" size={18} />
                  <h2 className="text-white font-semibold text-lg">PUT OPTIONS (PE)</h2>
                </div>
              </div>
              {tableLoading ? (
                <div className="p-8 text-center text-gray-400">Loading PE options...</div>
              ) : (
                <div className="ag-theme-quartz" style={{ height: 500 }}>
                  <AgGridReact
                    rowData={peSymbols}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    animateRows={true}
                    rowSelection="single"
                    pagination={true}
                    paginationPageSize={50}
                    enableCellTextSelection={true}
                    ensureDomOrder={true}
                    onGridReady={onPeGridReady}
                    rowHeight={42}
                    headerHeight={45}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Buy Modal */}
      {scriptModalOpen && selectedScriptRow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md relative overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className={`px-6 py-4 ${
              selectedScriptRow.optionType === 'CE' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedScriptRow.symbol}</h3>
                </div>
                <button 
                  onClick={() => setScriptModalOpen(false)} 
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <MdOutlineCancel size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Product Type */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="productType" checked={scriptProductType === "INTRADAY"} 
                      onChange={() => setScriptProductType("INTRADAY")} className="w-4 h-4 text-blue-500" /> 
                    <span className="text-sm">Intraday (MIS)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="productType" checked={scriptProductType === "DELIVERY"} 
                      onChange={() => setScriptProductType("DELIVERY")} className="w-4 h-4 text-blue-500" /> 
                    <span className="text-sm">Longterm (CNC)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="productType" checked={scriptProductType === "CARRYFORWARD"} 
                      onChange={() => setScriptProductType("CARRYFORWARD")} className="w-4 h-4 text-blue-500" /> 
                    <span className="text-sm">Normal (NRML)</span>
                  </label>
                </div>
              </div>

              {/* Quantity */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity (Lot Size: {selectedScriptRow.lotsize})
                </label>
                <input 
                  type="number" 
                  value={selectedQuantity} 
                  onChange={handleQuantityChange}
                  min={selectedScriptRow.lotsize}
                  step={selectedScriptRow.lotsize}
                  className={`w-full border rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    quantityError ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                
                {quantityError && (
                  <p className="text-red-500 text-sm mt-1">{quantityError}</p>
                )}

                {suggestedQuantity && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2 font-medium">Suggested quantities:</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSuggestedClick(suggestedQuantity.min)}
                        className="flex-1 px-3 py-2 bg-white border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                      >
                        Min: {suggestedQuantity.min}
                      </button>
                      <button
                        onClick={() => handleSuggestedClick(suggestedQuantity.max)}
                        className="flex-1 px-3 py-2 bg-white border border-green-300 text-green-600 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
                      >
                        Max: {suggestedQuantity.max}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      *Quantity must be in multiples of {selectedScriptRow.lotsize} (1 lot)
                    </p>
                  </div>
                )}

                {selectedQuantity > 0 && selectedQuantity % selectedScriptRow.lotsize === 0 && (
                  <p className="text-xs text-green-600 mt-2 font-medium">
                    {selectedQuantity / selectedScriptRow.lotsize} lots = {selectedQuantity} quantity
                  </p>
                )}
              </div>

              {/* Customer Dropdown */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Customer <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={handleEmployeeChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">-- Select Customer --</option>
                  {strategyList.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} - {emp.strategyName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Symbol LTP Display */}
              <div className={`mb-5 p-4 rounded-lg ${
                selectedScriptRow.optionType === 'CE' ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Market Price :</span>
                  {ltpFetchLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent"></div>
                  ) : (
                    <span className={`text-2xl font-bold ${
                      selectedScriptRow.optionType === 'CE' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₹{selectedSymbolLtp > 0 ? selectedSymbolLtp.toFixed(2) : '0.00'}
                    </span>
                  )}
                </div>
              </div>

              {/* Required Margin */}
              <div className="bg-gray-50 rounded-lg p-4 mb-5 border border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Required Margin:</span>
                  <span className="text-xl font-bold text-[#FB3800]">
                    ₹{(selectedSymbolLtp * selectedQuantity).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setScriptModalOpen(false)} 
                  className="px-5 py-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-all font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleScriptSave} 
                  disabled={isPlacing || selectedSymbolLtp === 0 || quantityError !== "" || !selectedEmployeeId}
                  className={`px-5 py-2.5 rounded-lg text-white font-medium transition-all ${
                    isPlacing || selectedSymbolLtp === 0 || quantityError !== "" || !selectedEmployeeId
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : selectedScriptRow.optionType === 'CE' 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' 
                        : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                  }`}
                >
                  {isPlacing ? "Placing..." : "Buy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}