// import React, { useEffect, useState, useMemo, useCallback } from "react";
// import axios from "axios";
// import * as XLSX from "xlsx";
// import { DatePicker } from "antd";
// import dayjs from "dayjs";
// import "antd/dist/reset.css";
// import { toast } from "react-toastify";
// import { AgGridReact } from "ag-grid-react";
// import { ColDef } from "ag-grid-community";
// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-alpine.css";

// type Order = {
//   variety: string;
//   ordertype: string;
//   producttype: string;
//   duration: string;
//   price: number;
//   triggerprice: number;
//   quantity: string;
//   disclosedquantity: string;
//   squareoff: number;
//   stoploss: number;
//   trailingstoploss: number;
//   tradingsymbol: string;
//   transactiontype: string;
//   exchange: string;
//   symboltoken: string;
//   ordertag: string;
//   instrumenttype: string;
//   strikeprice: number;
//   optiontype: string;
//   expirydate: string;
//   lotsize: string;
//   cancelsize: string;
//   averageprice: number;
//   filledshares: string;
//   unfilledshares: string;
//   orderid: string;
//   text: string;
//   status: string;
//   orderstatus: string;
//   updatetime: string;
//   exchtime: string;
//   exchorderupdatetime: string;
//   fillid: string;
//   filltime: string;
//   fillprice: string;
//   fillsize: string;
//   parentorderid: string;
//   uniqueorderid: string;
//   exchangeorderid: string;
//   createdAt: string;
//   tradedValue: any;
//   buyprice: any;
//   pnl: any;
//   updatedAt: any;

//   // 👇 extra fields you’re using in columnDefs
//   buyTime?: string;
//   sellTime?: string;

// };

// const { RangePicker } = DatePicker;

// export default function OrderTables() {
//   const apiUrl = import.meta.env.VITE_API_URL;

//   const [orders, setOrders] = useState<Order[]>([]);

//   const [totalTradedData, setTotalTradedData] = useState<number>(0);
//   const [totalPNL, settotalPNL] = useState<number>(0);

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(() => [
//     dayjs().startOf("day"),
//     dayjs().endOf("day"),
//   ]);

//   const [pickerOpen, setPickerOpen] = useState(false);
//   const [panelRange, setPanelRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(() => [
//     dayjs().startOf("day"),
//     dayjs().endOf("day"),
//   ]);

//   const [searchTerm, setSearchTerm] = useState("");
//   const [gridApi, setGridApi] = useState<any>(null);

//   console.log(gridApi);
  

//   const fetchOrders = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { data } = await axios.get(`${apiUrl}/order/get/table/order`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });

//       if (data?.status === true) {
      
//          const ordersArray = Array.isArray(data.data) ? data.data : [];

//           // Total PNL calculate
//           const total = ordersArray.reduce((sum:any, order:any) => {
//             return sum + Number(order.pnl || 0); // string ko number me convert
//           }, 0);

//         settotalPNL(total);
//         setOrders(Array.isArray(data.data) ? data.data : []);
//         setTotalTradedData(data.buydata || 0);
//       } else if (data?.status === false && data?.message === "Unauthorized") {
//         toast.error("Unauthorized User");
//         localStorage.clear();
//       } else {
//         toast.error(data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       setError(err?.message || "Something went wrong");
//       toast.error(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchOrders();
//   }, []);

//   const handleGetDates = async (rangeParam?: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
//     const activeRange = rangeParam ?? dateRange;

//     if (!activeRange) {
//       toast.error("Please select a date range");
//       return;
//     }

//     const [from, to] = activeRange;
//     const payload = [from.toISOString(), to.toISOString()];

//     setLoading(true);
//     setError(null);
//     try {
//       const res = await axios.post(
//         `${apiUrl}/order/datefilter/order`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//             AngelOneToken: localStorage.getItem("angel_token") || "",
//           },
//         }
//       );

//       if (res.data?.status === true) {

//          const ordersArray = Array.isArray(res.data.data) ? res.data.data : [];

//           // Total PNL calculate
//           const total = ordersArray.reduce((sum:any, order:any) => {
//             return sum + Number(order.pnl || 0); // string ko number me convert
//           }, 0);

//         settotalPNL(total);

//         setOrders(Array.isArray(res.data.data) ? res.data.data : []);
//         setTotalTradedData(res?.data?.buydata || 0);
//         toast.success(res.data?.message || "Filtered orders loaded");
//       } else if (
//         res.data?.status === false &&
//         res.data?.message === "Unauthorized"
//       ) {
//         localStorage.clear();
//         toast.error("Session expired. Please log in again.");
//       } else {
//         toast.error(res.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       setError(err?.message || "Something went wrong");
//       toast.error(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleKeyUp = async (e: React.KeyboardEvent<HTMLInputElement>) => {
//     const raw = e.currentTarget.value;
//     const query = raw.trim();

//     if (!query) {
//       fetchOrders();
//       return;
//     }

//     if (query.length < 3) return;

//     setLoading(true);
//     setError(null);

//     try {
//       const res = await axios.get(`${apiUrl}/order/search`, {
//         params: { search: query },
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });

