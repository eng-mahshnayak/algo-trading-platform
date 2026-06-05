import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { DatePicker, Select } from "antd";
import dayjs from "dayjs";
import "antd/dist/reset.css";
import { toast } from "react-toastify";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { 
  FiSearch, 
  FiDownload, 
  FiCalendar, 
  FiAlertCircle,
  FiXCircle,
  FiClock,
  FiUsers,
  FiActivity
} from "react-icons/fi";

type Order = {
  variety: string;
  ordertype: string;
  producttype: string;
  duration: string;
  price: number;
  triggerprice: number;
  quantity: string;
  disclosedquantity: string;
  squareoff: number;
  stoploss: number;
  trailingstoploss: number;
  tradingsymbol: string;
  transactiontype: string;
  exchange: string;
  symboltoken: string;
  ordertag: string;
  instrumenttype: string;
  strikeprice: number;
  optiontype: string;
  expirydate: string;
  lotsize: string;
  cancelsize: string;
  averageprice: number;
  filledshares: string;
  unfilledshares: string;
  orderid: string;
  text: string;
  status: string;
  orderstatus: string;
  updatetime: string;
  exchtime: string;
  exchorderupdatetime: string;
  fillid: string;
  filltime: string;
  fillprice: string;
  fillsize: string;
  parentorderid: string;
  uniqueorderid: string;
  exchangeorderid: string;
  createdAt: any;
  tradedValue: any;
  buyprice: any;
  pnl: any;
  updatedAt: any;
  userNameId: any;
  broker?: string;
  buyTime?: string;
  sellTime?: string;
};

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function RejectedHistory() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [totalTradedData, setTotalTradedData] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(() => [
    dayjs().startOf("day"),
    dayjs().endOf("day"),
  ]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [panelRange, setPanelRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(() => [
    dayjs().startOf("day"),
    dayjs().endOf("day"),
  ]);
  const [gridApi, setGridApi] = useState<any>(null);
  const [dropdownValue, setDropdownValue] = useState<string>("REJECTED");

  const fetchOrders = async (from?: string, to?: string) => {
    setLoading(true);
    setError(null);
    try {
      const payload: any = {};
      if (from && to) {
        payload.from = from;
        payload.to = to;
      }

      const { data } = await axios.post(
        `${apiUrl}/order/get/tablerejects/order`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            AngelOneToken: localStorage.getItem("angel_token") || "",
          },
        }
      );

      if (data?.status === true) {
        setAllOrders(Array.isArray(data.data) ? data.data : []);
        setFilteredOrders(Array.isArray(data.data) ? data.data : []);
        setTotalTradedData(data.buydata || 0);
      } else if (data?.status === false && data?.message === "Unauthorized") {
        toast.error("Unauthorized User");
        localStorage.clear();
      } else {
        toast.error(data?.message || "Something went wrong");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong");
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dateRange) {
      fetchOrders(dateRange[0].toISOString(), dateRange[1].toISOString());
    } else {
      fetchOrders();
    }
  }, []);

  useEffect(() => {
    if (dropdownValue === "ALL") {
      setFilteredOrders(allOrders);
    } else {
      const filtered = allOrders.filter(
        (order) => order.status?.toUpperCase() === dropdownValue
      );
      setFilteredOrders(filtered);
    }
  }, [dropdownValue, allOrders]);

  const handleGetDates = async (rangeParam?: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
    const activeRange = rangeParam ?? dateRange;

    if (!activeRange) {
      toast.error("Please select a date range");
      return;
    }

    const [from, to] = activeRange;
    const payload = [from.toISOString(), to.toISOString()];

    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        `${apiUrl}/order/get/tablerejects/order`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            AngelOneToken: localStorage.getItem("angel_token") || "",
          },
        }
      );

      if (res.data?.status === true) {
        setAllOrders(Array.isArray(res.data.data) ? res.data.data : []);
        setTotalTradedData(res?.data?.buydata || 0);
        setDateRange(activeRange);
        setPickerOpen(false);
        toast.success(res.data?.message || "Filtered orders loaded");
      } else if (
        res.data?.status === false &&
        res.data?.message === "Unauthorized"
      ) {
        localStorage.clear();
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error(res.data?.message || "Something went wrong");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong");
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDate = () => {
    setDateRange(null);
    setPanelRange(null);
    setPickerOpen(false);
    fetchOrders();
  };

  const convertHeaders = (data: any, mapping: any) => {
    return data.map((item: any) => {
      const newItem: any = {};
      Object.keys(mapping).forEach((oldKey) => {
        let value = item[oldKey];
        newItem[mapping[oldKey]] = value ?? "";
      });
      return newItem;
    });
  };

  const handleExcelDownload = () => {
    const headerMapping = {
      userNameId: "User ID",
      transactiontype: "Type",
      exchange: "Exchange",
      instrumenttype: "Instrument",
      orderid: "Order ID",
      tradingsymbol: "Symbol",
      ordertype: "Order Type",
      producttype: "Product Type",
      buyprice: "Buy Price",
      fillprice: "Sell Price",
      pnl: "PnL",
      quantity: "Order Qty",
      fillsize: "Traded Qty",
      status: "Status",
      text: "Message",
      createdAt: "Created Time",
      broker: "Broker"
    };

    const formattedOrders = convertHeaders(filteredOrders, headerMapping);
    const ws = XLSX.utils.json_to_sheet(formattedOrders);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rejected Orders");
    XLSX.writeFile(wb, `rejected_orders_${dayjs().format("YYYY-MM-DD")}.xlsx`);
    toast.success("Excel file downloaded successfully!");
  };

  const onGridReady = useCallback((params: any) => {
    setGridApi(params.api);
  }, []);

  const statusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "complete" || s === "filled" || s === "success") return "#10b981";
    if (s === "rejected" || s === "cancelled" || s === "canceled") return "#ef4444";
    if (s === "pending" || s === "open" || s === "queued") return "#f59e0b";
    return "#64748b";
  };

  const transactionTypeCellRenderer = (params: any) => {
    const value = params.value || "-";    
    const isBuy = value === "BUY";
    const isSell = value === "SELL";
    return (
      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
        isBuy ? "bg-green-100 text-green-700" : isSell ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
      }`}>
        {value}
      </span>
    );
  };

  const statusCellRenderer = (params: any) => {
    const status = params.value || "-";
    const backgroundColor = statusColor(status);
    return (
      <span
        className="inline-block px-2.5 py-1 rounded-full text-xs font-medium text-white capitalize"
        style={{ backgroundColor }}
        title={status}
      >
        {status}
      </span>
    );
  };

  const textCellRenderer = (params: any) => {
    const text = params.value || "—";
    return (
      <span
        title={text}
        className="block break-words whitespace-normal text-xs"
        style={{ maxWidth: "100%", lineHeight: "1.4" }}
      >
        {text}
      </span>
    );
  };

  const quantityCellRenderer = (params: any) => {
    const order = params.data;
    const title = `Filled: ${order.filledshares || 0} / Unfilled: ${order.unfilledshares || 0}`;
    return <span title={title} className="font-medium">{params.value || 0}</span>;
  };

  const columnDefs: ColDef<any>[] = useMemo(
    () => [
      {
        headerName: "User",
        field: "userNameId",
        filter: true,
        sortable: true,
        width: 130,
        minWidth: 120,
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-1">
            <FiUsers size={12} className="text-gray-400" />
            <span className="font-mono text-xs">{params.value || "-"}</span>
          </div>
        ),
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
      {
        headerName: "Symbol",
        field: "tradingsymbol",
        filter: true,
        sortable: true,
        width: 150,
        minWidth: 130,
        cellRenderer: (params: any) => (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">{params.value || "-"}</span>
            <span className="text-xs text-gray-400">{params.data?.exchange || ""}</span>
          </div>
        ),
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
      {
        headerName: "Instrument",
        field: "instrumenttype",
        filter: true,
        sortable: true,
        width: 120,
        minWidth: 100,
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
      {
        headerName: "Type",
        field: "transactiontype",
        filter: true,
        sortable: true,
        cellRenderer: transactionTypeCellRenderer,
        width: 90,
        minWidth: 80,
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
      {
        headerName: "Order Type",
        field: "ordertype",
        filter: true,
        sortable: true,
        width: 110,
        minWidth: 100,
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
      {
        headerName: "Product",
        field: "producttype",
        filter: true,
        sortable: true,
        width: 100,
        minWidth: 90,
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
      {
        headerName: "Qty",
        field: "quantity",
        filter: true,
        sortable: true,
        cellRenderer: quantityCellRenderer,
        width: 80,
        minWidth: 70,
        cellStyle: { borderRight: "1px solid #e2e8f0", textAlign: "center" },
      },
      {
        headerName: "Order ID",
        field: "orderid",
        filter: true,
        sortable: true,
        width: 180,
        minWidth: 160,
        cellRenderer: (params: any) => (
          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600">
            {params.value}
          </code>
        ),
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
      {
        headerName: "Status",
        field: "status",
        filter: true,
        sortable: true,
        cellRenderer: statusCellRenderer,
        width: 110,
        minWidth: 100,
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
      {
        headerName: "Broker",
        field: "broker",
        filter: true,
        sortable: true,
        width: 100,
        minWidth: 90,
        cellRenderer: (params: any) => (
          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
            {params.value || "-"}
          </span>
        ),
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
      {
        headerName: "Message",
        field: "text",
        filter: true,
        sortable: true,
        cellRenderer: textCellRenderer,
        autoHeight: true,
        wrapText: true,
        width: 350,
        minWidth: 300,
        flex: 1,
        cellStyle: () => ({
          borderRight: "1px solid #e2e8f0",
          whiteSpace: "normal",
          lineHeight: "1.4",
          padding: "8px 4px"
        }),
      },
      {
        headerName: "Created Time",
        field: "createdAt",
        filter: true,
        sortable: true,
        width: 180,
        minWidth: 160,
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-1">
            <FiClock size={12} className="text-gray-400" />
            <span className="text-xs">{params.value ? dayjs(params.value).format("DD-MMM-YYYY HH:mm:ss") : "-"}</span>
          </div>
        ),
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
    ],
    []
  );

  const getRowStyle = () => ({
    height: "auto",
    minHeight: "55px",
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid #e2e8f0",
  });

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      filter: true,
      sortable: true,
      flex: 1,
      minWidth: 80,
    }),
    []
  );

  // Calculate stats
  const totalRejected = filteredOrders.length;
  const uniqueUsers = new Set(filteredOrders.map(o => o.userNameId)).size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 md:px-6 lg:px-8 py-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-red-500 to-red-600 rounded-xl">
              <FiAlertCircle className="text-white" size={24} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Rejected Orders</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            Monitor and analyze rejected and failed orders
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Total Orders</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{allOrders.length}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <FiActivity className="text-blue-500" size={20} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Rejected Orders</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{totalRejected}</p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <FiXCircle className="text-red-500" size={20} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Unique Users</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{uniqueUsers}</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <FiUsers className="text-purple-500" size={20} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Total Traded</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{totalTradedData}</p>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg">
                <FiDownload className="text-orange-500" size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <RangePicker
                  format="DD-MMM-YYYY"
                  className="h-11 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  open={pickerOpen}
                  onOpenChange={(open) => {
                    if (open) {
                      setPickerOpen(true);
                      setPanelRange(dateRange);
                    }
                  }}
                  value={panelRange ?? dateRange ?? null}
                  onCalendarChange={(val) => setPanelRange(val as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                  onChange={(val) => setPanelRange(val as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                  allowClear={false}
                  ranges={{
                    Today: [dayjs().startOf("day"), dayjs().endOf("day")],
                    Yesterday: [
                      dayjs().subtract(1, "day").startOf("day"),
                      dayjs().subtract(1, "day").endOf("day"),
                    ],
                    "Last 7 Days": [
                      dayjs().subtract(6, "day").startOf("day"),
                      dayjs().endOf("day"),
                    ],
                    "Last 30 Days": [
                      dayjs().subtract(29, "day").startOf("day"),
                      dayjs().endOf("day"),
                    ],
                    "This Month": [dayjs().startOf("month"), dayjs().endOf("month")],
                    "Last Month": [
                      dayjs().subtract(1, "month").startOf("month"),
                      dayjs().subtract(1, "month").endOf("month"),
                    ],
                  }}
                  renderExtraFooter={() => (
                    <div className="flex justify-end gap-3 p-2">
                      <button
                        className="px-4 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                        onClick={() => {
                          setPanelRange(dateRange);
                          setPickerOpen(false);
                          handleCancelDate();
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-4 py-1.5 text-sm bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition disabled:opacity-50"
                        disabled={!panelRange || !panelRange?.[0] || !panelRange?.[1]}
                        onClick={() => {
                          if (!panelRange) return;
                          handleGetDates(panelRange);
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  )}
                />
              </div>

              <Select
                value={dropdownValue}
                onChange={(value) => setDropdownValue(value)}
                className="w-40 h-11 [&_.ant-select-selector]:rounded-lg [&_.ant-select-selector]:border-gray-200"
                popupClassName="rounded-lg"
              >
                <Option value="ALL">ALL</Option>
                <Option value="REJECTED">REJECTED</Option>
                <Option value="FAILED">FAILED</Option>
                <Option value="CANCELLED">CANCELLED</Option>
                <Option value="OPEN">OPEN</Option>
                <Option value="PENDING">PENDING</Option>
              </Select>
            </div>

            <div className="flex-1"></div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2.5 bg-orange-50 text-orange-700 rounded-lg font-semibold text-sm border border-orange-200">
                Total Traded: {totalTradedData}
              </div>
              <button
                onClick={handleExcelDownload}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-sm"
              >
                <FiDownload size={16} />
                Excel Download
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-red-100 rounded-full"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-red-500 rounded-full animate-spin border-t-transparent"></div>
            </div>
            <p className="mt-4 text-gray-500">Loading rejected orders...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-3">
              <FiXCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium text-red-800">Error Loading Data</p>
                <p className="text-sm text-red-600 mt-0.5">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* AG Grid Table */}
        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="ag-theme-alpine" style={{ height: "550px", width: "100%" }}>
              <AgGridReact<Order>
                columnDefs={columnDefs}
                rowData={filteredOrders}
                defaultColDef={defaultColDef}
                enableCellTextSelection={true}
                ensureDomOrder={true}
                onGridReady={onGridReady}
                getRowStyle={getRowStyle}
                loading={loading}
                rowHeight={55}
                headerHeight={48}
                pagination={true}
                paginationPageSize={20}
                paginationPageSizeSelector={[10, 20, 50, 100]}
                suppressRowClickSelection={true}
                rowSelection="multiple"
                animateRows={true}
                overlayLoadingTemplate={'<div class="flex justify-center items-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div><span class="ml-3 text-gray-500">Loading orders...</span></div>'}
                overlayNoRowsTemplate={
                  error
                    ? `<div class="flex justify-center items-center h-full text-red-500">${error}</div>`
                    : '<div class="flex justify-center items-center h-full text-gray-400">No rejected orders found</div>'
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}