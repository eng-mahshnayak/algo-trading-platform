import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { DatePicker, Button } from "antd";
import dayjs, { Dayjs } from "dayjs";
import "antd/dist/reset.css";
import { toast } from "react-toastify";
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
import { 
  FiSearch, 
  FiDownload, 

  FiTrendingUp, 
  FiTrendingDown,
  FiRefreshCw,
  FiUsers,
  FiActivity
} from "react-icons/fi";

const { RangePicker } = DatePicker;

type ClientOrder = {
  id: number;
  userId: number;
  userNameId: string;
  broker: string;
  variety?: string;
  ordertype?: string;
  producttype?: string;
  duration?: string;
  tradingsymbol?: string;
  transactiontype?: string;
  exchange?: string;
  orderid?: string;
  fillid?: string;
  status?: string;
  orderstatus?: string;
  orderstatuslocaldb?: string;
  buyprice?: any;
  buyvalue?: any;
  buysize?: any;
  fillprice?: any;
  fillsize?: any;
  tradedValue?: any;
  pnl?: any;
  buyTime?: any;
  filltime?: any;
  text?: any;
  createdAt?: any;
  updatedAt?: any;
  instrumenttype?: any;
  quantity?: any;
};

type Order = ClientOrder & {
  strategyUniqueId?: string;
  strategyName?: string;
  angelOneToken?: string;
  angelOneSymbol?: string;
  symboltoken?: string;
  client_data?: ClientOrder[];
  __isExpanded?: boolean;
  __rowType?: "MASTER";
};

type RowItem =
  | (Order & { __rowType?: "MASTER" })
  | {
      __rowType: "DETAIL";
      id: string;
      parentId: number;
      client_data: ClientOrder[];
    };

const pnlPill = (val: any) => {
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
      {Number.isFinite(n) ? (isPositive ? `+${n.toFixed(2)}` : n.toFixed(2)) : "-"}
    </span>
  );
};

const ExpandCellRenderer = (props: ICellRendererParams) => {
  const data = props.data as any;
  if (data?.__rowType === "DETAIL") return null;

  const isExpanded = !!data?.__isExpanded;
  const toggle = props.context?.toggleRow;

  return (
    <div className="flex items-center h-full">
      <button
        onClick={() => toggle?.(data)}
        className="p-1 rounded hover:bg-gray-100 transition-colors"
        title={isExpanded ? "Collapse" : "Expand"}
      >
        {isExpanded ? (
          <FaChevronDown className="w-3 h-3 text-gray-500" />
        ) : (
          <FaChevronRight className="w-3 h-3 text-gray-500" />
        )}
      </button>
    </div>
  );
};