//       if (res.data?.status === true && Array.isArray(res.data.data)) {
//         setOrders(res.data.data);
//       } else {
//         setOrders([]);
//         toast.error(res.data?.message || "No matching orders found");
//       }
//     } catch (err: any) {
//       console.error(err);
//       setError(err?.message || "Something went wrong");
//       toast.error(err?.message || "Something went wrong");
//       setOrders([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const convertHeaders = (data: any, mapping: any) => {
//     return data.map((item: any) => {
//       const newItem: any = {};

//       Object.keys(mapping).forEach(oldKey => {
//         let value = item[oldKey];
//         newItem[mapping[oldKey]] = value ?? "";
//       });

//       return newItem;
//     });
//   };

//   const handleExcelDownload = () => {
//     const headerMapping = {
//       userNameId: "UserId",
//       transactiontype: "SignalType",
//       exchange: "Exchange",
//       instrumenttype: "Instrument",
//       orderid: "OrderID",
//       tradingsymbol: "Symbol",
//       ordertype: "OrderType",
//       producttype: "ProductType",
//       buyprice: "Buy Price",
//       fillprice: "Sell Price",
//       pnl: "PnL",
//       quantity: "OrderQty",
//       fillsize: "TradedQty",
//       status: "Status",
//       text: "Message",
//       buyTime: "Buy Time",
//       filltime: "Sell Time",
//     };

//     // ⭐ Add static value for "transactiontype"
//   const updatedOrders = orders.map(o => ({
//     ...o,
//     transactiontype: "BUY",  // <-- put your value here
//   }));

//     const formattedOrders = convertHeaders(updatedOrders, headerMapping);
//     const ws = XLSX.utils.json_to_sheet(formattedOrders);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
//     XLSX.writeFile(wb, "orders.xlsx");
//   };

//   const handleCancelDate = async function () {
//     setDateRange(null);
//     setPanelRange(null);
//     setPickerOpen(false);
//     fetchOrders();
//   };

//   const onGridReady = useCallback((params: any) => {
//     setGridApi(params.api);
//   }, []);

//   const statusColor = (status: string) => {
//     const s = status?.toLowerCase();
//     if (s === "complete" || s === "filled" || s === "success") return "#16a34a";
//     if (s === "rejected" || s === "cancelled" || s === "canceled") return "#ef4444";
//     if (s === "pending" || s === "open" || s === "queued") return "#f59e0b";
//     return "#64748b";
//   };

//   const transactionTypeCellRenderer = (params: any) => {
//     const value = params.value || "-";
//     const isBuy = value === "BUY";
//     const isSell = value === "SELL";

//     const txnBg = isBuy ? "bg-green-100" : isSell ? "bg-red-100" : "bg-gray-200";
//     const txnColor = isBuy ? "text-green-800" : isSell ? "text-red-800" : "text-gray-700";

//     return (
//       <span
//         className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${txnBg} ${txnColor}`}
//       >
//         {value}
//       </span>
//     );
//   };



  
//   const statusCellRenderer = (params: any) => {
//     const status = params.value || "-";
//     const backgroundColor = statusColor(status);

//     return (
//       <span
//         className="inline-block px-2.5 py-1 rounded-full text-xs font-medium text-white capitalize whitespace-nowrap"
//         style={{ backgroundColor }}
//         title={status}
//       >
//         {status}
//       </span>
//     );
//   };

//   const textCellRenderer = (params: any) => {
//     const text = params.value || "—";
//     return (
//       <span
//         title={text}
//         className="inline-block overflow-hidden text-ellipsis whitespace-nowrap max-w-[360px]"
//       >
//         {text}
//       </span>
//     );
//   };

// const pnlCellRenderer = (params: any) => {
//   const pnl = params.value;
//   const numericPnl = Number(pnl);
//   const isPositive = numericPnl > 0;
//   const isNegative = numericPnl < 0;

//   // Text color logic
//   const colorClass = isPositive
//     ? "text-green-700"
//     : isNegative
//     ? "text-red-700"
//     : "text-gray-800";

//   // Background color logic
//   const bgClass = isPositive
//     ? "bg-green-100"
//     : isNegative
//     ? "bg-red-100"
//     : "bg-gray-200";

//   return (
//     <span
//       className={`px-2.5 py-1 rounded-full font-medium ${colorClass} ${bgClass}`}
//     >
//       {numericPnl > 0 ? `+${numericPnl.toFixed(2)}` : numericPnl.toFixed(2)}
//     </span>
//   );
// };


//   const quantityCellRenderer = (params: any) => {
//     const order = params.data;
//     const title = `Filled: ${order.filledshares} / Unfilled: ${order.unfilledshares}`;

//     return (
//       <span title={title}>
//         {params.value}
//       </span>
//     );
//   };

//   const priceFormatter = (params: any) => {
//   if (params.value === null || params.value === undefined) return "₹0.00";
//   return `₹${Number(params.value).toFixed(2)}`;
// };

  

// // Fixed & TypeScript-safe column definitions
// const columnDefs: ColDef<Order>[] = useMemo(() => [
//   {
//     headerName: "Symbol",
//     field: "tradingsymbol",
//     filter: true,
//     sortable: true,
//     width: 170,
//     minWidth: 180,
//     cellStyle: () => ({
//       borderRight: "1px solid #e2e8f0",
//     }),
//   },

//   {
//     headerName: "Type",
//     field: "transactiontype",
//     filter: true,
//     sortable: true,
//     cellRenderer: transactionTypeCellRenderer,
//     width: 100,
//     minWidth: 100,
//     valueGetter: () => "BUY",
//     cellStyle: () => ({
//       borderRight: "1px solid #e2e8f0",
//     }),
//   },

//   {
//     headerName: "Buy Price",
//     field: "buyprice",
//     filter: true,
//     sortable: true,
//     width: 120,
//     minWidth: 120,
//     valueFormatter: priceFormatter,
//     cellStyle: () => ({
//       borderRight: "1px solid #e2e8f0",
//       textAlign: "right",
//     }),
//   },

//   {
//     headerName: "Sell Price",
//     field: "fillprice",
//     filter: true,
//     sortable: true,
//     width: 120,
//     minWidth: 120,
//     valueFormatter: priceFormatter,
//     cellStyle: () => ({
//       borderRight: "1px solid #e2e8f0",
//       textAlign: "right",
//     }),
//   },

//   {
//     headerName: "Traded Qty",
//     field: "quantity",
//     filter: true,
//     sortable: true,
//     cellRenderer: quantityCellRenderer,
//     width: 150,
//     minWidth: 150,
//     cellStyle: () => ({
//       borderRight: "1px solid #e2e8f0",
//     }),
//   },