const DetailRowRenderer = (props: any) => {
  const row = props.data as { __rowType: "DETAIL"; client_data: ClientOrder[] };

  const subColumnDefs: ColDef<ClientOrder>[] = [
    { headerName: "Broker", field: "broker", width: 130 },
    { headerName: "User ID", field: "userNameId", width: 120 },
    { headerName: "Strategy ID", field: "strategyUniqueId" as any, width: 200 },
    { headerName: "Symbol", field: "tradingsymbol", width: 170 },
    { headerName: "Instrument", field: "instrumenttype", width: 150 },
    {
      headerName: "Type",
      field: "transactiontype",
      width: 120,
      cellRenderer: (params: any) => {
        const isBuy = params.value === "BUY";
        const isSell = params.value === "SELL";
        const txnBg = isBuy ? "bg-green-100" : isSell ? "bg-red-100" : "bg-gray-200";
        const txnColor = isBuy ? "text-green-800" : isSell ? "text-red-800" : "text-gray-800";

        return (
          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${txnBg} ${txnColor}`}>
            {params.value || "-"}
          </span>
        );
      },
    },
    { headerName: "Order Type", field: "ordertype", width: 140 },
    { headerName: "Product Type", field: "producttype", width: 140 },
    { headerName: "Buy Price", field: "buyprice", width: 120 },
    { headerName: "Sell Price", field: "fillprice", width: 120 },
    { headerName: "Quantity", field: "quantity" as any, width: 110 },
    { headerName: "PNL", field: "pnl", width: 120, cellRenderer: (p: any) => pnlPill(p.value) },
    { headerName: "Order ID", field: "orderid", width: 190 },
    { headerName: "Traded ID", field: "fillid", width: 140 },
    {
      headerName: "Status",
      field: "status",
      width: 140,
      cellRenderer: (params: any) => {
        const status = params.value || params.data?.orderstatus;
        const s = String(status || "").toLowerCase();
        let color = "#64748b";
        if (s === "complete" || s === "filled" || s === "success") color = "#10b981";
        else if (s === "rejected" || s === "cancelled" || s === "canceled") color = "#ef4444";
        else if (s === "pending" || s === "open" || s === "queued") color = "#f59e0b";
        return (
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium text-white capitalize" style={{ backgroundColor: color }}>
            {status || "-"}
          </span>
        );
      },
    },
    { headerName: "Buy Time", field: "buyTime", width: 230 },
    { headerName: "Sell Time", field: "filltime", width: 230 },
    { headerName: "OrderTag", field: "ordertag" as any, width: 110 },
    {
      headerName: "Message",
      field: "text",
      width: 470,
      minWidth: 350,
      wrapText: true,
      autoHeight: true,
      cellStyle: { whiteSpace: "normal", lineHeight: "1.35" },
    },
  ];

  const subDefaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), []);

  return (
    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg mx-2 my-2">
      <div className="text-sm font-semibold text-gray-700 mb-2">
        Client Orders ({row.client_data?.length || 0})
      </div>
      <div className="ag-theme-alpine" style={{ width: "100%", height: "280px" }}>
        <AgGridReact
          rowData={row.client_data || []}
          columnDefs={subColumnDefs}
          defaultColDef={subDefaultColDef}
          pagination={true}
          paginationPageSize={10}
          enableCellTextSelection={true}
          ensureDomOrder={true}
          rowHeight={50}
          headerHeight={40}
          suppressCellFocus={true}
          animateRows={true}
        />
      </div>
    </div>
  );
};

export default function TradeAdmin() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [rawOrders, setRawOrders] = useState<Order[]>([]);
  const [rowData, setRowData] = useState<RowItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalTradedData, setTotalTradedData] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    () => [dayjs().startOf("day"), dayjs().endOf("day")]
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [panelRange, setPanelRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    () => [dayjs().startOf("day"), dayjs().endOf("day")]
  );
  const gridApiRef = useRef<GridApi | null>(null);

  const buildRows = useCallback((orders: Order[], expanded: Set<number>) => {
    const rows: RowItem[] = [];
    for (const o of orders) {
      const isExpanded = expanded.has(o.id);
      rows.push({ ...o, __rowType: "MASTER", __isExpanded: isExpanded } as any);
      if (isExpanded) {
        rows.push({
          __rowType: "DETAIL",
          id: `detail-${o.id}`,
          parentId: o.id,
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
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(masterRow.id)) next.delete(masterRow.id);
      else next.add(masterRow.id);
      return next;
    });
  }, []);

  const columnDefs = useMemo<ColDef<RowItem>[]>(
    () => [
      {
        headerName: "",
        width: 55,
        minWidth: 55,
        maxWidth: 55,
        cellRenderer: ExpandCellRenderer,
        sortable: false,
        filter: false,
        resizable: false,
        pinned: "left",
      },
      {
        headerName: "Symbol",
        field: "tradingsymbol",
        width: 190,
        minWidth: 170,
      },
      {
        headerName: "Type",
        field: "transactiontype",
        width: 120,
        minWidth: 110,
        cellRenderer: (params: any) => {
          const isBuy = params.value === "BUY";
          const isSell = params.value === "SELL";
          const txnBg = isBuy ? "bg-green-100" : isSell ? "bg-red-100" : "bg-gray-200";
          const txnColor = isBuy ? "text-green-800" : isSell ? "text-red-800" : "text-gray-800";
          return (
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${txnBg} ${txnColor}`}>
              {params.value || "-"}
            </span>
          );
        },
      },
      {
        headerName: "Buy Price",
        field: "buyprice",
        width: 120,
        valueFormatter: params => params.value != null ? Number(params.value).toFixed(2) : ""
      },
      {
        headerName: "Sell Price",
        field: "fillprice",
        width: 120,
        valueFormatter: params => params.value != null ? Number(params.value).toFixed(2) : ""
      },
      { headerName: "Quantity", field: "quantity" as any, width: 110 },
      { headerName: "PNL", field: "pnl", width: 120, cellRenderer: (params: any) => pnlPill(params.value) },
      { headerName: "Order ID", field: "orderid", width: 190 },
      { headerName: "Strategy ID", field: "strategyUniqueId", width: 200, minWidth: 180 },
      { headerName: "Instrument", field: "instrumenttype", width: 150, minWidth: 140 },
      { headerName: "Order Type", field: "ordertype", width: 140 },
      { headerName: "Product Type", field: "producttype", width: 140 },
      { headerName: "Traded ID", field: "fillid", width: 140 },
      {
        headerName: "Status",
        field: "status",
        width: 140,
        cellRenderer: (params: any) => {
          const row = params.data as any;
          if (row?.__rowType === "DETAIL") return null;
          const status = params.value || (row?.orderstatus ?? row?.orderstatuslocaldb);
          const s = String(status || "").toLowerCase();
          let color = "#64748b";
          if (s === "complete" || s === "filled" || s === "success") color = "#10b981";
          else if (s === "rejected" || s === "cancelled" || s === "canceled") color = "#ef4444";
          else if (s === "pending" || s === "open" || s === "queued") color = "#f59e0b";
          return (
            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium text-white capitalize" style={{ backgroundColor: color }}>
              {status || "-"}
            </span>
          );
        },
      },
      { headerName: "Buy Time", field: "buyTime", width: 230 },
      { headerName: "Sell Time", field: "filltime", width: 230 },
      { headerName: "OrderTag", field: "ordertag" as any, width: 110 },
      {
        headerName: "Message",
        field: "text",
        width: 470,
        minWidth: 350,
        wrapText: true,
        autoHeight: true,
        cellStyle: { whiteSpace: "normal", lineHeight: "1.35" },
      },
    ],
    []
  );

  const defaultColDef = useMemo(() => ({
    resizable: true,
    filter: true,
    sortable: true,
  }), []);

  const onGridReady = (params: GridReadyEvent) => { gridApiRef.current = params.api; };
  const isFullWidthRow = useCallback((params: any) => params?.rowNode?.data?.__rowType === "DETAIL", []);
  const fullWidthCellRenderer = useCallback((props: any) => <DetailRowRenderer {...props} />, []);
  const getRowId = useCallback((params: any) => {
    const d = params.data as any;
    return d?.__rowType === "DETAIL" ? d.id : String(d.id);
  }, []);
  const getRowHeight = useCallback((params: RowHeightParams) => {
    const d: any = params.data;
    return d?.__rowType === "DETAIL" ? 330 : 50;
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${apiUrl}/admin/get/table/trade`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });
      if (data?.status === true) {
        setRawOrders(Array.isArray(data.data) ? data.data : []);
        setTotalTradedData(data.buydata || 0);
        setExpandedIds(new Set());
      } else if (data?.status === false && data?.message === "Unauthorized") {
        toast.error("Unauthorized User");
        localStorage.clear();
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleGetDates = async (rangeParam?: [Dayjs, Dayjs] | null) => {
    const activeRange = rangeParam ?? dateRange;
    if (!activeRange) { toast.error("Please select a date range"); return; }
    const [from, to] = activeRange;
    setLoading(true);
    try {
      const res = await axios.post(`${apiUrl}/admin/datefilter/order`, [from.toISOString(), to.toISOString()], {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      });
      if (res.data?.status === true) {
        setRawOrders(Array.isArray(res.data.data) ? res.data.data : []);
        setTotalTradedData(res.data?.buydata || 0);
        setExpandedIds(new Set());
        toast.success("Filtered orders loaded");
      } else if (res.data?.status === false && res.data?.message === "Unauthorized") {
        localStorage.clear();
        toast.error("Session expired");
      }
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDate = async () => {
    setDateRange(null);
    setPanelRange(null);
    setPickerOpen(false);
    await fetchOrders();
  };

  const handleKeyUp = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    const query = e.currentTarget.value.trim();
    if (!query) { fetchOrders(); return; }
    if (query.length < 3) return;
    setLoading(true);
    try {
      const res = await axios.post(`${apiUrl}/admin/search/order`, { search: query }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      });
      if (res.data?.status === true && Array.isArray(res.data.data)) {
        setRawOrders(res.data.data);
        setExpandedIds(new Set());
      } else {
        setRawOrders([]);
        toast.error(res.data?.message || "No matching orders found");
      }
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleExcelDownload = () => {
    const ws = XLSX.utils.json_to_sheet(rawOrders);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, `orders_${dayjs().format("YYYY-MM-DD")}.xlsx`);
    toast.success("Excel downloaded");
  };

  const totalOrders = rawOrders.length;
  const totalPNL = rawOrders.reduce((sum, order) => sum + (Number(order.pnl) || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 md:px-6 lg:px-8 py-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
              <FiActivity className="text-white" size={24} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Orders History</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            View and manage all your trading orders history
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Total Orders</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{totalOrders}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <FiActivity className="text-blue-500" size={20} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Total Traded</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{totalTradedData}</p>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg">
                <FiTrendingUp className="text-orange-500" size={20} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Total P&L</p>
                <p className={`text-2xl font-bold mt-1 ${totalPNL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalPNL >= 0 ? `+${totalPNL.toFixed(2)}` : totalPNL.toFixed(2)}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${totalPNL >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                {totalPNL >= 0 ? <FiTrendingUp className="text-green-500" size={20} /> : <FiTrendingDown className="text-red-500" size={20} />}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Unique Users</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{new Set(rawOrders.map(o => o.userNameId)).size}</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <FiUsers className="text-purple-500" size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <RangePicker
                format="DD-MMM-YYYY"
                className="h-11 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                open={pickerOpen}
                onOpenChange={(open) => { if (open) { setPickerOpen(true); setPanelRange(dateRange); } }}
                value={panelRange ?? dateRange ?? null}
                onCalendarChange={(val) => setPanelRange(val as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                onChange={(val) => setPanelRange(val as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                allowClear={false}
                ranges={{
                  Today: [dayjs().startOf("day"), dayjs().endOf("day")],
                  Yesterday: [dayjs().subtract(1, "day").startOf("day"), dayjs().subtract(1, "day").endOf("day")],
                  "Last 7 Days": [dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")],
                  "Last 30 Days": [dayjs().subtract(29, "day").startOf("day"), dayjs().endOf("day")],
                  "This Month": [dayjs().startOf("month"), dayjs().endOf("month")],
                  "Last Month": [dayjs().subtract(1, "month").startOf("month"), dayjs().subtract(1, "month").endOf("month")],
                }}
                renderExtraFooter={() => (
                  <div className="flex justify-end gap-3 p-2">
                    <Button size="small" onClick={() => { setPanelRange(dateRange); setPickerOpen(false); handleCancelDate(); }}>Cancel</Button>
                    <Button size="small" type="primary" disabled={!panelRange || !panelRange[0] || !panelRange[1]} onClick={() => { if (!panelRange) return; setDateRange(panelRange); setPickerOpen(false); handleGetDates(panelRange); }}>Apply</Button>
                  </div>
                )}
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyUp={handleKeyUp}
                  placeholder="Search by symbol, order ID (min 3 chars)..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <button onClick={handleExcelDownload} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-sm">
              <FiDownload size={16} /> Excel
            </button>
            <button onClick={fetchOrders} className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all">
              <FiRefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm">
            <div className="relative"><div className="w-12 h-12 border-4 border-blue-100 rounded-full"></div><div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div></div>
            <p className="mt-4 text-gray-500">Loading orders...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6"><div className="flex items-center gap-3"><FiTrendingDown className="h-5 w-5 text-red-500" /><div><p className="font-medium text-red-800">Error</p><p className="text-sm text-red-600">{error}</p></div></div></div>
        )}

        {/* AG Grid Table */}
        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="ag-theme-alpine" style={{ height: "550px", width: "100%" }}>
              <AgGridReact
                onGridReady={onGridReady}
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                context={{ toggleRow }}
                pagination={true}
                paginationPageSize={20}
                paginationPageSizeSelector={[20, 50, 100, 500, 1000]}
                suppressCellFocus={true}
                animateRows={true}
                enableCellTextSelection={true}
                ensureDomOrder={true}
                getRowId={getRowId}
                isFullWidthRow={isFullWidthRow}
                fullWidthCellRenderer={fullWidthCellRenderer}
                getRowHeight={getRowHeight}
                rowHeight={50}
                headerHeight={50}
                overlayLoadingTemplate={'<div class="flex justify-center items-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div><span class="ml-3 text-gray-500">Loading orders...</span></div>'}
                overlayNoRowsTemplate={'<div class="flex justify-center items-center h-full text-gray-400">No orders found</div>'}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}