//   {
//     headerName: "PNL",
//     field: "pnl",
//     filter: true,
//     sortable: true,
//     cellRenderer: pnlCellRenderer,
//     width: 120,
//     minWidth: 120,
//     cellStyle: () => ({
//       borderRight: "1px solid #e2e8f0",
//     }),
//   },

//   {
//     headerName: "Order ID",
//     field: "orderid",
//     filter: true,
//     sortable: true,
//     width: 140,
//     minWidth: 180,
//     cellStyle: () => ({
//       borderRight: "1px solid #e2e8f0",
//     }),
//   },

//   {
//     headerName: "Trade ID",
//     field: "fillid",
//     filter: true,
//     sortable: true,
//     width: 120,
//     minWidth: 120,
//     cellStyle: () => ({
//       borderRight: "1px solid #e2e8f0",
//     }),
//   },

//   {
//     headerName: "Order Type",
//     field: "ordertype",
//     filter: true,
//     sortable: true,
//     width: 120,
//     minWidth: 120,
//     cellStyle: () => ({
//       borderRight: "1px solid #e2e8f0",
//     }),
//   },

//   {
//     headerName: "Product Type",
//     field: "producttype",
//     filter: true,
//     sortable: true,
//     width: 140,
//     minWidth: 150,
//     cellStyle: () => ({
//       borderRight: "1px solid #e2e8f0",
//     }),
//   },

//   {
//     headerName: "Instrument",
//     field: "instrumenttype",
//     filter: true,
//     sortable: true,
//     width: 120,
//     minWidth: 120,
//     cellStyle: () => ({
//       borderRight: "1px solid #e2e8f0",
//     }),
//   },

//   {
//     headerName: "Status",
//     field: "status",
//     filter: true,
//     sortable: true,
//     cellRenderer: statusCellRenderer,
//     width: 120,
//     minWidth: 120,
//     cellStyle: () => ({
//       borderRight: "1px solid #e2e8f0",
//     }),
//   },

//   {
//     headerName: "Buy Time",
//     field: "buyTime",
//     filter: true,
//     sortable: true,
//     width: 300,
//     minWidth: 250,
//     cellStyle: () => ({
//       borderRight: "1px solid #e2e8f0",
//     }),
//   },

//   {
//     headerName: "Sell Time",
//     field: "filltime",
//     filter: true,
//     sortable: true,
//     width: 300,
//     minWidth: 250,
//     cellStyle: () => ({
//       borderRight: "1px solid #1a2533ff",
//     }),
//   },

//   {
//     headerName: "Message",
//     field: "text",
//     filter: true,
//     sortable: true,
//     cellRenderer: textCellRenderer,
//     width: 170,
//     minWidth: 180,
//     cellStyle: () => ({
//       borderRight: "1px solid #e2e8f0",
//     }),
//   },
// ], []);


//   const getRowStyle = () => {
//     return {
//       height: '70px',
//       display: 'flex',
//       alignItems: 'center',
//       borderBottom: '1px solid #e2e8f0'
//     };
//   };

//   const defaultColDef = useMemo(() => ({
//     resizable: true,
//     filter: true,
//     sortable: true,
//     flex: 1,
//     minWidth: 100,
//   }), []);

//   return (
//     <div className="p-4 font-sans">
//       <h2 className="mb-3 text-xl font-semibold">Orders History</h2>

//       {/* Date filter + Excel + Total Traded */}
//       <div className="flex justify-between items-center gap-6 mb-3">
//         <RangePicker
//           format="DD-MMMM-YYYY"
//           className="h-11 w-140 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//           open={pickerOpen}
//           onOpenChange={(open) => {
//             if (open) {
//               setPickerOpen(true);
//               setPanelRange(dateRange);
//             }
//           }}
//           value={panelRange ?? dateRange ?? null}
//           onCalendarChange={(val) =>
//             setPanelRange(val as [dayjs.Dayjs, dayjs.Dayjs] | null)
//           }
//           onChange={(val) =>
//             setPanelRange(val as [dayjs.Dayjs, dayjs.Dayjs] | null)
//           }
//           allowClear={false}
//           ranges={{
//             Today: [dayjs().startOf("day"), dayjs().endOf("day")],
//             Yesterday: [
//               dayjs().subtract(1, "day").startOf("day"),
//               dayjs().subtract(1, "day").endOf("day"),
//             ],
//             "Last 7 Days": [
//               dayjs().subtract(6, "day").startOf("day"),
//               dayjs().endOf("day"),
//             ],
//             "Last 30 Days": [
//               dayjs().subtract(29, "day").startOf("day"),
//               dayjs().endOf("day"),
//             ],
//             "This Month": [dayjs().startOf("month"), dayjs().endOf("month")],
//             "Last Month": [
//               dayjs().subtract(1, "month").startOf("month"),
//               dayjs().subtract(1, "month").endOf("month"),
//             ],
//           }}
//           renderExtraFooter={() => (
//             <div className="flex justify-end gap-3 p-2">
//               <button
//                 className="px-5 py-0.5 text-sm bg-gray-100 rounded hover:bg-gray-200"
//                 onClick={() => {
//                   setPanelRange(dateRange);
//                   setPickerOpen(false);
//                   handleCancelDate();
//                 }}
//               >
//                 Cancel
//               </button>

//               <button
//                 className="px-5 py-0.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
//                 disabled={!panelRange || !panelRange[0] || !panelRange[1]}
//                 onClick={() => {
//                   if (!panelRange) return;
//                   setDateRange(panelRange);
//                   setPickerOpen(false);
//                   handleGetDates(panelRange);
//                 }}
//               >
//                 <span className="text-white">Apply</span>
//               </button>
//             </div>
//           )}
//         />

//         <div className="flex items-center gap-4">

//            {/* <div className="px-4 py-3.5 bg-indigo-50 text-indigo-800 rounded-lg font-semibold text-sm border border-indigo-200 whitespace-nowrap">
//             Total PNL: {totalPNL}
//           </div> */}

//           <div
//   className={`px-4 py-3.5 rounded-lg font-semibold text-sm border whitespace-nowrap
//   ${
//     totalPNL < 0
//       ? "bg-red-50 text-red-800 border-red-200"
//       : "bg-green-50 text-green-800 border-green-200"
//   }`}
// >
//   Total PNL: {totalPNL}
// </div>

//           <div className="px-4 py-3.5 bg-indigo-50 text-indigo-800 rounded-lg font-semibold text-sm border border-indigo-200 whitespace-nowrap">
//             Total Traded: {totalTradedData}
//           </div>
//           <button
//             onClick={handleExcelDownload}
//             className="bg-blue-500 text-white px-4 py-3.5 rounded hover:bg-blue-600"
//           >
//             <span className="text-white">Excel Download</span>
//           </button>
//         </div>
//       </div>

//       {/* Search Box */}
//       <div className="w-full sm:w-64 md:w-80 mb-4">
//         <input
//           type="text"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           onKeyUp={handleKeyUp}
//           placeholder="Search (min 3 chars)"
//           className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
//         />
//       </div>

//       {/* AG Grid Table */}
//       <div className="ag-theme-alpine custom-ag-grid" style={{ height: 600, width: '100%' }}>
//         <AgGridReact<Order>
//           columnDefs={columnDefs}
//           rowData={orders}
//           defaultColDef={defaultColDef}
//           onGridReady={onGridReady}
//           getRowStyle={getRowStyle}
//           loading={loading}
//           rowHeight={50}
//   // ✅ COPY ENABLE
//   enableCellTextSelection={true}
//   ensureDomOrder={true}
//           headerHeight={50}
//           overlayLoadingTemplate={
//             '<span class="ag-overlay-loading-center">Loading orders...</span>'
//           }
//           overlayNoRowsTemplate={
//             error
//               ? `<div class="ag-overlay-no-rows-center text-red-500">${error}</div>`
//               : '<div class="ag-overlay-no-rows-center">No orders found.</div>'
//           }
//           pagination={true}
//           paginationPageSize={20}
          
//           paginationPageSizeSelector={[20, 50, 100, 500, 1000]}
//           suppressRowClickSelection={true}
//           rowSelection="multiple"
//           animateRows={true}
//         />
//       </div>
//     </div>
//   );
// }



import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import "antd/dist/reset.css";
import { toast } from "react-toastify";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { 
  FiDownload, 
  FiSearch, 
  FiCalendar, 
  FiTrendingUp, 
  FiTrendingDown,
  FiRefreshCw,
  FiPieChart
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
  createdAt: string;
  tradedValue: any;
  buyprice: any;
  pnl: any;
  updatedAt: any;
  buyTime?: string;
  sellTime?: string;
};

const { RangePicker } = DatePicker;

export default function OrderTables() {
  const apiUrl = import.meta.env.VITE_API_URL;

  const [orders, setOrders] = useState<Order[]>([]);
  const [totalTradedData, setTotalTradedData] = useState<number>(0);
  const [totalPNL, settotalPNL] = useState<number>(0);
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
  const [searchTerm, setSearchTerm] = useState("");
  const [gridApi, setGridApi] = useState<any>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${apiUrl}/order/get/table/order`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });

      if (data?.status === true) {
        const ordersArray = Array.isArray(data.data) ? data.data : [];
        const total = ordersArray.reduce((sum: any, order: any) => {
          return sum + Number(order.pnl || 0);
        }, 0);
        settotalPNL(total);
        setOrders(Array.isArray(data.data) ? data.data : []);
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
    fetchOrders();
  }, []);

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
      const res = await axios.post(`${apiUrl}/order/datefilter/order`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });

      if (res.data?.status === true) {
        const ordersArray = Array.isArray(res.data.data) ? res.data.data : [];
        const total = ordersArray.reduce((sum: any, order: any) => {
          return sum + Number(order.pnl || 0);
        }, 0);
        settotalPNL(total);
        setOrders(Array.isArray(res.data.data) ? res.data.data : []);
        setTotalTradedData(res?.data?.buydata || 0);
        toast.success(res.data?.message || "Filtered orders loaded");
      } else if (res.data?.status === false && res.data?.message === "Unauthorized") {
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

  const handleKeyUp = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    const raw = e.currentTarget.value;
    const query = raw.trim();

    if (!query) {
      fetchOrders();
      return;
    }

    if (query.length < 3) return;

    setLoading(true);
    setError(null);

    try {
      const res = await axios.get(`${apiUrl}/order/search`, {
        params: { search: query },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });

      if (res.data?.status === true && Array.isArray(res.data.data)) {
        setOrders(res.data.data);
      } else {
        setOrders([]);
        toast.error(res.data?.message || "No matching orders found");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong");
      toast.error(err?.message || "Something went wrong");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const convertHeaders = (data: any, mapping: any) => {
    return data.map((item: any) => {
      const newItem: any = {};
      Object.keys(mapping).forEach(oldKey => {
        let value = item[oldKey];
        newItem[mapping[oldKey]] = value ?? "";
      });
      return newItem;
    });
  };

  const handleExcelDownload = () => {
    const headerMapping = {
      userNameId: "UserId",
      transactiontype: "SignalType",
      exchange: "Exchange",
      instrumenttype: "Instrument",
      orderid: "OrderID",
      tradingsymbol: "Symbol",
      ordertype: "OrderType",
      producttype: "ProductType",
      buyprice: "Buy Price",
      fillprice: "Sell Price",
      pnl: "PnL",
      quantity: "OrderQty",
      fillsize: "TradedQty",
      status: "Status",
      text: "Message",
      buyTime: "Buy Time",
      filltime: "Sell Time",
    };

    const updatedOrders = orders.map(o => ({
      ...o,
      transactiontype: "BUY",
    }));

    const formattedOrders = convertHeaders(updatedOrders, headerMapping);
    const ws = XLSX.utils.json_to_sheet(formattedOrders);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, `orders_${dayjs().format("YYYY-MM-DD")}.xlsx`);
    toast.success("Excel file downloaded successfully!");
  };

  const handleCancelDate = async function () {
    setDateRange(null);
    setPanelRange(null);
    setPickerOpen(false);
    fetchOrders();
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
      <span
        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
          isBuy ? "bg-green-100 text-green-700" : isSell ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
        }`}
      >
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
      <span title={text} className="inline-block overflow-hidden text-ellipsis whitespace-nowrap max-w-[360px]">
        {text}
      </span>
    );
  };

  const pnlCellRenderer = (params: any) => {
    const pnl = params.value;
    const numericPnl = Number(pnl);
    const isPositive = numericPnl > 0;
    const isNegative = numericPnl < 0;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium ${
          isPositive ? "bg-green-100 text-green-700" : isNegative ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
        }`}
      >
        {isPositive && <FiTrendingUp size={12} />}
        {isNegative && <FiTrendingDown size={12} />}
        {numericPnl > 0 ? `+${numericPnl.toFixed(2)}` : numericPnl.toFixed(2)}
      </span>
    );
  };

  const quantityCellRenderer = (params: any) => {
    const order = params.data;
    const title = `Filled: ${order.filledshares || 0} / Unfilled: ${order.unfilledshares || 0}`;
    return <span title={title}>{params.value}</span>;
  };

  const priceFormatter = (params: any) => {
    if (params.value === null || params.value === undefined) return "₹0.00";
    return `₹${Number(params.value).toFixed(2)}`;
  };

  const columnDefs: ColDef<Order>[] = useMemo(() => [
    {
      headerName: "Symbol",
      field: "tradingsymbol",
      filter: true,
      sortable: true,
      width: 170,
      minWidth: 150,
      cellStyle: { borderRight: "1px solid #e2e8f0" },
    },
    {
      headerName: "Type",
      field: "transactiontype",
      filter: true,
      sortable: true,
      cellRenderer: transactionTypeCellRenderer,
      width: 100,
      minWidth: 100,
      valueGetter: () => "BUY",
      cellStyle: { borderRight: "1px solid #e2e8f0" },
    },
    {
      headerName: "Buy Price",
      field: "buyprice",
      filter: true,
      sortable: true,
      width: 120,
      minWidth: 110,
      valueFormatter: priceFormatter,
      cellStyle: { borderRight: "1px solid #e2e8f0", textAlign: "right" },
    },
    {
      headerName: "Sell Price",
      field: "fillprice",
      filter: true,
      sortable: true,
      width: 120,
      minWidth: 110,
      valueFormatter: priceFormatter,
      cellStyle: { borderRight: "1px solid #e2e8f0", textAlign: "right" },
    },
    {
      headerName: "Traded Qty",
      field: "quantity",
      filter: true,
      sortable: true,
      cellRenderer: quantityCellRenderer,
      width: 130,
      minWidth: 120,
      cellStyle: { borderRight: "1px solid #e2e8f0" },
    },
    {
      headerName: "PNL",
      field: "pnl",
      filter: true,
      sortable: true,
      cellRenderer: pnlCellRenderer,
      width: 120,
      minWidth: 110,
      cellStyle: { borderRight: "1px solid #e2e8f0" },
    },
    {
      headerName: "Order ID",
      field: "orderid",
      filter: true,
      sortable: true,
      width: 150,
      minWidth: 140,
      cellStyle: { borderRight: "1px solid #e2e8f0" },
    },
    {
      headerName: "Status",
      field: "status",
      filter: true,
      sortable: true,
      cellRenderer: statusCellRenderer,
      width: 120,
      minWidth: 110,
      cellStyle: { borderRight: "1px solid #e2e8f0" },
    },
    {
      headerName: "Buy Time",
      field: "buyTime",
      filter: true,
      sortable: true,
      width: 180,
      minWidth: 160,
      cellStyle: { borderRight: "1px solid #e2e8f0" },
    },
    {
      headerName: "Sell Time",
      field: "filltime",
      filter: true,
      sortable: true,
      width: 180,
      minWidth: 160,
      cellStyle: { borderRight: "1px solid #e2e8f0" },
    },
    {
      headerName: "Message",
      field: "text",
      filter: true,
      sortable: true,
      cellRenderer: textCellRenderer,
      width: 200,
      minWidth: 180,
      cellStyle: { borderRight: "1px solid #e2e8f0" },
    },
  ], []);

  const defaultColDef = useMemo(() => ({
    resizable: true,
    filter: true,
    sortable: true,
    flex: 1,
    minWidth: 100,
  }), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 md:px-6 lg:px-8 py-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-[#FB3800] to-orange-500 rounded-xl">
              <FiPieChart className="text-white" size={24} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Orders History</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            View and manage all your trading orders
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Total Traded</p>
                <p className="text-2xl font-bold text-gray-800">{totalTradedData}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <FiTrendingUp className="text-blue-500" size={20} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Total PNL</p>
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
                <p className="text-xs text-gray-400 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg">
                <FiRefreshCw className="text-orange-500" size={20} />
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyUp={handleKeyUp}
                  placeholder="Search by symbol, order ID..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                />
              </div>
            </div>

            <div>
              <RangePicker
                format="DD-MMM-YYYY"
                className="h-11 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800]"
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
                  Yesterday: [dayjs().subtract(1, "day").startOf("day"), dayjs().subtract(1, "day").endOf("day")],
                  "Last 7 Days": [dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")],
                  "Last 30 Days": [dayjs().subtract(29, "day").startOf("day"), dayjs().endOf("day")],
                  "This Month": [dayjs().startOf("month"), dayjs().endOf("month")],
                  "Last Month": [dayjs().subtract(1, "month").startOf("month"), dayjs().subtract(1, "month").endOf("month")],
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
                      className="px-4 py-1.5 text-sm bg-gradient-to-r from-[#FB3800] to-orange-500 text-white rounded-lg hover:shadow-md transition disabled:opacity-50"
                      disabled={!panelRange || !panelRange[0] || !panelRange[1]}
                      onClick={() => {
                        if (!panelRange) return;
                        setDateRange(panelRange);
                        setPickerOpen(false);
                        handleGetDates(panelRange);
                      }}
                    >
                      Apply
                    </button>
                  </div>
                )}
              />
            </div>

            <button
              onClick={handleExcelDownload}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-md transition-all duration-200"
            >
              <FiDownload size={16} />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* AG Grid Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="ag-theme-alpine" style={{ height: 550, width: '100%' }}>
            <AgGridReact<Order>
              columnDefs={columnDefs}
              rowData={orders}
              defaultColDef={defaultColDef}
              onGridReady={onGridReady}
              loading={loading}
              rowHeight={48}
              headerHeight={48}
              enableCellTextSelection={true}
              ensureDomOrder={true}
              overlayLoadingTemplate='<div class="flex items-center justify-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FB3800]"></div></div>'
              overlayNoRowsTemplate={error 
                ? `<div class="text-red-500 text-center p-8">${error}</div>`
                : '<div class="text-gray-400 text-center p-8">No orders found</div>'
              }
              pagination={true}
              paginationPageSize={20}
              paginationPageSizeSelector={[20, 50, 100, 500]}
              suppressRowClickSelection={true}
              rowSelection="multiple"
              animateRows={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}