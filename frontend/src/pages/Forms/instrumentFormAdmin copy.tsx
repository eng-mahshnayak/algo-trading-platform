
// import { useState, useEffect, useRef,useMemo } from "react";
// import axios from "axios";
// import * as XLSX from "xlsx";
// import { toast } from "react-toastify";

// // --- AG Grid v31+ (modular) ------------------------------
// import { ModuleRegistry } from "ag-grid-community";
// import { AllCommunityModule } from "ag-grid-community";
// ModuleRegistry.registerModules([AllCommunityModule]); // ✅ REQUIRED

// import { AgGridReact } from "ag-grid-react";
// import type {
//   ColDef,
//   GridApi,
//   GridReadyEvent,
//   ICellRendererParams,
// } from "ag-grid-community";

// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-quartz.css";
// // ----------------------------------------------------------

// export default function InstrumentFormAdmin() {
//   const apiUrl = import.meta.env.VITE_API_URL;

//   const [data, setData] = useState<any[]>([]);
//   const [dataexcel, setDataExcel] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const [getPrice, setOnlyPrice] = useState("");
//   const [getslotSIze, setSlotSIze] = useState("");

//   const [selectedItem, setSelectedItem] = useState<any | null>(null);
//   const [showForm, setShowForm] = useState(false);

//   const [duration, setDuration] = useState("DAY");
//   const [orderType, setOrderType] = useState("MARKET");
//   const [variety, setVariety] = useState("NORMAL");

//   const [searchTerm, setSearchTerm] = useState("");

//   const [getTrasectionType, setGetTrasectionType] = useState("");

//   const gridApiRef = useRef<GridApi | null>(null);

//     const [groupName, setGroupName] = useState("");


//     const [strategyList, setStrategyList] = useState([]); // all strategies from backend
// const [selectedStrategyId, setSelectedStrategyId] = useState(""); // dropdown selected id


//   // fetch data (full list)
//   const fetchData = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const res = await axios.get(`${apiUrl}/agnelone/instrument`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });

//       console.log(res?.data, "heello");

//       if (res?.data?.status === true) {
//         const allData = res?.data?.data || [];
//         setDataExcel(allData);
//         setData(allData);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       toast.error(err?.message || "Something went wrong");
//       setError(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);


//     const fetchStrategies = async () => {
//   try {
//     const res = await axios.get(`${apiUrl}/admin/strategies`, {
//       headers: {
//         Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//         AngelOneToken: localStorage.getItem("angel_token") || "",
//         userid: localStorage.getItem("userID"),
//       },
//     });


//     if (res.data.status === true) {
//       setStrategyList(res.data.data || []);
//     } else {
//       toast.error(res.data.message);
//     }
//   } catch (err:any) {
//     toast.error(err.message);
//   }
// };

//   // Buy
//   const handleBuyClick = async (item: any) => {

//     const payload = {
//       exchange: item.exch_seg,
//       tradingsymbol: item.symbol,
//       symboltoken: item.token,
//     };

//     try {



//       await fetchStrategies()

//       const res = await axios.post(`${apiUrl}/agnelone/instrument/ltp`, payload, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID"),
//         },
//       });

//       if (res?.data?.status === true) {
//         item.price = res?.data?.data.data.ltp;
//         item.transactiontype = "BUY";
//         item.totalPrice = item.price * item.lotsize;

//         setGetTrasectionType("Buy");
//         setOnlyPrice(res?.data?.data.data.ltp);
//         setSlotSIze(item.lotsize);
//         setSelectedItem({ ...item });
//         setShowForm(true);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {

//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   // Sell
//   const handleSellClick = async (item: any) => {
//     const payload = {
//       exchange: item.exch_seg,
//       tradingsymbol: item.symbol,
//       symboltoken: item.token,
//     };

//     try {


//       await fetchStrategies() 

//       const res = await axios.post(`${apiUrl}/agnelone/instrument/ltp`, payload, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID"),
//         },
//       });

//       if (res?.data?.status === true) {
//         item.price = res?.data?.data.data.ltp;
//         item.transactiontype = "SELL";
//         item.totalPrice = item.price * item.lotsize;

//         setGetTrasectionType("Sell");
//         setOnlyPrice(res?.data?.data.data.ltp);
//         setSlotSIze(item.lotsize);
//         setSelectedItem({ ...item });
//         setShowForm(true);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   // AG Grid columns
//   const columnDefs = useMemo<ColDef[]>(
//     () => [
//       { headerName: "Token", field: "token", minWidth: 60 },
//       // { headerName: "Symbol Num", field: "SyNum", minWidth: 20 },
//       { headerName: "Type", field: "syType", minWidth: 20 },
//       // { headerName: "nameStrickType", field: "nameStrickType", minWidth: 20 },
//       {
//         headerName: "Symbol",
//         field: "symbol",
//         minWidth: 250,
//         filter: "agTextColumnFilter",
//       },
//       { headerName: "Name", field: "name", minWidth: 80 },
//       { headerName: "Lot-Size", field: "lotsize", width: 110 },
//       {
//         headerName: "Buy",
//         field: "buy",
//         width: 100,
//         sortable: false,
//         filter: false,
//         cellRenderer: (params: ICellRendererParams) => (
//           <button
//             onClick={() => handleBuyClick(params.data)}
//             className="bg-green-500 hover:bg-green-600 text-white font-medium px-3 py-1 rounded-lg shadow-sm transition"
//           >
//             Entry Price
//           </button>
//         ),
//       },
//       {
//         headerName: "Sell",
//         field: "sell",
//         width: 100,
//         sortable: false,
//         filter: false,
//         cellRenderer: (params: ICellRendererParams) => (
//           <button
//             onClick={() => handleSellClick(params.data)}
//             className="bg-red-500 hover:bg-red-600 text-white font-medium px-3 py-1 rounded-lg shadow-sm transition"
//           >
//             Exit Price
//           </button>
//         ),
//       },
//     ],
//     []
//   );

//   const defaultColDef = useMemo<ColDef>(
//     () => ({
//       sortable: true,
//       resizable: true,
//       filter: true,
//       floatingFilter: true,
//     }),
//     []
//   );

//   const onGridReady = (e: GridReadyEvent) => {
//     gridApiRef.current = e.api;
//     e.api.sizeColumnsToFit();
//   };

//   // submit order
//   // const handleSubmit = async (e: React.FormEvent) => {
//   //   e.preventDefault();

//   //   if (!selectedItem) return;

//   //   const formData = {
//   //     token: selectedItem.token,
//   //     symbol: selectedItem.symbol,
//   //     name: selectedItem.name,
//   //     exch_seg: selectedItem.exch_seg,
//   //     price: selectedItem.price,
//   //     quantity: selectedItem.lotsize,
//   //     transactiontype: selectedItem.transactiontype,
//   //     duration,
//   //     orderType,
//   //     variety,
//   //     productType: selectedItem.productType,
//   //     totalPrice: selectedItem.totalPrice,
//   //     actualQuantity:
//   //       Number(selectedItem.lotsize) / Number(getslotSIze || 1), // avoid NaN
//   //       groupName:groupName
//   //   };

//   //   try {
//   //     const res = await axios.post(`${apiUrl}/order/place/order`, formData, {
//   //       headers: {
//   //         Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//   //         // AngelOneToken: localStorage.getItem("angel_token") || "",
//   //         // userid: localStorage.getItem("userID"),
//   //       },
//   //     });

//   //     console.log(res);

//   //     if (res?.data?.status === true) {
//   //       alert(res?.data?.message);
//   //       setShowForm(false);
//   //       setVariety("NORMAL");
//   //       setDuration("DAY");
//   //       setOrderType("MARKET");
//   //     } else {
//   //       toast.error(res?.data?.message || "Something went wrong");
//   //     }
//   //   } catch (err: any) {
//   //     toast.error(err.message || "Something went wrong");
//   //   }
//   // };


//    // submit order
//   const handleSubmitMultiple = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!selectedItem) return;

//     const formData = {
//       token: selectedItem.token,
//       symbol: selectedItem.symbol,
//       name: selectedItem.name,
//       exch_seg: selectedItem.exch_seg,
//       instrumenttype: selectedItem.instrumenttype,
//       price: selectedItem.price,
//       quantity: selectedItem.lotsize,
//       transactiontype: selectedItem.transactiontype,
//       duration,
//       orderType,
//       variety,
//       productType: selectedItem.productType,
//       totalPrice: selectedItem.totalPrice,
//       actualQuantity:
//         Number(selectedItem.lotsize) / Number(getslotSIze || 1), // avoid NaN
//         groupName:groupName
//     };

//     try {
//       const res = await axios.post(`${apiUrl}/admin/multiple/place/order`, formData, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//         },
//       });

//       console.log(res);

//       if (res?.data?.status === true) {
//         alert(res?.data?.message);
//         setShowForm(false);
//         setVariety("NORMAL");
//         setDuration("DAY");
//         setOrderType("MARKET");
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       toast.error(err.message || "Something went wrong");
//     }
//   };


//   // Excel download
//   const handleExcelDownload = () => {
//     const worksheet = XLSX.utils.json_to_sheet(dataexcel);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
//     XLSX.writeFile(workbook, "instrument.xlsx");
//   };

//   // 🔍 Backend search on key up
//   const handleKeyUp = async (e: React.KeyboardEvent<HTMLInputElement>) => {
//     const value = e.currentTarget.value;

//     // When 3+ chars → hit backend search
//     if (value.length >= 3) {
//       setLoading(true);
//       setError("");

//       try {
//         const res = await axios.get(
//           `${apiUrl}/agnelone/instrument/search/${value}`,
//           {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//               AngelOneToken: localStorage.getItem("angel_token") || "",
//             },
//           }
//         );

//         if (res?.data?.status === true) {
//           const allData = res?.data?.data || [];
//           setDataExcel(allData);
//           console.log(allData);
//           setData(allData);
//         } else {
//           toast.error(res?.data?.message || "Something went wrong");
//         }
//       } catch (err: any) {
//         toast.error(err?.message || "Something went wrong");
//         setError(err?.message || "Something went wrong");
//       } finally {
//         setLoading(false);
//       }
//     }
//     // When box cleared → reload full data
//     else if (value.length === 0) {
//       fetchData();
//     }
//   };

//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <h2 className="text-xl font-semibold mb-4">Nifty Bank Instruments</h2>

//       <div className="flex justify-end mb-4 gap-4">
//         <div className="w-full sm:w-80">
//           <input
//             type="text"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             onKeyUp={handleKeyUp}
//             placeholder="Search symbol (min 3 chars)"
//             className="border p-2 w-full rounded"
//           />
//         </div>
//         <div>
//           <button
//             className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
//             onClick={handleExcelDownload}
//           >
//             Excel Download
//           </button>
//         </div>
//       </div>

//       {loading && <p>Loading data...</p>}
//       {error && <p className="text-red-500">{error}</p>}
//       {!loading && !error && data.length === 0 && (
//         <p>No data found for "Nifty Bank"</p>
//       )}

//       {/* AG Grid table */}
// {data.length > 0 && (
//   <div className="ag-theme-quartz compact-grid" style={{ height: 540, width: "100%" }}>
//     <AgGridReact
//       rowData={data}
//       columnDefs={columnDefs}
//       defaultColDef={defaultColDef}
//       animateRows
//       rowSelection="single"
//       pagination
//       paginationPageSize={10000}
//       rowHeight={34}  // 🔥 Compact professional height
//       suppressFieldDotNotation
//       onGridReady={onGridReady}
//     />
//   </div>
// )}
//       {/* Modal Form */}
//       {showForm && selectedItem && (
//         <div className="fixed inset-0 bg-backdrop-md bg-opacity-50 flex items-center justify-center z-9999">
//           <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
//             <h3 className="text-lg font-semibold mb-4 text-center">
//               {getTrasectionType} Order — {selectedItem.name}
//             </h3>

//             {/* <form onSubmit={handleSubmit} className="space-y-4"> */}
//                   <form onSubmit={handleSubmitMultiple} className="space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium">Token</label>
//                   <input
//                     type="text"
//                     value={selectedItem.token}
//                     readOnly
//                     className="border p-2 w-full rounded bg-gray-100"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">Exchange</label>
//                   <input
//                     type="text"
//                     value={selectedItem.exch_seg}
//                     readOnly
//                     className="border p-2 w-full rounded bg-gray-100"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">Symbol</label>
//                   <input
//                     type="text"
//                     value={selectedItem.symbol}
//                     readOnly
//                     className="border p-2 w-full rounded bg-gray-100"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">
//                     Require Fund
//                   </label>
//                   <input
//                     type="text"
//                     value={Number(selectedItem.totalPrice).toFixed(2)}
//                     className="border p-2 w-full rounded bg-gray-100"
//                     readOnly
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">Quantity</label>
//                   <input
//                     type="text"
//                     value={selectedItem.lotsize}
//                     onChange={(e) =>
//                       setSelectedItem({
//                         ...selectedItem,
//                         lotsize: e.target.value,
//                         totalPrice:
//                           Number(e.target.value) * Number(getPrice || 0),
//                         actualQuantity:
//                           Number(e.target.value) / Number(getslotSIze || 1),
//                       })
//                     }
//                     className="border p-2 w-full rounded bg-gray-100"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">Price</label>
//                   <input
//                     type="text"
//                     value={Number(selectedItem.price).toFixed(2)}
//                     className="border p-2 w-full rounded bg-gray-100"
//                     readOnly
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">
//                     Order Type
//                   </label>
//                   <select
//                     value={orderType}
//                     onChange={(e) => setOrderType(e.target.value)}
//                     required
//                     className="border p-2 w-full rounded bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value="">Select Order Type</option>
//                     <option value="MARKET">MARKET</option>
//                     <option value="LIMIT">LIMIT</option>
//                     <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT</option>
//                     <option value="STOPLOSS_MARKET">STOPLOSS_MARKET</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">Duration</label>
//                   <select
//                     value={duration}
//                     onChange={(e) => setDuration(e.target.value)}
//                     required
//                     className="border p-2 w-full rounded bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value="">Select Duration</option>
//                     <option value="DAY">DAY</option>
//                     <option value="IOC">IOC</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">Variety</label>
//                   <select
//                     value={variety}
//                     onChange={(e) => setVariety(e.target.value)}
//                     required
//                     className="border p-2 w-full rounded bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value="">Select Variety</option>
//                     <option value="NORMAL">NORMAL</option>
//                     <option value="STOPLOSS">STOPLOSS</option>
//                     <option value="ROBO">ROBO</option>
//                   </select>
//                 </div>

//                 {/* Radio Buttons Section */}
//                 <div className="mt-3">
//                   <label className="block text-sm font-medium mb-1">
//                     Product Type
//                   </label>
//                   <div className="flex items-center gap-4">
//                     <label className="flex items-center gap-2">
//                       <input
//                         type="radio"
//                         name="productType"
//                         value="INTRADAY"
//                         checked={selectedItem.productType === "INTRADAY"}
//                         onChange={(e) =>
//                           setSelectedItem({
//                             ...selectedItem,
//                             productType: e.target.value,
//                           })
//                         }
//                       />
//                       <span>IntraDay MIS</span>
//                     </label>

//                     <label className="flex items-center gap-2">
//                       <input
//                         type="radio"
//                         name="productType"
//                         value="DELIVERY"
//                         checked={selectedItem.productType === "DELIVERY"}
//                         onChange={(e) =>
//                           setSelectedItem({
//                             ...selectedItem,
//                             productType: e.target.value,
//                           })
//                         }
//                       />
//                       <span>Longterm CNC</span>
//                     </label>

//                      {/* 🔽 Strategy Dropdown */}
     

        
//                   </div>
//                 </div>
//                    <div>
//           <label className="block text-sm mb-1">Select Strategy *</label>
//           <select
//             className="w-full border rounded px-3 py-2"
//             value={selectedStrategyId}
//             onChange={(e) => {
//               const strategyId = e.target.value;
//               setSelectedStrategyId(strategyId);

//               // Auto-fill fields
//               const selected:any = strategyList.find((s: any) => s.id == strategyId);
//               if (selected) {
//                 setGroupName(selected.strategyName);
               
//               }
//             }}
//           >
          
//             {strategyList.map((s: any) => (
//               <option value={s.id} key={s.id}>
//                 {/* {s.strategyName} — {s.strategyDis.slice(0, 20)}... */}
//                    {s.strategyName}
//               </option>
//             ))}
//           </select>
//         </div>
//               </div>

//               <div className="flex justify-end mt-6 gap-4">
//                 <button
//                   type="button"
//                   onClick={() => setShowForm(false)}
//                   className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
//                 >
//                   Cancel
//                 </button>

//                 <button
//                   type="submit"
//                   className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg"
//                 >
//                   Submit Order
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }









// import { useState, useEffect, useRef, useMemo } from "react";
// import axios from "axios";
// // import * as XLSX from "xlsx";
// import { toast } from "react-toastify";

// import { ModuleRegistry } from "ag-grid-community";
// import { AllCommunityModule } from "ag-grid-community";
// ModuleRegistry.registerModules([AllCommunityModule]);

// import { AgGridReact } from "ag-grid-react";
// import type {
//   ColDef,
//   GridApi,
//   GridReadyEvent,
//   // ICellRendererParams,
// } from "ag-grid-community";

// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-quartz.css";

// export default function InstrumentFormAdmin() {


//   const apiUrl = import.meta.env.VITE_API_URL;

//   const [data, setData] = useState<any[]>([]);

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");


//   const [getslotSIze, setSlotSIze] = useState("");



//   const [duration, setDuration] = useState("DAY");
//   const [orderType, setOrderType] = useState("MARKET");
//   const [variety, setVariety] = useState("NORMAL");


//   const [searchTerm, setSearchTerm] = useState("");
//   const [debouncedSearch, setDebouncedSearch] = useState("");



//   const gridApiRef = useRef<GridApi | null>(null);

//   const [groupName, setGroupName] = useState("");

//   const [strategyList, setStrategyList] = useState<any[]>([]);
//   const [selectedStrategyId, setSelectedStrategyId] = useState("");

//   // ------ Add/Edit Scrip modal state ------
//   const [scriptModalOpen, setScriptModalOpen] = useState(false);
//   const [scriptSearch, setScriptSearch] = useState("");
//   const [scriptExpiryFilter, setScriptExpiryFilter] = useState("");
//   const [scriptOptionFilter, setScriptOptionFilter] = useState<"" | "CE" | "PE">(
//     ""
//   );
//   const [selectedScriptRow, setSelectedScriptRow] = useState<any | null>(null);
//   const [chartSymbolSearch, setChartSymbolSearch] = useState("");
//   const [scriptTxnType, setScriptTxnType] = useState<"" | "BUY" | "SELL">("BUY");
//   const [scriptProductType, setScriptProductType] = useState<
//       "" | "INTRADAY" | "DELIVERY"
//     >("");


//   // ---------- Simple includes-based matcher for main grid ----------
//   const rowMatchesQuery = (row: any, rawQuery: string) => {
//     const q = rawQuery.toUpperCase();
//     if (!q) return true;

//     const symbol = String(row.symbol || "").toUpperCase();
//     const name = String(row.name || "").toUpperCase();
//     const token = String(row.token ?? "");
//     const syType = String(row.syType || "").toUpperCase();

//     return (
//       symbol.includes(q) ||
//       name.includes(q) ||
//       token.includes(q) ||
//       syType.includes(q)
//     );
//   };

//   // ---------- Parse option symbol (NIFTY02DEC2525800PE) ----------
//   const parseOptionMeta = (symbolRaw: any) => {
//     const symbol = String(symbolRaw || "").toUpperCase();
//     const re = /^([A-Z]+)(\d{2})([A-Z]{3})(\d{2})(\d+)(CE|PE)$/;
//     const m = symbol.match(re);
//     if (!m) return null;

//     const [, underlying, dd, monStr, yy, strike, optType] = m;
//     const monthMap: Record<string, number> = {
//       JAN: 0,
//       FEB: 1,
//       MAR: 2,
//       APR: 3,
//       MAY: 4,
//       JUN: 5,
//       JUL: 6,
//       AUG: 7,
//       SEP: 8,
//       OCT: 9,
//       NOV: 10,
//       DEC: 11,
//     };
//     const monthIndex = monthMap[monStr];
//     if (monthIndex === undefined) return null;

//     const year = 2000 + Number(yy);
//     const day = Number(dd);
//     const dateObj = new Date(year, monthIndex, day);

//     const expiryLabel = `${dd}-${monStr}-${year}`;

//     return {
//       underlying,
//       expiryLabel,
//       expiryDate: dateObj,
//       strike: Number(strike),
//       optionType: optType as "CE" | "PE",
//     };
//   };

//   // ---------- Fetch instruments ----------
//   const fetchData = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const res = await axios.get(`${apiUrl}/kite/instrument`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });

//       if (res?.data?.status === true) {
//         const allData = res?.data?.data || [];
       
        
        
//         setData(allData);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       toast.error(err?.message || "Something went wrong");
//       setError(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//     fetchStrategies()
//     setSearchTerm("")
//   }, []);

//   // ---------- Strategies ----------
//   const fetchStrategies = async () => {
//     try {
//       const res = await axios.get(`${apiUrl}/admin/strategies`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID"),
//         },
//       });

//       if (res.data.status === true) {
//         setStrategyList(res.data.data || []);
//       } else {
//         toast.error(res.data.message);
//       }
//     } catch (err: any) {
//       toast.error(err.message);
//     }
//   };





//   // ---------- Open Add/Edit Scrip modal ----------
//   const handleOpenScriptModal = (row: any) => {
//     // setSelectedScriptRow(row);
//     setSelectedScriptRow({});
//     setScriptModalOpen(true);
//     setScriptSearch(row.symbol || "");
//     setChartSymbolSearch("");
//   };

//   // ---------- AG Grid ----------
//   const columnDefs = useMemo<ColDef[]>(
//     () => [
//       { headerName: "Token", field: "token", minWidth: 60 },
//       { headerName: "Type", field: "syType", minWidth: 60 },
//       {
//         headerName: "Symbol",
//         field: "symbol",
//         minWidth: 250,
//         filter: "agTextColumnFilter",
//       },
//       { headerName: "Name", field: "name", minWidth: 120 },
//       { headerName: "Instrument", field: "instrumenttype", minWidth: 120 },
//       { headerName: "Lot-Size", field: "lotsize", width: 110 },
//     ],
//     []
//   );

//   const defaultColDef = useMemo<ColDef>(
//     () => ({
//       sortable: true,
//       resizable: true,
//       filter: true,
//       floatingFilter: true,
//     }),
//     []
//   );

//   const onGridReady = (e: GridReadyEvent) => {
//     gridApiRef.current = e.api;
//     e.api.sizeColumnsToFit();
//   };



//   // ---------- Excel ----------
  

//   // ---------- Debounced search (main grid) ----------
//   useEffect(() => {
//     const id = setTimeout(() => setDebouncedSearch(searchTerm), 150);
//     return () => clearTimeout(id);
//   }, [searchTerm]);

//   const filteredData = useMemo(() => {
//     if (!debouncedSearch.trim()) return data;
//     return data.filter((row) => rowMatchesQuery(row, debouncedSearch));
//   }, [data, debouncedSearch]);

//   // ---------- Expiry dropdown: today → today + N months ----------
//   const allExpiryOptions = useMemo(() => {
//     // 🔧 change this to 3 / 4 etc for different ranges
//     const MONTH_RANGE = 6;

//     const now = new Date();
//     const startOfToday = new Date(
//       now.getFullYear(),
//       now.getMonth(),
//       now.getDate()
//     );

//     const maxDate = new Date(
//       startOfToday.getFullYear(),
//       startOfToday.getMonth() + MONTH_RANGE,
//       startOfToday.getDate()
//     );

//     const map = new Map<string, Date>();

//     data.forEach((row) => {
//       const meta = parseOptionMeta(row.symbol);
//       if (!meta) return;

//       const d = meta.expiryDate;
//       if (d >= startOfToday && d <= maxDate) {
//         if (!map.has(meta.expiryLabel)) {
//           map.set(meta.expiryLabel, d);
//         }
//       }
//     });

//     return Array.from(map.entries())
//       .sort((a, b) => a[1].getTime() - b[1].getTime())
//       .map(([label]) => label);
//   }, [data]);

//   // ---------- Filter rows in Add/Edit Scrip modal ----------
//   const scriptFilteredRows = useMemo(() => {
//     let rows = data;

//     // text search on name/symbol
//     const q = scriptSearch.trim().toUpperCase();
//     if (q) {
//       rows = rows.filter((row) => {
//         const symbol = String(row.symbol || "").toUpperCase();
//         const name = String(row.name || "").toUpperCase();
//         return symbol.includes(q) || name.includes(q);
//       });
//     }

//     // strike (ChartSymbol) search
//     const strikeQ = chartSymbolSearch.trim();
//     if (strikeQ) {
//       rows = rows.filter((row) => {
//         const meta = parseOptionMeta(row.symbol);
//         if (!meta) return false;
//         return meta.strike.toString().includes(strikeQ);
//       });
//     }

//     // expiry filter (already filtered to next N months in allExpiryOptions)
//     if (scriptExpiryFilter) {
//       rows = rows.filter((row) => {
//         const meta = parseOptionMeta(row.symbol);
//         if (!meta) return false;
//         return meta.expiryLabel === scriptExpiryFilter;
//       });
//     }

//     // option type filter
//     if (scriptOptionFilter) {
//       rows = rows.filter((row) => {
//         const meta = parseOptionMeta(row.symbol);
//         if (!meta) return false;
//         return meta.optionType === scriptOptionFilter;
//       });
//     }

//     return rows.slice(0, 300);
//   }, [data, scriptSearch, scriptExpiryFilter, scriptOptionFilter, chartSymbolSearch]);




//   const handleScriptSave = async () => {

//   if (!selectedScriptRow) {
//     toast.error("Please select a scrip from the list");
//     return;
//   }

//   const payload = {
//     // From selected row
//     token: selectedScriptRow.token,
//     symbol: selectedScriptRow.symbol,
//     name: selectedScriptRow.name,
//     exch_seg: selectedScriptRow.exch_seg,
//     lotsize: selectedScriptRow.lotsize,
//     instrumenttype: selectedScriptRow.instrumenttype,
//     price: selectedScriptRow.price,
//     quantity: selectedScriptRow.lotsize,
//     transactiontype: scriptTxnType,
//     duration,
//     orderType,
//     variety,
//     productType: scriptProductType,
//     totalPrice:selectedScriptRow.price* selectedScriptRow.lotsize,
//     actualQuantity:
//     Number(selectedScriptRow.lotsize) / Number(getslotSIze || 1),
//     searchText: scriptSearch || "",
//     chartSymbol: chartSymbolSearch || "",
//     optionType: scriptOptionFilter || "",     // CE / PE / ALL
//     expiry: scriptExpiryFilter || "",         // selected expiry
//     strategyId: selectedStrategyId || "",
//     groupName: groupName,
//   };


  
 
//       try {
//       const res = await axios.post(
//         `${apiUrl}/admin/multiple/place/order`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         }
//       );

//       if (res?.data?.status === true) {
//         alert(res?.data?.message);
//         setVariety("NORMAL");
//         setDuration("DAY");
//         setOrderType("MARKET");
//         setScriptModalOpen(false);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       toast.error(err.message || "Something went wrong");
//     }



  

// };

// const handleSelectionInstrument = async(raw:any) => {
    
//     const payload = {
//       exchange: raw.exch_seg,
//       tradingsymbol: raw.symbol,
//       symboltoken: raw.token,
//     };

    
//       await fetchStrategies();

//       const res = await axios.post(
//         `${apiUrl}/agnelone/instrument/ltp`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//             AngelOneToken: localStorage.getItem("angel_token") || "",
//             userid: localStorage.getItem("userID"),
//           },
//         }
//       );

//       if (res?.data?.status === true) {
        
//        raw.price = res?.data?.data.data.ltp

//        setSlotSIze(raw.lotsize)

//       setSelectedScriptRow({ ...raw })
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//   }


//   // ---------- JSX ----------
//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <h2 className="text-xl font-semibold mb-4">Nifty Bank Instruments</h2>

    
//      <div className="flex justify-between items-center mb-4 gap-4">
//         <div className="w-full sm:w-80">
//           {/* Search box on left */}
//         <div className="w-full sm:w-80">
//           <input
//             type="text"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             placeholder='Search (e.g. "NIFTY02DEC2525800PE" or "NIFTY")'
//             className="border p-2 w-full rounded"
//           />
//         </div>
//         </div>
//         <div>
//           <button
//             className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
//             onClick={handleOpenScriptModal}
//           >
//            Add/Edit
//           </button>
//         </div>
//       </div>


//       {loading && <p>Loading data...</p>}
//       {error && <p className="text-red-500">{error}</p>}
//       {!loading && !error && filteredData.length === 0 && (
//         <p>No data found.</p>
//       )}

//       {filteredData.length > 0 && (
//         <div
//           className="ag-theme-quartz compact-grid"
//           style={{ height: 540, width: "100%" }}
//         >
//           <AgGridReact
//             rowData={filteredData}
//             columnDefs={columnDefs}
//             defaultColDef={defaultColDef}
//             animateRows
//             rowSelection="single"
//             pagination
//             paginationPageSize={10000}
//             rowHeight={34}
//             suppressFieldDotNotation
//             onGridReady={onGridReady}
//           />
//         </div>
//       )}

    

//       {/* ADD/EDIT SCRIP MODAL */}
// {scriptModalOpen && (
//   <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999999]">
//     <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl mx-3">
//       {/* Make inner content scrollable so it doesn't overlap header */}
//       <div className="max-h-[90vh] overflow-y-auto p-6">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-4">
//           <h3 className="text-lg font-semibold">Add / Edit Scrip</h3>
//           <button
//             onClick={() => setScriptModalOpen(false)}
//             className="text-gray-500 hover:text-black text-xl leading-none"
//           >
//             ×
//           </button>
//         </div>

//         {/* SECTION 1: Selected scrip & search */}
//         <div className="border border-gray-200 rounded-lg p-4 mb-6">
//           <h4 className="text-sm font-semibold text-gray-700 mb-3">
//             Scrip Details & Search
//           </h4>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1">
//                 Terminal Symbol
//               </label>
//               <input
//                 type="text"
//                 value={selectedScriptRow?.symbol || ""}
//                 readOnly
//                 className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//               />
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1">
//                 Last Traded Price
//               </label>
//               <input
//                 type="text"
//                 value={selectedScriptRow?.price || ""}
//                 readOnly
//                 className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//               />
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1">
//                 Search Name / Symbol / CE / PE
//               </label>
//               <input
//                 type="text"
//                 value={scriptSearch}
//                 onChange={(e) => setScriptSearch(e.target.value)}
//                 placeholder="e.g. NIFTY 25800 CE"
//                 className="border rounded px-3 py-2 w-full text-sm"
//               />
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1">
//                 Chart Symbol (Strike)
//               </label>
//               <input
//                 type="text"
//                 placeholder="e.g. 25800"
//                 value={chartSymbolSearch}
//                 onChange={(e) => setChartSymbolSearch(e.target.value)}
//                 className="border rounded px-3 py-2 w-full text-sm"
//               />
//             </div>
//           </div>
//         </div>

//         {/* SECTION 2: Filters & basic order settings */}
//         <div className="border border-gray-200 rounded-lg p-4 mb-6">
//           <h4 className="text-sm font-semibold text-gray-700 mb-3">
//             Filters & Order Settings
//           </h4>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1">
//                 Option Type
//               </label>
//               <select
//                 value={scriptOptionFilter}
//                 onChange={(e) =>
//                   setScriptOptionFilter(e.target.value as "" | "CE" | "PE")
//                 }
//                 className="border rounded px-3 py-2 w-full text-sm"
//               >
//                 <option value="">ALL</option>
//                 <option value="CE">CE (Call)</option>
//                 <option value="PE">PE (Put)</option>
//               </select>
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1">
//                 Expiry (next 6 months)
//               </label>
//               <select
//                 value={scriptExpiryFilter}
//                 onChange={(e) => setScriptExpiryFilter(e.target.value)}
//                 className="border rounded px-3 py-2 w-full text-sm"
//               >
//                 <option value="">All Expiries</option>
//                 {allExpiryOptions.map((exp) => (
//                   <option key={exp} value={exp}>
//                     {exp}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1">
//                 Transaction Type
//               </label>
//               <select
//                 value={scriptTxnType}
//                 onChange={(e) =>
//                   setScriptTxnType(e.target.value as "" | "BUY" | "SELL")
//                 }
//                 className="border rounded px-3 py-2 w-full text-sm"
//               >
//                 <option value="BUY">BUY</option>
//                 <option value="SELL">SELL</option>
//               </select>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1">
//                 Order Type
//               </label>
//               <select
//                 value={orderType}
//                 onChange={(e) => setOrderType(e.target.value)}
//                 required
//                 className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="">Select Order Type</option>
//                 <option value="MARKET">MARKET</option>
//                 <option value="LIMIT">LIMIT</option>
//                 <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT</option>
//                 <option value="STOPLOSS_MARKET">STOPLOSS_MARKET</option>
//               </select>
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1">
//                 Duration
//               </label>
//               <select
//                 value={duration}
//                 onChange={(e) => setDuration(e.target.value)}
//                 required
//                 className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="">Select Duration</option>
//                 <option value="DAY">DAY</option>
//                 <option value="IOC">IOC</option>
//               </select>
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1">
//                 Variety
//               </label>
//               <select
//                 value={variety}
//                 onChange={(e) => setVariety(e.target.value)}
//                 required
//                 className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="">Select Variety</option>
//                 <option value="NORMAL">NORMAL</option>
//                 <option value="STOPLOSS">STOPLOSS</option>
//                 <option value="ROBO">ROBO</option>
//               </select>
//             </div>
//           </div>
//         </div>

//       <div className="border border-gray-200 rounded-lg p-4 mb-6">
//   <h4 className="text-sm font-semibold text-gray-700 mb-3">
//     Product & Strategy
//   </h4>

//   {/* 1 column on mobile, 3 columns from md+ */}
//   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//     <div>
//       <label className="block text-xs font-medium text-gray-600 mb-1">
//         Product Type
//       </label>
//       <select
//         value={scriptProductType}
//         onChange={(e) =>
//           setScriptProductType(
//             e.target.value as "" | "INTRADAY" | "DELIVERY"
//           )
//         }
//         className="border rounded px-3 py-2 w-full text-sm"
//       >
//         <option value="">Select</option>
//         <option value="INTRADAY">IntraDay MIS</option>
//         <option value="DELIVERY">Longterm CNC</option>
//       </select>
//     </div>

//   <div>
//   <label className="block text-xs font-medium text-gray-600 mb-1">
//     Quantity in Lot
//   </label>
//   <input
//     type="number"
//     placeholder="Enter Quantity in Lot"
//     value={selectedScriptRow?.lotsize || ""}
//     onChange={(e) =>
//       setSelectedScriptRow((prev:any) => ({
//         ...prev,
//         lotsize: e.target.value
//       }))
//     }
//     className="border rounded px-3 py-2 w-full text-sm bg-white focus:ring-2 focus:ring-blue-500"
//   />
// </div>
//     <div>
//       <label className="block text-xs font-medium text-gray-600 mb-1">
//         Select Strategy *
//       </label>
//       <select
//         className="w-full border rounded px-3 py-2 text-sm"
//         value={selectedStrategyId}
//         onChange={(e) => {
//           const strategyId = e.target.value;
//           setSelectedStrategyId(strategyId);
//           const selected: any = strategyList.find(
//             (s: any) => s.id == strategyId
//           );
//           if (selected) {
//             setGroupName(selected.strategyName);
//           } else {
//             setGroupName("");
//           }
//         }}
//       >
//         <option value="">Select Strategy</option>
//         {strategyList.map((s: any) => (
//           <option value={s.id} key={s.id}>
//             {s.strategyName}
//           </option>
//         ))}
//       </select>
//     </div>
//   </div>
// </div>

//         {/* SECTION 4: Result list */}
//         <div className="border border-gray-200 rounded-lg mb-6">
//           <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
//             <span className="text-xs font-semibold text-gray-600">
//               Search Results (click to select)
//             </span>
//           </div>
//           <div className="max-h-64 overflow-auto">
//             <table className="w-full text-sm">
//               <thead className="bg-gray-100 sticky top-0">
//                 <tr>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                     Symbol
//                   </th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                     Name
//                   </th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                     Token
//                   </th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                     Lot
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {scriptFilteredRows.map((row) => (
//                   <tr
//                     key={`${row.token}-${row.symbol}`}
//                     className={`cursor-pointer transition-colors ${
//                       selectedScriptRow?.token === row.token
//                         ? "bg-purple-100"
//                         : "hover:bg-purple-50"
//                     }`}
//                     onClick={() => handleSelectionInstrument(row)}
//                   >
//                     <td className="px-3 py-1">{row.symbol}</td>
//                     <td className="px-3 py-1">{row.name}</td>
//                     <td className="px-3 py-1">{row.token}</td>
//                     <td className="px-3 py-1">{row.lotsize}</td>
//                   </tr>
//                 ))}

//                 {scriptFilteredRows.length === 0 && (
//                   <tr>
//                     <td className="px-3 py-3 text-center text-gray-500" colSpan={4}>
//                       No matching scrips found.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Footer buttons */}
//         <div className="flex justify-end gap-3">
//           <button
//             onClick={() => {
//               setScriptSearch("");
//               setScriptExpiryFilter("");
//               setScriptOptionFilter("");
//               setChartSymbolSearch("");
//               setSelectedScriptRow(null);
//               setScriptTxnType("BUY");
//               setScriptProductType("");
//               setSelectedStrategyId("");
//               setGroupName("");
//             }}
//             className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded text-sm"
//           >
//             Reset
//           </button>

//           <button
//             onClick={() => setScriptModalOpen(false)}
//             className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded text-sm"
//           >
//             Close
//           </button>

//           <button
//             onClick={handleScriptSave}
//             className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded text-sm font-medium"
//           >
//             Save changes
//           </button>
//         </div>
//       </div>
//     </div>
//   </div>
// )}


//     </div>
//   );
// }






//  Final Code

// import { useState, useEffect, useRef, useMemo } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { ModuleRegistry } from "ag-grid-community";
// import { AllCommunityModule } from "ag-grid-community";
// ModuleRegistry.registerModules([AllCommunityModule]);
// import { AgGridReact } from "ag-grid-react";
// import type { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";
// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-quartz.css";

// export default function InstrumentFormAdmin() {
//   const apiUrl = import.meta.env.VITE_API_URL;
//   const [data, setData] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [getslotSIze, setSlotSIze] = useState("");
//   const [duration, setDuration] = useState("DAY");
//   const [orderType, setOrderType] = useState("MARKET");
//   const [variety, setVariety] = useState("NORMAL");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [debouncedSearch, setDebouncedSearch] = useState("");
//   const gridApiRef = useRef<GridApi | null>(null);
//   const [groupName, setGroupName] = useState("");
//   const [strategyList, setStrategyList] = useState<any[]>([]);
//   const [selectedStrategyId, setSelectedStrategyId] = useState("");
//   // ------ Add/Edit Scrip modal state ------
//   const [scriptModalOpen, setScriptModalOpen] = useState(false);
//   const [scriptSearch, setScriptSearch] = useState("");
//   const [scriptExpiryFilter, setScriptExpiryFilter] = useState("");
//   const [scriptOptionFilter, setScriptOptionFilter] = useState<"" | "CE" | "PE">("");
//   const [selectedScriptRow, setSelectedScriptRow] = useState<any | null>(null);
//   const [chartSymbolSearch, setChartSymbolSearch] = useState("");
//   const [scriptTxnType, setScriptTxnType] = useState<"" | "BUY" | "SELL">("BUY");
//   const [scriptProductType, setScriptProductType] = useState<"" | "INTRADAY" | "DELIVERY">("");

//   // ---------- Simple includes-based matcher for main grid ----------
//   const rowMatchesQuery = (row: any, rawQuery: string) => {
//     const q = rawQuery.toUpperCase();
//     if (!q) return true;
//     const symbol = String(row.symbol || "").toUpperCase();
//     const name = String(row.name || "").toUpperCase();
//     const token = String(row.token ?? "");
//     const syType = String(row.syType || "").toUpperCase();
//     return (
//       symbol.includes(q) ||
//       name.includes(q) ||
//       token.includes(q) ||
//       syType.includes(q)
//     );
//   };

//   // ---------- Parse option symbol (NIFTY02DEC2525800PE) ----------
//   const parseOptionMeta = (symbolRaw: any) => {
//     const symbol = String(symbolRaw || "").toUpperCase();
//     const re = /^([A-Z]+)(\d{2})([A-Z]{3})(\d{2})(\d+)(CE|PE)$/;
//     const m = symbol.match(re);
//     if (!m) return null;
//     const [, underlying, dd, monStr, yy, strike, optType] = m;
//     const monthMap: Record<string, number> = {
//       JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
//       JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
//     };
//     const monthIndex = monthMap[monStr];
//     if (monthIndex === undefined) return null;
//     const year = 2000 + Number(yy);
//     const day = Number(dd);
//     const dateObj = new Date(year, monthIndex, day);
//     const expiryLabel = `${dd}-${monStr}-${year}`;
//     return {
//       underlying,
//       expiryLabel,
//       expiryDate: dateObj,
//       strike: Number(strike),
//       optionType: optType as "CE" | "PE",
//     };
//   };

//   // ---------- Fetch instruments ----------
//   const fetchData = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const res = await axios.get(`${apiUrl}/agnelone/instrument`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });
//       if (res?.data?.status === true) {
//         const allData = res?.data?.data || [];
//         setData(allData);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       toast.error(err?.message || "Something went wrong");
//       setError(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------- Strategies ----------
//   const fetchStrategies = async () => {
//     try {
//       const res = await axios.get(`${apiUrl}/admin/strategies`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID"),
//         },
//       });
//       if (res.data.status === true) {
//         setStrategyList(res.data.data || []);
//       } else {
//         toast.error(res.data.message);
//       }
//     } catch (err: any) {
//       toast.error(err.message);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//     fetchStrategies();
//     setSearchTerm("");
//   }, []);

//   // ---------- Open Add/Edit Scrip modal ----------
//   const handleOpenScriptModal = () => {
//     setSelectedScriptRow(null);
//     setScriptModalOpen(true);
//     setScriptSearch("");
//     setChartSymbolSearch("");
//     setScriptExpiryFilter("");
//     setScriptOptionFilter("");
//     setScriptTxnType("BUY");
//     setScriptProductType("");
//     setSelectedStrategyId("");
//     setGroupName("");
//   };

//   // ---------- AG Grid ----------
//   const columnDefs = useMemo<ColDef[]>(
//     () => [
//       { headerName: "Token", field: "token", minWidth: 60 },
//       { headerName: "Type", field: "syType", minWidth: 60 },
//       {
//         headerName: "Symbol",
//         field: "symbol",
//         minWidth: 250,
//         filter: "agTextColumnFilter",
//       },
//       { headerName: "Name", field: "name", minWidth: 120 },
//       { headerName: "Instrument", field: "instrumenttype", minWidth: 120 },
//       { headerName: "Lot-Size", field: "lotsize", width: 110 },
//     ],
//     []
//   );

//   const defaultColDef = useMemo<ColDef>(
//     () => ({
//       sortable: true,
//       resizable: true,
//       filter: true,
//       floatingFilter: true,
//     }),
//     []
//   );

//   const onGridReady = (e: GridReadyEvent) => {
//     gridApiRef.current = e.api;
//     e.api.sizeColumnsToFit();
//   };

//   // ---------- Debounced search (main grid) ----------
//   useEffect(() => {
//     const id = setTimeout(() => setDebouncedSearch(searchTerm), 150);
//     return () => clearTimeout(id);
//   }, [searchTerm]);

//   const filteredData = useMemo(() => {
//     if (!debouncedSearch.trim()) return data;
//     return data.filter((row) => rowMatchesQuery(row, debouncedSearch));
//   }, [data, debouncedSearch]);

//   // ---------- Expiry dropdown: today → today + N months ----------
//   const allExpiryOptions = useMemo(() => {
//     const MONTH_RANGE = 6;
//     const now = new Date();
//     const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//     const maxDate = new Date(
//       startOfToday.getFullYear(),
//       startOfToday.getMonth() + MONTH_RANGE,
//       startOfToday.getDate()
//     );
//     const map = new Map<string, Date>();
//     data.forEach((row) => {
//       const meta = parseOptionMeta(row.symbol);
//       if (!meta) return;
//       const d = meta.expiryDate;
//       if (d >= startOfToday && d <= maxDate) {
//         if (!map.has(meta.expiryLabel)) {
//           map.set(meta.expiryLabel, d);
//         }
//       }
//     });
//     return Array.from(map.entries())
//       .sort((a, b) => a[1].getTime() - b[1].getTime())
//       .map(([label]) => label);
//   }, [data]);

//   // ---------- Filter rows in Add/Edit Scrip modal ----------
//   const scriptFilteredRows = useMemo(() => {
//     let rows = data.filter((row) => !!parseOptionMeta(row.symbol));
//     const qRaw = scriptSearch.trim().toUpperCase();
//     const tokens = qRaw.split(/\s+/).filter(Boolean);
//     if (tokens.length > 0) {
//       rows = rows.filter((row) => {
//         const symbol = String(row.symbol || "").toUpperCase();
//         const name = String(row.name || "").toUpperCase();
//         const haystack = `${symbol} ${name}`;
//         return tokens.every((t) => haystack.includes(t));
//       });
//     }
//     const strikeQ = chartSymbolSearch.trim();
//     if (strikeQ) {
//       rows = rows.filter((row) => {
//         const meta = parseOptionMeta(row.symbol);
//         if (!meta) return false;
//         return meta.strike.toString().includes(strikeQ);
//       });
//     }
//     if (scriptExpiryFilter) {
//       rows = rows.filter((row) => {
//         const meta = parseOptionMeta(row.symbol);
//         if (!meta) return false;
//         return meta.expiryLabel === scriptExpiryFilter;
//       });
//     }
//     if (scriptOptionFilter) {
//       rows = rows.filter((row) => {
//         const meta = parseOptionMeta(row.symbol);
//         if (!meta) return false;
//         return meta.optionType === scriptOptionFilter;
//       });
//     }
//     return rows.slice(0, 300);
//   }, [
//     data,
//     scriptSearch,
//     scriptExpiryFilter,
//     scriptOptionFilter,
//     chartSymbolSearch,
//   ]);

//   // ---------- Save and Selection Handlers ----------
//   const handleScriptSave = async () => {
//     if (!selectedScriptRow) {
//       toast.error("Please select a scrip from the list");
//       return;
//     }
//     const lotSizeNum = Number(selectedScriptRow.lotsize || 0);
//     const priceNum = Number(selectedScriptRow.price || 0);
//     const slotSizeNum = Number(getslotSIze || 1);
//     const payload = {
//       token: selectedScriptRow.token,
//       symbol: selectedScriptRow.symbol,
//       name: selectedScriptRow.name,
//       exch_seg: selectedScriptRow.exch_seg,
//       lotsize: lotSizeNum,
//       instrumenttype: selectedScriptRow.instrumenttype,
//       price: priceNum,
//       quantity: lotSizeNum,
//       transactiontype: scriptTxnType,
//       duration,
//       orderType,
//       variety,
//       productType: scriptProductType,
//       totalPrice: priceNum * lotSizeNum,
//       actualQuantity: lotSizeNum / slotSizeNum,
//       searchText: scriptSearch || "",
//       chartSymbol: chartSymbolSearch || "",
//       optionType: scriptOptionFilter || "",
//       expiry: scriptExpiryFilter || "",
//       strategyId: selectedStrategyId || "",
//       groupName: groupName,
//     };
//     try {
//       const res = await axios.post(
//         `${apiUrl}/admin/multiple/place/order`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         }
//       );
//       if (res?.data?.status === true) {
//         alert(res?.data?.message);
//         setVariety("NORMAL");
//         setDuration("DAY");
//         setOrderType("MARKET");
//         setScriptModalOpen(false);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   const handleSelectionInstrument = async (raw: any) => {
//     const payload = {
//       exchange: raw.exch_seg,
//       tradingsymbol: raw.symbol,
//       symboltoken: raw.token,
//     };
//     try {
//       await fetchStrategies();
//       const res = await axios.post(
//         `${apiUrl}/agnelone/instrument/ltp`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//             AngelOneToken: localStorage.getItem("angel_token") || "",
//             userid: localStorage.getItem("userID"),
//           },
//         }
//       );
//       if (res?.data?.status === true) {
//         raw.price = res?.data?.data.data.ltp;
//         setSlotSIze(raw.lotsize);
//         setSelectedScriptRow({ ...raw });
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   // ---------- JSX ----------
//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <h2 className="text-xl font-semibold mb-4">Nifty Bank Instruments</h2>
//       <div className="flex justify-between items-center mb-4 gap-4">
//         <div className="w-full sm:w-80">
//           <input
//             type="text"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             placeholder='Search (e.g. "NIFTY02DEC2525800PE" or "NIFTY")'
//             className="border p-2 w-full rounded"
//           />
//         </div>
//         <div>
//           <button
//             className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
//             onClick={handleOpenScriptModal}
//           >
//             Add/Edit
//           </button>
//         </div>
//       </div>
//       {loading && <p>Loading data...</p>}
//       {error && <p className="text-red-500">{error}</p>}
//       {!loading && !error && filteredData.length === 0 && <p>No data found.</p>}
//       {filteredData.length > 0 && (
//         <div className="ag-theme-quartz compact-grid" style={{ height: 540, width: "100%" }}>
//           <AgGridReact
//             rowData={filteredData}
//             columnDefs={columnDefs}
//             defaultColDef={defaultColDef}
//             animateRows
//             rowSelection="single"
//             pagination
//             paginationPageSize={10000}
//             rowHeight={34}
//             suppressFieldDotNotation
//             onGridReady={onGridReady}
//           />
//         </div>
//       )}
//       {/* ADD/EDIT SCRIP MODAL */}
//       {scriptModalOpen && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999999]">
//           <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl mx-3">
//             <div className="max-h-[90vh] overflow-y-auto p-6">
//               {/* Header */}
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-lg font-semibold">Add / Edit Scrip</h3>
//                 <button
//                   onClick={() => setScriptModalOpen(false)}
//                   className="text-gray-500 hover:text-black text-xl leading-none"
//                 >
//                   ×
//                 </button>
//               </div>
//               {/* SECTION 1: Selected scrip & search */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <h4 className="text-sm font-semibold text-gray-700 mb-3">Scrip Details & Search</h4>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">Terminal Symbol</label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.symbol || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">Last Traded Price</label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.price || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">Search Name / Symbol / CE / PE</label>
//                     <input
//                       type="text"
//                       value={scriptSearch}
//                       onChange={(e) => setScriptSearch(e.target.value)}
//                       placeholder="e.g. NIFTY 26150 CE"
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">Chart Symbol (Strike)</label>
//                     <input
//                       type="text"
//                       placeholder="e.g. 26150"
//                       value={chartSymbolSearch}
//                       onChange={(e) => setChartSymbolSearch(e.target.value)}
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     />
//                   </div>
//                 </div>
//               </div>
//               {/* SECTION 2: Filters & basic order settings */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <h4 className="text-sm font-semibold text-gray-700 mb-3">Filters & Order Settings</h4>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">Option Type</label>
//                     <select
//                       value={scriptOptionFilter}
//                       onChange={(e) => setScriptOptionFilter(e.target.value as "" | "CE" | "PE")}
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">ALL</option>
//                       <option value="CE">CE (Call)</option>
//                       <option value="PE">PE (Put)</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">Expiry (next 6 months)</label>
//                     <select
//                       value={scriptExpiryFilter}
//                       onChange={(e) => setScriptExpiryFilter(e.target.value)}
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">All Expiries</option>
//                       {allExpiryOptions.map((exp) => (
//                         <option key={exp} value={exp}>{exp}</option>
//                       ))}
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">Transaction Type</label>
//                     <select
//                       value={scriptTxnType}
//                       onChange={(e) => setScriptTxnType(e.target.value as "" | "BUY" | "SELL")}
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="BUY">BUY</option>
//                       <option value="SELL">SELL</option>
//                     </select>
//                   </div>
//                 </div>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">Order Type</label>
//                     <select
//                       value={orderType}
//                       onChange={(e) => setOrderType(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Order Type</option>
//                       <option value="MARKET">MARKET</option>
//                       <option value="LIMIT">LIMIT</option>
//                       <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT</option>
//                       <option value="STOPLOSS_MARKET">STOPLOSS_MARKET</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">Duration</label>
//                     <select
//                       value={duration}
//                       onChange={(e) => setDuration(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Duration</option>
//                       <option value="DAY">DAY</option>
//                       <option value="IOC">IOC</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">Variety</label>
//                     <select
//                       value={variety}
//                       onChange={(e) => setVariety(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Variety</option>
//                       <option value="NORMAL">NORMAL</option>
//                       <option value="STOPLOSS">STOPLOSS</option>
//                       <option value="ROBO">ROBO</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>
//               {/* SECTION 3: Product & Strategy */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <h4 className="text-sm font-semibold text-gray-700 mb-3">Product & Strategy</h4>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">Product Type</label>
//                     <select
//                       value={scriptProductType}
//                       onChange={(e) => setScriptProductType(e.target.value as "" | "INTRADAY" | "DELIVERY")}
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">Select</option>
//                       <option value="INTRADAY">IntraDay MIS</option>
//                       <option value="DELIVERY">Longterm CNC</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">Quantity in Lot</label>
//                     <input
//                       type="number"
//                       placeholder="Enter Quantity in Lot"
//                       value={selectedScriptRow?.lotsize || ""}
//                       onChange={(e) => setSelectedScriptRow((prev: any) => ({ ...(prev || {}), lotsize: e.target.value }))}
//                       className="border rounded px-3 py-2 w-full text-sm bg-white focus:ring-2 focus:ring-blue-500"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">Select Strategy *</label>
//                     <select
//                       className="w-full border rounded px-3 py-2 text-sm"
//                       value={selectedStrategyId}
//                       onChange={(e) => {
//                         const strategyId = e.target.value;
//                         setSelectedStrategyId(strategyId);
//                         const selected: any = strategyList.find((s: any) => s.id == strategyId);
//                         if (selected) {
//                           setGroupName(selected.strategyName);
//                         } else {
//                           setGroupName("");
//                         }
//                       }}
//                     >
//                       <option value="">Select Strategy</option>
//                       {strategyList.map((s: any) => (
//                         <option value={s.id} key={s.id}>{s.strategyName}</option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
//               </div>
//               {/* SECTION 4: Result list */}
//               <div className="border border-gray-200 rounded-lg mb-6">
//                 <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
//                   <span className="text-xs font-semibold text-gray-600">Search Results (click to select)</span>
//                 </div>
//                 <div className="max-h-64 overflow-auto">
//                   <table className="w-full text-sm">
//                     <thead className="bg-gray-100 sticky top-0">
//                       <tr>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Symbol</th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Name</th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Token</th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Lot</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {scriptFilteredRows.map((row) => (
//                         <tr
//                           key={`${row.token}-${row.symbol}`}
//                           className={`cursor-pointer transition-colors ${
//                             selectedScriptRow?.token === row.token ? "bg-purple-100" : "hover:bg-purple-50"
//                           }`}
//                           onClick={() => handleSelectionInstrument(row)}
//                         >
//                           <td className="px-3 py-1">{row.symbol}</td>
//                           <td className="px-3 py-1">{row.name}</td>
//                           <td className="px-3 py-1">{row.token}</td>
//                           <td className="px-3 py-1">{row.lotsize}</td>
//                         </tr>
//                       ))}
//                       {scriptFilteredRows.length === 0 && (
//                         <tr>
//                           <td className="px-3 py-3 text-center text-gray-500" colSpan={4}>No matching scrips found.</td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//               {/* Footer buttons */}
//               <div className="flex justify-end gap-3">
//                 <button
//                   onClick={() => {
//                     setScriptSearch("");
//                     setScriptExpiryFilter("");
//                     setScriptOptionFilter("");
//                     setChartSymbolSearch("");
//                     setSelectedScriptRow(null);
//                     setScriptTxnType("BUY");
//                     setScriptProductType("");
//                     setSelectedStrategyId("");
//                     setGroupName("");
//                   }}
//                   className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded text-sm"
//                 >
//                   Reset
//                 </button>
//                 <button
//                   onClick={() => setScriptModalOpen(false)}
//                   className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded text-sm"
//                 >
//                   Close
//                 </button>
//                 <button
//                   onClick={handleScriptSave}
//                   className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded text-sm font-medium"
//                 >
//                   Save changes
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
















//  get both kite and angelone ltp code 


// import { useState, useEffect, useRef, useMemo } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { ModuleRegistry } from "ag-grid-community";
// import { AllCommunityModule } from "ag-grid-community";
// ModuleRegistry.registerModules([AllCommunityModule]);
// import { AgGridReact } from "ag-grid-react";
// import type { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";

// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-quartz.css";

// export default function InstrumentFormAdmin() {
//   const apiUrl = import.meta.env.VITE_API_URL;

//   const [data, setData] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const [getslotSIze, setSlotSIze] = useState("");

//   const [duration, setDuration] = useState("DAY");
//   const [orderType, setOrderType] = useState("MARKET");
//   const [variety, setVariety] = useState("NORMAL");

//   const [searchTerm, setSearchTerm] = useState("");
//   const [debouncedSearch, setDebouncedSearch] = useState("");

//   const gridApiRef = useRef<GridApi | null>(null);

//   const [groupName, setGroupName] = useState("");
//   const [strategyList, setStrategyList] = useState<any[]>([]);
//   const [selectedStrategyId, setSelectedStrategyId] = useState("");

//   const [scriptModalOpen, setScriptModalOpen] = useState(false);
//   const [scriptSearch, setScriptSearch] = useState("");
//   const [scriptExpiryFilter, setScriptExpiryFilter] = useState("");
//   const [scriptOptionFilter, setScriptOptionFilter] = useState<"" | "CE" | "PE">("");
//   const [selectedScriptRow, setSelectedScriptRow] = useState<any | null>(null);
//   const [chartSymbolSearch, setChartSymbolSearch] = useState("");
//   const [scriptTxnType, setScriptTxnType] = useState<"" | "BUY" | "SELL">("BUY");
//   const [scriptProductType, setScriptProductType] = useState<"" | "INTRADAY" | "DELIVERY">("");

//   const [useKite, setUseKite] = useState(false);

//   // ---------- Common expiry normalizer ----------
//   const buildExpiryMeta = (rawExpiry: any) => {
//     if (!rawExpiry) return { expiryDateObj: null, expiryLabel: "" };

//     const s = String(rawExpiry).trim();
//     if (!s) return { expiryDateObj: null, expiryLabel: "" };

//     let d: Date | null = null;

//     // 1) YYYY-MM-DD  (Kite)
//     if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
//       d = new Date(s + "T00:00:00");
//     }
//     // 2) DD-MMM-YYYY / DD-MMM-YY (AngelOne etc.)
//     else if (/^\d{2}-[A-Za-z]{3}-\d{2,4}$/.test(s)) {
//       const [ddStr, monStrRaw, yyStr] = s.split("-");
//       const dd = Number(ddStr);
//       const monStr = monStrRaw.toUpperCase();
//       const monthMap: Record<string, number> = {
//         JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
//         JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
//       };
//       const monthIndex = monthMap[monStr];
//       if (monthIndex !== undefined) {
//         let yearNum = Number(yyStr);
//         if (yyStr.length === 2) {
//           yearNum = 2000 + yearNum;
//         }
//         d = new Date(yearNum, monthIndex, dd);
//       }
//     }
//     // 3) Fallback: native Date parse
//     else {
//       const t = new Date(s);
//       if (!isNaN(t.getTime())) d = t;
//     }

//     if (!d) return { expiryDateObj: null, expiryLabel: "" };

//     const day = d.getDate().toString().padStart(2, "0");
//     const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
//     const label = `${day}-${monthNames[d.getMonth()]}-${d.getFullYear()}`;

//     return { expiryDateObj: d, expiryLabel: label };
//   };

//   // ---------- Parse option symbol (only for strike & CE/PE) ----------
//   // Works for NIFTY02DEC2525800PE, NIFTY25NOV24500CE etc.
//   const parseOptionMeta = (symbolRaw: any) => {
//     const symbol = String(symbolRaw || "").toUpperCase();

//     // e.g. NIFTY02DEC2525800PE  or  NIFTY25NOV24500CE
//     const re = /^([A-Z]+)(\d{2})([A-Z]{3})(\d{2})(\d+)(CE|PE)$/;
//     const m = symbol.match(re);
//     if (!m) return null;

//     const [, underlying, dd, monStr, yy, strike, optType] = m;

//     const monthMap: Record<string, number> = {
//       JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
//       JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
//     };
//     const monthIndex = monthMap[monStr];
//     if (monthIndex === undefined) return null;

//     const year = 2000 + Number(yy);
//     const day = Number(dd);
//     const dateObj = new Date(year, monthIndex, day);

//     const expiryLabel = `${day.toString().padStart(2, "0")}-${monStr}-${year}`;

//     return {
//       underlying,
//       expiryLabel,
//       expiryDate: dateObj,
//       strike: Number(strike),
//       optionType: optType as "CE" | "PE",
//     };
//   };

//   // ⭐ NEW: helper that always tries to extract strike / optionType / expiry
//   const getOptionMeta = (row: any) => {
//     const mainSymbol = row.symbol || row.kiteSymbol || row.angelSymbol || "";
//     const fromSymbol = parseOptionMeta(mainSymbol);
//     if (fromSymbol) return fromSymbol;

//     const name = String(row.name || "").toUpperCase();
//     const optMatch = name.match(/\b(CE|PE)\b/);
//     const strikeMatches = name.match(/(\d+)/g);

//     return {
//       underlying: "",
//       expiryLabel: row.expiryLabel || "",
//       expiryDate: row.expiryDateObj || null,
//       strike: strikeMatches
//         ? Number(strikeMatches[strikeMatches.length - 1])
//         : row.strike || 0,
//       optionType: (optMatch?.[1] as "CE" | "PE") || (row.syType as "CE" | "PE"),
//     };
//   };

//   // ---------- NORMALIZERS (AngelOne & Kite) ----------
//   const mapAngelToCommon = (row: any) => {
//     const { expiryDateObj, expiryLabel } = buildExpiryMeta(row.expiry);

//     return {
//       ...row,
//       token: String(row.token ?? ""),
//       symbol: String(row.symbol ?? ""),
//       name: row.name ?? "",
//       expiry: row.expiry ?? "",
//       strike: row.strike !== undefined ? Number(row.strike) : -1,
//       lotsize: row.lotsize !== undefined ? Number(row.lotsize) : 0,
//       instrumenttype: row.instrumenttype ?? "",
//       exch_seg: row.exch_seg ?? "",
//       tick_size: row.tick_size !== undefined ? Number(row.tick_size) : 0,
//       syType: row.instrumenttype ?? row.syType ?? "",
//       angelToken: String(row.token ?? ""),
//       angelSymbol: String(row.symbol ?? ""),
//       kiteToken: row.kiteToken ?? "",
//       kiteSymbol: row.kiteSymbol ?? "",
//       expiryDateObj,
//       expiryLabel,
//     };
//   };

//   const mapKiteToCommon = (row: any) => {
//     const { expiryDateObj, expiryLabel } = buildExpiryMeta(row.expiry);

//     // Try to derive strike if missing
//     let strike = row.strike;
//     if (!strike) {
//       const metaFromSymbol = parseOptionMeta(row.tradingsymbol);
//       if (metaFromSymbol) {
//         strike = metaFromSymbol.strike;
//       } else {
//         const m = String(row.name || "").match(/\d+/);
//         strike = m ? Number(m[0]) : 0;
//       }
//     }

//     return {
//       ...row,
//       token: String(row.instrument_token ?? ""),
//       symbol: String(row.tradingsymbol ?? ""),
//       name: row.name ?? "",
//       expiry: row.expiry ?? "",
//       strike: Number(strike),
//       lotsize: row.lot_size !== undefined ? Number(row.lot_size) : 0,
//       instrumenttype: row.instrument_type ?? "",
//       exch_seg: row.segment ?? row.exchange ?? "",
//       tick_size: row.tick_size !== undefined ? Number(row.tick_size) : 0,
//       syType: row.instrument_type ?? "",
//       kiteToken: String(row.instrument_token ?? ""),
//       kiteSymbol: String(row.tradingsymbol ?? ""),
//       angelToken: row.angelToken ?? "",
//       angelSymbol: row.angelSymbol ?? "",
//       expiryDateObj,
//       expiryLabel,
//     };
//   };

//   // ---------- Fetch instruments (AngelOne or Kite) ----------
//   const fetchData = async () => {
//     setLoading(true);
//     setError("");

//     try {
//       const endpoint = useKite ? "/kite/instrument" : "/agnelone/instrument";
//       const res = await axios.get(`${apiUrl}${endpoint}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });

//       if (res?.data?.status === true) {
//         const rawData = res?.data?.data || [];

//         const normalized = useKite
//           ? rawData.map((row: any) => mapKiteToCommon(row))
//           : rawData.map((row: any) => mapAngelToCommon(row));

//         setData(normalized);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err?.message || "Something went wrong");
//       setError(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------- Fetch strategies ----------
//   const fetchStrategies = async () => {
//     try {
//       const res = await axios.get(`${apiUrl}/admin/strategies`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID"),
//         },
//       });

//       if (res.data.status === true) {
//         setStrategyList(res.data.data || []);
//       } else {
//         toast.error(res.data.message);
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//     fetchStrategies();
//     setSearchTerm("");
//   }, [useKite]);

//   // ---------- Open Add/Edit Scrip modal ----------
//   const handleOpenScriptModal = () => {
//     setSelectedScriptRow(null);
//     setScriptModalOpen(true);
//     setScriptSearch("");
//     setChartSymbolSearch("");
//     setScriptExpiryFilter("");
//     setScriptOptionFilter("");
//     setScriptTxnType("BUY");
//     setScriptProductType("");
//     setSelectedStrategyId("");
//     setGroupName("");
//   };

//   // ---------- AG Grid ----------
//   const columnDefs = useMemo<ColDef[]>(
//     () => [
//       { headerName: "Token", field: "token", minWidth: 80 },
//       { headerName: "Type", field: "syType", minWidth: 80 },
//       {
//         headerName: "Symbol",
//         field: "symbol",
//         minWidth: 250,
//         filter: "agTextColumnFilter",
//       },
//       { headerName: "Name", field: "name", minWidth: 120 },
//       { headerName: "Instrument", field: "instrumenttype", minWidth: 120 },
//       { headerName: "Lot-Size", field: "lotsize", width: 110 },
//       ...(useKite
//         ? [
//             { headerName: "Kite Token", field: "kiteToken", minWidth: 120 },
//             { headerName: "Kite Symbol", field: "kiteSymbol", minWidth: 180 },
//           ]
//         : [
//             { headerName: "Angel Token", field: "angelToken", minWidth: 120 },
//             { headerName: "Angel Symbol", field: "angelSymbol", minWidth: 180 },
//           ]),
//       { headerName: "Expiry", field: "expiryLabel", minWidth: 130 },
//     ],
//     [useKite]
//   );

//   const defaultColDef = useMemo<ColDef>(
//     () => ({
//       sortable: true,
//       resizable: true,
//       filter: true,
//       floatingFilter: true,
//     }),
//     []
//   );

//   const onGridReady = (e: GridReadyEvent) => {
//     gridApiRef.current = e.api;
//     e.api.sizeColumnsToFit();
//   };

//   // ---------- Debounced search (main grid) ----------
//   useEffect(() => {
//     const id = setTimeout(() => setDebouncedSearch(searchTerm), 150);
//     return () => clearTimeout(id);
//   }, [searchTerm]);

//   const rowMatchesQuery = (row: any, query: string) => {
//     const q = query.trim().toUpperCase();
//     if (!q) return true;

//     const symbol = String(row.symbol || "").toUpperCase();
//     const name = String(row.name || "").toUpperCase();
//     const token = String(row.token || "").toUpperCase();
//     const full = `${symbol} ${name} ${token}`;

//     return full.includes(q);
//   };

//   const filteredData = useMemo(() => {
//     if (!debouncedSearch.trim()) return data;
//     return data.filter((row) => rowMatchesQuery(row, debouncedSearch));
//   }, [data, debouncedSearch]);

//   // ---------- Expiry dropdown: based on expiry or parsed from symbol (today → +6 months) ----------
//   const allExpiryOptions = useMemo(() => {
//     const MONTH_RANGE = 6;
//     const now = new Date();
//     const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//     const maxDate = new Date(
//       startOfToday.getFullYear(),
//       startOfToday.getMonth() + MONTH_RANGE,
//       startOfToday.getDate()
//     );

//     const map = new Map<string, { label: string; date: Date }>();

//     data.forEach((row) => {
//       let d: Date | null = row.expiryDateObj || null;
//       let label: string = row.expiryLabel || "";

//       // ⭐ NEW: fallback to parse from symbol if expiry field was empty
//       if (!d || !label) {
//         const meta = parseOptionMeta(row.symbol || row.kiteSymbol || row.angelSymbol);
//         if (meta) {
//           d = meta.expiryDate;
//           label = meta.expiryLabel;
//         }
//       }

//       if (!d || !label) return;
//       if (d < startOfToday || d > maxDate) return;

//       const key = d.toISOString().slice(0, 10);
//       if (!map.has(key)) {
//         map.set(key, { label, date: d });
//       }
//     });

//     return Array.from(map.entries())
//       .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
//       .map(([key, value]) => ({
//         key,
//         label: value.label,
//       }));
//   }, [data]);

//   // ---------- Filter rows in Add/Edit Scrip modal ----------
//   const scriptFilteredRows = useMemo(() => {
//     let rows = data.filter((row) => {
//       if (useKite) {
//         return row.kiteSymbol && row.kiteToken;
//       } else {
//         return row.angelSymbol && row.angelToken;
//       }
//     });

//     // Search by name/symbol/CE/PE
//     const qRaw = scriptSearch.trim().toUpperCase();
//     const tokens = qRaw.split(/\s+/).filter(Boolean);

//     if (tokens.length > 0) {
//       rows = rows.filter((row) => {
//         const symbol = String(row.symbol || "").toUpperCase();
//         const name = String(row.name || "").toUpperCase();
//         const haystack = `${symbol} ${name}`;
//         return tokens.every((t) => haystack.includes(t));
//       });
//     }

//     // ⭐ UPDATED: Chart Symbol (Strike) filter using getOptionMeta
//     const strikeQ = chartSymbolSearch.trim();
//     if (strikeQ) {
//       rows = rows.filter((row) => {
//         const meta = getOptionMeta(row);
//         const strikeStr = String(meta?.strike ?? row.strike ?? "");
//         return strikeStr.includes(strikeQ);
//       });
//     }

//     // ⭐ UPDATED: Expiry filter uses expiryLabel (from field or parsed)
//     if (scriptExpiryFilter) {
//       rows = rows.filter((row) => {
//         if (row.expiryLabel === scriptExpiryFilter) return true;
//         const meta = getOptionMeta(row);
//         return meta?.expiryLabel === scriptExpiryFilter;
//       });
//     }

//     // ⭐ UPDATED: Option Type filter using getOptionMeta (works for Kite + AngelOne)
//     if (scriptOptionFilter) {
//       rows = rows.filter((row) => {
//         const meta = getOptionMeta(row);
//         return meta && meta.optionType === scriptOptionFilter;
//       });
//     }

//     return rows.slice(0, 300);
//   }, [data, scriptSearch, scriptExpiryFilter, scriptOptionFilter, chartSymbolSearch, useKite]);

//   // ---------- Save ----------
//   const handleScriptSave = async () => {
//     if (!selectedScriptRow) {
//       toast.error("Please select a scrip from the list");
//       return;
//     }

//     const lotSizeNum = Number(selectedScriptRow.lotsize || 0);
//     const priceNum = Number(selectedScriptRow.price || 0);
//     const slotSizeNum = Number(getslotSIze || 1);

//     const payload = {
//       token: selectedScriptRow.token || "",
//       symbol: selectedScriptRow.symbol || "",
//       name: selectedScriptRow.name || "",
//       exch_seg: selectedScriptRow.exch_seg || "",
//       lotsize: lotSizeNum,
//       instrumenttype: selectedScriptRow.instrumenttype || "",
//       price: priceNum,
//       quantity: lotSizeNum,
//       transactiontype: scriptTxnType,
//       duration,
//       orderType,
//       variety,
//       productType: scriptProductType,
//       totalPrice: priceNum * lotSizeNum,
//       actualQuantity: lotSizeNum / slotSizeNum,
//       searchText: scriptSearch || "",
//       chartSymbol: chartSymbolSearch || "",
//       optionType: scriptOptionFilter || "",
//       expiry: selectedScriptRow.expiry || "",
//       expiryLabel: selectedScriptRow.expiryLabel || "",
//       strategyId: selectedStrategyId || "",
//       groupName: groupName,
//       angelToken: selectedScriptRow.angelToken || "",
//       angelSymbol: selectedScriptRow.angelSymbol || "",
//       kiteToken: selectedScriptRow.kiteToken || "",
//       kiteSymbol: selectedScriptRow.kiteSymbol || "",
//     };

//     try {
//       const res = await axios.post(
//         `${apiUrl}/admin/multiple/place/order`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         }
//       );

//       if (res?.data?.status === true) {
//         alert(res?.data?.message);
//         setVariety("NORMAL");
//         setDuration("DAY");
//         setOrderType("MARKET");
//         setScriptModalOpen(false);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   // ---------- Selection Handler ----------
//   const handleSelectionInstrument = async (raw: any) => {
    
//     const payload = {
//       exchange: raw.exch_seg,
//       tradingsymbol: raw.symbol,
//       symboltoken: raw.token,
//     };

//     try {
//       await fetchStrategies();

//       if (useKite) {
//         try {
//           const res = await axios.post(
//             `${apiUrl}/kite/instrument/ltp`,
//             payload,
//             {
//               headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//                 userid: localStorage.getItem("userID"),
//               },
//             }
//           );

//           if (res?.data?.status === true) {
//             const ltp =
//               res?.data?.data?.ltp ||
//               res?.data?.data?.last_price ||
//               raw.last_price ||
//               raw.price ||
//               0;

//             setSelectedScriptRow((prev: any) => ({
//               ...(prev || {}),
//               kiteToken: raw.kiteToken || raw.token,
//               kiteSymbol: raw.kiteSymbol || raw.symbol,
//               angelToken: prev?.angelToken || "",
//               angelSymbol: prev?.angelSymbol || "",
//               token: raw.token,
//               symbol: raw.symbol,
//               name: raw.name,
//               exch_seg: raw.exch_seg,
//               lotsize: raw.lotsize,
//               instrumenttype: raw.instrumenttype,
//               price: ltp,
//               expiry: raw.expiry,
//               expiryLabel: raw.expiryLabel,
//               expiryDateObj: raw.expiryDateObj,
//             }));

//             setSlotSIze(raw.lotsize);
//           } else {
//             toast.error(res?.data?.message || "Something went wrong");
//           }
//         } catch (err: any) {
//           console.error(err);
//           toast.error(err.message || "Something went wrong");
//         }
//       } else {
//         try {
//           const res = await axios.post(
//             `${apiUrl}/agnelone/instrument/ltp`,
//             payload,
//             {
//               headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//                 AngelOneToken: localStorage.getItem("angel_token") || "",
//                 userid: localStorage.getItem("userID"),
//               },
//             }
//           );

//           if (res?.data?.status === true) {
//             const ltp = res?.data?.data?.data?.ltp || raw.price || 0;

//             setSelectedScriptRow((prev: any) => ({
//               ...(prev || {}),
//               angelToken: raw.angelToken || raw.token,
//               angelSymbol: raw.angelSymbol || raw.symbol,
//               kiteToken: prev?.kiteToken || "",
//               kiteSymbol: prev?.kiteSymbol || "",
//               token: raw.token,
//               symbol: raw.symbol,
//               name: raw.name,
//               exch_seg: raw.exch_seg,
//               lotsize: raw.lotsize,
//               instrumenttype: raw.instrumenttype,
//               price: ltp,
//               expiry: raw.expiry,
//               expiryLabel: raw.expiryLabel,
//               expiryDateObj: raw.expiryDateObj,
//             }));

//             setSlotSIze(raw.lotsize);
//           } else {
//             toast.error(res?.data?.message || "Something went wrong");
//           }
//         } catch (err: any) {
//           console.error(err);
//           toast.error(err.message || "Something went wrong");
//         }
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   // ---------- JSX ----------
//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <h2 className="text-xl font-semibold mb-4">Nifty Bank Instruments</h2>

//       <div className="flex justify-between items-center mb-4 gap-4">
//         <div className="w-full sm:w-80">
//           <input
//             type="text"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             placeholder='Search (e.g. "NIFTY02DEC2525800PE" or "NIFTY")'
//             className="border p-2 w-full rounded"
//           />
//         </div>

//         <div className="flex items-center gap-4">
//           <label className="flex items-center gap-2">
//             <input
//               type="checkbox"
//               checked={useKite}
//               onChange={(e) => setUseKite(e.target.checked)}
//               className="h-4 w-4"
//             />
//             Use Kite Instruments
//           </label>

//           <button
//             className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
//             onClick={handleOpenScriptModal}
//           >
//             Add/Edit
//           </button>
//         </div>
//       </div>

//       {loading && <p>Loading data...</p>}
//       {error && <p className="text-red-500">{error}</p>}
//       {!loading && !error && filteredData.length === 0 && <p>No data found.</p>}

//       {filteredData.length > 0 && (
//         <div className="ag-theme-quartz compact-grid" style={{ height: 540, width: "100%" }}>
//           <AgGridReact
//             rowData={filteredData}
//             columnDefs={columnDefs}
//             defaultColDef={defaultColDef}
//             animateRows
//             rowSelection="single"
//             pagination
//             paginationPageSize={10000}
//             rowHeight={34}
//             suppressFieldDotNotation
//             onGridReady={onGridReady}
//           />
//         </div>
//       )}

//       {scriptModalOpen && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999999]">
//           <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl mx-3">
//             <div className="max-h-[90vh] overflow-y-auto p-6">
//               {/* Header */}
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-lg font-semibold">Add / Edit Scrip</h3>
//                 <button
//                   onClick={() => setScriptModalOpen(false)}
//                   className="text-gray-500 hover:text-black text-xl leading-none"
//                 >
//                   ×
//                 </button>
//               </div>

//               {/* SECTION 1: Scrip Details & Search */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <div className="flex items-center justify-between mb-3">
//                   <h4 className="text-sm font-semibold text-gray-700">
//                     Scrip Details & Search
//                   </h4>

//                   <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
//                     <input
//                       type="checkbox"
//                       checked={useKite}
//                       onChange={(e) => setUseKite(e.target.checked)}
//                       className="h-4 w-4"
//                     />
//                     Search in Kite Instruments (unchecked = AngelOne)
//                   </label>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Terminal Symbol (AngelOne)
//                     </label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.angelSymbol || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Terminal Symbol (Kite)
//                     </label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.kiteSymbol || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Token (AngelOne)
//                     </label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.angelToken || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Token (Kite)
//                     </label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.kiteToken || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Last Traded Price
//                     </label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.price || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Search Name / Symbol / CE / PE
//                     </label>
//                     <input
//                       type="text"
//                       value={scriptSearch}
//                       onChange={(e) => setScriptSearch(e.target.value)}
//                       placeholder="e.g. NIFTY 26150 CE"
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Chart Symbol (Strike)
//                     </label>
//                     <input
//                       type="text"
//                       placeholder="e.g. 26150"
//                       value={chartSymbolSearch}
//                       onChange={(e) => setChartSymbolSearch(e.target.value)}
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* SECTION 2: Filters & Order Settings */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <h4 className="text-sm font-semibold text-gray-700 mb-3">
//                   Filters & Order Settings
//                 </h4>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Option Type
//                     </label>
//                     <select
//                       value={scriptOptionFilter}
//                       onChange={(e) =>
//                         setScriptOptionFilter(e.target.value as "" | "CE" | "PE")
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">ALL</option>
//                       <option value="CE">CE (Call)</option>
//                       <option value="PE">PE (Put)</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Expiry (next 6 months)
//                     </label>
//                     <select
//                       value={scriptExpiryFilter}
//                       onChange={(e) => setScriptExpiryFilter(e.target.value)}
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">All Expiries</option>
//                       {allExpiryOptions.map((exp) => (
//                         <option key={exp.key} value={exp.label}>
//                           {exp.label}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Transaction Type
//                     </label>
//                     <select
//                       value={scriptTxnType}
//                       onChange={(e) =>
//                         setScriptTxnType(e.target.value as "" | "BUY" | "SELL")
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="BUY">BUY</option>
//                       <option value="SELL">SELL</option>
//                     </select>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Order Type
//                     </label>
//                     <select
//                       value={orderType}
//                       onChange={(e) => setOrderType(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Order Type</option>
//                       <option value="MARKET">MARKET</option>
//                       <option value="LIMIT">LIMIT</option>
//                       <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT</option>
//                       <option value="STOPLOSS_MARKET">STOPLOSS_MARKET</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Duration
//                     </label>
//                     <select
//                       value={duration}
//                       onChange={(e) => setDuration(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Duration</option>
//                       <option value="DAY">DAY</option>
//                       <option value="IOC">IOC</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Variety
//                     </label>
//                     <select
//                       value={variety}
//                       onChange={(e) => setVariety(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Variety</option>
//                       <option value="NORMAL">NORMAL</option>
//                       <option value="STOPLOSS">STOPLOSS</option>
//                       <option value="ROBO">ROBO</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* SECTION 3: Product & Strategy */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <h4 className="text-sm font-semibold text-gray-700 mb-3">
//                   Product & Strategy
//                 </h4>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Product Type
//                     </label>
//                     <select
//                       value={scriptProductType}
//                       onChange={(e) =>
//                         setScriptProductType(
//                           e.target.value as "" | "INTRADAY" | "DELIVERY"
//                         )
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">Select</option>
//                       <option value="INTRADAY">IntraDay MIS</option>
//                       <option value="DELIVERY">Longterm CNC</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Quantity in Lot
//                     </label>
//                     <input
//                       type="number"
//                       placeholder="Enter Quantity in Lot"
//                       value={selectedScriptRow?.lotsize || ""}
//                       onChange={(e) =>
//                         setSelectedScriptRow((prev: any) => ({
//                           ...(prev || {}),
//                           lotsize: e.target.value,
//                         }))
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm bg-white focus:ring-2 focus:ring-blue-500"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Select Strategy *
//                     </label>
//                     <select
//                       className="w-full border rounded px-3 py-2 text-sm"
//                       value={selectedStrategyId}
//                       onChange={(e) => {
//                         const strategyId = e.target.value;
//                         setSelectedStrategyId(strategyId);

//                         const selected: any = strategyList.find(
//                           (s: any) => s.id == strategyId
//                         );

//                         if (selected) {
//                           setGroupName(selected.strategyName);
//                         } else {
//                           setGroupName("");
//                         }
//                       }}
//                     >
//                       <option value="">Select Strategy</option>
//                       {strategyList.map((s: any) => (
//                         <option value={s.id} key={s.id}>
//                           {s.strategyName}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* SECTION 4: Result list */}
//               <div className="border border-gray-200 rounded-lg mb-6">
//                 <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
//                   <span className="text-xs font-semibold text-gray-600">
//                     Search Results (click to select)
//                   </span>
//                 </div>

//                 <div className="max-h-64 overflow-auto">
//                   <table className="w-full text-sm">
//                     <thead className="bg-gray-100 sticky top-0">
//                       <tr>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Symbol
//                         </th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Name
//                         </th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Token
//                         </th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Lot
//                         </th>
//                       </tr>
//                     </thead>

//                     <tbody>
//                       {scriptFilteredRows.map((row) => (
//                         <tr
//                           key={`${row.token}-${row.symbol}`}
//                           className={`cursor-pointer transition-colors ${
//                             selectedScriptRow?.token === row.token ||
//                             selectedScriptRow?.kiteToken === row.token ||
//                             selectedScriptRow?.angelToken === row.token
//                               ? "bg-purple-100"
//                               : "hover:bg-purple-50"
//                           }`}
//                           onClick={() => handleSelectionInstrument(row)}
//                         >
//                           <td className="px-3 py-1">{row.symbol}</td>
//                           <td className="px-3 py-1">{row.name}</td>
//                           <td className="px-3 py-1">{row.token}</td>
//                           <td className="px-3 py-1">{row.lotsize}</td>
//                         </tr>
//                       ))}

//                       {scriptFilteredRows.length === 0 && (
//                         <tr>
//                           <td
//                             className="px-3 py-3 text-center text-gray-500"
//                             colSpan={4}
//                           >
//                             No matching scrips found.
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>

//               {/* Footer buttons */}
//               <div className="flex justify-end gap-3">
//                 <button
//                   onClick={() => {
//                     setScriptSearch("");
//                     setScriptExpiryFilter("");
//                     setScriptOptionFilter("");
//                     setChartSymbolSearch("");
//                     setSelectedScriptRow(null);
//                     setScriptTxnType("BUY");
//                     setScriptProductType("");
//                     setSelectedStrategyId("");
//                     setGroupName("");
//                   }}
//                   className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded text-sm"
//                 >
//                   Reset
//                 </button>

//                 <button
//                   onClick={() => setScriptModalOpen(false)}
//                   className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded text-sm"
//                 >
//                   Close
//                 </button>

//                 <button
//                   onClick={handleScriptSave}
//                   className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded text-sm font-medium"
//                 >
//                   Save changes
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }








// import { useState, useEffect, useRef, useMemo } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { ModuleRegistry } from "ag-grid-community";
// import { AllCommunityModule } from "ag-grid-community";
// ModuleRegistry.registerModules([AllCommunityModule]);
// import { AgGridReact } from "ag-grid-react";
// import type { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";

// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-quartz.css";

// export default function InstrumentFormAdmin() {
//   const apiUrl = import.meta.env.VITE_API_URL;

//   const [data, setData] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const [getslotSIze, setSlotSIze] = useState("");

//   const [duration, setDuration] = useState("DAY");
//   const [orderType, setOrderType] = useState("MARKET");
//   const [variety, setVariety] = useState("NORMAL");

//   const [searchTerm, setSearchTerm] = useState("");
//   const [debouncedSearch, setDebouncedSearch] = useState("");

//   const gridApiRef = useRef<GridApi | null>(null);

//   const [groupName, setGroupName] = useState("");
//   const [strategyList, setStrategyList] = useState<any[]>([]);
//   const [selectedStrategyId, setSelectedStrategyId] = useState("");

//   const [scriptModalOpen, setScriptModalOpen] = useState(false);
//   const [scriptSearch, setScriptSearch] = useState("");
//   const [scriptExpiryFilter, setScriptExpiryFilter] = useState("");
//   const [scriptOptionFilter, setScriptOptionFilter] = useState<"" | "CE" | "PE">("");
//   const [selectedScriptRow, setSelectedScriptRow] = useState<any | null>(null);
//   const [chartSymbolSearch, setChartSymbolSearch] = useState("");
//   const [scriptTxnType, setScriptTxnType] = useState<"" | "BUY" | "SELL">("BUY");
//   const [scriptProductType, setScriptProductType] = useState<"" | "INTRADAY" | "DELIVERY">("INTRADAY");

//   const [useKite, setUseKite] = useState(false);

//   // ---------- Common expiry normalizer ----------
//   const buildExpiryMeta = (rawExpiry: any) => {
//     if (!rawExpiry) return { expiryDateObj: null, expiryLabel: "" };

//     const s = String(rawExpiry).trim();
//     if (!s) return { expiryDateObj: null, expiryLabel: "" };

//     let d: Date | null = null;

//     // 1) YYYY-MM-DD  (Kite)
//     if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
//       d = new Date(s + "T00:00:00");
//     }
//     // 2) DD-MMM-YYYY / DD-MMM-YY (AngelOne etc.)
//     else if (/^\d{2}-[A-Za-z]{3}-\d{2,4}$/.test(s)) {
//       const [ddStr, monStrRaw, yyStr] = s.split("-");
//       const dd = Number(ddStr);
//       const monStr = monStrRaw.toUpperCase();
//       const monthMap: Record<string, number> = {
//         JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
//         JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
//       };
//       const monthIndex = monthMap[monStr];
//       if (monthIndex !== undefined) {
//         let yearNum = Number(yyStr);
//         if (yyStr.length === 2) {
//           yearNum = 2000 + yearNum;
//         }
//         d = new Date(yearNum, monthIndex, dd);
//       }
//     }
//     // 3) Fallback: native Date parse
//     else {
//       const t = new Date(s);
//       if (!isNaN(t.getTime())) d = t;
//     }

//     if (!d) return { expiryDateObj: null, expiryLabel: "" };

//     const day = d.getDate().toString().padStart(2, "0");
//     const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
//     const label = `${day}-${monthNames[d.getMonth()]}-${d.getFullYear()}`;

//     return { expiryDateObj: d, expiryLabel: label };
//   };

//   // ---------- Parse option symbol (only for strike & CE/PE) ----------
//   // Works for NIFTY02DEC2525800PE, NIFTY25NOV24500CE etc.
//   const parseOptionMeta = (symbolRaw: any) => {
//     const symbol = String(symbolRaw || "").toUpperCase();

//     // e.g. NIFTY02DEC2525800PE  or  NIFTY25NOV24500CE
//     const re = /^([A-Z]+)(\d{2})([A-Z]{3})(\d{2})(\d+)(CE|PE)$/;
//     const m = symbol.match(re);
//     if (!m) return null;

//     const [, underlying, dd, monStr, yy, strike, optType] = m;

//     const monthMap: Record<string, number> = {
//       JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
//       JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
//     };
//     const monthIndex = monthMap[monStr];
//     if (monthIndex === undefined) return null;

//     const year = 2000 + Number(yy);
//     const day = Number(dd);
//     const dateObj = new Date(year, monthIndex, day);

//     const expiryLabel = `${day.toString().padStart(2, "0")}-${monStr}-${year}`;

//     return {
//       underlying,
//       expiryLabel,
//       expiryDate: dateObj,
//       strike: Number(strike),
//       optionType: optType as "CE" | "PE",
//     };
//   };

//   // ⭐ NEW: helper that always tries to extract strike / optionType / expiry
//   const getOptionMeta = (row: any) => {
//     const mainSymbol = row.symbol || row.kiteSymbol || row.angelSymbol || "";

//     console.log(row,'mainSymbol');
    
//     const fromSymbol = parseOptionMeta(mainSymbol);
//     if (fromSymbol) return fromSymbol;

//     const name = String(row.name || "").toUpperCase();
//     const optMatch = name.match(/\b(CE|PE)\b/);
//     const strikeMatches = name.match(/(\d+)/g);

//     return {
//       underlying: "",
//       expiryLabel: row.expiryLabel || "",
//       expiryDate: row.expiryDateObj || null,
//       strike: strikeMatches
//         ? Number(strikeMatches[strikeMatches.length - 1])
//         : row.strike || 0,
//       optionType: (optMatch?.[1] as "CE" | "PE") || (row.syType as "CE" | "PE"),
//     };
//   };

//   // ---------- NORMALIZERS (AngelOne & Kite) ----------
//   const mapAngelToCommon = (row: any) => {
//     const { expiryDateObj, expiryLabel } = buildExpiryMeta(row.expiry);

//     return {
//       ...row,
//       token: String(row.token ?? ""),
//       symbol: String(row.symbol ?? ""),
//       name: row.name ?? "",
//       expiry: row.expiry ?? "",
//       strike: row.strike !== undefined ? Number(row.strike) : -1,
//       lotsize: row.lotsize !== undefined ? Number(row.lotsize) : 0,
//       instrumenttype: row.instrumenttype ?? "",
//       exch_seg: row.exch_seg ?? "",
//       tick_size: row.tick_size !== undefined ? Number(row.tick_size) : 0,
//       syType: row.instrumenttype ?? row.syType ?? "",
//       angelToken: String(row.token ?? ""),
//       angelSymbol: String(row.symbol ?? ""),
//       kiteToken: row.kiteToken ?? "",
//       kiteSymbol: row.kiteSymbol ?? "",
//       expiryDateObj,
//       expiryLabel,
//     };
//   };

//   const mapKiteToCommon = (row: any) => {
//     const { expiryDateObj, expiryLabel } = buildExpiryMeta(row.expiry);

//     // Try to derive strike if missing
//     let strike = row.strike;
//     if (!strike) {
//       const metaFromSymbol = parseOptionMeta(row.tradingsymbol);
//       if (metaFromSymbol) {
//         strike = metaFromSymbol.strike;
//       } else {
//         const m = String(row.name || "").match(/\d+/);
//         strike = m ? Number(m[0]) : 0;
//       }
//     }


    

//     return {
//       ...row,
//       token: String(row.exchange_token ?? ""),
//       symbol: String(row.tradingsymbol ?? ""),
//       name: row.name ?? "",
//       expiry: row.expiry ?? "",
//       strike: Number(strike),
//       lotsize: row.lot_size !== undefined ? Number(row.lot_size) : 0,
//       instrumenttype: row.instrument_type ?? "",
//       exch_seg: row.segment ?? row.exchange ?? "",
//       tick_size: row.tick_size !== undefined ? Number(row.tick_size) : 0,
//       syType: row.instrument_type ?? "",
//       kiteToken: String(row.exchange_token ?? ""),
//       kiteSymbol: String(row.tradingsymbol ?? ""),
//       angelToken: row.angelToken ?? "",
//       angelSymbol: row.angelSymbol ?? "",
//       expiryDateObj,
//       expiryLabel,
//     };
//   };

//   // ---------- Fetch instruments (AngelOne or Kite) ----------
//   const fetchData = async () => {
//     setLoading(true);
//     setError("");

//     try {
//       const endpoint = useKite ? "/kite/instrument" : "/agnelone/instrument";
//       const res = await axios.get(`${apiUrl}${endpoint}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });

//       if (res?.data?.status === true) {
//         const rawData = res?.data?.data || [];

//         const normalized = useKite
//           ? rawData.map((row: any) => mapKiteToCommon(row))
//           : rawData.map((row: any) => mapAngelToCommon(row));

//         setData(normalized);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err?.message || "Something went wrong");
//       setError(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------- Fetch strategies ----------
//   const fetchStrategies = async () => {
//     try {
//       const res = await axios.get(`${apiUrl}/admin/strategies`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID"),
//         },
//       });

//       if (res.data.status === true) {
//         setStrategyList(res.data.data || []);
//       } else {
//         toast.error(res.data.message);
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//     fetchStrategies();
//     setSearchTerm("");
//   }, [useKite]);

//   // ---------- Open Add/Edit Scrip modal ----------
//   const handleOpenScriptModal = () => {
//     setSelectedScriptRow(null);
//     setScriptModalOpen(true);
//     setScriptSearch("");
//     setChartSymbolSearch("");
//     setScriptExpiryFilter("");
//     setScriptOptionFilter("");
//     setScriptTxnType("BUY");
//     setScriptProductType("");
//     setSelectedStrategyId("");
//     setGroupName("");
//   };

//   // ---------- AG Grid ----------
//   const columnDefs = useMemo<ColDef[]>(
//     () => [
//       { headerName: "Token", field: "token", minWidth: 80 },
//       { headerName: "Type", field: "syType", minWidth: 80 },
//       {
//         headerName: "Symbol",
//         field: "symbol",
//         minWidth: 250,
//         filter: "agTextColumnFilter",
//       },
//       { headerName: "Name", field: "name", minWidth: 120 },
//       { headerName: "Instrument", field: "instrumenttype", minWidth: 120 },
//       { headerName: "Lot-Size", field: "lotsize", width: 110 },
//       ...(useKite
//         ? [
//             { headerName: "Kite Token", field: "kiteToken", minWidth: 120 },
//             { headerName: "Kite Symbol", field: "kiteSymbol", minWidth: 180 },
//           ]
//         : [
//             { headerName: "Angel Token", field: "angelToken", minWidth: 120 },
//             { headerName: "Angel Symbol", field: "angelSymbol", minWidth: 180 },
//           ]),
//       { headerName: "Expiry", field: "expiryLabel", minWidth: 130 },
//     ],
//     [useKite]
//   );

//   const defaultColDef = useMemo<ColDef>(
//     () => ({
//       sortable: true,
//       resizable: true,
//       filter: true,
//       floatingFilter: true,
//     }),
//     []
//   );

//   const onGridReady = (e: GridReadyEvent) => {
//     gridApiRef.current = e.api;
//     e.api.sizeColumnsToFit();
//   };

//   // ---------- Debounced search (main grid) ----------
//   useEffect(() => {
//     const id = setTimeout(() => setDebouncedSearch(searchTerm), 150);
//     return () => clearTimeout(id);
//   }, [searchTerm]);

//   const rowMatchesQuery = (row: any, query: string) => {
//     const q = query.trim().toUpperCase();
//     if (!q) return true;

//     const symbol = String(row.symbol || "").toUpperCase();
//     const name = String(row.name || "").toUpperCase();
//     const token = String(row.token || "").toUpperCase();
//     const full = `${symbol} ${name} ${token}`;

//     return full.includes(q);
//   };

//   const filteredData = useMemo(() => {
//     if (!debouncedSearch.trim()) return data;
//     return data.filter((row) => rowMatchesQuery(row, debouncedSearch));
//   }, [data, debouncedSearch]);

//   // ---------- Expiry dropdown: based on expiry or parsed from symbol (today → +6 months) ----------
//   const allExpiryOptions = useMemo(() => {
//     const MONTH_RANGE = 6;
//     const now = new Date();
//     const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//     const maxDate = new Date(
//       startOfToday.getFullYear(),
//       startOfToday.getMonth() + MONTH_RANGE,
//       startOfToday.getDate()
//     );

//     const map = new Map<string, { label: string; date: Date }>();

//     data.forEach((row) => {
//       let d: Date | null = row.expiryDateObj || null;
//       let label: string = row.expiryLabel || "";

//       // ⭐ NEW: fallback to parse from symbol if expiry field was empty
//       if (!d || !label) {
//         const meta = parseOptionMeta(row.symbol || row.kiteSymbol || row.angelSymbol);
//         if (meta) {
//           d = meta.expiryDate;
//           label = meta.expiryLabel;
//         }
//       }

//       if (!d || !label) return;
//       if (d < startOfToday || d > maxDate) return;

//       const key = d.toISOString().slice(0, 10);
//       if (!map.has(key)) {
//         map.set(key, { label, date: d });
//       }
//     });

//     return Array.from(map.entries())
//       .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
//       .map(([key, value]) => ({
//         key,
//         label: value.label,
//       }));
//   }, [data]);

//   // ---------- Filter rows in Add/Edit Scrip modal ----------
//   const scriptFilteredRows = useMemo(() => {
//     let rows = data.filter((row) => {
//       if (useKite) {
        
        
//         return row.kiteSymbol && row.kiteToken;
//       } else {
//         return row.angelSymbol && row.angelToken;
//       }
//     });

      
    

//     // Search by name/symbol/CE/PE
//     const qRaw = scriptSearch.trim().toUpperCase();
//     const tokens = qRaw.split(/\s+/).filter(Boolean);

//     if (tokens.length > 0) {
//       rows = rows.filter((row) => {
//         const symbol = String(row.symbol || "").toUpperCase();
//         const name = String(row.name || "").toUpperCase();
//         // const haystack = `${symbol} ${name}`;
//           const haystack = `${symbol} ${name}`;
//         return tokens.every((t) => haystack.includes(t));
//       });
//     }

//     console.log(rows,'rows after search name');
    

//     // ⭐ UPDATED: Chart Symbol (Strike) filter using getOptionMeta
//     const strikeQ = chartSymbolSearch.trim();
//     if (strikeQ) {

     
       
//       rows = rows.filter((row) => {

         

//         const meta = getOptionMeta(row);
//         const strikeStr = String(meta?.strike ?? row.strike ?? "");

       
        

//         return strikeStr.includes(strikeQ);

       

//       });
//     }

//     // ⭐ UPDATED: Expiry filter uses expiryLabel (from field or parsed)
//     if (scriptExpiryFilter) {
//       rows = rows.filter((row) => {
//         if (row.expiryLabel === scriptExpiryFilter) return true;
//         const meta = getOptionMeta(row);
//         return meta?.expiryLabel === scriptExpiryFilter;
//       });
//     }

//     // ⭐ UPDATED: Option Type filter using getOptionMeta (works for Kite + AngelOne)
//     if (scriptOptionFilter) {
//       rows = rows.filter((row) => {
//         const meta = getOptionMeta(row);
//         return meta && meta.optionType === scriptOptionFilter;
//       });
//     }

//     return rows.slice(0, 300);
//   }, [data, scriptSearch, scriptExpiryFilter, scriptOptionFilter, chartSymbolSearch, useKite]);

//   // ---------- Save ----------
//   const handleScriptSave = async () => {
    
//     if (!selectedScriptRow) {
//       toast.error("Please select a scrip from the list");
//       return;
//     }

//     const lotSizeNum = Number(selectedScriptRow.lotsize || 0);
//     const priceNum = Number(selectedScriptRow.price || 0);
//     const slotSizeNum = Number(getslotSIze || 1);

//     //  REQUIRED FIELD CHECKS
//   // -------------------------
//   const requiredFields = [
//     { label: "Token", value: selectedScriptRow.token },
//     { label: "Symbol", value: selectedScriptRow.symbol },
//     { label: "Name", value: selectedScriptRow.name },
//     { label: "Exchange Segment", value: selectedScriptRow.exch_seg },
//     { label: "AngelOne Token", value: selectedScriptRow.angelToken },
//     { label: "AngelOne Symbol", value: selectedScriptRow.angelSymbol },
//     { label: "Kite Token", value: selectedScriptRow.kiteToken },
//     { label: "Kite Symbol", value: selectedScriptRow.kiteSymbol },
//     { label: "Group Name", value: groupName },
//     { label: "Quantity (Lot Size)", value: lotSizeNum },
//     { label: "Product Type)", value: scriptProductType },

    
//   ];

//   console.log(selectedScriptRow.kiteToken,selectedScriptRow.kiteSymbol, groupName,lotSizeNum);
  
//   for (let item of requiredFields) {
//     if (!item.value || item.value === ""|| item.value === " ") {
//       toast.error(`${item.label} is required.`);
//       return;
//     }
//   }



//     const payload = {
//       token: selectedScriptRow.token || "",
//       symbol: selectedScriptRow.symbol || "",
//       name: selectedScriptRow.name || "",
//       exch_seg: selectedScriptRow.exch_seg || "",
//       lotsize: lotSizeNum,
//       instrumenttype: selectedScriptRow.instrumenttype || "",
//       price: priceNum,
//       quantity: lotSizeNum,
//       transactiontype: scriptTxnType,
//       duration,
//       orderType,
//       variety,
//       productType: scriptProductType,
//       totalPrice: priceNum * lotSizeNum,
//       actualQuantity: lotSizeNum / slotSizeNum,
//       searchText: scriptSearch || "",
//       chartSymbol: chartSymbolSearch || "",
//       optionType: scriptOptionFilter || "",
//       expiry: selectedScriptRow.expiry || "",
//       expiryLabel: selectedScriptRow.expiryLabel || "",
//       strategyId: selectedStrategyId || "",
//       groupName: groupName,
//       angelOneToken: selectedScriptRow.angelToken || "",
//       angelOneSymbol: selectedScriptRow.angelSymbol || "",
//       kiteToken: selectedScriptRow.kiteToken || "",
//       kiteSymbol: selectedScriptRow.kiteSymbol || "",
//     };

//     try {
//       const res = await axios.post(
//         `${apiUrl}/admin/multiple/place/order`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         }
//       );

//       if (res?.data?.status === true) {
//         alert(res?.data?.message);
//         setVariety("NORMAL");
//         setDuration("DAY");
//         setOrderType("MARKET");
//         setScriptModalOpen(false);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   // ---------- Selection Handler ----------
//   const handleSelectionInstrument = async (raw: any) => {
    
//     const payload = {
//       exchange: raw.exch_seg,
//       tradingsymbol: raw.symbol,
//       symboltoken: raw.token,
//     };

//     console.log(raw,' instrument',useKite);
    

//     try {
//       await fetchStrategies();

//       if (useKite) {
          
//           setSelectedScriptRow((prev: any) => ({
//               ...(prev || {}),
//               kiteToken: raw.exchange_token ,
//               kiteSymbol: raw.kiteSymbol ,
//               angelToken: prev?.angelToken || "",
//               angelSymbol: prev?.angelSymbol || "",
//               kiteName: raw.name,
//               exch_seg: raw.exchange,
//               lotsize: raw.lotsize,
//               // instrumenttype: raw.instrumenttype,
//               price: 0,
//               expiry: raw.expiry,
//               expiryLabel: raw.expiryLabel,
//               expiryDateObj: raw.expiryDateObj,
//             }));

//             setSlotSIze(raw.lotsize);

//       } else {
//         try {
//           const res = await axios.post(
//             `${apiUrl}/agnelone/instrument/ltp`,
//             payload,
//             {
//               headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//                 AngelOneToken: localStorage.getItem("angel_token") || "",
//                 userid: localStorage.getItem("userID"),
//               },
//             }
//           );

//           if (res?.data?.status === true) {
//             const ltp = res?.data?.data?.data?.ltp || raw.price || 0;

//             setSelectedScriptRow((prev: any) => ({
//               ...(prev || {}),
//               angelToken: raw.angelToken || raw.token,
//               angelSymbol: raw.angelSymbol || raw.symbol,
//               kiteToken: prev?.kiteToken || "",
//               kiteSymbol: prev?.kiteSymbol || "",
//               token: raw.token,
//               symbol: raw.symbol,
//               name: raw.name,
//               exch_seg: raw.exch_seg,
//               lotsize: raw.lotsize,
//               instrumenttype: raw.instrumenttype,
//               price: ltp,
//               expiry: raw.expiry,
//               expiryLabel: raw.expiryLabel,
//               expiryDateObj: raw.expiryDateObj,
//             }));

//             setSlotSIze(raw.lotsize);
//           } else {
//             toast.error(res?.data?.message || "Something went wrong");
//           }
//         } catch (err: any) {
//           console.error(err);
//           toast.error(err.message || "Something went wrong");
//         }
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   // ---------- JSX ----------
//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <h2 className="text-xl font-semibold mb-4">Nifty Bank Instruments</h2>

//       <div className="flex justify-between items-center mb-4 gap-4">
//         <div className="w-full sm:w-80">
//           <input
//             type="text"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             placeholder='Search (e.g. "NIFTY02DEC2525800PE" or "NIFTY")'
//             className="border p-2 w-full rounded"
//           />
//         </div>

//         <div className="flex items-center gap-4">
//           <label className="flex items-center gap-2">
//             <input
//               type="checkbox"
//               checked={useKite}
//               onChange={(e) => setUseKite(e.target.checked)}
//               className="h-4 w-4"
//             />
//             Use Kite Instruments
//           </label>

//           <button
//             className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
//             onClick={handleOpenScriptModal}
//           >
//             Add/Edit
//           </button>
//         </div>
//       </div>

//       {loading && <p>Loading data...</p>}
//       {error && <p className="text-red-500">{error}</p>}
//       {!loading && !error && filteredData.length === 0 && <p>No data found.</p>}

//       {filteredData.length > 0 && (
//         <div className="ag-theme-quartz compact-grid" style={{ height: 540, width: "100%" }}>
//           <AgGridReact
//             rowData={filteredData}
//             columnDefs={columnDefs}
//             defaultColDef={defaultColDef}
//             animateRows
//             rowSelection="single"
//             pagination
//             paginationPageSize={10000}
//             rowHeight={34}
//             suppressFieldDotNotation
//             onGridReady={onGridReady}
//           />
//         </div>
//       )}

//       {scriptModalOpen && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999999]">
//           <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl mx-3">
//             <div className="max-h-[90vh] overflow-y-auto p-6">
//               {/* Header */}
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-lg font-semibold">Add / Edit Scrip</h3>
//                 <button
//                   onClick={() => setScriptModalOpen(false)}
//                   className="text-gray-500 hover:text-black text-xl leading-none"
//                 >
//                   ×
//                 </button>
//               </div>

//               {/* SECTION 1: Scrip Details & Search */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <div className="flex items-center justify-between mb-3">
//                   <h4 className="text-sm font-semibold text-gray-700">
//                     Scrip Details & Search
//                   </h4>

//                   <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
//                     <input
//                       type="checkbox"
//                       checked={useKite}
//                       onChange={(e) => setUseKite(e.target.checked)}
//                       className="h-4 w-4"
//                     />
//                     Search in Kite Instruments (unchecked = AngelOne)
//                   </label>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Terminal Symbol (AngelOne)
//                     </label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.angelSymbol || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Terminal Symbol (Kite)
//                     </label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.kiteSymbol || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Token (AngelOne)
//                     </label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.angelToken || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Token (Kite)
//                     </label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.kiteToken || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Last Traded Price
//                     </label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.price || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Search Name / Symbol / CE / PE
//                     </label>
//                     <input
//                       type="text"
//                       value={scriptSearch}
//                       onChange={(e) => setScriptSearch(e.target.value)}
//                       placeholder="e.g. NIFTY 26150 CE"
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Chart Symbol (Strike)
//                     </label>
//                     <input
//                       type="text"
//                       placeholder="e.g. 26150"
//                       value={chartSymbolSearch}
//                       onChange={(e) => setChartSymbolSearch(e.target.value)}
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* SECTION 2: Filters & Order Settings */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <h4 className="text-sm font-semibold text-gray-700 mb-3">
//                   Filters & Order Settings
//                 </h4>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Option Type
//                     </label>
//                     <select
//                       value={scriptOptionFilter}
//                       onChange={(e) =>
//                         setScriptOptionFilter(e.target.value as "" | "CE" | "PE")
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">ALL</option>
//                       <option value="CE">CE (Call)</option>
//                       <option value="PE">PE (Put)</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Expiry (next 6 months)
//                     </label>
//                     <select
//                       value={scriptExpiryFilter}
//                       onChange={(e) => setScriptExpiryFilter(e.target.value)}
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">All Expiries</option>
//                       {allExpiryOptions.map((exp) => (
//                         <option key={exp.key} value={exp.label}>
//                           {exp.label}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Transaction Type
//                     </label>
//                     <select
//                       value={scriptTxnType}
//                       onChange={(e) =>
//                         setScriptTxnType(e.target.value as "" | "BUY" | "SELL")
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="BUY">BUY</option>
//                       <option value="SELL">SELL</option>
//                     </select>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Order Type
//                     </label>
//                     <select
//                       value={orderType}
//                       onChange={(e) => setOrderType(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Order Type</option>
//                       <option value="MARKET">MARKET</option>
//                       <option value="LIMIT">LIMIT</option>
//                       <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT</option>
//                       <option value="STOPLOSS_MARKET">STOPLOSS_MARKET</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Duration
//                     </label>
//                     <select
//                       value={duration}
//                       onChange={(e) => setDuration(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Duration</option>
//                       <option value="DAY">DAY</option>
//                       <option value="IOC">IOC</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Variety
//                     </label>
//                     <select
//                       value={variety}
//                       onChange={(e) => setVariety(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Variety</option>
//                       <option value="NORMAL">NORMAL</option>
//                       <option value="STOPLOSS">STOPLOSS</option>
//                       <option value="ROBO">ROBO</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* SECTION 3: Product & Strategy */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <h4 className="text-sm font-semibold text-gray-700 mb-3">
//                   Product & Strategy
//                 </h4>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Product Type
//                     </label>
//                     <select
//                       value={scriptProductType}
//                       onChange={(e) =>
//                         setScriptProductType(
//                           e.target.value as "" | "INTRADAY" | "DELIVERY"
//                         )
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">Select</option>
//                       <option value="INTRADAY">IntraDay MIS</option>
//                       <option value="DELIVERY">Longterm CNC</option>
//                       <option value="CARRYFORWARD">CARRYFORWARD</option>
//                       <option value="BO">Bracket Order </option>
//                       <option value="MARGIN">Margin Delivery</option>

//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Quantity in Lot
//                     </label>
//                     <input
//                       type="number"
//                       placeholder="Enter Quantity in Lot"
//                       value={selectedScriptRow?.lotsize || ""}
//                       onChange={(e) =>
//                         setSelectedScriptRow((prev: any) => ({
//                           ...(prev || {}),
//                           lotsize: e.target.value,
//                         }))
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm bg-white focus:ring-2 focus:ring-blue-500"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Select Strategy *
//                     </label>
//                     <select
//                       className="w-full border rounded px-3 py-2 text-sm"
//                       value={selectedStrategyId}
//                       onChange={(e) => {
//                         const strategyId = e.target.value;
//                         setSelectedStrategyId(strategyId);

//                         const selected: any = strategyList.find(
//                           (s: any) => s.id == strategyId
//                         );

//                         if (selected) {
//                           setGroupName(selected.strategyName);
//                         } else {
//                           setGroupName("");
//                         }
//                       }}
//                     >
//                       <option value="">Select Strategy</option>
//                       {strategyList.map((s: any) => (
//                         <option value={s.id} key={s.id}>
//                           {s.strategyName}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* SECTION 4: Result list */}
//               <div className="border border-gray-200 rounded-lg mb-6">
//                 <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
//                   <span className="text-xs font-semibold text-gray-600">
//                     Search Results (click to select)
//                   </span>
//                 </div>

//                 <div className="max-h-64 overflow-auto">
//                   <table className="w-full text-sm">
//                     <thead className="bg-gray-100 sticky top-0">
//                       <tr>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Symbol
//                         </th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Name
//                         </th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Token
//                         </th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Lot
//                         </th>
//                       </tr>
//                     </thead>

//                     <tbody>
//                       {scriptFilteredRows.map((row) => (
//                         <tr
//                           key={`${row.token}-${row.symbol}`}
//                           className={`cursor-pointer transition-colors ${
//                             selectedScriptRow?.token === row.token ||
//                             selectedScriptRow?.kiteToken === row.token ||
//                             selectedScriptRow?.angelToken === row.token
//                               ? "bg-purple-100"
//                               : "hover:bg-purple-50"
//                           }`}
//                           onClick={() => handleSelectionInstrument(row)}
//                         >
//                           <td className="px-3 py-1">{row.symbol}</td>
//                           <td className="px-3 py-1">{row.name}</td>
//                           <td className="px-3 py-1">{row.token}</td>
//                           <td className="px-3 py-1">{row.lotsize}</td>
//                         </tr>
//                       ))}

//                       {scriptFilteredRows.length === 0 && (
//                         <tr>
//                           <td
//                             className="px-3 py-3 text-center text-gray-500"
//                             colSpan={4}
//                           >
//                             No matching scrips found.
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>

//               {/* Footer buttons */}
//               <div className="flex justify-end gap-3">
//                 <button
//                   onClick={() => {
//                     setScriptSearch("");
//                     setScriptExpiryFilter("");
//                     setScriptOptionFilter("");
//                     setChartSymbolSearch("");
//                     setSelectedScriptRow(null);
//                     setScriptTxnType("BUY");
//                     setScriptProductType("");
//                     setSelectedStrategyId("");
//                     setGroupName("");
//                   }}
//                   className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded text-sm"
//                 >
//                   Reset
//                 </button>

//                 <button
//                   onClick={() => setScriptModalOpen(false)}
//                   className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded text-sm"
//                 >
//                   Close
//                 </button>

//                 <button
//                   onClick={handleScriptSave}
//                   className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded text-sm font-medium"
//                 >
//                   Save changes
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



// import { useState, useEffect, useRef, useMemo } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { ModuleRegistry } from "ag-grid-community";
// import { AllCommunityModule } from "ag-grid-community";
// ModuleRegistry.registerModules([AllCommunityModule]);
// import { AgGridReact } from "ag-grid-react";
// import type { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";

// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-quartz.css";

// export default function InstrumentFormAdmin() {
//   const apiUrl = import.meta.env.VITE_API_URL;

//   const [data, setData] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const [getslotSIze, setSlotSIze] = useState("");

//   const [duration, setDuration] = useState("DAY");
//   const [orderType, setOrderType] = useState("MARKET");
//   const [variety, setVariety] = useState("NORMAL");

//   const [searchTerm, setSearchTerm] = useState("");
//   const [debouncedSearch, setDebouncedSearch] = useState("");

//   const gridApiRef = useRef<GridApi | null>(null);

//   const [groupName, setGroupName] = useState("");
//   const [strategyList, setStrategyList] = useState<any[]>([]);
//   const [selectedStrategyId, setSelectedStrategyId] = useState("");

//   const [scriptModalOpen, setScriptModalOpen] = useState(false);
//   const [scriptSearch, setScriptSearch] = useState("");
//   const [scriptExpiryFilter, setScriptExpiryFilter] = useState("");
//   const [scriptOptionFilter, setScriptOptionFilter] = useState<"" | "CE" | "PE">("");
//   const [selectedScriptRow, setSelectedScriptRow] = useState<any | null>(null);
//   const [chartSymbolSearch, setChartSymbolSearch] = useState("");
//   const [scriptTxnType, setScriptTxnType] = useState<"" | "BUY" | "SELL">("BUY");
//   const [scriptProductType, setScriptProductType] = useState<"" | "INTRADAY" | "DELIVERY">("INTRADAY");

//   const [useKite, setUseKite] = useState(false);

//   // ---------- Common expiry normalizer ----------
//   const buildExpiryMeta = (rawExpiry: any) => {
//     if (!rawExpiry) return { expiryDateObj: null, expiryLabel: "" };

//     const s = String(rawExpiry).trim();
//     if (!s) return { expiryDateObj: null, expiryLabel: "" };

//     let d: Date | null = null;

//     // 1) YYYY-MM-DD  (Kite)
//     if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
//       d = new Date(s + "T00:00:00");
//     }
//     // 2) DD-MMM-YYYY / DD-MMM-YY (AngelOne etc.)
//     else if (/^\d{2}-[A-Za-z]{3}-\d{2,4}$/.test(s)) {
//       const [ddStr, monStrRaw, yyStr] = s.split("-");
//       const dd = Number(ddStr);
//       const monStr = monStrRaw.toUpperCase();
//       const monthMap: Record<string, number> = {
//         JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
//         JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
//       };
//       const monthIndex = monthMap[monStr];
//       if (monthIndex !== undefined) {
//         let yearNum = Number(yyStr);
//         if (yyStr.length === 2) {
//           yearNum = 2000 + yearNum;
//         }
//         d = new Date(yearNum, monthIndex, dd);
//       }
//     }
//     // 3) Fallback: native Date parse
//     else {
//       const t = new Date(s);
//       if (!isNaN(t.getTime())) d = t;
//     }

//     if (!d) return { expiryDateObj: null, expiryLabel: "" };

//     const day = d.getDate().toString().padStart(2, "0");
//     const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
//     const label = `${day}-${monthNames[d.getMonth()]}-${d.getFullYear()}`;

//     return { expiryDateObj: d, expiryLabel: label };
//   };

//   // ---------- Parse option symbol (only for strike & CE/PE) ----------
//   // Works for NIFTY02DEC2525800PE, NIFTY25NOV24500CE etc.
//   const parseOptionMeta = (symbolRaw: any) => {
//     const symbol = String(symbolRaw || "").toUpperCase();

//     // e.g. NIFTY02DEC2525800PE  or  NIFTY25NOV24500CE
//     const re = /^([A-Z]+)(\d{2})([A-Z]{3})(\d{2})(\d+)(CE|PE)$/;
//     const m = symbol.match(re);
//     if (!m) return null;

//     const [, underlying, dd, monStr, yy, strike, optType] = m;

//     const monthMap: Record<string, number> = {
//       JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
//       JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
//     };
//     const monthIndex = monthMap[monStr];
//     if (monthIndex === undefined) return null;

//     const year = 2000 + Number(yy);
//     const day = Number(dd);
//     const dateObj = new Date(year, monthIndex, day);

//     const expiryLabel = `${day.toString().padStart(2, "0")}-${monStr}-${year}`;

//     return {
//       underlying,
//       expiryLabel,
//       expiryDate: dateObj,
//       strike: Number(strike),
//       optionType: optType as "CE" | "PE",
//     };
//   };

//   // ⭐ NEW: helper that always tries to extract strike / optionType / expiry
//   const getOptionMeta = (row: any) => {
//     const mainSymbol = row.symbol || row.kiteSymbol || row.angelSymbol || "";

//     console.log(row,'mainSymbol');
    
//     const fromSymbol = parseOptionMeta(mainSymbol);
//     if (fromSymbol) return fromSymbol;

//     const name = String(row.name || "").toUpperCase();
//     const optMatch = name.match(/\b(CE|PE)\b/);
//     const strikeMatches = name.match(/(\d+)/g);

//     return {
//       underlying: "",
//       expiryLabel: row.expiryLabel || "",
//       expiryDate: row.expiryDateObj || null,
//       strike: strikeMatches
//         ? Number(strikeMatches[strikeMatches.length - 1])
//         : row.strike || 0,
//       optionType: (optMatch?.[1] as "CE" | "PE") || (row.syType as "CE" | "PE"),
//     };
//   };

//   // ---------- NORMALIZERS (AngelOne & Kite) ----------
//   const mapAngelToCommon = (row: any) => {
//     const { expiryDateObj, expiryLabel } = buildExpiryMeta(row.expiry);

//     return {
//       ...row,
//       token: String(row.token ?? ""),
//       symbol: String(row.symbol ?? ""),
//       name: row.name ?? "",
//       expiry: row.expiry ?? "",
//       strike: row.strike !== undefined ? Number(row.strike) : -1,
//       lotsize: row.lotsize !== undefined ? Number(row.lotsize) : 0,
//       instrumenttype: row.instrumenttype ?? "",
//       exch_seg: row.exch_seg ?? "",
//       tick_size: row.tick_size !== undefined ? Number(row.tick_size) : 0,
//       syType: row.instrumenttype ?? row.syType ?? "",
//       angelToken: String(row.token ?? ""),
//       angelSymbol: String(row.symbol ?? ""),
//       kiteToken: row.kiteToken ?? "",
//       kiteSymbol: row.kiteSymbol ?? "",
//       expiryDateObj,
//       expiryLabel,
//     };
//   };

//   const mapKiteToCommon = (row: any) => {
//     const { expiryDateObj, expiryLabel } = buildExpiryMeta(row.expiry);

//     // Try to derive strike if missing
//     let strike = row.strike;
//     if (!strike) {
//       const metaFromSymbol = parseOptionMeta(row.tradingsymbol);
//       if (metaFromSymbol) {
//         strike = metaFromSymbol.strike;
//       } else {
//         const m = String(row.name || "").match(/\d+/);
//         strike = m ? Number(m[0]) : 0;
//       }
//     }


    

//     return {
//       ...row,
//       token: String(row.exchange_token ?? ""),
//       symbol: String(row.tradingsymbol ?? ""),
//       name: row.name ?? "",
//       expiry: row.expiry ?? "",
//       strike: Number(strike),
//       lotsize: row.lot_size !== undefined ? Number(row.lot_size) : 0,
//       instrumenttype: row.instrument_type ?? "",
//       exch_seg: row.segment ?? row.exchange ?? "",
//       tick_size: row.tick_size !== undefined ? Number(row.tick_size) : 0,
//       syType: row.instrument_type ?? "",
//       kiteToken: String(row.exchange_token ?? ""),
//       kiteSymbol: String(row.tradingsymbol ?? ""),
//       angelToken: row.angelToken ?? "",
//       angelSymbol: row.angelSymbol ?? "",
//       expiryDateObj,
//       expiryLabel,
//     };
//   };

//   // ---------- Fetch instruments (AngelOne or Kite) ----------
//   const fetchData = async () => {
//     setLoading(true);
//     setError("");

//     try {
//       const endpoint = useKite ? "/kite/instrument" : "/agnelone/instrument";
//       const res = await axios.get(`${apiUrl}${endpoint}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });

//       if (res?.data?.status === true) {
//         const rawData = res?.data?.data || [];

//         const normalized = useKite
//           ? rawData.map((row: any) => mapKiteToCommon(row))
//           : rawData.map((row: any) => mapAngelToCommon(row));

//         setData(normalized);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err?.message || "Something went wrong");
//       setError(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------- Fetch strategies ----------
//   const fetchStrategies = async () => {
//     try {
//       const res = await axios.get(`${apiUrl}/admin/strategies`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID"),
//         },
//       });

//       if (res.data.status === true) {
//         setStrategyList(res.data.data || []);
//       } else {
//         toast.error(res.data.message);
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//     fetchStrategies();
//     setSearchTerm("");
//   }, [useKite]);

//   // ---------- Open Add/Edit Scrip modal ----------
//   const handleOpenScriptModal = () => {
//     setSelectedScriptRow(null);
//     setScriptModalOpen(true);
//     setScriptSearch("");
//     setChartSymbolSearch("");
//     setScriptExpiryFilter("");
//     setScriptOptionFilter("");
//     setScriptTxnType("BUY");
//     setScriptProductType("");
//     setSelectedStrategyId("");
//     setGroupName("");
//   };

//   // ---------- AG Grid ----------
//   const columnDefs = useMemo<ColDef[]>(
//     () => [
//       { headerName: "Token", field: "token", minWidth: 80 },
//       { headerName: "Type", field: "syType", minWidth: 80 },
//       {
//         headerName: "Symbol",
//         field: "symbol",
//         minWidth: 250,
//         filter: "agTextColumnFilter",
//       },
//       { headerName: "Name", field: "name", minWidth: 120 },
//       { headerName: "Instrument", field: "instrumenttype", minWidth: 120 },
//       { headerName: "Lot-Size", field: "lotsize", width: 110 },
//       ...(useKite
//         ? [
//             { headerName: "Kite Token", field: "kiteToken", minWidth: 120 },
//             { headerName: "Kite Symbol", field: "kiteSymbol", minWidth: 180 },
//           ]
//         : [
//             { headerName: "Angel Token", field: "angelToken", minWidth: 120 },
//             { headerName: "Angel Symbol", field: "angelSymbol", minWidth: 180 },
//           ]),
//       { headerName: "Expiry", field: "expiryLabel", minWidth: 130 },
//     ],
//     [useKite]
//   );

//   const defaultColDef = useMemo<ColDef>(
//     () => ({
//       sortable: true,
//       resizable: true,
//       filter: true,
//       floatingFilter: true,
//     }),
//     []
//   );

//   const onGridReady = (e: GridReadyEvent) => {
//     gridApiRef.current = e.api;
//     e.api.sizeColumnsToFit();
//   };

//   // ---------- Debounced search (main grid) ----------
//   useEffect(() => {
//     const id = setTimeout(() => setDebouncedSearch(searchTerm), 150);
//     return () => clearTimeout(id);
//   }, [searchTerm]);

//   const rowMatchesQuery = (row: any, query: string) => {
//     const q = query.trim().toUpperCase();
//     if (!q) return true;

//     const symbol = String(row.symbol || "").toUpperCase();
//     const name = String(row.name || "").toUpperCase();
//     const token = String(row.token || "").toUpperCase();
//     const full = `${symbol} ${name} ${token}`;

//     return full.includes(q);
//   };

//   const filteredData = useMemo(() => {
//     if (!debouncedSearch.trim()) return data;
//     return data.filter((row) => rowMatchesQuery(row, debouncedSearch));
//   }, [data, debouncedSearch]);

//   // ---------- Expiry dropdown: based on expiry or parsed from symbol (today → +6 months) ----------
//   const allExpiryOptions = useMemo(() => {
//     const MONTH_RANGE = 6;
//     const now = new Date();
//     const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//     const maxDate = new Date(
//       startOfToday.getFullYear(),
//       startOfToday.getMonth() + MONTH_RANGE,
//       startOfToday.getDate()
//     );

//     const map = new Map<string, { label: string; date: Date }>();

//     data.forEach((row) => {
//       let d: Date | null = row.expiryDateObj || null;
//       let label: string = row.expiryLabel || "";

//       // ⭐ NEW: fallback to parse from symbol if expiry field was empty
//       if (!d || !label) {
//         const meta = parseOptionMeta(row.symbol || row.kiteSymbol || row.angelSymbol);
//         if (meta) {
//           d = meta.expiryDate;
//           label = meta.expiryLabel;
//         }
//       }

//       if (!d || !label) return;
//       if (d < startOfToday || d > maxDate) return;

//       const key = d.toISOString().slice(0, 10);
//       if (!map.has(key)) {
//         map.set(key, { label, date: d });
//       }
//     });

//     return Array.from(map.entries())
//       .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
//       .map(([key, value]) => ({
//         key,
//         label: value.label,
//       }));
//   }, [data]);

//   // ---------- Filter rows in Add/Edit Scrip modal ----------
//   const scriptFilteredRows = useMemo(() => {
//     let rows = data.filter((row) => {
//       if (useKite) {
        
        
//         return row.kiteSymbol && row.kiteToken;
//       } else {
//         return row.angelSymbol && row.angelToken;
//       }
//     });

      
    

//     // Search by name/symbol/CE/PE
//     const qRaw = scriptSearch.trim().toUpperCase();
//     const tokens = qRaw.split(/\s+/).filter(Boolean);

//     if (tokens.length > 0) {
//       rows = rows.filter((row) => {
//         const symbol = String(row.symbol || "").toUpperCase();
//         const name = String(row.name || "").toUpperCase();
//         // const haystack = `${symbol} ${name}`;
//           const haystack = `${symbol} ${name}`;
//         return tokens.every((t) => haystack.includes(t));
//       });
//     }

//     // ⭐ UPDATED: Chart Symbol (Strike) filter using getOptionMeta
//     const strikeQ = chartSymbolSearch.trim();
//     if (strikeQ) {

//       rows = rows.filter((row:any) => {

//        return (
//           (row.symbol && row.symbol.toUpperCase().includes(strikeQ.toUpperCase())) ||
//           (row.tradingsymbol &&
//             row.tradingsymbol.toUpperCase().includes(strikeQ.toUpperCase()))
//         );
//       });
//     }

//     // ⭐ UPDATED: Expiry filter uses expiryLabel (from field or parsed)
//     if (scriptExpiryFilter) {
//       rows = rows.filter((row) => {
//         if (row.expiryLabel === scriptExpiryFilter) return true;
//         const meta = getOptionMeta(row);
//         return meta?.expiryLabel === scriptExpiryFilter;
//       });
//     }

//     // ⭐ UPDATED: Option Type filter using getOptionMeta (works for Kite + AngelOne)
//     if (scriptOptionFilter) {
//       rows = rows.filter((row) => {
//         const meta = getOptionMeta(row);
//         return meta && meta.optionType === scriptOptionFilter;
//       });
//     }

//     return rows.slice(0, 300);
//   }, [data, scriptSearch, scriptExpiryFilter, scriptOptionFilter, chartSymbolSearch, useKite]);

//   // ---------- Save ----------
//   const handleScriptSave = async () => {
    
//     if (!selectedScriptRow) {
//       toast.error("Please select a scrip from the list");
//       return;
//     }

//     const lotSizeNum = Number(selectedScriptRow.lotsize || 0);
//     const priceNum = Number(selectedScriptRow.price || 0);
//     const slotSizeNum = Number(getslotSIze || 1);

//     //  REQUIRED FIELD CHECKS
//   // -------------------------
//   const requiredFields = [
//     { label: "Token", value: selectedScriptRow.token },
//     { label: "Symbol", value: selectedScriptRow.symbol },
//     { label: "Name", value: selectedScriptRow.name },
//     { label: "Exchange Segment", value: selectedScriptRow.exch_seg },
//     { label: "AngelOne Token", value: selectedScriptRow.angelToken },
//     { label: "AngelOne Symbol", value: selectedScriptRow.angelSymbol },
//     { label: "Kite Token", value: selectedScriptRow.kiteToken },
//     { label: "Kite Symbol", value: selectedScriptRow.kiteSymbol },
//     { label: "Group Name", value: groupName },
//     { label: "Quantity (Lot Size)", value: lotSizeNum },
//     { label: "Product Type)", value: scriptProductType },

    
//   ];

//   console.log(selectedScriptRow.kiteToken,selectedScriptRow.kiteSymbol, groupName,lotSizeNum);
  
//   for (let item of requiredFields) {
//     if (!item.value || item.value === ""|| item.value === " ") {
//       toast.error(`${item.label} is required.`);
//       return;
//     }
//   }



//     const payload = {
//       token: selectedScriptRow.token || "",
//       symbol: selectedScriptRow.symbol || "",
//       name: selectedScriptRow.name || "",
//       exch_seg: selectedScriptRow.exch_seg || "",
//       lotsize: lotSizeNum,
//       instrumenttype: selectedScriptRow.instrumenttype || "",
//       price: priceNum,
//       quantity: lotSizeNum,
//       transactiontype: scriptTxnType,
//       duration,
//       orderType,
//       variety,
//       productType: scriptProductType,
//       totalPrice: priceNum * lotSizeNum,
//       actualQuantity: lotSizeNum / slotSizeNum,
//       searchText: scriptSearch || "",
//       chartSymbol: chartSymbolSearch || "",
//       optionType: scriptOptionFilter || "",
//       expiry: selectedScriptRow.expiry || "",
//       expiryLabel: selectedScriptRow.expiryLabel || "",
//       strategyId: selectedStrategyId || "",
//       groupName: groupName,
//       angelOneToken: selectedScriptRow.angelToken || "",
//       angelOneSymbol: selectedScriptRow.angelSymbol || "",
//       kiteToken: selectedScriptRow.kiteToken || "",
//       kiteSymbol: selectedScriptRow.kiteSymbol || "",
//     };

//     try {
//       const res = await axios.post(
//         `${apiUrl}/admin/multiple/place/order`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         }
//       );

//       if (res?.data?.status === true) {
//         alert(res?.data?.message);
//         setVariety("NORMAL");
//         setDuration("DAY");
//         setOrderType("MARKET");
//         setScriptModalOpen(false);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   // ---------- Selection Handler ----------
//   const handleSelectionInstrument = async (raw: any) => {
    
//     const payload = {
//       exchange: raw.exch_seg,
//       tradingsymbol: raw.symbol,
//       symboltoken: raw.token,
//     };

//     console.log(raw,' instrument',useKite);
    

//     try {
//       await fetchStrategies();

//       if (useKite) {
          
//           setSelectedScriptRow((prev: any) => ({
//               ...(prev || {}),
//               kiteToken: raw.exchange_token ,
//               kiteSymbol: raw.kiteSymbol ,
//               angelToken: prev?.angelToken || "",
//               angelSymbol: prev?.angelSymbol || "",
//               kiteName: raw.name,
//               exch_seg: raw.exchange,
//               lotsize: raw.lotsize,
//               // instrumenttype: raw.instrumenttype,
//               price: 0,
//               expiry: raw.expiry,
//               expiryLabel: raw.expiryLabel,
//               expiryDateObj: raw.expiryDateObj,
//             }));

//             setSlotSIze(raw.lotsize);

//       } else {
//         try {
//           const res = await axios.post(
//             `${apiUrl}/agnelone/instrument/ltp`,
//             payload,
//             {
//               headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//                 AngelOneToken: localStorage.getItem("angel_token") || "",
//                 userid: localStorage.getItem("userID"),
//               },
//             }
//           );

//           if (res?.data?.status === true) {
//             const ltp = res?.data?.data?.data?.ltp || raw.price || 0;

//             setSelectedScriptRow((prev: any) => ({
//               ...(prev || {}),
//               angelToken: raw.angelToken || raw.token,
//               angelSymbol: raw.angelSymbol || raw.symbol,
//               kiteToken: prev?.kiteToken || "",
//               kiteSymbol: prev?.kiteSymbol || "",
//               token: raw.token,
//               symbol: raw.symbol,
//               name: raw.name,
//               exch_seg: raw.exch_seg,
//               lotsize: raw.lotsize,
//               instrumenttype: raw.instrumenttype,
//               price: ltp,
//               expiry: raw.expiry,
//               expiryLabel: raw.expiryLabel,
//               expiryDateObj: raw.expiryDateObj,
//             }));

//             setSlotSIze(raw.lotsize);
//           } else {
//             toast.error(res?.data?.message || "Something went wrong");
//           }
//         } catch (err: any) {
//           console.error(err);
//           toast.error(err.message || "Something went wrong");
//         }
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   // ---------- JSX ----------
//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <h2 className="text-xl font-semibold mb-4">Nifty Bank Instruments</h2>

//       <div className="flex justify-between items-center mb-4 gap-4">
//         <div className="w-full sm:w-80">
//           <input
//             type="text"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             placeholder='Search (e.g. "NIFTY02DEC2525800PE" or "NIFTY")'
//             className="border p-2 w-full rounded"
//           />
//         </div>

//         <div className="flex items-center gap-4">
//           <label className="flex items-center gap-2">
//             <input
//               type="checkbox"
//               checked={useKite}
//               onChange={(e) => setUseKite(e.target.checked)}
//               className="h-4 w-4"
//             />
//             Use Kite Instruments
//           </label>

//           <button
//             className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
//             onClick={handleOpenScriptModal}
//           >
//             Add/Edit
//           </button>
//         </div>
//       </div>

//       {loading && <p>Loading data...</p>}
//       {error && <p className="text-red-500">{error}</p>}
//       {!loading && !error && filteredData.length === 0 && <p>No data found.</p>}

//       {filteredData.length > 0 && (
//         <div className="ag-theme-quartz compact-grid" style={{ height: 540, width: "100%" }}>
//           <AgGridReact
//             rowData={filteredData}
//             columnDefs={columnDefs}
//             defaultColDef={defaultColDef}
//             animateRows
//             rowSelection="single"
//             pagination
//             paginationPageSize={10000}
//             rowHeight={34}
//             suppressFieldDotNotation
//             onGridReady={onGridReady}
//           />
//         </div>
//       )}

//       {scriptModalOpen && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999999]">
//           <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl mx-3">
//             <div className="max-h-[90vh] overflow-y-auto p-6">
//               {/* Header */}
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-lg font-semibold">Add / Edit Scrip</h3>
//                 <button
//                   onClick={() => setScriptModalOpen(false)}
//                   className="text-gray-500 hover:text-black text-xl leading-none"
//                 >
//                   ×
//                 </button>
//               </div>

//               {/* SECTION 1: Scrip Details & Search */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <div className="flex items-center justify-between mb-3">
//                   <h4 className="text-sm font-semibold text-gray-700">
//                     Scrip Details & Search
//                   </h4>

//                   <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
//                     <input
//                       type="checkbox"
//                       checked={useKite}
//                       onChange={(e) => setUseKite(e.target.checked)}
//                       className="h-4 w-4"
//                     />
//                     Search in Kite Instruments (unchecked = AngelOne)
//                   </label>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Terminal Symbol (AngelOne)
//                     </label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.angelSymbol || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Terminal Symbol (Kite)
//                     </label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.kiteSymbol || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Token (AngelOne)
//                     </label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.angelToken || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Token (Kite)
//                     </label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.kiteToken || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Last Traded Price
//                     </label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.price || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Search Name / Symbol / CE / PE
//                     </label>
//                     <input
//                       type="text"
//                       value={scriptSearch}
//                       onChange={(e) => setScriptSearch(e.target.value)}
//                       placeholder="e.g. NIFTY 26150 CE"
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Chart Symbol (Strike)
//                     </label>
//                     <input
//                       type="text"
//                       placeholder="e.g. 26150"
//                       value={chartSymbolSearch}
//                       onChange={(e) => setChartSymbolSearch(e.target.value)}
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* SECTION 2: Filters & Order Settings */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <h4 className="text-sm font-semibold text-gray-700 mb-3">
//                   Filters & Order Settings
//                 </h4>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Option Type
//                     </label>
//                     <select
//                       value={scriptOptionFilter}
//                       onChange={(e) =>
//                         setScriptOptionFilter(e.target.value as "" | "CE" | "PE")
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">ALL</option>
//                       <option value="CE">CE (Call)</option>
//                       <option value="PE">PE (Put)</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Expiry (next 6 months)
//                     </label>
//                     <select
//                       value={scriptExpiryFilter}
//                       onChange={(e) => setScriptExpiryFilter(e.target.value)}
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">All Expiries</option>
//                       {allExpiryOptions.map((exp) => (
//                         <option key={exp.key} value={exp.label}>
//                           {exp.label}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Transaction Type
//                     </label>
//                     <select
//                       value={scriptTxnType}
//                       onChange={(e) =>
//                         setScriptTxnType(e.target.value as "" | "BUY" | "SELL")
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="BUY">BUY</option>
//                       <option value="SELL">SELL</option>
//                     </select>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Order Type
//                     </label>
//                     <select
//                       value={orderType}
//                       onChange={(e) => setOrderType(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Order Type</option>
//                       <option value="MARKET">MARKET</option>
//                       <option value="LIMIT">LIMIT</option>
//                       <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT</option>
//                       <option value="STOPLOSS_MARKET">STOPLOSS_MARKET</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Duration
//                     </label>
//                     <select
//                       value={duration}
//                       onChange={(e) => setDuration(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Duration</option>
//                       <option value="DAY">DAY</option>
//                       <option value="IOC">IOC</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Variety
//                     </label>
//                     <select
//                       value={variety}
//                       onChange={(e) => setVariety(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Variety</option>
//                       <option value="NORMAL">NORMAL</option>
//                       <option value="STOPLOSS">STOPLOSS</option>
//                       <option value="ROBO">ROBO</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* SECTION 3: Product & Strategy */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <h4 className="text-sm font-semibold text-gray-700 mb-3">
//                   Product & Strategy
//                 </h4>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Product Type
//                     </label>
//                     <select
//                       value={scriptProductType}
//                       onChange={(e) =>
//                         setScriptProductType(
//                           e.target.value as "" | "INTRADAY" | "DELIVERY"
//                         )
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">Select</option>
//                       <option value="INTRADAY">IntraDay MIS</option>
//                       <option value="DELIVERY">Longterm CNC</option>
//                       <option value="CARRYFORWARD">CARRYFORWARD</option>
//                       <option value="BO">Bracket Order </option>
//                       <option value="MARGIN">Margin Delivery</option>

//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Quantity in Lot
//                     </label>
//                     <input
//                       type="number"
//                       placeholder="Enter Quantity in Lot"
//                       value={selectedScriptRow?.lotsize || ""}
//                       onChange={(e) =>
//                         setSelectedScriptRow((prev: any) => ({
//                           ...(prev || {}),
//                           lotsize: e.target.value,
//                         }))
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm bg-white focus:ring-2 focus:ring-blue-500"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Select Strategy *
//                     </label>
//                     <select
//                       className="w-full border rounded px-3 py-2 text-sm"
//                       value={selectedStrategyId}
//                       onChange={(e) => {
//                         const strategyId = e.target.value;
//                         setSelectedStrategyId(strategyId);

//                         const selected: any = strategyList.find(
//                           (s: any) => s.id == strategyId
//                         );

//                         if (selected) {
//                           setGroupName(selected.strategyName);
//                         } else {
//                           setGroupName("");
//                         }
//                       }}
//                     >
//                       <option value="">Select Strategy</option>
//                       {strategyList.map((s: any) => (
//                         <option value={s.id} key={s.id}>
//                           {s.strategyName}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* SECTION 4: Result list */}
//               <div className="border border-gray-200 rounded-lg mb-6">
//                 <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
//                   <span className="text-xs font-semibold text-gray-600">
//                     Search Results (click to select)
//                   </span>
//                 </div>

//                 <div className="max-h-64 overflow-auto">
//                   <table className="w-full text-sm">
//                     <thead className="bg-gray-100 sticky top-0">
//                       <tr>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Symbol
//                         </th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Name
//                         </th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Token
//                         </th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Lot
//                         </th>
//                       </tr>
//                     </thead>

//                     <tbody>
//                       {scriptFilteredRows.map((row) => (
//                         <tr
//                           key={`${row.token}-${row.symbol}`}
//                           className={`cursor-pointer transition-colors ${
//                             selectedScriptRow?.token === row.token ||
//                             selectedScriptRow?.kiteToken === row.token ||
//                             selectedScriptRow?.angelToken === row.token
//                               ? "bg-purple-100"
//                               : "hover:bg-purple-50"
//                           }`}
//                           onClick={() => handleSelectionInstrument(row)}
//                         >
//                           <td className="px-3 py-1">{row.symbol}</td>
//                           <td className="px-3 py-1">{row.name}</td>
//                           <td className="px-3 py-1">{row.token}</td>
//                           <td className="px-3 py-1">{row.lotsize}</td>
//                         </tr>
//                       ))}

//                       {scriptFilteredRows.length === 0 && (
//                         <tr>
//                           <td
//                             className="px-3 py-3 text-center text-gray-500"
//                             colSpan={4}
//                           >
//                             No matching scrips found.
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>

//               {/* Footer buttons */}
//               <div className="flex justify-end gap-3">
//                 <button
//                   onClick={() => {
//                     setScriptSearch("");
//                     setScriptExpiryFilter("");
//                     setScriptOptionFilter("");
//                     setChartSymbolSearch("");
//                     setSelectedScriptRow(null);
//                     setScriptTxnType("BUY");
//                     setScriptProductType("");
//                     setSelectedStrategyId("");
//                     setGroupName("");
//                   }}
//                   className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded text-sm"
//                 >
//                   Reset
//                 </button>

//                 <button
//                   onClick={() => setScriptModalOpen(false)}
//                   className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded text-sm"
//                 >
//                   Close
//                 </button>

//                 <button
//                   onClick={handleScriptSave}
//                   className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded text-sm font-medium"
//                 >
//                   Save changes
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


// import { useState, useEffect, useRef, useMemo } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { ModuleRegistry } from "ag-grid-community";
// import { AllCommunityModule } from "ag-grid-community";
// ModuleRegistry.registerModules([AllCommunityModule]);
// import { AgGridReact } from "ag-grid-react";
// import type { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";

// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-quartz.css";

// export default function InstrumentFormAdmin() {
//   const apiUrl = import.meta.env.VITE_API_URL;

//   const [data, setData] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const [getslotSIze, setSlotSIze] = useState("");

//   const [duration, setDuration] = useState("DAY");
//   const [orderType, setOrderType] = useState("MARKET");
//   const [variety, setVariety] = useState("NORMAL");

//   const [searchTerm, setSearchTerm] = useState("");
//   const [debouncedSearch, setDebouncedSearch] = useState("");

//   const gridApiRef = useRef<GridApi | null>(null);

//   const [groupName, setGroupName] = useState("");
//   const [strategyList, setStrategyList] = useState<any[]>([]);
//   const [selectedStrategyId, setSelectedStrategyId] = useState("");

//   const [scriptModalOpen, setScriptModalOpen] = useState(false);
//   const [scriptSearch, setScriptSearch] = useState("");
//   const [scriptExpiryFilter, setScriptExpiryFilter] = useState("");
//   const [scriptOptionFilter, setScriptOptionFilter] = useState<"" | "CE" | "PE">("");
//   const [selectedScriptRow, setSelectedScriptRow] = useState<any | null>(null);
//   const [chartSymbolSearch, setChartSymbolSearch] = useState("");
//   const [scriptTxnType, setScriptTxnType] = useState<"" | "BUY" | "SELL">("BUY");
//   const [scriptProductType, setScriptProductType] = useState<"" | "INTRADAY" | "DELIVERY">("INTRADAY");

//   const [useKite, setUseKite] = useState(false);

//   // ---------- Common expiry normalizer ----------
//   const buildExpiryMeta = (rawExpiry: any) => {
//     if (!rawExpiry) return { expiryDateObj: null, expiryLabel: "" };

//     const s = String(rawExpiry).trim();
//     if (!s) return { expiryDateObj: null, expiryLabel: "" };

//     let d: Date | null = null;

//     // 1) YYYY-MM-DD  (Kite)
//     if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
//       d = new Date(s + "T00:00:00");
//     }
//     // 2) DD-MMM-YYYY / DD-MMM-YY (AngelOne etc.)
//     else if (/^\d{2}-[A-Za-z]{3}-\d{2,4}$/.test(s)) {
//       const [ddStr, monStrRaw, yyStr] = s.split("-");
//       const dd = Number(ddStr);
//       const monStr = monStrRaw.toUpperCase();
//       const monthMap: Record<string, number> = {
//         JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
//         JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
//       };
//       const monthIndex = monthMap[monStr];
//       if (monthIndex !== undefined) {
//         let yearNum = Number(yyStr);
//         if (yyStr.length === 2) {
//           yearNum = 2000 + yearNum;
//         }
//         d = new Date(yearNum, monthIndex, dd);
//       }
//     }
//     // 3) Fallback: native Date parse
//     else {
//       const t = new Date(s);
//       if (!isNaN(t.getTime())) d = t;
//     }

//     if (!d) return { expiryDateObj: null, expiryLabel: "" };

//     const day = d.getDate().toString().padStart(2, "0");
//     const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
//     const label = `${day}-${monthNames[d.getMonth()]}-${d.getFullYear()}`;

//     return { expiryDateObj: d, expiryLabel: label };
//   };

//   // ---------- Parse option symbol (only for strike & CE/PE) ----------
//   // Works for NIFTY02DEC2525800PE, NIFTY25NOV24500CE etc.
//   const parseOptionMeta = (symbolRaw: any) => {
//     const symbol = String(symbolRaw || "").toUpperCase();

//     // e.g. NIFTY02DEC2525800PE  or  NIFTY25NOV24500CE
//     const re = /^([A-Z]+)(\d{2})([A-Z]{3})(\d{2})(\d+)(CE|PE)$/;
//     const m = symbol.match(re);
//     if (!m) return null;

//     const [, underlying, dd, monStr, yy, strike, optType] = m;

//     const monthMap: Record<string, number> = {
//       JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
//       JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
//     };
//     const monthIndex = monthMap[monStr];
//     if (monthIndex === undefined) return null;

//     const year = 2000 + Number(yy);
//     const day = Number(dd);
//     const dateObj = new Date(year, monthIndex, day);

//     const expiryLabel = `${day.toString().padStart(2, "0")}-${monStr}-${year}`;

//     return {
//       underlying,
//       expiryLabel,
//       expiryDate: dateObj,
//       strike: Number(strike),
//       optionType: optType as "CE" | "PE",
//     };
//   };

//   // ⭐ NEW: helper that always tries to extract strike / optionType / expiry
//   const getOptionMeta = (row: any) => {
//     const mainSymbol = row.symbol || row.kiteSymbol || row.angelSymbol || "";

//     console.log(row,'mainSymbol');
    
//     const fromSymbol = parseOptionMeta(mainSymbol);
//     if (fromSymbol) return fromSymbol;

//     const name = String(row.name || "").toUpperCase();
//     const optMatch = name.match(/\b(CE|PE)\b/);
//     const strikeMatches = name.match(/(\d+)/g);

//     return {
//       underlying: "",
//       expiryLabel: row.expiryLabel || "",
//       expiryDate: row.expiryDateObj || null,
//       strike: strikeMatches
//         ? Number(strikeMatches[strikeMatches.length - 1])
//         : row.strike || 0,
//       optionType: (optMatch?.[1] as "CE" | "PE") || (row.syType as "CE" | "PE"),
//     };
//   };

//   // ---------- NORMALIZERS (AngelOne & Kite) ----------
//   const mapAngelToCommon = (row: any) => {
//     const { expiryDateObj, expiryLabel } = buildExpiryMeta(row.expiry);

//     return {
//       ...row,
//       token: String(row.token ?? ""),
//       symbol: String(row.symbol ?? ""),
//       name: row.name ?? "",
//       expiry: row.expiry ?? "",
//       strike: row.strike !== undefined ? Number(row.strike) : -1,
//       lotsize: row.lotsize !== undefined ? Number(row.lotsize) : 0,
//       instrumenttype: row.instrumenttype ?? "",
//       exch_seg: row.exch_seg ?? "",
//       tick_size: row.tick_size !== undefined ? Number(row.tick_size) : 0,
//       syType: row.instrumenttype ?? row.syType ?? "",
//       angelToken: String(row.token ?? ""),
//       angelSymbol: String(row.symbol ?? ""),
//       kiteToken: row.kiteToken ?? "",
//       kiteSymbol: row.kiteSymbol ?? "",
//       expiryDateObj,
//       expiryLabel,
//     };
//   };

//   const mapKiteToCommon = (row: any) => {
//     const { expiryDateObj, expiryLabel } = buildExpiryMeta(row.expiry);

//     // Try to derive strike if missing
//     let strike = row.strike;
//     if (!strike) {
//       const metaFromSymbol = parseOptionMeta(row.tradingsymbol);
//       if (metaFromSymbol) {
//         strike = metaFromSymbol.strike;
//       } else {
//         const m = String(row.name || "").match(/\d+/);
//         strike = m ? Number(m[0]) : 0;
//       }
//     }


    

//     return {
//       ...row,
//       token: String(row.exchange_token ?? ""),
//       symbol: String(row.tradingsymbol ?? ""),
//       name: row.name ?? "",
//       expiry: row.expiry ?? "",
//       strike: Number(strike),
//       lotsize: row.lot_size !== undefined ? Number(row.lot_size) : 0,
//       instrumenttype: row.instrument_type ?? "",
//       exch_seg: row.segment ?? row.exchange ?? "",
//       tick_size: row.tick_size !== undefined ? Number(row.tick_size) : 0,
//       syType: row.instrument_type ?? "",
//       kiteToken: String(row.exchange_token ?? ""),
//       kiteSymbol: String(row.tradingsymbol ?? ""),
//       angelToken: row.angelToken ?? "",
//       angelSymbol: row.angelSymbol ?? "",
//       expiryDateObj,
//       expiryLabel,
//     };
//   };

//   // ---------- Fetch instruments (AngelOne or Kite) ----------
//   const fetchData = async () => {
//     setLoading(true);
//     setError("");

//     try {
//       const endpoint = useKite ? "/kite/instrument" : "/agnelone/instrument";
//       const res = await axios.get(`${apiUrl}${endpoint}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });

//       if (res?.data?.status === true) {
//         const rawData = res?.data?.data || [];

//         const normalized = useKite
//           ? rawData.map((row: any) => mapKiteToCommon(row))
//           : rawData.map((row: any) => mapAngelToCommon(row));

//         setData(normalized);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err?.message || "Something went wrong");
//       setError(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------- Fetch strategies ----------
//   const fetchStrategies = async () => {
//     try {
//       const res = await axios.get(`${apiUrl}/admin/strategies`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID"),
//         },
//       });

//       if (res.data.status === true) {
//         setStrategyList(res.data.data || []);
//       } else {
//         toast.error(res.data.message);
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//     fetchStrategies();
//     setSearchTerm("");
//   }, [useKite]);

//   // ---------- Open Add/Edit Scrip modal ----------
//   const handleOpenScriptModal = () => {
//     setSelectedScriptRow(null);
//     setScriptModalOpen(true);
//     setScriptSearch("");
//     setChartSymbolSearch("");
//     setScriptExpiryFilter("");
//     setScriptOptionFilter("");
//     setScriptTxnType("BUY");
//     setScriptProductType("");
//     setSelectedStrategyId("");
//     setGroupName("");
//   };

//   // ---------- AG Grid ----------
//   const columnDefs = useMemo<ColDef[]>(
//     () => [
//       { headerName: "Token", field: "token", minWidth: 80 },
//       { headerName: "Type", field: "syType", minWidth: 80 },
//       {
//         headerName: "Symbol",
//         field: "symbol",
//         minWidth: 250,
//         filter: "agTextColumnFilter",
//       },
//       { headerName: "Name", field: "name", minWidth: 120 },
//       { headerName: "Instrument", field: "instrumenttype", minWidth: 120 },
//       { headerName: "Lot-Size", field: "lotsize", width: 110 },
//       ...(useKite
//         ? [
//             { headerName: "Kite Token", field: "kiteToken", minWidth: 120 },
//             { headerName: "Kite Symbol", field: "kiteSymbol", minWidth: 180 },
//           ]
//         : [
//             { headerName: "Angel Token", field: "angelToken", minWidth: 120 },
//             { headerName: "Angel Symbol", field: "angelSymbol", minWidth: 180 },
//           ]),
//       { headerName: "Expiry", field: "expiryLabel", minWidth: 130 },
//     ],
//     [useKite]
//   );

//   const defaultColDef = useMemo<ColDef>(
//     () => ({
//       sortable: true,
//       resizable: true,
//       filter: true,
//       floatingFilter: true,
//     }),
//     []
//   );

//   const onGridReady = (e: GridReadyEvent) => {
//     gridApiRef.current = e.api;
//     e.api.sizeColumnsToFit();
//   };

//   // ---------- Debounced search (main grid) ----------
//   useEffect(() => {
//     const id = setTimeout(() => setDebouncedSearch(searchTerm), 150);
//     return () => clearTimeout(id);
//   }, [searchTerm]);

//   const rowMatchesQuery = (row: any, query: string) => {
//     const q = query.trim().toUpperCase();
//     if (!q) return true;

//     const symbol = String(row.symbol || "").toUpperCase();
//     const name = String(row.name || "").toUpperCase();
//     const token = String(row.token || "").toUpperCase();
//     const full = `${symbol} ${name} ${token}`;

//     return full.includes(q);
//   };

//   const filteredData = useMemo(() => {
//     if (!debouncedSearch.trim()) return data;
//     return data.filter((row) => rowMatchesQuery(row, debouncedSearch));
//   }, [data, debouncedSearch]);

//   // ---------- Expiry dropdown: based on expiry or parsed from symbol (today → +6 months) ----------
//   const allExpiryOptions = useMemo(() => {
//     const MONTH_RANGE = 6;
//     const now = new Date();
//     const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//     const maxDate = new Date(
//       startOfToday.getFullYear(),
//       startOfToday.getMonth() + MONTH_RANGE,
//       startOfToday.getDate()
//     );

//     const map = new Map<string, { label: string; date: Date }>();

//     data.forEach((row) => {
//       let d: Date | null = row.expiryDateObj || null;
//       let label: string = row.expiryLabel || "";

//       // ⭐ NEW: fallback to parse from symbol if expiry field was empty
//       if (!d || !label) {
//         const meta = parseOptionMeta(row.symbol || row.kiteSymbol || row.angelSymbol);
//         if (meta) {
//           d = meta.expiryDate;
//           label = meta.expiryLabel;
//         }
//       }

//       if (!d || !label) return;
//       if (d < startOfToday || d > maxDate) return;

//       const key = d.toISOString().slice(0, 10);
//       if (!map.has(key)) {
//         map.set(key, { label, date: d });
//       }
//     });

//     return Array.from(map.entries())
//       .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
//       .map(([key, value]) => ({
//         key,
//         label: value.label,
//       }));
//   }, [data]);

//   // ---------- Filter rows in Add/Edit Scrip modal ----------
//   const scriptFilteredRows = useMemo(() => {
//     let rows = data.filter((row) => {
//       if (useKite) {
        
        
//         return row.kiteSymbol && row.kiteToken;
//       } else {
//         return row.angelSymbol && row.angelToken;
//       }
//     });

      
    

//     // Search by name/symbol/CE/PE
//     const qRaw = scriptSearch.trim().toUpperCase();
//     const tokens = qRaw.split(/\s+/).filter(Boolean);

//     if (tokens.length > 0) {
//       rows = rows.filter((row) => {
//         const symbol = String(row.symbol || "").toUpperCase();
//         const name = String(row.name || "").toUpperCase();
//         // const haystack = `${symbol} ${name}`;
//           const haystack = `${symbol} ${name}`;
//         return tokens.every((t) => haystack.includes(t));
//       });
//     }

//     // ⭐ UPDATED: Chart Symbol (Strike) filter using getOptionMeta
//     const strikeQ = chartSymbolSearch.trim();
//     if (strikeQ) {

//       rows = rows.filter((row:any) => {

//        return (
//           (row.symbol && row.symbol.toUpperCase().includes(strikeQ.toUpperCase())) ||
//           (row.tradingsymbol &&
//             row.tradingsymbol.toUpperCase().includes(strikeQ.toUpperCase()))
//         );
//       });
//     }

//     // ⭐ UPDATED: Expiry filter uses expiryLabel (from field or parsed)
//     if (scriptExpiryFilter) {
//       rows = rows.filter((row) => {
//         if (row.expiryLabel === scriptExpiryFilter) return true;
//         const meta = getOptionMeta(row);
//         return meta?.expiryLabel === scriptExpiryFilter;
//       });
//     }

//     // ⭐ UPDATED: Option Type filter using getOptionMeta (works for Kite + AngelOne)
//     if (scriptOptionFilter) {
//       rows = rows.filter((row) => {
//         const meta = getOptionMeta(row);
//         return meta && meta.optionType === scriptOptionFilter;
//       });
//     }

//     return rows.slice(0, 300);
//   }, [data, scriptSearch, scriptExpiryFilter, scriptOptionFilter, chartSymbolSearch, useKite]);

//   // ---------- Save ----------
//   const handleScriptSave = async () => {
    
//     if (!selectedScriptRow) {
//       toast.error("Please select a scrip from the list");
//       return;
//     }

//     const lotSizeNum = Number(selectedScriptRow.lotsize || 0);
//     const priceNum = Number(selectedScriptRow.price || 0);
//     const slotSizeNum = Number(getslotSIze || 1);

//     //  REQUIRED FIELD CHECKS
//   // -------------------------
//   const requiredFields = [
//     { label: "Token", value: selectedScriptRow.token },
//     { label: "Symbol", value: selectedScriptRow.symbol },
//     { label: "Name", value: selectedScriptRow.name },
//     { label: "Exchange Segment", value: selectedScriptRow.exch_seg },
//     { label: "AngelOne Token", value: selectedScriptRow.angelToken },
//     { label: "AngelOne Symbol", value: selectedScriptRow.angelSymbol },
//     { label: "Kite Token", value: selectedScriptRow.kiteToken },
//     { label: "Kite Symbol", value: selectedScriptRow.kiteSymbol },
//     { label: "Group Name", value: groupName },
//     { label: "Quantity (Lot Size)", value: lotSizeNum },
//     { label: "Product Type)", value: scriptProductType },

    
//   ];

//   console.log(selectedScriptRow.kiteToken,selectedScriptRow.kiteSymbol, groupName,lotSizeNum);
  
//   for (let item of requiredFields) {
//     if (!item.value || item.value === ""|| item.value === " ") {
//       toast.error(`${item.label} is required.`);
//       return;
//     }
//   }



//     const payload = {
//       token: selectedScriptRow.token || "",
//       symbol: selectedScriptRow.symbol || "",
//       name: selectedScriptRow.name || "",
//       exch_seg: selectedScriptRow.exch_seg || "",
//       lotsize: lotSizeNum,
//       instrumenttype: selectedScriptRow.instrumenttype || "",
//       price: priceNum,
//       quantity: lotSizeNum,
//       transactiontype: scriptTxnType,
//       duration,
//       orderType,
//       variety,
//       productType: scriptProductType,
//       totalPrice: priceNum * lotSizeNum,
//       actualQuantity: lotSizeNum / slotSizeNum,
//       searchText: scriptSearch || "",
//       chartSymbol: chartSymbolSearch || "",
//       optionType: scriptOptionFilter || "",
//       expiry: selectedScriptRow.expiry || "",
//       expiryLabel: selectedScriptRow.expiryLabel || "",
//       strategyId: selectedStrategyId || "",
//       groupName: groupName,
//       angelOneToken: selectedScriptRow.angelToken || "",
//       angelOneSymbol: selectedScriptRow.angelSymbol || "",
//       kiteToken: selectedScriptRow.kiteToken || "",
//       kiteSymbol: selectedScriptRow.kiteSymbol || "",
//     };

//     try {
//       const res = await axios.post(
//         `${apiUrl}/admin/multiple/place/order`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         }
//       );

//       if (res?.data?.status === true) {
//         alert(res?.data?.message);
//         setVariety("NORMAL");
//         setDuration("DAY");
//         setOrderType("MARKET");
//         setScriptModalOpen(false);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   // ---------- Selection Handler ----------
//   const handleSelectionInstrument = async (raw: any) => {
    
//     const payload = {
//       exchange: raw.exch_seg,
//       tradingsymbol: raw.symbol,
//       symboltoken: raw.token,
//     };

//     console.log(raw,' instrument',useKite);
    

//     try {
//       await fetchStrategies();

//       if (useKite) {
          
//           setSelectedScriptRow((prev: any) => ({
//               ...(prev || {}),
//               kiteToken: raw.exchange_token ,
//               kiteSymbol: raw.kiteSymbol ,
//               angelToken: prev?.angelToken || "",
//               angelSymbol: prev?.angelSymbol || "",
//               kiteName: raw.name,
//               exch_seg: raw.exchange,
//               lotsize: raw.lotsize,
//               // instrumenttype: raw.instrumenttype,
//               price: 0,
//               expiry: raw.expiry,
//               expiryLabel: raw.expiryLabel,
//               expiryDateObj: raw.expiryDateObj,
//             }));

//             setSlotSIze(raw.lotsize);

//       } else {
//         try {
//           const res = await axios.post(
//             `${apiUrl}/agnelone/instrument/ltp`,
//             payload,
//             {
//               headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//                 AngelOneToken: localStorage.getItem("angel_token") || "",
//                 userid: localStorage.getItem("userID"),
//               },
//             }
//           );

//           if (res?.data?.status === true) {
//             const ltp = res?.data?.data?.data?.ltp || raw.price || 0;

//             setSelectedScriptRow((prev: any) => ({
//               ...(prev || {}),
//               angelToken: raw.angelToken || raw.token,
//               angelSymbol: raw.angelSymbol || raw.symbol,
//               kiteToken: prev?.kiteToken || "",
//               kiteSymbol: prev?.kiteSymbol || "",
//               token: raw.token,
//               symbol: raw.symbol,
//               name: raw.name,
//               exch_seg: raw.exch_seg,
//               lotsize: raw.lotsize,
//               instrumenttype: raw.instrumenttype,
//               price: ltp,
//               expiry: raw.expiry,
//               expiryLabel: raw.expiryLabel,
//               expiryDateObj: raw.expiryDateObj,
//             }));

//             setSlotSIze(raw.lotsize);
//           } else {
//             toast.error(res?.data?.message || "Something went wrong");
//           }
//         } catch (err: any) {
//           console.error(err);
//           toast.error(err.message || "Something went wrong");
//         }
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   // ---------- JSX ----------
//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <h2 className="text-xl font-semibold mb-4">Nifty Bank Instruments</h2>

//       <div className="flex justify-between items-center mb-4 gap-4">
//         <div className="w-full sm:w-80">
//           <input
//             type="text"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             placeholder='Search (e.g. "NIFTY02DEC2525800PE" or "NIFTY")'
//             className="border p-2 w-full rounded"
//           />
//         </div>

//         <div className="flex items-center gap-4">
//           <label className="flex items-center gap-2">
//             <input
//               type="checkbox"
//               checked={useKite}
//               onChange={(e) => setUseKite(e.target.checked)}
//               className="h-4 w-4"
//             />
//             Use Kite Instruments
//           </label>

//           <button
//             className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
//             onClick={handleOpenScriptModal}
//           >
//             Add/Edit
//           </button>
//         </div>
//       </div>

//       {loading && <p>Loading data...</p>}
//       {error && <p className="text-red-500">{error}</p>}
//       {!loading && !error && filteredData.length === 0 && <p>No data found.</p>}

//       {filteredData.length > 0 && (
//         <div className="ag-theme-quartz compact-grid" style={{ height: 540, width: "100%" }}>
//           <AgGridReact
//             rowData={filteredData}
//             columnDefs={columnDefs}
//             defaultColDef={defaultColDef}
//             animateRows
//             rowSelection="single"
//             pagination
//             paginationPageSize={10000}
//             rowHeight={34}
//             suppressFieldDotNotation
//             onGridReady={onGridReady}
//           />
//         </div>
//       )}

//       {scriptModalOpen && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999999]">
//           <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl mx-3">
//             <div className="max-h-[90vh] overflow-y-auto p-6">
//               {/* Header */}
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-lg font-semibold">Add / Edit Scrip</h3>
//                 <button
//                   onClick={() => setScriptModalOpen(false)}
//                   className="text-gray-500 hover:text-black text-xl leading-none"
//                 >
//                   ×
//                 </button>
//               </div>

//               {/* SECTION 1: Scrip Details & Search */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <div className="flex items-center justify-between mb-3">
//                   <h4 className="text-sm font-semibold text-gray-700">
//                     Scrip Details & Search
//                   </h4>

//                   <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
//                     <input
//                       type="checkbox"
//                       checked={useKite}
//                       onChange={(e) => setUseKite(e.target.checked)}
//                       className="h-4 w-4"
//                     />
//                     Search in Kite Instruments (unchecked = AngelOne)
//                   </label>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Terminal Symbol (AngelOne)
//                     </label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.angelSymbol || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Terminal Symbol (Kite)
//                     </label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.kiteSymbol || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Token (AngelOne)
//                     </label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.angelToken || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Token (Kite)
//                     </label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.kiteToken || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Last Traded Price
//                     </label>
//                     <input
//                       type="text"
//                       value={selectedScriptRow?.price || ""}
//                       readOnly
//                       className="border rounded px-3 py-2 w-full bg-gray-100 text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Search Name / Symbol / CE / PE
//                     </label>
//                     <input
//                       type="text"
//                       value={scriptSearch}
//                       onChange={(e) => setScriptSearch(e.target.value)}
//                       placeholder="e.g. NIFTY 26150 CE"
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Chart Symbol (Strike)
//                     </label>
//                     <input
//                       type="text"
//                       placeholder="e.g. 26150"
//                       value={chartSymbolSearch}
//                       onChange={(e) => setChartSymbolSearch(e.target.value)}
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* SECTION 2: Filters & Order Settings */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <h4 className="text-sm font-semibold text-gray-700 mb-3">
//                   Filters & Order Settings
//                 </h4>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Option Type
//                     </label>
//                     <select
//                       value={scriptOptionFilter}
//                       onChange={(e) =>
//                         setScriptOptionFilter(e.target.value as "" | "CE" | "PE")
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">ALL</option>
//                       <option value="CE">CE (Call)</option>
//                       <option value="PE">PE (Put)</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Expiry (next 6 months)
//                     </label>
//                     <select
//                       value={scriptExpiryFilter}
//                       onChange={(e) => setScriptExpiryFilter(e.target.value)}
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">All Expiries</option>
//                       {allExpiryOptions.map((exp) => (
//                         <option key={exp.key} value={exp.label}>
//                           {exp.label}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Transaction Type
//                     </label>
//                     <select
//                       value={scriptTxnType}
//                       onChange={(e) =>
//                         setScriptTxnType(e.target.value as "" | "BUY" | "SELL")
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="BUY">BUY</option>
//                       <option value="SELL">SELL</option>
//                     </select>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Order Type
//                     </label>
//                     <select
//                       value={orderType}
//                       onChange={(e) => setOrderType(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Order Type</option>
//                       <option value="MARKET">MARKET</option>
//                       <option value="LIMIT">LIMIT</option>
//                       <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT</option>
//                       <option value="STOPLOSS_MARKET">STOPLOSS_MARKET</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Duration
//                     </label>
//                     <select
//                       value={duration}
//                       onChange={(e) => setDuration(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Duration</option>
//                       <option value="DAY">DAY</option>
//                       <option value="IOC">IOC</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Variety
//                     </label>
//                     <select
//                       value={variety}
//                       onChange={(e) => setVariety(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Variety</option>
//                       <option value="NORMAL">NORMAL</option>
//                       <option value="STOPLOSS">STOPLOSS</option>
//                       <option value="ROBO">ROBO</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* SECTION 3: Product & Strategy */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <h4 className="text-sm font-semibold text-gray-700 mb-3">
//                   Product & Strategy
//                 </h4>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Product Type
//                     </label>
//                     <select
//                       value={scriptProductType}
//                       onChange={(e) =>
//                         setScriptProductType(
//                           e.target.value as "" | "INTRADAY" | "DELIVERY"
//                         )
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">Select</option>
//                       <option value="INTRADAY">IntraDay MIS</option>
//                       <option value="DELIVERY">Longterm CNC</option>
//                       <option value="CARRYFORWARD">CARRYFORWARD</option>
//                       <option value="BO">Bracket Order </option>
//                       <option value="MARGIN">Margin Delivery</option>

//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Quantity in Lot
//                     </label>
//                     <input
//                       type="number"
//                       placeholder="Enter Quantity in Lot"
//                       value={selectedScriptRow?.lotsize || ""}
//                       onChange={(e) =>
//                         setSelectedScriptRow((prev: any) => ({
//                           ...(prev || {}),
//                           lotsize: e.target.value,
//                         }))
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm bg-white focus:ring-2 focus:ring-blue-500"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Select Strategy *
//                     </label>
//                     <select
//                       className="w-full border rounded px-3 py-2 text-sm"
//                       value={selectedStrategyId}
//                       onChange={(e) => {
//                         const strategyId = e.target.value;
//                         setSelectedStrategyId(strategyId);

//                         const selected: any = strategyList.find(
//                           (s: any) => s.id == strategyId
//                         );

//                         if (selected) {
//                           setGroupName(selected.strategyName);
//                         } else {
//                           setGroupName("");
//                         }
//                       }}
//                     >
//                       <option value="">Select Strategy</option>
//                       {strategyList.map((s: any) => (
//                         <option value={s.id} key={s.id}>
//                           {s.strategyName}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* SECTION 4: Result list */}
//               <div className="border border-gray-200 rounded-lg mb-6">
//                 <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
//                   <span className="text-xs font-semibold text-gray-600">
//                     Search Results (click to select)
//                   </span>
//                 </div>

//                 <div className="max-h-64 overflow-auto">
//                   <table className="w-full text-sm">
//                     <thead className="bg-gray-100 sticky top-0">
//                       <tr>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Symbol
//                         </th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Name
//                         </th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Token
//                         </th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Lot
//                         </th>
//                       </tr>
//                     </thead>

//                     <tbody>
//                       {scriptFilteredRows.map((row) => (
//                         <tr
//                           key={`${row.token}-${row.symbol}`}
//                           className={`cursor-pointer transition-colors ${
//                             selectedScriptRow?.token === row.token ||
//                             selectedScriptRow?.kiteToken === row.token ||
//                             selectedScriptRow?.angelToken === row.token
//                               ? "bg-purple-100"
//                               : "hover:bg-purple-50"
//                           }`}
//                           onClick={() => handleSelectionInstrument(row)}
//                         >
//                           <td className="px-3 py-1">{row.symbol}</td>
//                           <td className="px-3 py-1">{row.name}</td>
//                           <td className="px-3 py-1">{row.token}</td>
//                           <td className="px-3 py-1">{row.lotsize}</td>
//                         </tr>
//                       ))}

//                       {scriptFilteredRows.length === 0 && (
//                         <tr>
//                           <td
//                             className="px-3 py-3 text-center text-gray-500"
//                             colSpan={4}
//                           >
//                             No matching scrips found.
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>

//               {/* Footer buttons */}
//               <div className="flex justify-end gap-3">
//                 <button
//                   onClick={() => {
//                     setScriptSearch("");
//                     setScriptExpiryFilter("");
//                     setScriptOptionFilter("");
//                     setChartSymbolSearch("");
//                     setSelectedScriptRow(null);
//                     setScriptTxnType("BUY");
//                     setScriptProductType("");
//                     setSelectedStrategyId("");
//                     setGroupName("");
//                   }}
//                   className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded text-sm"
//                 >
//                   Reset
//                 </button>

//                 <button
//                   onClick={() => setScriptModalOpen(false)}
//                   className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded text-sm"
//                 >
//                   Close
//                 </button>

//                 <button
//                   onClick={handleScriptSave}
//                   className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded text-sm font-medium"
//                 >
//                   Save changes
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }















// import { useState, useEffect, useRef, useMemo } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { ModuleRegistry } from "ag-grid-community";
// import { AllCommunityModule } from "ag-grid-community";
// ModuleRegistry.registerModules([AllCommunityModule]);
// import { AgGridReact } from "ag-grid-react";
// import type { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";

// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-quartz.css";

// export default function InstrumentFormAdmin() {
//   const apiUrl = import.meta.env.VITE_API_URL;

//   const [data, setData] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const [symbolPrefix, setSymbolPrefix] = useState("");

//   const [getslotSIze, setSlotSIze] = useState("");

//   const [duration, setDuration] = useState("DAY");
//   const [orderType, setOrderType] = useState("MARKET");
//   const [variety, setVariety] = useState("NORMAL");

//   const [searchTerm, setSearchTerm] = useState("");
//   const [debouncedSearch, setDebouncedSearch] = useState("");

//   const gridApiRef = useRef<GridApi | null>(null);

//   const [groupName, setGroupName] = useState("");
//   const [strategyList, setStrategyList] = useState<any[]>([]);
//   const [selectedStrategyId, setSelectedStrategyId] = useState("");

//   const [scriptModalOpen, setScriptModalOpen] = useState(false);
//   const [scriptSearch, setScriptSearch] = useState("");
//   const [scriptExpiryFilter, setScriptExpiryFilter] = useState("");
//   const [scriptOptionFilter, setScriptOptionFilter] = useState<"" | "CE" | "PE">("");
//   const [selectedScriptRow, setSelectedScriptRow] = useState<any | null>(null);
//   const [chartSymbolSearch, setChartSymbolSearch] = useState("");
//   const [scriptTxnType, setScriptTxnType] = useState<"" | "BUY" | "SELL">("BUY");
//   const [scriptProductType, setScriptProductType] = useState<
//     "" | "INTRADAY" | "DELIVERY" | "CARRYFORWARD" | "BO" | "MARGIN"
//   >("INTRADAY");

//   const [useKite, setUseKite] = useState(false);

//   // ---------- Common expiry normalizer ----------
//   const buildExpiryMeta = (rawExpiry: any) => {
//     if (!rawExpiry) return { expiryDateObj: null, expiryLabel: "" };

//     const s = String(rawExpiry).trim();
//     if (!s) return { expiryDateObj: null, expiryLabel: "" };

//     let d: Date | null = null;

//     // 1) YYYY-MM-DD  (Kite)
//     if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
//       d = new Date(s + "T00:00:00");
//     }
//     // 2) DD-MMM-YYYY / DD-MMM-YY (AngelOne etc.)
//     else if (/^\d{2}-[A-Za-z]{3}-\d{2,4}$/.test(s)) {
//       const [ddStr, monStrRaw, yyStr] = s.split("-");
//       const dd = Number(ddStr);
//       const monStr = monStrRaw.toUpperCase();
//       const monthMap: Record<string, number> = {
//         JAN: 0,
//         FEB: 1,
//         MAR: 2,
//         APR: 3,
//         MAY: 4,
//         JUN: 5,
//         JUL: 6,
//         AUG: 7,
//         SEP: 8,
//         OCT: 9,
//         NOV: 10,
//         DEC: 11,
//       };
//       const monthIndex = monthMap[monStr];
//       if (monthIndex !== undefined) {
//         let yearNum = Number(yyStr);
//         if (yyStr.length === 2) {
//           yearNum = 2000 + yearNum;
//         }
//         d = new Date(yearNum, monthIndex, dd);
//       }
//     }
//     // 3) Fallback: native Date parse
//     else {
//       const t = new Date(s);
//       if (!isNaN(t.getTime())) d = t;
//     }

//     if (!d) return { expiryDateObj: null, expiryLabel: "" };

//     const day = d.getDate().toString().padStart(2, "0");
//     const monthNames = [
//       "JAN",
//       "FEB",
//       "MAR",
//       "APR",
//       "MAY",
//       "JUN",
//       "JUL",
//       "AUG",
//       "SEP",
//       "OCT",
//       "NOV",
//       "DEC",
//     ];
//     const label = `${day}-${monthNames[d.getMonth()]}-${d.getFullYear()}`;

//     return { expiryDateObj: d, expiryLabel: label };
//   };

//   // ---------- Parse option symbol (only for strike & CE/PE) ----------
//   // Works for NIFTY02DEC2525800PE, NIFTY25NOV24500CE etc.
//   const parseOptionMeta = (symbolRaw: any) => {
//     const symbol = String(symbolRaw || "").toUpperCase();

//     // e.g. NIFTY02DEC2525800PE  or  NIFTY25NOV24500CE
//     const re = /^([A-Z]+)(\d{2})([A-Z]{3})(\d{2})(\d+)(CE|PE)$/;
//     const m = symbol.match(re);
//     if (!m) return null;

//     const [, underlying, dd, monStr, yy, strike, optType] = m;

//     const monthMap: Record<string, number> = {
//       JAN: 0,
//       FEB: 1,
//       MAR: 2,
//       APR: 3,
//       MAY: 4,
//       JUN: 5,
//       JUL: 6,
//       AUG: 7,
//       SEP: 8,
//       OCT: 9,
//       NOV: 10,
//       DEC: 11,
//     };
//     const monthIndex = monthMap[monStr];
//     if (monthIndex === undefined) return null;

//     const year = 2000 + Number(yy);
//     const day = Number(dd);
//     const dateObj = new Date(year, monthIndex, day);

//     const expiryLabel = `${day.toString().padStart(2, "0")}-${monStr}-${year}`;

//     return {
//       underlying,
//       expiryLabel,
//       expiryDate: dateObj,
//       strike: Number(strike),
//       optionType: optType as "CE" | "PE",
//     };
//   };

//   // ⭐ helper that always tries to extract strike / optionType / expiry
//   const getOptionMeta = (row: any) => {
//     const mainSymbol = row.symbol || row.kiteSymbol || row.angelSymbol || "";

//     const fromSymbol = parseOptionMeta(mainSymbol);
//     if (fromSymbol) return fromSymbol;

//     const name = String(row.name || "").toUpperCase();
//     const optMatch = name.match(/\b(CE|PE)\b/);
//     const strikeMatches = name.match(/(\d+)/g);

//     return {
//       underlying: "",
//       expiryLabel: row.expiryLabel || "",
//       expiryDate: row.expiryDateObj || null,
//       strike: strikeMatches
//         ? Number(strikeMatches[strikeMatches.length - 1])
//         : row.strike || 0,
//       optionType: (optMatch?.[1] as "CE" | "PE") || (row.syType as "CE" | "PE"),
//     };
//   };

//   // ---------- NORMALIZERS (AngelOne & Kite) ----------
//   const mapAngelToCommon = (row: any) => {
//     const { expiryDateObj, expiryLabel } = buildExpiryMeta(row.expiry);

//     return {
//       ...row,
//       token: String(row.token ?? ""),
//       symbol: String(row.symbol ?? ""),
//       name: row.name ?? "",
//       expiry: row.expiry ?? "",
//       strike: row.strike !== undefined ? Number(row.strike) : -1,
//       lotsize: row.lotsize !== undefined ? Number(row.lotsize) : 0,
//       instrumenttype: row.instrumenttype ?? "",
//       exch_seg: row.exch_seg ?? "",
//       tick_size: row.tick_size !== undefined ? Number(row.tick_size) : 0,
//       syType: row.instrumenttype ?? row.syType ?? "",
//       angelToken: String(row.token ?? ""),
//       angelSymbol: String(row.symbol ?? ""),
//       kiteToken: row.kiteToken ?? "",
//       kiteSymbol: row.kiteSymbol ?? "",
//       expiryDateObj,
//       expiryLabel,
//     };
//   };

//   const mapKiteToCommon = (row: any) => {
//     const { expiryDateObj, expiryLabel } = buildExpiryMeta(row.expiry);

//     // Try to derive strike if missing
//     let strike = row.strike;
//     if (!strike) {
//       const metaFromSymbol = parseOptionMeta(row.tradingsymbol);
//       if (metaFromSymbol) {
//         strike = metaFromSymbol.strike;
//       } else {
//         const m = String(row.name || "").match(/\d+/);
//         strike = m ? Number(m[0]) : 0;
//       }
//     }

//     return {
//       ...row,
//       token: String(row.exchange_token ?? ""),
//       symbol: String(row.tradingsymbol ?? ""),
//       name: row.name ?? "",
//       expiry: row.expiry ?? "",
//       strike: Number(strike),
//       lotsize: row.lot_size !== undefined ? Number(row.lot_size) : 0,
//       instrumenttype: row.instrument_type ?? "",
//       exch_seg: row.segment ?? row.exchange ?? "",
//       tick_size: row.tick_size !== undefined ? Number(row.tick_size) : 0,
//       syType: row.instrument_type ?? "",
//       kiteToken: String(row.exchange_token ?? ""),
//       kiteSymbol: String(row.tradingsymbol ?? ""),
//       angelToken: row.angelToken ?? "",
//       angelSymbol: row.angelSymbol ?? "",
//       expiryDateObj,
//       expiryLabel,
//     };
//   };

//   // ---------- Fetch instruments (AngelOne or Kite) ----------
//   const fetchData = async () => {
//     setLoading(true);
//     setError("");

//     try {
//       const endpoint = useKite ? "/kite/instrument" : "/agnelone/instrument";
//       const res = await axios.get(`${apiUrl}${endpoint}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });

//       if (res?.data?.status === true) {
//         const rawData = res?.data?.data || [];

//         const normalized = useKite
//           ? rawData.map((row: any) => mapKiteToCommon(row))
//           : rawData.map((row: any) => mapAngelToCommon(row));

//         setData(normalized);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err?.message || "Something went wrong");
//       setError(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------- Fetch strategies ----------
//   const fetchStrategies = async () => {
//     try {
//       const res = await axios.get(`${apiUrl}/admin/strategies`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID"),
//         },
//       });

//       if (res.data.status === true) {
//         setStrategyList(res.data.data || []);
//       } else {
//         toast.error(res.data.message);
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//     fetchStrategies();
//     setSearchTerm("");
//   }, [useKite]);

//   // ---------- Open Add/Edit Scrip modal ----------
//   const handleOpenScriptModal = () => {
//     setSelectedScriptRow(null);
//     setScriptModalOpen(true);
//     setScriptSearch("");
//     setChartSymbolSearch("");
//     setScriptExpiryFilter("");
//     setScriptOptionFilter("");
//     setScriptTxnType("BUY");
//     setScriptProductType("");
//     setSelectedStrategyId("");
//     setGroupName("");
//     setSymbolPrefix("");
//   };

//   // ---------- AG Grid ----------
//   const columnDefs = useMemo<ColDef[]>(
//     () => [
//       { headerName: "Token", field: "token", minWidth: 80 },
//       { headerName: "Type", field: "syType", minWidth: 80 },
//       {
//         headerName: "Symbol",
//         field: "symbol",
//         minWidth: 250,
//         filter: "agTextColumnFilter",
//       },
//       { headerName: "Name", field: "name", minWidth: 120 },
//       { headerName: "Instrument", field: "instrumenttype", minWidth: 120 },
//       { headerName: "Lot-Size", field: "lotsize", width: 110 },
//       ...(useKite
//         ? [
//             { headerName: "Kite Token", field: "kiteToken", minWidth: 120 },
//             { headerName: "Kite Symbol", field: "kiteSymbol", minWidth: 180 },
//           ]
//         : [
//             { headerName: "Angel Token", field: "angelToken", minWidth: 120 },
//             { headerName: "Angel Symbol", field: "angelSymbol", minWidth: 180 },
//           ]),
//       { headerName: "Expiry", field: "expiryLabel", minWidth: 130 },
//     ],
//     [useKite]
//   );

//   const defaultColDef = useMemo<ColDef>(
//     () => ({
//       sortable: true,
//       resizable: true,
//       filter: true,
//       floatingFilter: true,
//     }),
//     []
//   );

//   const onGridReady = (e: GridReadyEvent) => {
//     gridApiRef.current = e.api;
//     e.api.sizeColumnsToFit();
//   };

//   // ---------- Debounced search (main grid) ----------
//   useEffect(() => {
//     const id = setTimeout(() => setDebouncedSearch(searchTerm), 150);
//     return () => clearTimeout(id);
//   }, [searchTerm]);

//   const rowMatchesQuery = (row: any, query: string) => {
//     const q = query.trim().toUpperCase();
//     if (!q) return true;

//     const symbol = String(row.symbol || "").toUpperCase();
//     const name = String(row.name || "").toUpperCase();
//     const token = String(row.token || "").toUpperCase();
//     const full = `${symbol} ${name} ${token}`;

//     return full.includes(q);
//   };

//   const filteredData = useMemo(() => {
//     if (!debouncedSearch.trim()) return data;
//     return data.filter((row) => rowMatchesQuery(row, debouncedSearch));
//   }, [data, debouncedSearch]);

//   // ---------- Base rows for modal filters (without expiry) ----------
//   const scriptBaseRows = useMemo(() => {
//     let rows = data.filter((row) => {
//       if (useKite) {
//         return row.kiteSymbol && row.kiteToken;
//       } else {
//         return row.angelSymbol && row.angelToken;
//       }
//     });

//     // Combined search: dropdown (NIFTY/BANKNIFTY) + input text
//     const combinedSearch = `${symbolPrefix} ${scriptSearch}`.trim().toUpperCase();
//     const tokens = combinedSearch.split(/\s+/).filter(Boolean);

//     if (tokens.length > 0) {
//       rows = rows.filter((row) => {
//         const symbol = String(row.symbol || "").toUpperCase();
//         const name = String(row.name || "").toUpperCase();
//         const haystack = `${symbol} ${name}`;
//         return tokens.every((t) => haystack.includes(t));
//       });
//     }

//     // Chart Symbol (Strike) filter – matches whatever you type (e.g. 26300)
//     const strikeQ = chartSymbolSearch.trim();
//     if (strikeQ) {
//       rows = rows.filter((row: any) => {
//         return (
//           (row.symbol &&
//             String(row.symbol).toUpperCase().includes(strikeQ.toUpperCase())) ||
//           (row.tradingsymbol &&
//             String(row.tradingsymbol)
//               .toUpperCase()
//               .includes(strikeQ.toUpperCase()))
//         );
//       });
//     }

//     // Option Type filter (CE/PE)
//     if (scriptOptionFilter) {
//       rows = rows.filter((row) => {
//         const meta = getOptionMeta(row);
//         return meta && meta.optionType === scriptOptionFilter;
//       });
//     }

//     return rows;
//   }, [data, scriptSearch, symbolPrefix, chartSymbolSearch, scriptOptionFilter, useKite]);

//   // ---------- Expiry dropdown: based on filtered rows (current month only) ----------
//   const allExpiryOptions = useMemo(() => {
//     const now = new Date();
//     const currentMonth = now.getMonth();
//     const currentYear = now.getFullYear();

//     const map = new Map<string, { label: string; date: Date }>();

//     scriptBaseRows.forEach((row) => {
//       let d: Date | null = row.expiryDateObj || null;
//       let label: string = row.expiryLabel || "";

//       // fallback to parse from symbol if expiry field was empty
//       if (!d || !label) {
//         const meta = parseOptionMeta(row.symbol || row.kiteSymbol || row.angelSymbol);
//         if (meta) {
//           d = meta.expiryDate;
//           label = meta.expiryLabel;
//         }
//       }

//       if (!d || !label) return;

//       // only current month/year
//       if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) return;

//       const key = d.toISOString().slice(0, 10);
//       if (!map.has(key)) {
//         map.set(key, { label, date: d });
//       }
//     });

//     return Array.from(map.entries())
//       .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
//       .map(([key, value]) => ({
//         key,
//         label: value.label,
//       }));
//   }, [scriptBaseRows]);

//   // ---------- Final filtered rows in Add/Edit Scrip modal (with expiry) ----------
//   const scriptFilteredRows = useMemo(() => {
//     let rows = [...scriptBaseRows];

//     // Expiry filter (dropdown)
//     if (scriptExpiryFilter) {
//       rows = rows.filter((row) => {
//         if (row.expiryLabel === scriptExpiryFilter) return true;
//         const meta = getOptionMeta(row);
//         return meta?.expiryLabel === scriptExpiryFilter;
//       });
//     }

//     return rows.slice(0, 300);
//   }, [scriptBaseRows, scriptExpiryFilter]);

//   // ---------- Save ----------
//   const handleScriptSave = async () => {
//     if (!selectedScriptRow) {
//       toast.error("Please select a scrip from the list");
//       return;
//     }

//     const lotSizeNum = Number(selectedScriptRow.lotsize || 0);
//     const priceNum = Number(selectedScriptRow.price || 0);
//     const slotSizeNum = Number(getslotSIze || 1);

//     const requiredFields = [
//       { label: "Token", value: selectedScriptRow.token },
//       { label: "Symbol", value: selectedScriptRow.symbol },
//       { label: "Name", value: selectedScriptRow.name },
//       { label: "Exchange Segment", value: selectedScriptRow.exch_seg },
//       { label: "AngelOne Token", value: selectedScriptRow.angelToken },
//       { label: "AngelOne Symbol", value: selectedScriptRow.angelSymbol },
//       { label: "Kite Token", value: selectedScriptRow.kiteToken },
//       { label: "Kite Symbol", value: selectedScriptRow.kiteSymbol },
//       { label: "Group Name", value: groupName },
//       { label: "Quantity (Lot Size)", value: lotSizeNum },
//       { label: "Product Type", value: scriptProductType },
//     ];

//     for (let item of requiredFields) {
//       if (!item.value || item.value === "" || item.value === " ") {
//         toast.error(`${item.label} is required.`);
//         return;
//       }
//     }

//     const payload = {
//       token: selectedScriptRow.token || "",
//       symbol: selectedScriptRow.symbol || "",
//       name: selectedScriptRow.name || "",
//       exch_seg: selectedScriptRow.exch_seg || "",
//       lotsize: lotSizeNum,
//       instrumenttype: selectedScriptRow.instrumenttype || "",
//       price: priceNum,
//       quantity: lotSizeNum,
//       transactiontype: scriptTxnType,
//       duration,
//       orderType,
//       variety,
//       productType: scriptProductType,
//       totalPrice: priceNum * lotSizeNum,
//       actualQuantity: lotSizeNum / slotSizeNum,
//       searchText: scriptSearch || "",
//       chartSymbol: chartSymbolSearch || "",
//       optionType: scriptOptionFilter || "",
//       expiry: selectedScriptRow.expiry || "",
//       expiryLabel: selectedScriptRow.expiryLabel || "",
//       strategyId: selectedStrategyId || "",
//       groupName: groupName,
//       angelOneToken: selectedScriptRow.angelToken || "",
//       angelOneSymbol: selectedScriptRow.angelSymbol || "",
//       kiteToken: selectedScriptRow.kiteToken || "",
//       kiteSymbol: selectedScriptRow.kiteSymbol || "",
//     };

//     try {
//       const res = await axios.post(
//         `${apiUrl}/admin/multiple/place/order`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         }
//       );

//       if (res?.data?.status === true) {
//         alert(res?.data?.message);
//         setVariety("NORMAL");
//         setDuration("DAY");
//         setOrderType("MARKET");
//         setScriptModalOpen(false);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   // ---------- Selection Handler ----------
//   const handleSelectionInstrument = async (raw: any) => {
//     const payload = {
//       exchange: raw.exch_seg,
//       tradingsymbol: raw.symbol,
//       symboltoken: raw.token,
//     };

//     try {
//       await fetchStrategies();

//       if (useKite) {
//         setSelectedScriptRow((prev: any) => ({
//           ...(prev || {}),
//           kiteToken: raw.exchange_token || raw.kiteToken || raw.token,
//           kiteSymbol: raw.kiteSymbol || raw.symbol,
//           angelToken: prev?.angelToken || "",
//           angelSymbol: prev?.angelSymbol || "",
//           kiteName: raw.name,
//           exch_seg: raw.exch_seg || raw.exchange,
//           lotsize: raw.lotsize,
//           price: 0,
//           expiry: raw.expiry,
//           expiryLabel: raw.expiryLabel,
//           expiryDateObj: raw.expiryDateObj,
//         }));

//         setSlotSIze(raw.lotsize);
//       } else {
//         try {
//           const res = await axios.post(
//             `${apiUrl}/agnelone/instrument/ltp`,
//             payload,
//             {
//               headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//                 AngelOneToken: localStorage.getItem("angel_token") || "",
//                 userid: localStorage.getItem("userID"),
//               },
//             }
//           );

//           if (res?.data?.status === true) {
//             const ltp = res?.data?.data?.data?.ltp || raw.price || 0;

//             setSelectedScriptRow((prev: any) => ({
//               ...(prev || {}),
//               angelToken: raw.angelToken || raw.token,
//               angelSymbol: raw.angelSymbol || raw.symbol,
//               kiteToken: prev?.kiteToken || "",
//               kiteSymbol: prev?.kiteSymbol || "",
//               token: raw.token,
//               symbol: raw.symbol,
//               name: raw.name,
//               exch_seg: raw.exch_seg,
//               lotsize: raw.lotsize,
//               instrumenttype: raw.instrumenttype,
//               price: ltp,
//               expiry: raw.expiry,
//               expiryLabel: raw.expiryLabel,
//               expiryDateObj: raw.expiryDateObj,
//             }));

//             setSlotSIze(raw.lotsize);
//           } else {
//             toast.error(res?.data?.message || "Something went wrong");
//           }
//         } catch (err: any) {
//           console.error(err);
//           toast.error(err.message || "Something went wrong");
//         }
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   // ---------- JSX ----------
//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <h2 className="text-xl font-semibold mb-4">Nifty Bank Instruments</h2>

//       <div className="flex justify-between items-center mb-4 gap-4">
//         <div className="w-full sm:w-80">
//           <input
//             type="text"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             placeholder='Search (e.g. "NIFTY02DEC2525800PE" or "NIFTY")'
//             className="border p-2 w-full rounded"
//           />
//         </div>

//         <div className="flex items-center gap-4">
//           <label className="flex items-center gap-2">
//             <input
//               type="checkbox"
//               checked={useKite}
//               onChange={(e) => setUseKite(e.target.checked)}
//               className="h-4 w-4"
//             />
//             Use Kite Instruments
//           </label>

//           <button
//             className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
//             onClick={handleOpenScriptModal}
//           >
//             Add/Edit
//           </button>
//         </div>
//       </div>

//       {loading && <p>Loading data...</p>}
//       {error && <p className="text-red-500">{error}</p>}
//       {!loading && !error && filteredData.length === 0 && <p>No data found.</p>}

//       {filteredData.length > 0 && (
//         <div
//           className="ag-theme-quartz compact-grid"
//           style={{ height: 540, width: "100%" }}
//         >
//           <AgGridReact
//             rowData={filteredData}
//             columnDefs={columnDefs}
//             defaultColDef={defaultColDef}
//             animateRows
//             rowSelection="single"
//             pagination
//             paginationPageSize={10000}
//             rowHeight={34}
//             suppressFieldDotNotation
//             onGridReady={onGridReady}
//           />
//         </div>
//       )}

//       {scriptModalOpen && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999999]">
//           <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl mx-3">
//             <div className="max-h-[90vh] overflow-y-auto p-6">
//               {/* Header */}
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-lg font-semibold">Add / Edit Scrip</h3>
//                 <button
//                   onClick={() => setScriptModalOpen(false)}
//                   className="text-gray-500 hover:text-black text-xl leading-none"
//                 >
//                   ×
//                 </button>
//               </div>

//               {/* SECTION 1: Scrip Details & Search */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <div className="flex items-center justify-between mb-3">
//                   <h4 className="text-sm font-semibold text-gray-700">
//                     Scrip Details & Search
//                   </h4>

//                   <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
//                     <input
//                       type="checkbox"
//                       checked={useKite}
//                       onChange={(e) => setUseKite(e.target.checked)}
//                       className="h-4 w-4"
//                     />
//                     Search in Kite Instruments (unchecked = AngelOne)
//                   </label>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Search Name / Symbol / CE / PE
//                     </label>

//                     <div className="flex gap-2">
//                       {/* Dropdown */}
//                       <select
//                         value={symbolPrefix}
//                         onChange={(e) => setSymbolPrefix(e.target.value)}
//                         className="border rounded px-3 py-2 text-sm bg-white"
//                         style={{ minWidth: "120px" }}
//                       >
//                         <option value="">Select</option>
//                         <option value="NIFTY">NIFTY</option>
//                         <option value="BANKNIFTY">BANKNIFTY</option>
//                       </select>

//                       {/* Input box */}
//                       <input
//                         type="text"
//                         value={scriptSearch}
//                         onChange={(e) => setScriptSearch(e.target.value)}
//                         placeholder="e.g. 26150 CE"
//                         className="border rounded px-3 py-2 w-full text-sm"
//                       />
//                     </div>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Chart Symbol (Strike)
//                     </label>
//                     <input
//                       type="text"
//                       placeholder="e.g. 26150"
//                       value={chartSymbolSearch}
//                       onChange={(e) => setChartSymbolSearch(e.target.value)}
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* SECTION 2: Filters & Order Settings */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <h4 className="text-sm font-semibold text-gray-700 mb-3">
//                   Filters & Order Settings
//                 </h4>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Option Type
//                     </label>
//                     <select
//                       value={scriptOptionFilter}
//                       onChange={(e) =>
//                         setScriptOptionFilter(e.target.value as "" | "CE" | "PE")
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">ALL</option>
//                       <option value="CE">CE (Call)</option>
//                       <option value="PE">PE (Put)</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Expiry (current month)
//                     </label>
//                     <select
//                       value={scriptExpiryFilter}
//                       onChange={(e) => setScriptExpiryFilter(e.target.value)}
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">All Expiries</option>
//                       {allExpiryOptions.map((exp) => (
//                         <option key={exp.key} value={exp.label}>
//                           {exp.label}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Transaction Type
//                     </label>
//                     <select
//                       value={scriptTxnType}
//                       onChange={(e) =>
//                         setScriptTxnType(e.target.value as "" | "BUY" | "SELL")
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="BUY">BUY</option>
//                       <option value="SELL">SELL</option>
//                     </select>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Order Type
//                     </label>
//                     <select
//                       value={orderType}
//                       onChange={(e) => setOrderType(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Order Type</option>
//                       <option value="MARKET">MARKET</option>
//                       <option value="LIMIT">LIMIT</option>
//                       <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT</option>
//                       <option value="STOPLOSS_MARKET">STOPLOSS_MARKET</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Duration
//                     </label>
//                     <select
//                       value={duration}
//                       onChange={(e) => setDuration(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Duration</option>
//                       <option value="DAY">DAY</option>
//                       <option value="IOC">IOC</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Variety
//                     </label>
//                     <select
//                       value={variety}
//                       onChange={(e) => setVariety(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Variety</option>
//                       <option value="NORMAL">NORMAL</option>
//                       <option value="STOPLOSS">STOPLOSS</option>
//                       <option value="ROBO">ROBO</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* SECTION 3: Product & Strategy */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <h4 className="text-sm font-semibold text-gray-700 mb-3">
//                   Product & Strategy
//                 </h4>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Product Type
//                     </label>
//                     <select
//                       value={scriptProductType}
//                       onChange={(e) =>
//                         setScriptProductType(
//                           e.target.value as
//                             | ""
//                             | "INTRADAY"
//                             | "DELIVERY"
//                             | "CARRYFORWARD"
//                             | "BO"
//                             | "MARGIN"
//                         )
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">Select</option>
//                       <option value="INTRADAY">IntraDay MIS</option>
//                       <option value="DELIVERY">Longterm CNC</option>
//                       <option value="CARRYFORWARD">CARRYFORWARD</option>
//                       <option value="BO">Bracket Order </option>
//                       <option value="MARGIN">Margin Delivery</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Quantity in Lot
//                     </label>
//                     <input
//                       type="number"
//                       placeholder="Enter Quantity in Lot"
//                       value={selectedScriptRow?.lotsize || ""}
//                       onChange={(e) =>
//                         setSelectedScriptRow((prev: any) => ({
//                           ...(prev || {}),
//                           lotsize: e.target.value,
//                         }))
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm bg-white focus:ring-2 focus:ring-blue-500"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Select Strategy *
//                     </label>
//                     <select
//                       className="w-full border rounded px-3 py-2 text-sm"
//                       value={selectedStrategyId}
//                       onChange={(e) => {
//                         const strategyId = e.target.value;
//                         setSelectedStrategyId(strategyId);

//                         const selected: any = strategyList.find(
//                           (s: any) => s.id == strategyId
//                         );

//                         if (selected) {
//                           setGroupName(selected.strategyName);
//                         } else {
//                           setGroupName("");
//                         }
//                       }}
//                     >
//                       <option value="">Select Strategy</option>
//                       {strategyList.map((s: any) => (
//                         <option value={s.id} key={s.id}>
//                           {s.strategyName}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* SECTION 4: Result list */}
//               <div className="border border-gray-200 rounded-lg mb-6">
//                 <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
//                   <span className="text-xs font-semibold text-gray-600">
//                     Search Results (click to select)
//                   </span>
//                 </div>

//                 <div className="max-h-64 overflow-auto">
//                   <table className="w-full text-sm">
//                     <thead className="bg-gray-100 sticky top-0">
//                       <tr>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Symbol
//                         </th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Name
//                         </th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Token
//                         </th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Lot
//                         </th>
//                       </tr>
//                     </thead>

//                     <tbody>
//                       {scriptFilteredRows.map((row) => (
//                         <tr
//                           key={`${row.token}-${row.symbol}`}
//                           className={`cursor-pointer transition-colors ${
//                             selectedScriptRow?.token === row.token ||
//                             selectedScriptRow?.kiteToken === row.token ||
//                             selectedScriptRow?.angelToken === row.token
//                               ? "bg-purple-100"
//                               : "hover:bg-purple-50"
//                           }`}
//                           onClick={() => handleSelectionInstrument(row)}
//                         >
//                           <td className="px-3 py-1">{row.symbol}</td>
//                           <td className="px-3 py-1">{row.name}</td>
//                           <td className="px-3 py-1">{row.token}</td>
//                           <td className="px-3 py-1">{row.lotsize}</td>
//                         </tr>
//                       ))}

//                       {scriptFilteredRows.length === 0 && (
//                         <tr>
//                           <td
//                             className="px-3 py-3 text-center text-gray-500"
//                             colSpan={4}
//                           >
//                             No matching scrips found.
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>

//               {/* Footer buttons */}
//               <div className="flex justify-end gap-3">
//                 <button
//                   onClick={() => {
//                     setScriptSearch("");
//                     setScriptExpiryFilter("");
//                     setScriptOptionFilter("");
//                     setChartSymbolSearch("");
//                     setSelectedScriptRow(null);
//                     setScriptTxnType("BUY");
//                     setScriptProductType("");
//                     setSelectedStrategyId("");
//                     setGroupName("");
//                     setSymbolPrefix("");
//                   }}
//                   className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded text-sm"
//                 >
//                   Reset
//                 </button>

//                 <button
//                   onClick={() => setScriptModalOpen(false)}
//                   className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded text-sm"
//                 >
//                   Close
//                 </button>

//                 <button
//                   onClick={handleScriptSave}
//                   className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded text-sm font-medium"
//                 >
//                   Save changes
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }







// import { useState, useEffect, useRef, useMemo } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { ModuleRegistry } from "ag-grid-community";
// import { AllCommunityModule } from "ag-grid-community";
// ModuleRegistry.registerModules([AllCommunityModule]);
// import { AgGridReact } from "ag-grid-react";
// import type { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";

// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-quartz.css";

// export default function InstrumentFormAdmin() {
//   const apiUrl = import.meta.env.VITE_API_URL;
// const [quickFilterText, setQuickFilterText] = useState("");
//   const [data, setData] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const [symbolPrefix, setSymbolPrefix] = useState("");

//   const [getslotSIze, setSlotSIze] = useState("");

//   const [duration, setDuration] = useState("DAY");
//   const [orderType, setOrderType] = useState("MARKET");
//   const [variety, setVariety] = useState("NORMAL");

//   // 🔹 TOP SEARCH BAR -> AG GRID QUICK FILTER
//   const [gridSearch, setGridSearch] = useState("");

//   const gridApiRef = useRef<GridApi | null>(null);

//   const [groupName, setGroupName] = useState("");
//   const [strategyList, setStrategyList] = useState<any[]>([]);
//   const [selectedStrategyId, setSelectedStrategyId] = useState("");

//   const [scriptModalOpen, setScriptModalOpen] = useState(false);
//   const [scriptSearch, setScriptSearch] = useState("");
//   const [scriptExpiryFilter, setScriptExpiryFilter] = useState("");
//   const [scriptOptionFilter, setScriptOptionFilter] = useState<"" | "CE" | "PE">("");
//   const [selectedScriptRow, setSelectedScriptRow] = useState<any | null>(null);
//   const [chartSymbolSearch, setChartSymbolSearch] = useState("");
//   const [scriptTxnType, setScriptTxnType] = useState<"" | "BUY" | "SELL">("BUY");
//   const [scriptProductType, setScriptProductType] = useState<
//     "" | "INTRADAY" | "DELIVERY" | "CARRYFORWARD" | "BO" | "MARGIN"
//   >("INTRADAY");

//   const [useKite, setUseKite] = useState(false);


//   const onFilterTextBoxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//   setQuickFilterText(e.target.value);
// };

//   // ---------- Common expiry normalizer ----------
//   const buildExpiryMeta = (rawExpiry: any) => {
//     if (!rawExpiry) return { expiryDateObj: null, expiryLabel: "" };

//     const s = String(rawExpiry).trim();
//     if (!s) return { expiryDateObj: null, expiryLabel: "" };

//     let d: Date | null = null;

//     // 1) YYYY-MM-DD  (Kite)
//     if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
//       d = new Date(s + "T00:00:00");
//     }
//     // 2) DD-MMM-YYYY / DD-MMM-YY (AngelOne etc.)
//     else if (/^\d{2}-[A-Za-z]{3}-\d{2,4}$/.test(s)) {
//       const [ddStr, monStrRaw, yyStr] = s.split("-");
//       const dd = Number(ddStr);
//       const monStr = monStrRaw.toUpperCase();
//       const monthMap: Record<string, number> = {
//         JAN: 0,
//         FEB: 1,
//         MAR: 2,
//         APR: 3,
//         MAY: 4,
//         JUN: 5,
//         JUL: 6,
//         AUG: 7,
//         SEP: 8,
//         OCT: 9,
//         NOV: 10,
//         DEC: 11,
//       };
//       const monthIndex = monthMap[monStr];
//       if (monthIndex !== undefined) {
//         let yearNum = Number(yyStr);
//         if (yyStr.length === 2) {
//           yearNum = 2000 + yearNum;
//         }
//         d = new Date(yearNum, monthIndex, dd);
//       }
//     }
//     // 3) Fallback: native Date parse
//     else {
//       const t = new Date(s);
//       if (!isNaN(t.getTime())) d = t;
//     }

//     if (!d) return { expiryDateObj: null, expiryLabel: "" };

//     const day = d.getDate().toString().padStart(2, "0");
//     const monthNames = [
//       "JAN",
//       "FEB",
//       "MAR",
//       "APR",
//       "MAY",
//       "JUN",
//       "JUL",
//       "AUG",
//       "SEP",
//       "OCT",
//       "NOV",
//       "DEC",
//     ];
//     const label = `${day}-${monthNames[d.getMonth()]}-${d.getFullYear()}`;

//     return { expiryDateObj: d, expiryLabel: label };
//   };

//   // ---------- Parse option symbol (only for strike & CE/PE) ----------
//   // Works for NIFTY02DEC2525800PE, NIFTY25NOV24500CE etc.
//   const parseOptionMeta = (symbolRaw: any) => {
//     const symbol = String(symbolRaw || "").toUpperCase();

//     // e.g. NIFTY02DEC2525800PE  or  NIFTY25NOV24500CE
//     const re = /^([A-Z]+)(\d{2})([A-Z]{3})(\d{2})(\d+)(CE|PE)$/;
//     const m = symbol.match(re);
//     if (!m) return null;

//     const [, underlying, dd, monStr, yy, strike, optType] = m;

//     const monthMap: Record<string, number> = {
//       JAN: 0,
//       FEB: 1,
//       MAR: 2,
//       APR: 3,
//       MAY: 4,
//       JUN: 5,
//       JUL: 6,
//       AUG: 7,
//       SEP: 8,
//       OCT: 9,
//       NOV: 10,
//       DEC: 11,
//     };
//     const monthIndex = monthMap[monStr];
//     if (monthIndex === undefined) return null;

//     const year = 2000 + Number(yy);
//     const day = Number(dd);
//     const dateObj = new Date(year, monthIndex, day);

//     const expiryLabel = `${day.toString().padStart(2, "0")}-${monStr}-${year}`;

//     return {
//       underlying,
//       expiryLabel,
//       expiryDate: dateObj,
//       strike: Number(strike),
//       optionType: optType as "CE" | "PE",
//     };
//   };

//   // ⭐ helper that always tries to extract strike / optionType / expiry
//   const getOptionMeta = (row: any) => {
//     const mainSymbol = row.symbol || row.kiteSymbol || row.angelSymbol || "";

//     const fromSymbol = parseOptionMeta(mainSymbol);
//     if (fromSymbol) return fromSymbol;

//     const name = String(row.name || "").toUpperCase();
//     const optMatch = name.match(/\b(CE|PE)\b/);
//     const strikeMatches = name.match(/(\d+)/g);

//     return {
//       underlying: "",
//       expiryLabel: row.expiryLabel || "",
//       expiryDate: row.expiryDateObj || null,
//       strike: strikeMatches
//         ? Number(strikeMatches[strikeMatches.length - 1])
//         : row.strike || 0,
//       optionType: (optMatch?.[1] as "CE" | "PE") || (row.syType as "CE" | "PE"),
//     };
//   };

//   // ---------- NORMALIZERS (AngelOne & Kite) ----------
//   const mapAngelToCommon = (row: any) => {
//     const { expiryDateObj, expiryLabel } = buildExpiryMeta(row.expiry);

//     return {
//       ...row,
//       token: String(row.token ?? ""),
//       symbol: String(row.symbol ?? ""),
//       name: row.name ?? "",
//       expiry: row.expiry ?? "",
//       strike: row.strike !== undefined ? Number(row.strike) : -1,
//       lotsize: row.lotsize !== undefined ? Number(row.lotsize) : 0,
//       instrumenttype: row.instrumenttype ?? "",
//       exch_seg: row.exch_seg ?? "",
//       tick_size: row.tick_size !== undefined ? Number(row.tick_size) : 0,
//       syType: row.instrumenttype ?? row.syType ?? "",
//       angelToken: String(row.token ?? ""),
//       angelSymbol: String(row.symbol ?? ""),
//       kiteToken: row.kiteToken ?? "",
//       kiteSymbol: row.kiteSymbol ?? "",
//       expiryDateObj,
//       expiryLabel,
//     };
//   };

//   const mapKiteToCommon = (row: any) => {
//     const { expiryDateObj, expiryLabel } = buildExpiryMeta(row.expiry);

//     // Try to derive strike if missing
//     let strike = row.strike;
//     if (!strike) {
//       const metaFromSymbol = parseOptionMeta(row.tradingsymbol);
//       if (metaFromSymbol) {
//         strike = metaFromSymbol.strike;
//       } else {
//         const m = String(row.name || "").match(/\d+/);
//         strike = m ? Number(m[0]) : 0;
//       }
//     }

//     return {
//       ...row,
//       token: String(row.exchange_token ?? ""),
//       symbol: String(row.tradingsymbol ?? ""),
//       name: row.name ?? "",
//       expiry: row.expiry ?? "",
//       strike: Number(strike),
//       lotsize: row.lot_size !== undefined ? Number(row.lot_size) : 0,
//       instrumenttype: row.instrument_type ?? "",
//       exch_seg: row.segment ?? row.exchange ?? "",
//       tick_size: row.tick_size !== undefined ? Number(row.tick_size) : 0,
//       syType: row.instrument_type ?? "",
//       kiteToken: String(row.exchange_token ?? ""),
//       kiteSymbol: String(row.tradingsymbol ?? ""),
//       angelToken: row.angelToken ?? "",
//       angelSymbol: row.angelSymbol ?? "",
//       expiryDateObj,
//       expiryLabel,
//     };
//   };

//   // ---------- Fetch instruments (AngelOne or Kite) ----------
//   const fetchData = async () => {
//     setLoading(true);
//     setError("");

//     try {
//       const endpoint = useKite ? "/kite/instrument" : "/agnelone/instrument";
//       const res = await axios.get(`${apiUrl}${endpoint}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });

//       if (res?.data?.status === true) {
//         const rawData = res?.data?.data || [];

//         const normalized = useKite
//           ? rawData.map((row: any) => mapKiteToCommon(row))
//           : rawData.map((row: any) => mapAngelToCommon(row));

//         setData(normalized);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err?.message || "Something went wrong");
//       setError(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------- Fetch strategies ----------
//   const fetchStrategies = async () => {
//     try {
//       const res = await axios.get(`${apiUrl}/admin/strategies`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID"),
//         },
//       });

//       if (res.data.status === true) {
//         setStrategyList(res.data.data || []);
//       } else {
//         toast.error(res.data.message);
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//     fetchStrategies();
//     setGridSearch("");
   
//   }, [useKite]);

//   // ---------- Open Add/Edit Scrip modal ----------
//   const handleOpenScriptModal = () => {
//     setSelectedScriptRow(null);
//     setScriptModalOpen(true);
//     setScriptSearch("");
//     setChartSymbolSearch("");
//     setScriptExpiryFilter("");
//     setScriptOptionFilter("");
//     setScriptTxnType("BUY");
//     setScriptProductType("");
//     setSelectedStrategyId("");
//     setGroupName("");
//     setSymbolPrefix("");
//   };

//   // ---------- AG Grid ----------
//   const columnDefs = useMemo<ColDef[]>(
//     () => [
//       { headerName: "Token", field: "token", minWidth: 80 },
//       { headerName: "Type", field: "syType", minWidth: 80 },
//       {
//         headerName: "Symbol",
//         field: "symbol",
//         minWidth: 250,
//         filter: "agTextColumnFilter",
//       },
//       { headerName: "Name", field: "name", minWidth: 120 },
//       { headerName: "Instrument", field: "instrumenttype", minWidth: 120 },
//       { headerName: "Lot-Size", field: "lotsize", width: 110 },
//       ...(useKite
//         ? [
//             { headerName: "Kite Token", field: "kiteToken", minWidth: 120 },
//             { headerName: "Kite Symbol", field: "kiteSymbol", minWidth: 180 },
//           ]
//         : [
//             { headerName: "Angel Token", field: "angelToken", minWidth: 120 },
//             { headerName: "Angel Symbol", field: "angelSymbol", minWidth: 180 },
//           ]),
//       { headerName: "Expiry", field: "expiryLabel", minWidth: 130 },
//     ],
//     [useKite]
//   );

//   const defaultColDef = useMemo<ColDef>(
//     () => ({
//       sortable: true,
//       resizable: true,
//       filter: true,
//       floatingFilter: true,
//     }),
//     []
//   );

//   const onGridReady = (e: GridReadyEvent) => {
//     gridApiRef.current = e.api;
//     e.api.sizeColumnsToFit();
  
//   };

//   // 🔹 Whenever top search changes, update AG Grid quick filter


//   // ---------- Base rows for modal filters (without expiry) ----------
//   const scriptBaseRows = useMemo(() => {
//     let rows = data.filter((row) => {
//       if (useKite) {
//         return row.kiteSymbol && row.kiteToken;
//       } else {
//         return row.angelSymbol && row.angelToken;
//       }
//     });

//     // Combined search: dropdown (NIFTY/BANKNIFTY) + input text
//     const combinedSearch = `${symbolPrefix} ${scriptSearch}`.trim().toUpperCase();
//     const tokens = combinedSearch.split(/\s+/).filter(Boolean);

//     if (tokens.length > 0) {
//       rows = rows.filter((row) => {
//         const symbol = String(row.symbol || "").toUpperCase();
//         const name = String(row.name || "").toUpperCase();
//         const haystack = `${symbol} ${name}`;
//         return tokens.every((t) => haystack.includes(t));
//       });
//     }

//     // Chart Symbol (Strike) filter – matches whatever you type (e.g. 26300)
//     const strikeQ = chartSymbolSearch.trim();
//     if (strikeQ) {
//       rows = rows.filter((row: any) => {
//         return (
//           (row.symbol &&
//             String(row.symbol).toUpperCase().includes(strikeQ.toUpperCase())) ||
//           (row.tradingsymbol &&
//             String(row.tradingsymbol)
//               .toUpperCase()
//               .includes(strikeQ.toUpperCase()))
//         );
//       });
//     }

//     // Option Type filter (CE/PE)
//     if (scriptOptionFilter) {
//       rows = rows.filter((row) => {
//         const meta = getOptionMeta(row);
//         return meta && meta.optionType === scriptOptionFilter;
//       });
//     }

//     return rows;
//   }, [data, scriptSearch, symbolPrefix, chartSymbolSearch, scriptOptionFilter, useKite]);

//   // ---------- Expiry dropdown: based on filtered rows (current month only) ----------
//   const allExpiryOptions = useMemo(() => {
//     const now = new Date();
//     const currentMonth = now.getMonth();
//     const currentYear = now.getFullYear();

//     const map = new Map<string, { label: string; date: Date }>();

//     scriptBaseRows.forEach((row) => {
//       let d: Date | null = row.expiryDateObj || null;
//       let label: string = row.expiryLabel || "";

//       // fallback to parse from symbol if expiry field was empty
//       if (!d || !label) {
//         const meta = parseOptionMeta(row.symbol || row.kiteSymbol || row.angelSymbol);
//         if (meta) {
//           d = meta.expiryDate;
//           label = meta.expiryLabel;
//         }
//       }

//       if (!d || !label) return;

//       // only current month/year
//       if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) return;

//       const key = d.toISOString().slice(0, 10);
//       if (!map.has(key)) {
//         map.set(key, { label, date: d });
//       }
//     });

//     return Array.from(map.entries())
//       .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
//       .map(([key, value]) => ({
//         key,
//         label: value.label,
//       }));
//   }, [scriptBaseRows]);

//   // ---------- Final filtered rows in Add/Edit Scrip modal (with expiry) ----------
//   const scriptFilteredRows = useMemo(() => {
//     let rows = [...scriptBaseRows];

//     // Expiry filter (dropdown)
//     if (scriptExpiryFilter) {
//       rows = rows.filter((row) => {
//         if (row.expiryLabel === scriptExpiryFilter) return true;
//         const meta = getOptionMeta(row);
//         return meta?.expiryLabel === scriptExpiryFilter;
//       });
//     }

//     return rows.slice(0, 300);
//   }, [scriptBaseRows, scriptExpiryFilter]);

//   // ---------- Save ----------
//   const handleScriptSave = async () => {
//     if (!selectedScriptRow) {
//       toast.error("Please select a scrip from the list");
//       return;
//     }

//     const lotSizeNum = Number(selectedScriptRow.lotsize || 0);
//     const priceNum = Number(selectedScriptRow.price || 0);
//     const slotSizeNum = Number(getslotSIze || 1);

//     const requiredFields = [
//       { label: "Token", value: selectedScriptRow.token },
//       { label: "Symbol", value: selectedScriptRow.symbol },
//       { label: "Name", value: selectedScriptRow.name },
//       { label: "Exchange Segment", value: selectedScriptRow.exch_seg },
//       { label: "AngelOne Token", value: selectedScriptRow.angelToken },
//       { label: "AngelOne Symbol", value: selectedScriptRow.angelSymbol },
//       { label: "Kite Token", value: selectedScriptRow.kiteToken },
//       { label: "Kite Symbol", value: selectedScriptRow.kiteSymbol },
//       { label: "Group Name", value: groupName },
//       { label: "Quantity (Lot Size)", value: lotSizeNum },
//       { label: "Product Type", value: scriptProductType },
//     ];

//     for (let item of requiredFields) {
//       if (!item.value || item.value === "" || item.value === " ") {
//         toast.error(`${item.label} is required.`);
//         return;
//       }
//     }

//     const payload = {
//       token: selectedScriptRow.token || "",
//       symbol: selectedScriptRow.symbol || "",
//       name: selectedScriptRow.name || "",
//       exch_seg: selectedScriptRow.exch_seg || "",
//       lotsize: lotSizeNum,
//       instrumenttype: selectedScriptRow.instrumenttype || "",
//       price: priceNum,
//       quantity: lotSizeNum,
//       transactiontype: scriptTxnType,
//       duration,
//       orderType,
//       variety,
//       productType: scriptProductType,
//       totalPrice: priceNum * lotSizeNum,
//       actualQuantity: lotSizeNum / slotSizeNum,
//       searchText: scriptSearch || "",
//       chartSymbol: chartSymbolSearch || "",
//       optionType: scriptOptionFilter || "",
//       expiry: selectedScriptRow.expiry || "",
//       expiryLabel: selectedScriptRow.expiryLabel || "",
//       strategyId: selectedStrategyId || "",
//       groupName: groupName,
//       angelOneToken: selectedScriptRow.angelToken || "",
//       angelOneSymbol: selectedScriptRow.angelSymbol || "",
//       kiteToken: selectedScriptRow.kiteToken || "",
//       kiteSymbol: selectedScriptRow.kiteSymbol || "",
//     };

//     try {
//       const res = await axios.post(
//         `${apiUrl}/admin/multiple/place/order`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         }
//       );

//       if (res?.data?.status === true) {
//         alert(res?.data?.message);
//         setVariety("NORMAL");
//         setDuration("DAY");
//         setOrderType("MARKET");
//         setScriptModalOpen(false);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   // ---------- Selection Handler ----------
//   const handleSelectionInstrument = async (raw: any) => {
//     const payload = {
//       exchange: raw.exch_seg,
//       tradingsymbol: raw.symbol,
//       symboltoken: raw.token,
//     };

//     try {
//       await fetchStrategies();

//       if (useKite) {
//         setSelectedScriptRow((prev: any) => ({
//           ...(prev || {}),
//           kiteToken: raw.exchange_token || raw.kiteToken || raw.token,
//           kiteSymbol: raw.kiteSymbol || raw.symbol,
//           angelToken: prev?.angelToken || "",
//           angelSymbol: prev?.angelSymbol || "",
//           kiteName: raw.name,
//           exch_seg: raw.exch_seg || raw.exchange,
//           lotsize: raw.lotsize,
//           price: 0,
//           expiry: raw.expiry,
//           expiryLabel: raw.expiryLabel,
//           expiryDateObj: raw.expiryDateObj,
//         }));

//         setSlotSIze(raw.lotsize);
//       } else {
//         try {
//           const res = await axios.post(
//             `${apiUrl}/agnelone/instrument/ltp`,
//             payload,
//             {
//               headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//                 AngelOneToken: localStorage.getItem("angel_token") || "",
//                 userid: localStorage.getItem("userID"),
//               },
//             }
//           );

//           if (res?.data?.status === true) {
//             const ltp = res?.data?.data?.data?.ltp || raw.price || 0;

//             setSelectedScriptRow((prev: any) => ({
//               ...(prev || {}),
//               angelToken: raw.angelToken || raw.token,
//               angelSymbol: raw.angelSymbol || raw.symbol,
//               kiteToken: prev?.kiteToken || "",
//               kiteSymbol: prev?.kiteSymbol || "",
//               token: raw.token,
//               symbol: raw.symbol,
//               name: raw.name,
//               exch_seg: raw.exch_seg,
//               lotsize: raw.lotsize,
//               instrumenttype: raw.instrumenttype,
//               price: ltp,
//               expiry: raw.expiry,
//               expiryLabel: raw.expiryLabel,
//               expiryDateObj: raw.expiryDateObj,
//             }));

//             setSlotSIze(raw.lotsize);
//           } else {
//             toast.error(res?.data?.message || "Something went wrong");
//           }
//         } catch (err: any) {
//           console.error(err);
//           toast.error(err.message || "Something went wrong");
//         }
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   // ---------- JSX ----------
//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <h2 className="text-xl font-semibold mb-4">Nifty Bank Instruments</h2>

//       <div className="flex justify-between items-center mb-4 gap-4">
//         <div className="w-full sm:w-80">
//           {/* 🔹 AG GRID QUICK FILTER */}
//           {/* <input
//             type="text"
//             value={gridSearch}
//             onChange={(e) => setGridSearch(e.target.value)}
//             placeholder='AG Grid Search (symbol / name / token)'
//             className="border p-2 w-full rounded"
//           /> */}
//           <input
//   type="text"
//   value={quickFilterText}
//   onChange={onFilterTextBoxChange}
//   placeholder='AG Grid Quick Filter (e.g. "NIFTY02DEC2525800PE" or "NIFTY")'
//   className="border p-2 w-full rounded"
// />
//         </div>

//         <div className="flex items-center gap-4">
//           <label className="flex items-center gap-2">
//             <input
//               type="checkbox"
//               checked={useKite}
//               onChange={(e) => setUseKite(e.target.checked)}
//               className="h-4 w-4"
//             />
//             Use Kite Instruments
//           </label>

//           <button
//             className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
//             onClick={handleOpenScriptModal}
//           >
//             Add/Edit
//           </button>
//         </div>
//       </div>

//       {loading && <p>Loading data...</p>}
//       {error && <p className="text-red-500">{error}</p>}
//       {!loading && !error && data.length === 0 && <p>No data found.</p>}

//       {data.length > 0 && (
//         <div
//           className="ag-theme-quartz compact-grid"
//           style={{ height: 540, width: "100%" }}
//         >
//           <AgGridReact
//             rowData={data} // 🔹 Direct data, AG Grid handles filtering
//             columnDefs={columnDefs}
//             defaultColDef={defaultColDef}
//             animateRows
//             rowSelection="single"
//             pagination
//             paginationPageSize={10000}
//             rowHeight={34}
//             suppressFieldDotNotation
//             onGridReady={onGridReady}
//             quickFilterText={quickFilterText}
//           />
//         </div>
//       )}

//       {scriptModalOpen && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999999]">
//           <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl mx-3">
//             <div className="max-h-[90vh] overflow-y-auto p-6">
//               {/* Header */}
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-lg font-semibold">Add / Edit Scrip</h3>
//                 <button
//                   onClick={() => setScriptModalOpen(false)}
//                   className="text-gray-500 hover:text-black text-xl leading-none"
//                 >
//                   ×
//                 </button>
//               </div>

//               {/* SECTION 1: Scrip Details & Search */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <div className="flex items-center justify-between mb-3">
//                   <h4 className="text-sm font-semibold text-gray-700">
//                     Scrip Details & Search
//                   </h4>

//                   <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
//                     <input
//                       type="checkbox"
//                       checked={useKite}
//                       onChange={(e) => setUseKite(e.target.checked)}
//                       className="h-4 w-4"
//                     />
//                     Search in Kite Instruments (unchecked = AngelOne)
//                   </label>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Search Name / Symbol / CE / PE
//                     </label>

//                     <div className="flex gap-2">
//                       {/* Dropdown */}
//                       <select
//                         value={symbolPrefix}
//                         onChange={(e) => setSymbolPrefix(e.target.value)}
//                         className="border rounded px-3 py-2 text-sm bg-white"
//                         style={{ minWidth: "120px" }}
//                       >
//                         <option value="">Select</option>
//                         <option value="NIFTY">NIFTY</option>
//                         <option value="BANKNIFTY">BANKNIFTY</option>
//                       </select>

//                       {/* Input box */}
//                       <input
//                         type="text"
//                         value={scriptSearch}
//                         onChange={(e) => setScriptSearch(e.target.value)}
//                         placeholder="e.g. 26150 CE"
//                         className="border rounded px-3 py-2 w-full text-sm"
//                       />
//                     </div>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Chart Symbol (Strike)
//                     </label>
//                     <input
//                       type="text"
//                       placeholder="e.g. 26150"
//                       value={chartSymbolSearch}
//                       onChange={(e) => setChartSymbolSearch(e.target.value)}
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* SECTION 2: Filters & Order Settings */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <h4 className="text-sm font-semibold text-gray-700 mb-3">
//                   Filters & Order Settings
//                 </h4>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Option Type
//                     </label>
//                     <select
//                       value={scriptOptionFilter}
//                       onChange={(e) =>
//                         setScriptOptionFilter(e.target.value as "" | "CE" | "PE")
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">ALL</option>
//                       <option value="CE">CE (Call)</option>
//                       <option value="PE">PE (Put)</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Expiry (current month)
//                     </label>
//                     <select
//                       value={scriptExpiryFilter}
//                       onChange={(e) => setScriptExpiryFilter(e.target.value)}
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">All Expiries</option>
//                       {allExpiryOptions.map((exp) => (
//                         <option key={exp.key} value={exp.label}>
//                           {exp.label}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Transaction Type
//                     </label>
//                     <select
//                       value={scriptTxnType}
//                       onChange={(e) =>
//                         setScriptTxnType(e.target.value as "" | "BUY" | "SELL")
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="BUY">BUY</option>
//                       <option value="SELL">SELL</option>
//                     </select>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Order Type
//                     </label>
//                     <select
//                       value={orderType}
//                       onChange={(e) => setOrderType(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Order Type</option>
//                       <option value="MARKET">MARKET</option>
//                       <option value="LIMIT">LIMIT</option>
//                       <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT</option>
//                       <option value="STOPLOSS_MARKET">STOPLOSS_MARKET</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Duration
//                     </label>
//                     <select
//                       value={duration}
//                       onChange={(e) => setDuration(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Duration</option>
//                       <option value="DAY">DAY</option>
//                       <option value="IOC">IOC</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Variety
//                     </label>
//                     <select
//                       value={variety}
//                       onChange={(e) => setVariety(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Variety</option>
//                       <option value="NORMAL">NORMAL</option>
//                       <option value="STOPLOSS">STOPLOSS</option>
//                       <option value="ROBO">ROBO</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* SECTION 3: Product & Strategy */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <h4 className="text-sm font-semibold text-gray-700 mb-3">
//                   Product & Strategy
//                 </h4>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Product Type
//                     </label>
//                     <select
//                       value={scriptProductType}
//                       onChange={(e) =>
//                         setScriptProductType(
//                           e.target.value as
//                             | ""
//                             | "INTRADAY"
//                             | "DELIVERY"
//                             | "CARRYFORWARD"
//                             | "BO"
//                             | "MARGIN"
//                         )
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">Select</option>
//                       <option value="INTRADAY">IntraDay MIS</option>
//                       <option value="DELIVERY">Longterm CNC</option>
//                       <option value="CARRYFORWARD">CARRYFORWARD</option>
//                       <option value="BO">Bracket Order </option>
//                       <option value="MARGIN">Margin Delivery</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Quantity in Lot
//                     </label>
//                     <input
//                       type="number"
//                       placeholder="Enter Quantity in Lot"
//                       value={selectedScriptRow?.lotsize || ""}
//                       onChange={(e) =>
//                         setSelectedScriptRow((prev: any) => ({
//                           ...(prev || {}),
//                           lotsize: e.target.value,
//                         }))
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm bg-white focus:ring-2 focus:ring-blue-500"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Select Strategy *
//                     </label>
//                     <select
//                       className="w-full border rounded px-3 py-2 text-sm"
//                       value={selectedStrategyId}
//                       onChange={(e) => {
//                         const strategyId = e.target.value;
//                         setSelectedStrategyId(strategyId);

//                         const selected: any = strategyList.find(
//                           (s: any) => s.id == strategyId
//                         );

//                         if (selected) {
//                           setGroupName(selected.strategyName);
//                         } else {
//                           setGroupName("");
//                         }
//                       }}
//                     >
//                       <option value="">Select Strategy</option>
//                       {strategyList.map((s: any) => (
//                         <option value={s.id} key={s.id}>
//                           {s.strategyName}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* SECTION 4: Result list */}
//               <div className="border border-gray-200 rounded-lg mb-6">
//                 <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
//                   <span className="text-xs font-semibold text-gray-600">
//                     Search Results (click to select)
//                   </span>
//                 </div>

//                 <div className="max-h-64 overflow-auto">
//                   <table className="w-full text-sm">
//                     <thead className="bg-gray-100 sticky top-0">
//                       <tr>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Symbol
//                         </th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Name
//                         </th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Token
//                         </th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Lot
//                         </th>
//                       </tr>
//                     </thead>

//                     <tbody>
//                       {scriptFilteredRows.map((row) => (
//                         <tr
//                           key={`${row.token}-${row.symbol}`}
//                           className={`cursor-pointer transition-colors ${
//                             selectedScriptRow?.token === row.token ||
//                             selectedScriptRow?.kiteToken === row.token ||
//                             selectedScriptRow?.angelToken === row.token
//                               ? "bg-purple-100"
//                               : "hover:bg-purple-50"
//                           }`}
//                           onClick={() => handleSelectionInstrument(row)}
//                         >
//                           <td className="px-3 py-1">{row.symbol}</td>
//                           <td className="px-3 py-1">{row.name}</td>
//                           <td className="px-3 py-1">{row.token}</td>
//                           <td className="px-3 py-1">{row.lotsize}</td>
//                         </tr>
//                       ))}

//                       {scriptFilteredRows.length === 0 && (
//                         <tr>
//                           <td
//                             className="px-3 py-3 text-center text-gray-500"
//                             colSpan={4}
//                           >
//                             No matching scrips found.
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>

//               {/* Footer buttons */}
//               <div className="flex justify-end gap-3">
//                 <button
//                   onClick={() => {
//                     setScriptSearch("");
//                     setScriptExpiryFilter("");
//                     setScriptOptionFilter("");
//                     setChartSymbolSearch("");
//                     setSelectedScriptRow(null);
//                     setScriptTxnType("BUY");
//                     setScriptProductType("");
//                     setSelectedStrategyId("");
//                     setGroupName("");
//                     setSymbolPrefix("");
//                   }}
//                   className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded text-sm"
//                 >
//                   Reset
//                 </button>

//                 <button
//                   onClick={() => setScriptModalOpen(false)}
//                   className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded text-sm"
//                 >
//                   Close
//                 </button>

//                 <button
//                   onClick={handleScriptSave}
//                   className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded text-sm font-medium"
//                 >
//                   Save changes
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }




// import { useState, useEffect, useRef, useMemo } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { ModuleRegistry } from "ag-grid-community";
// import { AllCommunityModule } from "ag-grid-community";
// ModuleRegistry.registerModules([AllCommunityModule]);
// import { AgGridReact } from "ag-grid-react";
// import type { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";

// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-quartz.css";

// export default function InstrumentFormAdmin() {
//   const apiUrl = import.meta.env.VITE_API_URL;

//   const [quickFilterText, setQuickFilterText] = useState("");
//   const [data, setData] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const [symbolPrefix, setSymbolPrefix] = useState("");
//   const [getslotSIze, setSlotSIze] = useState("");

//   const [duration, setDuration] = useState("DAY");
//   const [orderType, setOrderType] = useState("MARKET");
//   const [variety, setVariety] = useState("NORMAL");

//   const [gridSearch, setGridSearch] = useState("");

//   const gridApiRef = useRef<GridApi | null>(null);

//   const [groupName, setGroupName] = useState("");
//   const [strategyList, setStrategyList] = useState<any[]>([]);
//   const [selectedStrategyId, setSelectedStrategyId] = useState("");

//   const [scriptModalOpen, setScriptModalOpen] = useState(false);
//   const [scriptSearch, setScriptSearch] = useState("");
//   const [scriptExpiryFilter, setScriptExpiryFilter] = useState("");
//   const [scriptOptionFilter, setScriptOptionFilter] =
//     useState<"" | "CE" | "PE">("");
//   const [selectedScriptRow, setSelectedScriptRow] = useState<any | null>(null);
//   const [chartSymbolSearch, setChartSymbolSearch] = useState("");
//   const [scriptTxnType, setScriptTxnType] = useState<"" | "BUY" | "SELL">(
//     "BUY"
//   );
//   const [scriptProductType, setScriptProductType] = useState<
//     "" | "INTRADAY" | "DELIVERY" | "CARRYFORWARD" | "BO" | "MARGIN"
//   >("INTRADAY");

//   const [useKite, setUseKite] = useState(false);

//   // Quick Buy state (Buy button in grid)
//   const [quickBuyRow, setQuickBuyRow] = useState<any | null>(null);
//   const [quickBuyQty, setQuickBuyQty] = useState<string>("");

//   const onFilterTextBoxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setQuickFilterText(e.target.value);
//   };

//   // ---------- Common expiry normalizer ----------
//   const buildExpiryMeta = (rawExpiry: any) => {
//     if (!rawExpiry) return { expiryDateObj: null, expiryLabel: "" };

//     const s = String(rawExpiry).trim();
//     if (!s) return { expiryDateObj: null, expiryLabel: "" };

//     let d: Date | null = null;

//     // 1) YYYY-MM-DD
//     if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
//       d = new Date(s + "T00:00:00");
//     }
//     // 2) DD-MMM-YYYY / DD-MMM-YY
//     else if (/^\d{2}-[A-Za-z]{3}-\d{2,4}$/.test(s)) {
//       const [ddStr, monStrRaw, yyStr] = s.split("-");
//       const dd = Number(ddStr);
//       const monStr = monStrRaw.toUpperCase();
//       const monthMap: Record<string, number> = {
//         JAN: 0,
//         FEB: 1,
//         MAR: 2,
//         APR: 3,
//         MAY: 4,
//         JUN: 5,
//         JUL: 6,
//         AUG: 7,
//         SEP: 8,
//         OCT: 9,
//         NOV: 10,
//         DEC: 11,
//       };
//       const monthIndex = monthMap[monStr];
//       if (monthIndex !== undefined) {
//         let yearNum = Number(yyStr);
//         if (yyStr.length === 2) yearNum = 2000 + yearNum;
//         d = new Date(yearNum, monthIndex, dd);
//       }
//     } else {
//       const t = new Date(s);
//       if (!isNaN(t.getTime())) d = t;
//     }

//     if (!d) return { expiryDateObj: null, expiryLabel: "" };

//     const day = d.getDate().toString().padStart(2, "0");
//     const monthNames = [
//       "JAN",
//       "FEB",
//       "MAR",
//       "APR",
//       "MAY",
//       "JUN",
//       "JUL",
//       "AUG",
//       "SEP",
//       "OCT",
//       "NOV",
//       "DEC",
//     ];
//     const label = `${day}-${monthNames[d.getMonth()]}-${d.getFullYear()}`;

//     return { expiryDateObj: d, expiryLabel: label };
//   };

//   // ---------- Parse option symbol ----------
//   const parseOptionMeta = (symbolRaw: any) => {
//     const symbol = String(symbolRaw || "").toUpperCase();
//     const re = /^([A-Z]+)(\d{2})([A-Z]{3})(\d{2})(\d+)(CE|PE)$/;
//     const m = symbol.match(re);
//     if (!m) return null;

//     const [, underlying, dd, monStr, yy, strike, optType] = m;

//     const monthMap: Record<string, number> = {
//       JAN: 0,
//       FEB: 1,
//       MAR: 2,
//       APR: 3,
//       MAY: 4,
//       JUN: 5,
//       JUL: 6,
//       AUG: 7,
//       SEP: 8,
//       OCT: 9,
//       NOV: 10,
//       DEC: 11,
//     };
//     const monthIndex = monthMap[monStr];
//     if (monthIndex === undefined) return null;

//     const year = 2000 + Number(yy);
//     const day = Number(dd);
//     const dateObj = new Date(year, monthIndex, day);
//     const expiryLabel = `${day.toString().padStart(2, "0")}-${monStr}-${year}`;

//     return {
//       underlying,
//       expiryLabel,
//       expiryDate: dateObj,
//       strike: Number(strike),
//       optionType: optType as "CE" | "PE",
//     };
//   };

//   const getOptionMeta = (row: any) => {
//     const mainSymbol = row.symbol || row.kiteSymbol || row.angelSymbol || "";
//     const fromSymbol = parseOptionMeta(mainSymbol);
//     if (fromSymbol) return fromSymbol;

//     const name = String(row.name || "").toUpperCase();
//     const optMatch = name.match(/\b(CE|PE)\b/);
//     const strikeMatches = name.match(/(\d+)/g);

//     return {
//       underlying: "",
//       expiryLabel: row.expiryLabel || "",
//       expiryDate: row.expiryDateObj || null,
//       strike: strikeMatches
//         ? Number(strikeMatches[strikeMatches.length - 1])
//         : row.strike || 0,
//       optionType: (optMatch?.[1] as "CE" | "PE") || (row.syType as "CE" | "PE"),
//     };
//   };

//   // Only current-month expiry, ignore rows with no expiry
//   const isCurrentMonthExpiry = (row: any) => {
//     let d: Date | null = row.expiryDateObj || null;

//     if (!d) {
//       const meta = parseOptionMeta(
//         row.symbol || row.kiteSymbol || row.angelSymbol
//       );
//       if (meta) d = meta.expiryDate;
//     }

//     if (!d) return false;

//     const now = new Date();
//     return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
//   };

//   // ---------- NORMALIZERS ----------
//   const mapAngelToCommon = (row: any) => {
//     const { expiryDateObj, expiryLabel } = buildExpiryMeta(row.expiry);
//     return {
//       ...row,
//       token: String(row.token ?? ""),
//       symbol: String(row.symbol ?? ""),
//       name: row.name ?? "",
//       expiry: row.expiry ?? "",
//       strike: row.strike !== undefined ? Number(row.strike) : -1,
//       lotsize: row.lotsize !== undefined ? Number(row.lotsize) : 0,
//       instrumenttype: row.instrumenttype ?? "",
//       exch_seg: row.exch_seg ?? "",
//       tick_size: row.tick_size !== undefined ? Number(row.tick_size) : 0,
//       syType: row.instrumenttype ?? row.syType ?? "",
//       angelToken: String(row.token ?? ""),
//       angelSymbol: String(row.symbol ?? ""),
//       kiteToken: row.kiteToken ?? "",
//       kiteSymbol: row.kiteSymbol ?? "",
//       expiryDateObj,
//       expiryLabel,
//     };
//   };

//   const mapKiteToCommon = (row: any) => {
//     const { expiryDateObj, expiryLabel } = buildExpiryMeta(row.expiry);

//     let strike = row.strike;
//     if (!strike) {
//       const metaFromSymbol = parseOptionMeta(row.tradingsymbol);
//       if (metaFromSymbol) {
//         strike = metaFromSymbol.strike;
//       } else {
//         const m = String(row.name || "").match(/\d+/);
//         strike = m ? Number(m[0]) : 0;
//       }
//     }

//     return {
//       ...row,
//       token: String(row.exchange_token ?? ""),
//       symbol: String(row.tradingsymbol ?? ""),
//       name: row.name ?? "",
//       expiry: row.expiry ?? "",
//       strike: Number(strike),
//       lotsize: row.lot_size !== undefined ? Number(row.lot_size) : 0,
//       instrumenttype: row.instrument_type ?? "",
//       exch_seg: row.segment ?? row.exchange ?? "",
//       tick_size: row.tick_size !== undefined ? Number(row.tick_size) : 0,
//       syType: row.instrument_type ?? "",
//       kiteToken: String(row.exchange_token ?? ""),
//       kiteSymbol: String(row.tradingsymbol ?? ""),
//       angelToken: row.angelToken ?? "",
//       angelSymbol: row.angelSymbol ?? "",
//       expiryDateObj,
//       expiryLabel,
//     };
//   };

//   // ---------- Fetch instruments ----------
//   const fetchData = async () => {
//     setLoading(true);
//     setError("");

//     try {
//       const endpoint = useKite ? "/kite/instrument" : "/agnelone/instrument";
//       const res = await axios.get(`${apiUrl}${endpoint}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });

//       if (res?.data?.status === true) {
//         const rawData = res?.data?.data || [];
//         const normalized = useKite
//           ? rawData.map((row: any) => mapKiteToCommon(row))
//           : rawData.map((row: any) => mapAngelToCommon(row));
//         setData(normalized);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err?.message || "Something went wrong");
//       setError(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------- Fetch strategies ----------
//   const fetchStrategies = async () => {
//     try {
//       const res = await axios.get(`${apiUrl}/admin/strategies`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID"),
//         },
//       });

//       if (res.data.status === true) {
//         setStrategyList(res.data.data || []);
//       } else {
//         toast.error(res.data.message);
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//     fetchStrategies();
//     setGridSearch("");
//   }, [useKite]);

//   const handleSelectionInstrument = async (raw: any) => {
//     const payload = {
//       exchange: raw.exch_seg,
//       tradingsymbol: raw.symbol,
//       symboltoken: raw.token,
//     };

//     try {
//       await fetchStrategies();

//       if (useKite) {
//         setSelectedScriptRow((prev: any) => ({
//           ...(prev || {}),
//           kiteToken: raw.exchange_token || raw.kiteToken || raw.token,
//           kiteSymbol: raw.kiteSymbol || raw.symbol,
//           angelToken: prev?.angelToken || "",
//           angelSymbol: prev?.angelSymbol || "",
//           kiteName: raw.name,
//           exch_seg: raw.exch_seg || raw.exchange,
//           lotsize: raw.lotsize,
//           price: 0,
//           expiry: raw.expiry,
//           expiryLabel: raw.expiryLabel,
//           expiryDateObj: raw.expiryDateObj,
//         }));
//         setSlotSIze(raw.lotsize);
//       } else {
//         try {
//           const res = await axios.post(
//             `${apiUrl}/agnelone/instrument/ltp`,
//             payload,
//             {
//               headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//                 AngelOneToken: localStorage.getItem("angel_token") || "",
//                 userid: localStorage.getItem("userID"),
//               },
//             }
//           );

//           if (res?.data?.status === true) {
//             const ltp = res?.data?.data?.data?.ltp || raw.price || 0;

//             setSelectedScriptRow((prev: any) => ({
//               ...(prev || {}),
//               angelToken: raw.angelToken || raw.token,
//               angelSymbol: raw.angelSymbol || raw.symbol,
//               kiteToken: prev?.kiteToken || "",
//               kiteSymbol: prev?.kiteSymbol || "",
//               token: raw.token,
//               symbol: raw.symbol,
//               name: raw.name,
//               exch_seg: raw.exch_seg,
//               lotsize: raw.lotsize,
//               instrumenttype: raw.instrumenttype,
//               price: ltp,
//               expiry: raw.expiry,
//               expiryLabel: raw.expiryLabel,
//               expiryDateObj: raw.expiryDateObj,
//             }));

//             setSlotSIze(raw.lotsize);
//           } else {
//             toast.error(res?.data?.message || "Something went wrong");
//           }
//         } catch (err: any) {
//           console.error(err);
//           toast.error(err.message || "Something went wrong");
//         }
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   const handleOpenScriptModal = () => {
//     setSelectedScriptRow(null);
//     setScriptModalOpen(true);
//     setScriptSearch("");
//     setChartSymbolSearch("");
//     setScriptExpiryFilter("");
//     setScriptOptionFilter("");
//     setScriptTxnType("BUY");
//     setScriptProductType("");
//     setSelectedStrategyId("");
//     setGroupName("");
//     setSymbolPrefix("");
//   };

//   // grid rows = only current month expiry
//   const gridRows = useMemo(
//     () => data.filter((row) => isCurrentMonthExpiry(row)),
//     [data]
//   );

//   // ---------- AG Grid ----------
//   const columnDefs = useMemo<ColDef[]>(
//     () => [
//       { headerName: "Token", field: "token", minWidth: 80 },
//       { headerName: "Type", field: "syType", minWidth: 80 },
//       {
//         headerName: "Symbol",
//         field: "symbol",
//         minWidth: 250,
//         filter: "agTextColumnFilter",
//       },
//       { headerName: "Name", field: "name", minWidth: 120 },
//       { headerName: "Instrument", field: "instrumenttype", minWidth: 120 },
//       { headerName: "Lot-Size", field: "lotsize", width: 110 },
//       ...(useKite
//         ? [
//             { headerName: "Kite Token", field: "kiteToken", minWidth: 120 },
//             { headerName: "Kite Symbol", field: "kiteSymbol", minWidth: 180 },
//           ]
//         : [
//             { headerName: "Angel Token", field: "angelToken", minWidth: 120 },
//             { headerName: "Angel Symbol", field: "angelSymbol", minWidth: 180 },
//           ]),
//       { headerName: "Expiry", field: "expiryLabel", minWidth: 130 },
//       {
//         headerName: "Action",
//         field: "action",
//         width: 120,
//         cellRenderer: (params: any) => {
//           const row = params.data;
//           const handleClick = async () => {
//             await handleSelectionInstrument(row);
//             setQuickBuyRow(row);
//             setQuickBuyQty(String(row.lotsize || ""));
//           };

//           return (
//             <button
//               style={{
//                 padding: "4px 10px",
//                 borderRadius: "4px",
//                 border: "none",
//                 cursor: "pointer",
//                 backgroundColor: "#16a34a",
//                 color: "#fff",
//                 fontSize: "12px",
//               }}
//               onClick={handleClick}
//             >
//               Buy
//             </button>
//           );
//         },
//       },
//     ],
//     [useKite]
//   );

//   const defaultColDef = useMemo<ColDef>(
//     () => ({
//       sortable: true,
//       resizable: true,
//       filter: true,
//       floatingFilter: true,
//     }),
//     []
//   );

//   const onGridReady = (e: GridReadyEvent) => {
//     gridApiRef.current = e.api;
//     e.api.sizeColumnsToFit();
//   };

//   // ---------- Base rows for modal filters ----------
//   const scriptBaseRows = useMemo(() => {
//     let rows = data.filter((row) => {
//       if (useKite) return row.kiteSymbol && row.kiteToken;
//       return row.angelSymbol && row.angelToken;
//     });

//     // only current-month expiry & expiry exists
//     rows = rows.filter((row) => isCurrentMonthExpiry(row));

//     const combinedSearch = `${symbolPrefix} ${scriptSearch}`
//       .trim()
//       .toUpperCase();
//     const tokens = combinedSearch.split(/\s+/).filter(Boolean);

//     if (tokens.length > 0) {
//       rows = rows.filter((row) => {
//         const symbol = String(row.symbol || "").toUpperCase();
//         const name = String(row.name || "").toUpperCase();
//         const haystack = `${symbol} ${name}`;
//         return tokens.every((t) => haystack.includes(t));
//       });
//     }

//     const strikeQ = chartSymbolSearch.trim();
//     if (strikeQ) {
//       rows = rows.filter((row: any) => {
//         return (
//           (row.symbol &&
//             String(row.symbol).toUpperCase().includes(strikeQ.toUpperCase())) ||
//           (row.tradingsymbol &&
//             String(row.tradingsymbol)
//               .toUpperCase()
//               .includes(strikeQ.toUpperCase()))
//         );
//       });
//     }

//     if (scriptOptionFilter) {
//       rows = rows.filter((row) => {
//         const meta = getOptionMeta(row);
//         return meta && meta.optionType === scriptOptionFilter;
//       });
//     }

//     return rows;
//   }, [
//     data,
//     scriptSearch,
//     symbolPrefix,
//     chartSymbolSearch,
//     scriptOptionFilter,
//     useKite,
//   ]);

//   // ---------- Expiry dropdown ----------
//   const allExpiryOptions = useMemo(() => {
//     const now = new Date();
//     const currentMonth = now.getMonth();
//     const currentYear = now.getFullYear();

//     const map = new Map<string, { label: string; date: Date }>();

//     scriptBaseRows.forEach((row) => {
//       let d: Date | null = row.expiryDateObj || null;
//       let label: string = row.expiryLabel || "";

//       if (!d || !label) {
//         const meta = parseOptionMeta(
//           row.symbol || row.kiteSymbol || row.angelSymbol
//         );
//         if (meta) {
//           d = meta.expiryDate;
//           label = meta.expiryLabel;
//         }
//       }

//       if (!d || !label) return;
//       if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) return;

//       const key = d.toISOString().slice(0, 10);
//       if (!map.has(key)) {
//         map.set(key, { label, date: d });
//       }
//     });

//     return Array.from(map.entries())
//       .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
//       .map(([key, value]) => ({
//         key,
//         label: value.label,
//       }));
//   }, [scriptBaseRows]);

//   // ---------- Final modal rows ----------
//   const scriptFilteredRows = useMemo(() => {
//     let rows = [...scriptBaseRows];

//     if (scriptExpiryFilter) {
//       rows = rows.filter((row) => {
//         if (row.expiryLabel === scriptExpiryFilter) return true;
//         const meta = getOptionMeta(row);
//         return meta?.expiryLabel === scriptExpiryFilter;
//       });
//     }

//     return rows.slice(0, 300);
//   }, [scriptBaseRows, scriptExpiryFilter]);

//   // ---------- Save from modal ----------
//   const handleScriptSave = async () => {
//     if (!selectedScriptRow) {
//       toast.error("Please select a scrip from the list");
//       return;
//     }

//     const lotSizeNum = Number(selectedScriptRow.lotsize || 0);
//     const priceNum = Number(selectedScriptRow.price || 0);
//     const slotSizeNum = Number(getslotSIze || 1) || 1;

//     const requiredFields = [
//       { label: "Token", value: selectedScriptRow.token },
//       { label: "Symbol", value: selectedScriptRow.symbol },
//       { label: "Name", value: selectedScriptRow.name },
//       { label: "Exchange Segment", value: selectedScriptRow.exch_seg },
//       { label: "AngelOne Token", value: selectedScriptRow.angelToken },
//       { label: "AngelOne Symbol", value: selectedScriptRow.angelSymbol },
//       { label: "Kite Token", value: selectedScriptRow.kiteToken },
//       { label: "Kite Symbol", value: selectedScriptRow.kiteSymbol },
//       { label: "Group Name", value: groupName },
//       { label: "Quantity (Lot Size)", value: lotSizeNum },
//       { label: "Product Type", value: scriptProductType },
//     ];

//     for (let item of requiredFields) {
//       if (!item.value || item.value === "" || item.value === " ") {
//         toast.error(`${item.label} is required.`);
//         return;
//       }
//     }

//     const payload = {
//       token: selectedScriptRow.token || "",
//       symbol: selectedScriptRow.symbol || "",
//       name: selectedScriptRow.name || "",
//       exch_seg: selectedScriptRow.exch_seg || "",
//       lotsize: lotSizeNum,
//       instrumenttype: selectedScriptRow.instrumenttype || "",
//       price: priceNum,
//       quantity: lotSizeNum,
//       transactiontype: scriptTxnType,
//       duration,
//       orderType,
//       variety,
//       productType: scriptProductType,
//       totalPrice: priceNum * lotSizeNum,
//       actualQuantity: lotSizeNum / slotSizeNum,
//       searchText: scriptSearch || "",
//       chartSymbol: chartSymbolSearch || "",
//       optionType: scriptOptionFilter || "",
//       expiry: selectedScriptRow.expiry || "",
//       expiryLabel: selectedScriptRow.expiryLabel || "",
//       strategyId: selectedStrategyId || "",
//       groupName: groupName,
//       angelOneToken: selectedScriptRow.angelToken || "",
//       angelOneSymbol: selectedScriptRow.angelSymbol || "",
//       kiteToken: selectedScriptRow.kiteToken || "",
//       kiteSymbol: selectedScriptRow.kiteSymbol || "",
//     };

//     try {
//       const res = await axios.post(
//         `${apiUrl}/admin/multiple/place/order`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         }
//       );

//       if (res?.data?.status === true) {
//         alert(res?.data?.message);
//         setVariety("NORMAL");
//         setDuration("DAY");
//         setOrderType("MARKET");
//         setScriptModalOpen(false);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   // ---------- Quick Buy ----------
//   const handleQuickBuy = async () => {
//     if (!quickBuyRow) {
//       toast.error("No instrument selected");
//       return;
//     }

//     const qtyNum = Number(quickBuyQty);
//     if (!qtyNum || qtyNum <= 0) {
//       toast.error("Please enter a valid quantity");
//       return;
//     }

//     const slotSizeNum = Number(getslotSIze || 1) || 1;
//     const priceNum = Number(quickBuyRow.price || 0);

//     const payload = {
//       token: quickBuyRow.token || "",
//       symbol: quickBuyRow.symbol || "",
//       name: quickBuyRow.name || "",
//       exch_seg: quickBuyRow.exch_seg || "",
//       lotsize: qtyNum,
//       instrumenttype: quickBuyRow.instrumenttype || "",
//       price: priceNum,
//       quantity: qtyNum,
//       transactiontype: "BUY",
//       duration,
//       orderType,
//       variety,
//       productType: scriptProductType || "INTRADAY",
//       totalPrice: priceNum * qtyNum,
//       actualQuantity: qtyNum / slotSizeNum,
//       searchText: "",
//       chartSymbol: "",
//       optionType: quickBuyRow.syType || "",
//       expiry: quickBuyRow.expiry || "",
//       expiryLabel: quickBuyRow.expiryLabel || "",
//       strategyId: selectedStrategyId || "",
//       groupName: groupName || "",
//       angelOneToken: quickBuyRow.angelToken || "",
//       angelOneSymbol: quickBuyRow.angelSymbol || "",
//       kiteToken: quickBuyRow.kiteToken || "",
//       kiteSymbol: quickBuyRow.kiteSymbol || "",
//     };

//     try {
//       const res = await axios.post(
//         `${apiUrl}/admin/multiple/place/order`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         }
//       );

//       if (res?.data?.status === true) {
//         toast.success(res?.data?.message || "Order placed successfully");
//         setQuickBuyRow(null);
//         setQuickBuyQty("");
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   // ---------- JSX ----------
//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <h2 className="text-xl font-semibold mb-4">Nifty Bank Instruments</h2>

//       {/* Top controls */}
//       <div className="flex justify-between items-center mb-4 gap-4">
//         <div className="w-full sm:w-80">
//           <input
//             type="text"
//             value={quickFilterText}
//             onChange={onFilterTextBoxChange}
//             placeholder='AG Grid Quick Filter (e.g. "NIFTY02DEC2525800PE" or "NIFTY")'
//             className="border p-2 w-full rounded"
//           />
//         </div>

//         <div className="flex items-center gap-4">
//           <label className="flex items-center gap-2">
//             <input
//               type="checkbox"
//               checked={useKite}
//               onChange={(e) => setUseKite(e.target.checked)}
//               className="h-4 w-4"
//             />
//             Use Kite Instruments
//           </label>

//           <button
//             className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
//             onClick={handleOpenScriptModal}
//           >
//             Add/Edit
//           </button>
//         </div>
//       </div>

//       {/* INLINE MODAL CARD – ABOVE TABLE */}
//       {scriptModalOpen && (
//         <div className="border border-gray-300 bg-white rounded-xl shadow-md mb-6">
//           <div className="p-4 border-b flex items-center justify-between">
//             <h3 className="text-lg font-semibold">Add / Edit Scrip</h3>
//             <button
//               onClick={() => setScriptModalOpen(false)}
//               className="text-gray-500 hover:text-black text-xl leading-none"
//             >
//               ×
//             </button>
//           </div>

//           <div className="p-4 max-h-[70vh] overflow-y-auto">
//             {/* SECTION 1: Scrip Details & Search */}
//             <div className="border border-gray-200 rounded-lg p-4 mb-6">
//               <div className="flex items-center justify-between mb-3">
//                 <h4 className="text-sm font-semibold text-gray-700">
//                   Scrip Details & Search
//                 </h4>

//                 <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
//                   <input
//                     type="checkbox"
//                     checked={useKite}
//                     onChange={(e) => setUseKite(e.target.checked)}
//                     className="h-4 w-4"
//                   />
//                   Search in Kite Instruments (unchecked = AngelOne)
//                 </label>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                 <div>
//                   <label className="block text-xs font-medium text-gray-600 mb-1">
//                     Search Name / Symbol / CE / PE
//                   </label>

//                   <div className="flex gap-2">
//                     <select
//                       value={symbolPrefix}
//                       onChange={(e) => setSymbolPrefix(e.target.value)}
//                       className="border rounded px-3 py-2 text-sm bg-white"
//                       style={{ minWidth: "120px" }}
//                     >
//                       <option value="">Select</option>
//                       <option value="NIFTY">NIFTY</option>
//                       <option value="BANKNIFTY">BANKNIFTY</option>
//                     </select>

//                     <input
//                       type="text"
//                       value={scriptSearch}
//                       onChange={(e) => setScriptSearch(e.target.value)}
//                       placeholder="e.g. 26150 CE"
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-xs font-medium text-gray-600 mb-1">
//                     Chart Symbol (Strike)
//                   </label>
//                   <input
//                     type="text"
//                     placeholder="e.g. 26150"
//                     value={chartSymbolSearch}
//                     onChange={(e) => setChartSymbolSearch(e.target.value)}
//                     className="border rounded px-3 py-2 w-full text-sm"
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* SECTION 2: Filters & Order Settings */}
//             <div className="border border-gray-200 rounded-lg p-4 mb-6">
//               <h4 className="text-sm font-semibold text-gray-700 mb-3">
//                 Filters & Order Settings
//               </h4>

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//                 <div>
//                   <label className="block text-xs font-medium text-gray-600 mb-1">
//                     Option Type
//                   </label>
//                   <select
//                     value={scriptOptionFilter}
//                     onChange={(e) =>
//                       setScriptOptionFilter(e.target.value as "" | "CE" | "PE")
//                     }
//                     className="border rounded px-3 py-2 w-full text-sm"
//                   >
//                     <option value="">ALL</option>
//                     <option value="CE">CE (Call)</option>
//                     <option value="PE">PE (Put)</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-xs font-medium text-gray-600 mb-1">
//                     Expiry (current month)
//                   </label>
//                   <select
//                     value={scriptExpiryFilter}
//                     onChange={(e) => setScriptExpiryFilter(e.target.value)}
//                     className="border rounded px-3 py-2 w-full text-sm"
//                   >
//                     <option value="">All Expiries</option>
//                     {allExpiryOptions.map((exp) => (
//                       <option key={exp.key} value={exp.label}>
//                         {exp.label}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-xs font-medium text-gray-600 mb-1">
//                     Transaction Type
//                   </label>
//                   <select
//                     value={scriptTxnType}
//                     onChange={(e) =>
//                       setScriptTxnType(e.target.value as "" | "BUY" | "SELL")
//                     }
//                     className="border rounded px-3 py-2 w-full text-sm"
//                   >
//                     <option value="BUY">BUY</option>
//                     <option value="SELL">SELL</option>
//                   </select>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div>
//                   <label className="block text-xs font-medium text-gray-600 mb-1">
//                     Order Type
//                   </label>
//                   <select
//                     value={orderType}
//                     onChange={(e) => setOrderType(e.target.value)}
//                     required
//                     className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value="">Select Order Type</option>
//                     <option value="MARKET">MARKET</option>
//                     <option value="LIMIT">LIMIT</option>
//                     <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT</option>
//                     <option value="STOPLOSS_MARKET">STOPLOSS_MARKET</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-xs font-medium text-gray-600 mb-1">
//                     Duration
//                   </label>
//                   <select
//                     value={duration}
//                     onChange={(e) => setDuration(e.target.value)}
//                     required
//                     className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value="">Select Duration</option>
//                     <option value="DAY">DAY</option>
//                     <option value="IOC">IOC</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-xs font-medium text-gray-600 mb-1">
//                     Variety
//                   </label>
//                   <select
//                     value={variety}
//                     onChange={(e) => setVariety(e.target.value)}
//                     required
//                     className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value="">Select Variety</option>
//                     <option value="NORMAL">NORMAL</option>
//                     <option value="STOPLOSS">STOPLOSS</option>
//                     <option value="ROBO">ROBO</option>
//                   </select>
//                 </div>
//               </div>
//             </div>

//             {/* SECTION 3: Product & Strategy */}
//             <div className="border border-gray-200 rounded-lg p-4 mb-6">
//               <h4 className="text-sm font-semibold text-gray-700 mb-3">
//                 Product & Strategy
//               </h4>

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div>
//                   <label className="block text-xs font-medium text-gray-600 mb-1">
//                     Product Type
//                   </label>
//                   <select
//                     value={scriptProductType}
//                     onChange={(e) =>
//                       setScriptProductType(
//                         e.target.value as
//                           | ""
//                           | "INTRADAY"
//                           | "DELIVERY"
//                           | "CARRYFORWARD"
//                           | "BO"
//                           | "MARGIN"
//                       )
//                     }
//                     className="border rounded px-3 py-2 w-full text-sm"
//                   >
//                     <option value="">Select</option>
//                     <option value="INTRADAY">IntraDay MIS</option>
//                     <option value="DELIVERY">Longterm CNC</option>
//                     <option value="CARRYFORWARD">CARRYFORWARD</option>
//                     <option value="BO">Bracket Order</option>
//                     <option value="MARGIN">Margin Delivery</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-xs font-medium text-gray-600 mb-1">
//                     Quantity in Lot
//                   </label>
//                   <input
//                     type="number"
//                     placeholder="Enter Quantity in Lot"
//                     value={selectedScriptRow?.lotsize || ""}
//                     onChange={(e) =>
//                       setSelectedScriptRow((prev: any) => ({
//                         ...(prev || {}),
//                         lotsize: e.target.value,
//                       }))
//                     }
//                     className="border rounded px-3 py-2 w-full text-sm bg-white focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-xs font-medium text-gray-600 mb-1">
//                     Select Strategy *
//                   </label>
//                   <select
//                     className="w-full border rounded px-3 py-2 text-sm"
//                     value={selectedStrategyId}
//                     onChange={(e) => {
//                       const strategyId = e.target.value;
//                       setSelectedStrategyId(strategyId);
//                       const selected: any = strategyList.find(
//                         (s: any) => s.id == strategyId
//                       );
//                       if (selected) setGroupName(selected.strategyName);
//                       else setGroupName("");
//                     }}
//                   >
//                     <option value="">Select Strategy</option>
//                     {strategyList.map((s: any) => (
//                       <option value={s.id} key={s.id}>
//                         {s.strategyName}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>
//             </div>

//             {/* SECTION 4: Search Result list */}
//             <div className="border border-gray-200 rounded-lg mb-6">
//               <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
//                 <span className="text-xs font-semibold text-gray-600">
//                   Search Results (click to select)
//                 </span>
//               </div>

//               <div className="max-h-64 overflow-auto">
//                 <table className="w-full text-sm">
//                   <thead className="bg-gray-100 sticky top-0">
//                     <tr>
//                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                         Symbol
//                       </th>
//                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                         Name
//                       </th>
//                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                         Token
//                       </th>
//                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                         Lot
//                       </th>
//                     </tr>
//                   </thead>

//                   <tbody>
//                     {scriptFilteredRows.map((row) => (
//                       <tr
//                         key={`${row.token}-${row.symbol}`}
//                         className={`cursor-pointer transition-colors ${
//                           selectedScriptRow?.token === row.token ||
//                           selectedScriptRow?.kiteToken === row.token ||
//                           selectedScriptRow?.angelToken === row.token
//                             ? "bg-purple-100"
//                             : "hover:bg-purple-50"
//                         }`}
//                         onClick={() => handleSelectionInstrument(row)}
//                       >
//                         <td className="px-3 py-1">{row.symbol}</td>
//                         <td className="px-3 py-1">{row.name}</td>
//                         <td className="px-3 py-1">{row.token}</td>
//                         <td className="px-3 py-1">{row.lotsize}</td>
//                       </tr>
//                     ))}

//                     {scriptFilteredRows.length === 0 && (
//                       <tr>
//                         <td
//                           className="px-3 py-3 text-center text-gray-500"
//                           colSpan={4}
//                         >
//                           No matching scrips found.
//                         </td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </div>

//             {/* Footer buttons */}
//             <div className="flex justify-end gap-3 mt-2">
//               <button
//                 onClick={() => {
//                   setScriptSearch("");
//                   setScriptExpiryFilter("");
//                   setScriptOptionFilter("");
//                   setChartSymbolSearch("");
//                   setSelectedScriptRow(null);
//                   setScriptTxnType("BUY");
//                   setScriptProductType("");
//                   setSelectedStrategyId("");
//                   setGroupName("");
//                   setSymbolPrefix("");
//                 }}
//                 className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded text-sm"
//               >
//                 Reset
//               </button>

//               <button
//                 onClick={() => setScriptModalOpen(false)}
//                 className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded text-sm"
//               >
//                 Close
//               </button>

//               <button
//                 onClick={handleScriptSave}
//                 className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded text-sm font-medium"
//               >
//                 Save changes
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* GRID + Quick Buy */}
//       {loading && <p>Loading data...</p>}
//       {error && <p className="text-red-500">{error}</p>}
//       {!loading && !error && gridRows.length === 0 && (
//         <p>No current-month expiry instruments found.</p>
//       )}

//       {gridRows.length > 0 && (
//         <div
//           className="ag-theme-quartz compact-grid"
//           style={{ height: 540, width: "100%" }}
//         >
//           <AgGridReact
//             rowData={gridRows}
//             columnDefs={columnDefs}
//             defaultColDef={defaultColDef}
//             animateRows
//             rowSelection="single"
//             pagination
//             paginationPageSize={10000}
//             rowHeight={34}
//             suppressFieldDotNotation
//             onGridReady={onGridReady}
//             quickFilterText={quickFilterText}
//           />
//         </div>
//       )}

//       {/* Quick Buy Form */}
//       {quickBuyRow && (
//         <div className="mt-4 border border-green-300 bg-green-50 rounded-lg p-4">
//           <div className="flex justify-between items-center mb-3">
//             <h3 className="font-semibold text-sm text-green-800">
//               Quick Buy Order
//             </h3>
//             <button
//               className="text-xs text-red-500 hover:underline"
//               onClick={() => {
//                 setQuickBuyRow(null);
//                 setQuickBuyQty("");
//               }}
//             >
//               Close
//             </button>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1">
//                 Selected Instrument
//               </label>
//               <div className="border rounded px-3 py-2 text-sm bg-white">
//                 <div className="font-semibold">{quickBuyRow.symbol}</div>
//                 <div className="text-xs text-gray-600">
//                   {quickBuyRow.name}{" "}
//                   {quickBuyRow.expiryLabel && (
//                     <>| Expiry: {quickBuyRow.expiryLabel}</>
//                   )}
//                 </div>
//               </div>
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1">
//                 Quantity
//               </label>
//               <input
//                 type="number"
//                 value={quickBuyQty}
//                 onChange={(e) => setQuickBuyQty(e.target.value)}
//                 placeholder="Enter quantity"
//                 className="border rounded px-3 py-2 w-full text-sm bg-white focus:ring-2 focus:ring-green-500"
//               />
//             </div>

//             <div className="flex gap-2">
//               <button
//                 onClick={handleQuickBuy}
//                 className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium w-full"
//               >
//                 Buy Now
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }






// import { useState, useEffect, useRef, useMemo } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { ModuleRegistry } from "ag-grid-community";
// import { AllCommunityModule } from "ag-grid-community";
// import { AgGridReact } from "ag-grid-react";
// import type { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";
// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-quartz.css";

// ModuleRegistry.registerModules([AllCommunityModule]);

// export default function InstrumentFormAdmin() {
//   const apiUrl = import.meta.env.VITE_API_URL;
//   const [quickFilterText, setQuickFilterText] = useState("");
//   const [data, setData] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [symbolPrefix, setSymbolPrefix] = useState("");
//   const [getslotSIze, setSlotSIze] = useState("");
//   const [duration, setDuration] = useState("DAY");
//   const [orderType, setOrderType] = useState("MARKET");
//   const [variety, setVariety] = useState("NORMAL");
//   const [gridSearch, setGridSearch] = useState("");
//   const gridApiRef = useRef<GridApi | null>(null);
//   const [groupName, setGroupName] = useState("");
//   const [strategyList, setStrategyList] = useState<any[]>([]);
//   const [selectedStrategyId, setSelectedStrategyId] = useState("");
//   const [scriptModalOpen, setScriptModalOpen] = useState(false);
//   const [scriptSearch, setScriptSearch] = useState("");
//   const [scriptExpiryFilter, setScriptExpiryFilter] = useState("");
//   const [scriptOptionFilter, setScriptOptionFilter] = useState<"" | "CE" | "PE">("");
//   const [selectedScriptRow, setSelectedScriptRow] = useState<any | null>(null);
//   const [chartSymbolSearch, setChartSymbolSearch] = useState("");
//   const [scriptTxnType, setScriptTxnType] = useState<"" | "BUY" | "SELL">("BUY");
//   const [scriptProductType, setScriptProductType] = useState<"" | "INTRADAY" | "DELIVERY" | "CARRYFORWARD" | "BO" | "MARGIN">("INTRADAY");
//   const [useKite, setUseKite] = useState(false);
//   const [quickBuyModalOpen, setQuickBuyModalOpen] = useState(false);
//   const [quickBuyRow, setQuickBuyRow] = useState<any | null>(null);
//   const [quickBuyQty, setQuickBuyQty] = useState<string>("");

//   // ---------- Common expiry normalizer ----------
//   const buildExpiryMeta = (rawExpiry: any) => {
//     if (!rawExpiry) return { expiryDateObj: null, expiryLabel: "" };
//     const s = String(rawExpiry).trim();
//     if (!s) return { expiryDateObj: null, expiryLabel: "" };
//     let d: Date | null = null;
//     if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
//       d = new Date(s + "T00:00:00");
//     } else if (/^\d{2}-[A-Za-z]{3}-\d{2,4}$/.test(s)) {
//       const [ddStr, monStrRaw, yyStr] = s.split("-");
//       const dd = Number(ddStr);
//       const monStr = monStrRaw.toUpperCase();
//       const monthMap: Record<string, number> = {
//         JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
//         JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
//       };
//       const monthIndex = monthMap[monStr];
//       if (monthIndex !== undefined) {
//         let yearNum = Number(yyStr);
//         if (yyStr.length === 2) yearNum = 2000 + yearNum;
//         d = new Date(yearNum, monthIndex, dd);
//       }
//     } else {
//       const t = new Date(s);
//       if (!isNaN(t.getTime())) d = t;
//     }
//     if (!d) return { expiryDateObj: null, expiryLabel: "" };
//     const day = d.getDate().toString().padStart(2, "0");
//     const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
//     const label = `${day}-${monthNames[d.getMonth()]}-${d.getFullYear()}`;
//     return { expiryDateObj: d, expiryLabel: label };
//   };

//   // ---------- Parse option symbol ----------
//   const parseOptionMeta = (symbolRaw: any) => {
//     const symbol = String(symbolRaw || "").toUpperCase();
//     const re = /^([A-Z]+)(\d{2})([A-Z]{3})(\d{2})(\d+)(CE|PE)$/;
//     const m = symbol.match(re);
//     if (!m) return null;
//     const [, underlying, dd, monStr, yy, strike, optType] = m;
//     const monthMap: Record<string, number> = {
//       JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
//       JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
//     };
//     const monthIndex = monthMap[monStr];
//     if (monthIndex === undefined) return null;
//     const year = 2000 + Number(yy);
//     const day = Number(dd);
//     const dateObj = new Date(year, monthIndex, day);
//     const expiryLabel = `${day.toString().padStart(2, "0")}-${monStr}-${year}`;
//     return {
//       underlying,
//       expiryLabel,
//       expiryDate: dateObj,
//       strike: Number(strike),
//       optionType: optType as "CE" | "PE",
//     };
//   };

//   // ---------- Get option meta ----------
//   const getOptionMeta = (row: any) => {
//     const mainSymbol = row.symbol || row.kiteSymbol || row.angelSymbol || "";
//     const fromSymbol = parseOptionMeta(mainSymbol);
//     if (fromSymbol) return fromSymbol;
//     const name = String(row.name || "").toUpperCase();
//     const optMatch = name.match(/\b(CE|PE)\b/);
//     const strikeMatches = name.match(/(\d+)/g);
//     return {
//       underlying: "",
//       expiryLabel: row.expiryLabel || "",
//       expiryDate: row.expiryDateObj || null,
//       strike: strikeMatches
//         ? Number(strikeMatches[strikeMatches.length - 1])
//         : row.strike || 0,
//       optionType: (optMatch?.[1] as "CE" | "PE") || (row.syType as "CE" | "PE"),
//     };
//   };

//   // ---------- Check if expiry is current month ----------
//   const isCurrentMonthExpiry = (row: any) => {
//     let d: Date | null = row.expiryDateObj || null;
//     if (!d) {
//       const meta = parseOptionMeta(
//         row.symbol || row.kiteSymbol || row.angelSymbol
//       );
//       if (meta) d = meta.expiryDate;
//     }
//     if (!d) return false;
//     const now = new Date();
//     return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
//   };

//   // ---------- NORMALIZERS ----------
//   const mapAngelToCommon = (row: any) => {
//     const { expiryDateObj, expiryLabel } = buildExpiryMeta(row.expiry);
//     return {
//       ...row,
//       token: String(row.token ?? ""),
//       symbol: String(row.symbol ?? ""),
//       name: row.name ?? "",
//       expiry: row.expiry ?? "",
//       strike: row.strike !== undefined ? Number(row.strike) : -1,
//       lotsize: row.lotsize !== undefined ? Number(row.lotsize) : 0,
//       instrumenttype: row.instrumenttype ?? "",
//       exch_seg: row.exch_seg ?? "",
//       tick_size: row.tick_size !== undefined ? Number(row.tick_size) : 0,
//       syType: row.instrumenttype ?? row.syType ?? "",
//       angelToken: String(row.token ?? ""),
//       angelSymbol: String(row.symbol ?? ""),
//       kiteToken: row.kiteToken ?? "",
//       kiteSymbol: row.kiteSymbol ?? "",
//       expiryDateObj,
//       expiryLabel,
//     };
//   };

//   const mapKiteToCommon = (row: any) => {
//     const { expiryDateObj, expiryLabel } = buildExpiryMeta(row.expiry);
//     let strike = row.strike;
//     if (!strike) {
//       const metaFromSymbol = parseOptionMeta(row.tradingsymbol);
//       if (metaFromSymbol) {
//         strike = metaFromSymbol.strike;
//       } else {
//         const m = String(row.name || "").match(/\d+/);
//         strike = m ? Number(m[0]) : 0;
//       }
//     }
//     return {
//       ...row,
//       token: String(row.exchange_token ?? ""),
//       symbol: String(row.tradingsymbol ?? ""),
//       name: row.name ?? "",
//       expiry: row.expiry ?? "",
//       strike: Number(strike),
//       lotsize: row.lot_size !== undefined ? Number(row.lot_size) : 0,
//       instrumenttype: row.instrument_type ?? "",
//       exch_seg: row.segment ?? row.exchange ?? "",
//       tick_size: row.tick_size !== undefined ? Number(row.tick_size) : 0,
//       syType: row.instrument_type ?? "",
//       kiteToken: String(row.exchange_token ?? ""),
//       kiteSymbol: String(row.tradingsymbol ?? ""),
//       angelToken: row.angelToken ?? "",
//       angelSymbol: row.angelSymbol ?? "",
//       expiryDateObj,
//       expiryLabel,
//     };
//   };

//   // ---------- Fetch instruments ----------
//   const fetchData = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const endpoint = useKite ? "/kite/instrument" : "/agnelone/instrument";
//       const res = await axios.get(`${apiUrl}${endpoint}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });
//       if (res?.data?.status === true) {
//         const rawData = res?.data?.data || [];
//         const normalized = useKite
//           ? rawData.map((row: any) => mapKiteToCommon(row))
//           : rawData.map((row: any) => mapAngelToCommon(row));
//         setData(normalized);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err?.message || "Something went wrong");
//       setError(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------- Fetch strategies ----------
//   const fetchStrategies = async () => {
//     try {
//       const res = await axios.get(`${apiUrl}/admin/strategies`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID"),
//         },
//       });
//       if (res.data.status === true) {
//         setStrategyList(res.data.data || []);
//       } else {
//         toast.error(res.data.message);
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//     fetchStrategies();
//     setGridSearch("");
//   }, [useKite]);

//   // ---------- AG Grid ----------
//   const gridRows = useMemo(
//     () => data.filter((row) => isCurrentMonthExpiry(row)),
//     [data]
//   );

//   const columnDefs = useMemo<ColDef[]>(
//     () => [
//           {
//         headerName: "Action",
//         field: "action",
//         width: 200,
//         minWidth:150,
//         cellRenderer: (params: any) => {
//           const row = params.data;
//           const handleClick = () => {
//             setQuickBuyRow(row);
//             setQuickBuyQty(String(row.lotsize || ""));
//             setQuickBuyModalOpen(true);
//           };
//           return (
//             <button
//               style={{
//                 padding: "4px 10px",
//                 borderRadius: "4px",
//                 border: "none",
//                 cursor: "pointer",
//                 backgroundColor: "#16a34a",
//                 color: "#fff",
//                 fontSize: "12px",
//               }}
//               onClick={handleClick}
//             >
//               Buy
//             </button>
//           );
//         },
//       },
//       // { headerName: "Token", field: "token", minWidth: 80 },
//       // { headerName: "Type", field: "syType", minWidth: 80 },
//       {
//         headerName: "Symbol",
//         field: "symbol",
//         minWidth: 250,
//         filter: "agTextColumnFilter",
//       },
//       { headerName: "Name", field: "name", minWidth: 120 },
//       // { headerName: "Instrument", field: "instrumenttype", minWidth: 120 },
//       // { headerName: "Lot-Size", field: "lotsize", width: 110 },
//       // ...(useKite
//       //   ? [
//       //       { headerName: "Kite Token", field: "kiteToken", minWidth: 120 },
//       //       { headerName: "Kite Symbol", field: "kiteSymbol", minWidth: 180 },
//       //     ]
//       //   : [
//       //       { headerName: "Angel Token", field: "angelToken", minWidth: 120 },
//       //       { headerName: "Angel Symbol", field: "angelSymbol", minWidth: 180 },
//       //     ]),
//       // { headerName: "Expiry", field: "expiryLabel", minWidth: 130 },
  
//     ],
//     [useKite]
//   );

//   const defaultColDef = useMemo<ColDef>(
//     () => ({
//       sortable: true,
//       resizable: true,
//       filter: true,
//       floatingFilter: true,
//     }),
//     []
//   );

//   const onGridReady = (e: GridReadyEvent) => {
//     gridApiRef.current = e.api;
//     e.api.sizeColumnsToFit();
//   };

//   // ---------- Quick Buy Modal ----------
//   const handleQuickBuy = async () => {
//     if (!quickBuyRow) {
//       toast.error("No instrument selected");
//       return;
//     }
//     const qtyNum = Number(quickBuyQty);
//     if (!qtyNum || qtyNum <= 0) {
//       toast.error("Please enter a valid quantity");
//       return;
//     }
//     const slotSizeNum = Number(getslotSIze || 1) || 1;
//     const priceNum = Number(quickBuyRow.price || 0);
//     const payload = {
//       token: quickBuyRow.token || "",
//       symbol: quickBuyRow.symbol || "",
//       name: quickBuyRow.name || "",
//       exch_seg: quickBuyRow.exch_seg || "",
//       lotsize: qtyNum,
//       instrumenttype: quickBuyRow.instrumenttype || "",
//       price: priceNum,
//       quantity: qtyNum,
//       transactiontype: "BUY",
//       duration,
//       orderType,
//       variety,
//       productType: scriptProductType || "INTRADAY",
//       totalPrice: priceNum * qtyNum,
//       actualQuantity: qtyNum / slotSizeNum,
//       searchText: "",
//       chartSymbol: "",
//       optionType: quickBuyRow.syType || "",
//       expiry: quickBuyRow.expiry || "",
//       expiryLabel: quickBuyRow.expiryLabel || "",
//       strategyId: selectedStrategyId || "",
//       groupName: groupName || "",
//       angelOneToken: quickBuyRow.angelToken || "",
//       angelOneSymbol: quickBuyRow.angelSymbol || "",
//       kiteToken: quickBuyRow.kiteToken || "",
//       kiteSymbol: quickBuyRow.kiteSymbol || "",
//     };
//     try {
//       const res = await axios.post(
//         `${apiUrl}/admin/multiple/place/order`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         }
//       );
//       if (res?.data?.status === true) {
//         toast.success(res?.data?.message || "Order placed successfully");
//         setQuickBuyModalOpen(false);
//         setQuickBuyRow(null);
//         setQuickBuyQty("");
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   // ---------- JSX ----------
//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <h2 className="text-xl font-semibold mb-4">Nifty Bank Instruments</h2>
//       {/* Top controls */}
//       <div className="flex justify-between items-center mb-4 gap-4">
//         <div className="w-full sm:w-80">
//           <input
//             type="text"
//             value={quickFilterText}
//             onChange={(e) => setQuickFilterText(e.target.value)}
//             placeholder='AG Grid Quick Filter (e.g. "NIFTY02DEC2525800PE" or "NIFTY")'
//             className="border p-2 w-full rounded"
//           />
//         </div>
//         <div className="flex items-center gap-4">
//           <label className="flex items-center gap-2">
//             <input
//               type="checkbox"
//               checked={useKite}
//               onChange={(e) => setUseKite(e.target.checked)}
//               className="h-4 w-4"
//             />
//             Use Kite Instruments
//           </label>
//         </div>
//       </div>

//       {/* Quick Buy Modal */}
//       {quickBuyModalOpen && quickBuyRow && (
//         <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-99999">
//           <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
//             <div className="flex justify-between items-center mb-4">
//               <h3 className="text-lg font-semibold">Quick Buy Order</h3>
//               <button
//                 onClick={() => {
//                   setQuickBuyModalOpen(false);
//                   setQuickBuyRow(null);
//                   setQuickBuyQty("");
//                 }}
//                 className="text-gray-500 hover:text-black text-xl leading-none"
//               >
//                 ×
//               </button>
//             </div>
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Instrument
//                 </label>
//                 <div className="border rounded px-3 py-2 bg-gray-50">
//                   <div className="font-medium">{quickBuyRow.symbol}</div>
//                   <div className="text-xs text-gray-600">
//                     {quickBuyRow.name}{" "}
//                     {quickBuyRow.expiryLabel && (
//                       <>| Expiry: {quickBuyRow.expiryLabel}</>
//                     )}
//                   </div>
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Quantity (Lot Size)
//                 </label>
//                 <input
//                   type="number"
//                   value={quickBuyQty}
//                   onChange={(e) => setQuickBuyQty(e.target.value)}
//                   placeholder="Enter quantity"
//                   className="border rounded px-3 py-2 w-full text-sm"
//                 />
//               </div>
//               <div className="flex justify-end gap-2">
//                 <button
//                   onClick={() => {
//                     setQuickBuyModalOpen(false);
//                     setQuickBuyRow(null);
//                     setQuickBuyQty("");
//                   }}
//                   className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded text-sm"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleQuickBuy}
//                   className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
//                 >
//                   Buy Now
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* AG Grid */}
//       {loading && <p>Loading data...</p>}
//       {error && <p className="text-red-500">{error}</p>}
//       {!loading && !error && gridRows.length === 0 && (
//         <p>No current-month expiry instruments found.</p>
//       )}
//       {gridRows.length > 0 && (
//         <div
//           className="ag-theme-quartz compact-grid"
//           style={{ height: 540, width: "100%" }}
//         >
//           <AgGridReact
//             rowData={gridRows}
//             columnDefs={columnDefs}
//             defaultColDef={defaultColDef}
//             animateRows
//             rowSelection="single"
//             pagination
//             paginationPageSize={10000}
//             rowHeight={34}
//             suppressFieldDotNotation
//             onGridReady={onGridReady}
//             quickFilterText={quickFilterText}
//           />
//         </div>
//       )}
//     </div>
//   );
// }




import { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { ModuleRegistry } from "ag-grid-community";
import { AllCommunityModule } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

export default function InstrumentFormAdmin() {
  const apiUrl = import.meta.env.VITE_API_URL;

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [symbolPrefix, setSymbolPrefix] = useState("");

  const [getslotSIze, setSlotSIze] = useState("");

  const [duration, setDuration] = useState("DAY");
  const [orderType, setOrderType] = useState("MARKET");
  const [variety, setVariety] = useState("NORMAL");

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const gridApiRef = useRef<GridApi | null>(null);

  const [groupName, setGroupName] = useState("");
  const [strategyList, setStrategyList] = useState<any[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState("");

  const [scriptModalOpen, setScriptModalOpen] = useState(false);
  const [scriptSearch, setScriptSearch] = useState("");
  const [scriptExpiryFilter, setScriptExpiryFilter] = useState("");
  const [scriptOptionFilter, setScriptOptionFilter] = useState<"" | "CE" | "PE">("");
  const [selectedScriptRow, setSelectedScriptRow] = useState<any | null>(null);
  const [chartSymbolSearch, setChartSymbolSearch] = useState("");
  const [scriptTxnType, setScriptTxnType] = useState<"" | "BUY" | "SELL">("BUY");
  const [scriptProductType, setScriptProductType] = useState<
    "" | "INTRADAY" | "DELIVERY" | "CARRYFORWARD" | "BO" | "MARGIN"
  >("INTRADAY");

  const [useKite, setUseKite] = useState(false);

  // ---------- Common expiry normalizer ----------
  const buildExpiryMeta = (rawExpiry: any) => {
    if (!rawExpiry) return { expiryDateObj: null, expiryLabel: "" };

    const s = String(rawExpiry).trim();
    if (!s) return { expiryDateObj: null, expiryLabel: "" };

    let d: Date | null = null;

    // 1) YYYY-MM-DD  (Kite)
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      d = new Date(s + "T00:00:00");
    }
    // 2) DD-MMM-YYYY / DD-MMM-YY (AngelOne etc.)
    else if (/^\d{2}-[A-Za-z]{3}-\d{2,4}$/.test(s)) {
      const [ddStr, monStrRaw, yyStr] = s.split("-");
      const dd = Number(ddStr);
      const monStr = monStrRaw.toUpperCase();
      const monthMap: Record<string, number> = {
        JAN: 0,
        FEB: 1,
        MAR: 2,
        APR: 3,
        MAY: 4,
        JUN: 5,
        JUL: 6,
        AUG: 7,
        SEP: 8,
        OCT: 9,
        NOV: 10,
        DEC: 11,
      };
      const monthIndex = monthMap[monStr];
      if (monthIndex !== undefined) {
        let yearNum = Number(yyStr);
        if (yyStr.length === 2) {
          yearNum = 2000 + yearNum;
        }
        d = new Date(yearNum, monthIndex, dd);
      }
    }
    // 3) Fallback: native Date parse
    else {
      const t = new Date(s);
      if (!isNaN(t.getTime())) d = t;
    }

    if (!d) return { expiryDateObj: null, expiryLabel: "" };

    const day = d.getDate().toString().padStart(2, "0");
    const monthNames = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];
    const label = `${day}-${monthNames[d.getMonth()]}-${d.getFullYear()}`;

    return { expiryDateObj: d, expiryLabel: label };
  };

  // ---------- Parse option symbol (only for strike & CE/PE) ----------
  // Works for NIFTY02DEC2525800PE, NIFTY25NOV24500CE etc.
  const parseOptionMeta = (symbolRaw: any) => {
    const symbol = String(symbolRaw || "").toUpperCase();

    // e.g. NIFTY02DEC2525800PE  or  NIFTY25NOV24500CE
    const re = /^([A-Z]+)(\d{2})([A-Z]{3})(\d{2})(\d+)(CE|PE)$/;
    const m = symbol.match(re);
    if (!m) return null;

    const [, underlying, dd, monStr, yy, strike, optType] = m;

    const monthMap: Record<string, number> = {
      JAN: 0,
      FEB: 1,
      MAR: 2,
      APR: 3,
      MAY: 4,
      JUN: 5,
      JUL: 6,
      AUG: 7,
      SEP: 8,
      OCT: 9,
      NOV: 10,
      DEC: 11,
    };
    const monthIndex = monthMap[monStr];
    if (monthIndex === undefined) return null;

    const year = 2000 + Number(yy);
    const day = Number(dd);
    const dateObj = new Date(year, monthIndex, day);

    const expiryLabel = `${day.toString().padStart(2, "0")}-${monStr}-${year}`;

    return {
      underlying,
      expiryLabel,
      expiryDate: dateObj,
      strike: Number(strike),
      optionType: optType as "CE" | "PE",
    };
  };

  // ⭐ helper that always tries to extract strike / optionType / expiry
  const getOptionMeta = (row: any) => {
    const mainSymbol = row.symbol || row.kiteSymbol || row.angelSymbol || "";

    const fromSymbol = parseOptionMeta(mainSymbol);
    if (fromSymbol) return fromSymbol;

    const name = String(row.name || "").toUpperCase();
    const optMatch = name.match(/\b(CE|PE)\b/);
    const strikeMatches = name.match(/(\d+)/g);

    return {
      underlying: "",
      expiryLabel: row.expiryLabel || "",
      expiryDate: row.expiryDateObj || null,
      strike: strikeMatches
        ? Number(strikeMatches[strikeMatches.length - 1])
        : row.strike || 0,
      optionType: (optMatch?.[1] as "CE" | "PE") || (row.syType as "CE" | "PE"),
    };
  };

  // ---------- NORMALIZERS (AngelOne & Kite) ----------
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
      kiteToken: row.kiteToken ?? "",
      kiteSymbol: row.kiteSymbol ?? "",
      expiryDateObj,
      expiryLabel,
    };
  };

  const mapKiteToCommon = (row: any) => {
    const { expiryDateObj, expiryLabel } = buildExpiryMeta(row.expiry);

    // Try to derive strike if missing
    let strike = row.strike;
    if (!strike) {
      const metaFromSymbol = parseOptionMeta(row.tradingsymbol);
      if (metaFromSymbol) {
        strike = metaFromSymbol.strike;
      } else {
        const m = String(row.name || "").match(/\d+/);
        strike = m ? Number(m[0]) : 0;
      }
    }

    return {
      ...row,
      token: String(row.exchange_token ?? ""),
      symbol: String(row.tradingsymbol ?? ""),
      name: row.name ?? "",
      expiry: row.expiry ?? "",
      strike: Number(strike),
      lotsize: row.lot_size !== undefined ? Number(row.lot_size) : 0,
      instrumenttype: row.instrument_type ?? "",
      exch_seg: row.segment ?? row.exchange ?? "",
      tick_size: row.tick_size !== undefined ? Number(row.tick_size) : 0,
      syType: row.instrument_type ?? "",
      kiteToken: String(row.exchange_token ?? ""),
      kiteSymbol: String(row.tradingsymbol ?? ""),
      angelToken: row.angelToken ?? "",
      angelSymbol: row.angelSymbol ?? "",
      expiryDateObj,
      expiryLabel,
    };
  };

  // ---------- Fetch instruments (AngelOne or Kite) ----------
  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const endpoint = useKite ? "/kite/instrument" : "/agnelone/instrument";
      const res = await axios.get(`${apiUrl}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });

      if (res?.data?.status === true) {
        const rawData = res?.data?.data || [];

        const normalized = useKite
          ? rawData.map((row: any) => mapKiteToCommon(row))
          : rawData.map((row: any) => mapAngelToCommon(row));

        setData(normalized);
      } else {
        toast.error(res?.data?.message || "Something went wrong");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Something went wrong");
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Fetch strategies ----------
  const fetchStrategies = async () => {
    try {
      const res = await axios.get(`${apiUrl}/admin/strategies`, {
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
    fetchStrategies();
    setSearchTerm("");
  }, [useKite]);

  // ---------- Open Add/Edit Scrip modal ----------
  const handleOpenScriptModal = () => {
    setSelectedScriptRow(null);
    setScriptModalOpen(true);
    setScriptSearch("");
    setChartSymbolSearch("");
    setScriptExpiryFilter("");
    setScriptOptionFilter("");
    setScriptTxnType("BUY");
    setScriptProductType("");
    setSelectedStrategyId("");
    setGroupName("");
  };

  // ---------- AG Grid ----------
  const columnDefs = useMemo<ColDef[]>(
    () => [
      { headerName: "Token", field: "token", minWidth: 80 },
      { headerName: "Type", field: "syType", minWidth: 80 },
      {
        headerName: "Symbol",
        field: "symbol",
        minWidth: 250,
        filter: "agTextColumnFilter",
      },
      { headerName: "Name", field: "name", minWidth: 120 },
      { headerName: "Instrument", field: "instrumenttype", minWidth: 120 },
      { headerName: "Lot-Size", field: "lotsize", width: 110 },
      ...(useKite
        ? [
            { headerName: "Kite Token", field: "kiteToken", minWidth: 120 },
            { headerName: "Kite Symbol", field: "kiteSymbol", minWidth: 180 },
          ]
        : [
            { headerName: "Angel Token", field: "angelToken", minWidth: 120 },
            { headerName: "Angel Symbol", field: "angelSymbol", minWidth: 180 },
          ]),
      { headerName: "Expiry", field: "expiryLabel", minWidth: 130 },
    ],
    [useKite]
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      resizable: true,
      filter: true,
      floatingFilter: true,
    }),
    []
  );

  const onGridReady = (e: GridReadyEvent) => {
    gridApiRef.current = e.api;
    e.api.sizeColumnsToFit();
  };

  // ---------- Debounced search (main grid) ----------
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchTerm), 150);
    return () => clearTimeout(id);
  }, [searchTerm]);

  const rowMatchesQuery = (row: any, query: string) => {
    const q = query.trim().toUpperCase();
    if (!q) return true;

    const symbol = String(row.symbol || "").toUpperCase();
    const name = String(row.name || "").toUpperCase();
    const token = String(row.token || "").toUpperCase();
    const full = `${symbol} ${name} ${token}`;

    return full.includes(q);
  };

  const filteredData = useMemo(() => {
    if (!debouncedSearch.trim()) return data;
    return data.filter((row) => rowMatchesQuery(row, debouncedSearch));
  }, [data, debouncedSearch]);

  // ---------- Base rows for modal filters (without expiry) ----------
  const scriptBaseRows = useMemo(() => {
    let rows = data.filter((row) => {
      if (useKite) {
        return row.kiteSymbol && row.kiteToken;
      } else {
        return row.angelSymbol && row.angelToken;
      }
    });

    // Search by name/symbol/CE/PE (e.g. "NIFTY")
    const qRaw = scriptSearch.trim().toUpperCase();
    const tokens = qRaw.split(/\s+/).filter(Boolean);

    if (tokens.length > 0) {
      rows = rows.filter((row) => {
        const symbol = String(row.symbol || "").toUpperCase();
        const name = String(row.name || "").toUpperCase();
        const haystack = `${symbol} ${name}`;
        return tokens.every((t) => haystack.includes(t));
      });
    }

    // Chart Symbol (Strike) filter – matches whatever you type (e.g. 26300)
    const strikeQ = chartSymbolSearch.trim();
    if (strikeQ) {
      // const sq = strikeQ.toUpperCase();
      rows = rows.filter((row: any) => {

        // const sym = String(row.symbol || "").toUpperCase();
        // const ts = String(row.tradingsymbol || row.kiteSymbol || "").toUpperCase();
        
        // return sym.includes(sq) || ts.includes(sq);

        return (
          (row.symbol && row.symbol.toUpperCase().includes(strikeQ.toUpperCase())) ||
          (row.tradingsymbol &&
            row.tradingsymbol.toUpperCase().includes(strikeQ.toUpperCase()))
        );

      });
    }

    // Option Type filter (CE/PE)
    if (scriptOptionFilter) {
      rows = rows.filter((row) => {
        const meta = getOptionMeta(row);
        return meta && meta.optionType === scriptOptionFilter;
      });
    }

    return rows;
  }, [data, scriptSearch, chartSymbolSearch, scriptOptionFilter, useKite]);

  // ---------- Expiry dropdown: based on filtered rows (today → +3 months) ----------
  const allExpiryOptions = useMemo(() => {
    const MONTH_RANGE = 3; // ⭐ only next 3 months
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const maxDate = new Date(
      startOfToday.getFullYear(),
      startOfToday.getMonth() + MONTH_RANGE,
      startOfToday.getDate()
    );

    const map = new Map<string, { label: string; date: Date }>();

    scriptBaseRows.forEach((row) => {
      let d: Date | null = row.expiryDateObj || null;
      let label: string = row.expiryLabel || "";

      // fallback to parse from symbol if expiry field was empty
      if (!d || !label) {
        const meta = parseOptionMeta(row.symbol || row.kiteSymbol || row.angelSymbol);
        if (meta) {
          d = meta.expiryDate;
          label = meta.expiryLabel;
        }
      }

      if (!d || !label) return;
      if (d < startOfToday || d > maxDate) return;

      const key = d.toISOString().slice(0, 10);
      if (!map.has(key)) {
        map.set(key, { label, date: d });
      }
    });

    return Array.from(map.entries())
      .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
      .map(([key, value]) => ({
        key,
        label: value.label,
      }));
  }, [scriptBaseRows]);

  // ---------- Final filtered rows in Add/Edit Scrip modal (with expiry) ----------
  const scriptFilteredRows = useMemo(() => {
    let rows = [...scriptBaseRows];

    // Expiry filter (dropdown)
    if (scriptExpiryFilter) {
      rows = rows.filter((row) => {
        if (row.expiryLabel === scriptExpiryFilter) return true;
        const meta = getOptionMeta(row);
        return meta?.expiryLabel === scriptExpiryFilter;
      });
    }

    return rows.slice(0, 300);
  }, [scriptBaseRows, scriptExpiryFilter]);

  // ---------- Save ----------
  const handleScriptSave = async () => {
    if (!selectedScriptRow) {
      toast.error("Please select a scrip from the list");
      return;
    }

    const lotSizeNum = Number(selectedScriptRow.lotsize || 0);
    const priceNum = Number(selectedScriptRow.price || 0);
    const slotSizeNum = Number(getslotSIze || 1);

    const requiredFields = [
      { label: "Token", value: selectedScriptRow.token },
      { label: "Symbol", value: selectedScriptRow.symbol },
      { label: "Name", value: selectedScriptRow.name },
      { label: "Exchange Segment", value: selectedScriptRow.exch_seg },
      { label: "AngelOne Token", value: selectedScriptRow.angelToken },
      { label: "AngelOne Symbol", value: selectedScriptRow.angelSymbol },
      { label: "Kite Token", value: selectedScriptRow.kiteToken },
      { label: "Kite Symbol", value: selectedScriptRow.kiteSymbol },
      { label: "Group Name", value: groupName },
      { label: "Quantity (Lot Size)", value: lotSizeNum },
      { label: "Product Type", value: scriptProductType },
    ];

    for (let item of requiredFields) {
      if (!item.value || item.value === "" || item.value === " ") {
        toast.error(`${item.label} is required.`);
        return;
      }
    }

    const payload = {
      token: selectedScriptRow.token || "",
      symbol: selectedScriptRow.symbol || "",
      name: selectedScriptRow.name || "",
      exch_seg: selectedScriptRow.exch_seg || "",
      lotsize: lotSizeNum,
      instrumenttype: selectedScriptRow.instrumenttype || "",
      price: priceNum,
      quantity: lotSizeNum,
      transactiontype: scriptTxnType,
      duration,
      orderType,
      variety,
      productType: scriptProductType,
      totalPrice: priceNum * lotSizeNum,
      actualQuantity: lotSizeNum / slotSizeNum,
      searchText: scriptSearch || "",
      chartSymbol: chartSymbolSearch || "",
      optionType: scriptOptionFilter || "",
      expiry: selectedScriptRow.expiry || "",
      expiryLabel: selectedScriptRow.expiryLabel || "",
      strategyId: selectedStrategyId || "",
      groupName: groupName,
      angelOneToken: selectedScriptRow.angelToken || "",
      angelOneSymbol: selectedScriptRow.angelSymbol || "",
      kiteToken: selectedScriptRow.kiteToken || "",
      kiteSymbol: selectedScriptRow.kiteSymbol || "",
    };

    try {
      const res = await axios.post(
        `${apiUrl}/admin/multiple/place/order`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      if (res?.data?.status === true) {
        alert(res?.data?.message);
        setVariety("NORMAL");
        setDuration("DAY");
        setOrderType("MARKET");
        setScriptModalOpen(false);
      } else {
        toast.error(res?.data?.message || "Something went wrong");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong");
    }
  };

  // ---------- Selection Handler ----------
  const handleSelectionInstrument = async (raw: any) => {
    const payload = {
      exchange: raw.exch_seg,
      tradingsymbol: raw.symbol,
      symboltoken: raw.token,
    };

    try {
      await fetchStrategies();

      if (useKite) {
        setSelectedScriptRow((prev: any) => ({
          ...(prev || {}),
          kiteToken: raw.exchange_token || raw.kiteToken || raw.token,
          kiteSymbol: raw.kiteSymbol || raw.symbol,
          angelToken: prev?.angelToken || "",
          angelSymbol: prev?.angelSymbol || "",
          kiteName: raw.name,
          exch_seg: raw.exch_seg || raw.exchange,
          lotsize: raw.lotsize,
          price: 0,
          expiry: raw.expiry,
          expiryLabel: raw.expiryLabel,
          expiryDateObj: raw.expiryDateObj,
        }));

        setSlotSIze(raw.lotsize);
      } else {
        try {
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

          if (res?.data?.status === true) {
            const ltp = res?.data?.data?.data?.ltp || raw.price || 0;

            setSelectedScriptRow((prev: any) => ({
              ...(prev || {}),
              angelToken: raw.angelToken || raw.token,
              angelSymbol: raw.angelSymbol || raw.symbol,
              kiteToken: prev?.kiteToken || "",
              kiteSymbol: prev?.kiteSymbol || "",
              token: raw.token,
              symbol: raw.symbol,
              name: raw.name,
              exch_seg: raw.exch_seg,
              lotsize: raw.lotsize,
              instrumenttype: raw.instrumenttype,
              price: ltp,
              expiry: raw.expiry,
              expiryLabel: raw.expiryLabel,
              expiryDateObj: raw.expiryDateObj,
            }));

            setSlotSIze(raw.lotsize);
          } else {
            toast.error(res?.data?.message || "Something went wrong");
          }
        } catch (err: any) {
          console.error(err);
          toast.error(err.message || "Something went wrong");
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong");
    }
  };

  // ---------- JSX ----------
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Nifty Bank Instruments</h2>

      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder='Search (e.g. "NIFTY02DEC2525800PE" or "NIFTY")'
            className="border p-2 w-full rounded"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useKite}
              onChange={(e) => setUseKite(e.target.checked)}
              className="h-4 w-4"
            />
            Use Kite Instruments
          </label>

          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            onClick={handleOpenScriptModal}
          >
            Add/Edit
          </button>
        </div>
      </div>

      {loading && <p>Loading data...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && filteredData.length === 0 && <p>No data found.</p>}

      {filteredData.length > 0 && (
        <div
          className="ag-theme-quartz compact-grid"
          style={{ height: 540, width: "100%" }}
        >
          <AgGridReact
            rowData={filteredData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            animateRows
            rowSelection="single"
            pagination
            paginationPageSize={10000}
            rowHeight={34}
            suppressFieldDotNotation
            onGridReady={onGridReady}
          />
        </div>
      )}

      {scriptModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999999]">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl mx-3">
            <div className="max-h-[90vh] overflow-y-auto p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add / Edit Scrip</h3>
                <button
                  onClick={() => setScriptModalOpen(false)}
                  className="text-gray-500 hover:text-black text-xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* SECTION 1: Scrip Details & Search */}
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Scrip Details & Search
                  </h4>

                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={useKite}
                      onChange={(e) => setUseKite(e.target.checked)}
                      className="h-4 w-4"
                    />
                    Search in Kite Instruments (unchecked = AngelOne)
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                

                 

                 

                
               <div>
  <label className="block text-xs font-medium text-gray-600 mb-1">
    Search Name / Symbol / CE / PE
  </label>

  <div className="flex gap-2">
    {/* Dropdown */}
    <select
      value={symbolPrefix}
      onChange={(e) => setSymbolPrefix(e.target.value)}
      className="border rounded px-3 py-2 text-sm bg-white"
      style={{ minWidth: "120px" }}
    >
      <option value="">Select</option>
      <option value="NIFTY">NIFTY</option>
      <option value="BANKNIFTY">BANKNIFTY</option>
    </select>

    {/* Input box */}
    <input
      type="text"
      value={scriptSearch}
      onChange={(e) => setScriptSearch(e.target.value)}
      placeholder="e.g. 26150 CE"
      className="border rounded px-3 py-2 w-full text-sm"
    />
  </div>
</div>

                  {/* <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Search Name / Symbol / CE / PE
                    </label>
                    <input
                      type="text"
                      value={scriptSearch}
                      onChange={(e) => setScriptSearch(e.target.value)}
                      placeholder="e.g. NIFTY 26150 CE"
                      className="border rounded px-3 py-2 w-full text-sm"
                    />
                  </div> */}

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Chart Symbol (Strike)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 26150"
                      value={chartSymbolSearch}
                      onChange={(e) => setChartSymbolSearch(e.target.value)}
                      className="border rounded px-3 py-2 w-full text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Filters & Order Settings */}
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Filters & Order Settings
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Option Type
                    </label>
                    <select
                      value={scriptOptionFilter}
                      onChange={(e) =>
                        setScriptOptionFilter(e.target.value as "" | "CE" | "PE")
                      }
                      className="border rounded px-3 py-2 w-full text-sm"
                    >
                      <option value="">ALL</option>
                      <option value="CE">CE (Call)</option>
                      <option value="PE">PE (Put)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Expiry (next 3 months)
                    </label>
                    <select
                      value={scriptExpiryFilter}
                      onChange={(e) => setScriptExpiryFilter(e.target.value)}
                      className="border rounded px-3 py-2 w-full text-sm"
                    >
                      <option value="">All Expiries</option>
                      {allExpiryOptions.map((exp) => (
                        <option key={exp.key} value={exp.label}>
                          {exp.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Transaction Type
                    </label>
                    <select
                      value={scriptTxnType}
                      onChange={(e) =>
                        setScriptTxnType(e.target.value as "" | "BUY" | "SELL")
                      }
                      className="border rounded px-3 py-2 w-full text-sm"
                    >
                      <option value="BUY">BUY</option>
                      <option value="SELL">SELL</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Order Type
                    </label>
                    <select
                      value={orderType}
                      onChange={(e) => setOrderType(e.target.value)}
                      required
                      className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Order Type</option>
                      <option value="MARKET">MARKET</option>
                      <option value="LIMIT">LIMIT</option>
                      <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT</option>
                      <option value="STOPLOSS_MARKET">STOPLOSS_MARKET</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Duration
                    </label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      required
                      className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Duration</option>
                      <option value="DAY">DAY</option>
                      <option value="IOC">IOC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Variety
                    </label>
                    <select
                      value={variety}
                      onChange={(e) => setVariety(e.target.value)}
                      required
                      className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Variety</option>
                      <option value="NORMAL">NORMAL</option>
                      <option value="STOPLOSS">STOPLOSS</option>
                      <option value="ROBO">ROBO</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Product & Strategy */}
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Product & Strategy
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Product Type
                    </label>
                    <select
                      value={scriptProductType}
                      onChange={(e) =>
                        setScriptProductType(
                          e.target.value as
                            | ""
                            | "INTRADAY"
                            | "DELIVERY"
                            | "CARRYFORWARD"
                            | "BO"
                            | "MARGIN"
                        )
                      }
                      className="border rounded px-3 py-2 w-full text-sm"
                    >
                      <option value="">Select</option>
                      <option value="INTRADAY">IntraDay MIS</option>
                      <option value="DELIVERY">Longterm CNC</option>
                      <option value="CARRYFORWARD">CARRYFORWARD</option>
                      <option value="BO">Bracket Order </option>
                      <option value="MARGIN">Margin Delivery</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Quantity in Lot
                    </label>
                    <input
                      type="number"
                      placeholder="Enter Quantity in Lot"
                      value={selectedScriptRow?.lotsize || ""}
                      onChange={(e) =>
                        setSelectedScriptRow((prev: any) => ({
                          ...(prev || {}),
                          lotsize: e.target.value,
                        }))
                      }
                      className="border rounded px-3 py-2 w-full text-sm bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Select Strategy *
                    </label>
                    <select
                      className="w-full border rounded px-3 py-2 text-sm"
                      value={selectedStrategyId}
                      onChange={(e) => {
                        const strategyId = e.target.value;
                        setSelectedStrategyId(strategyId);

                        const selected: any = strategyList.find(
                          (s: any) => s.id == strategyId
                        );

                        if (selected) {
                          setGroupName(selected.strategyName);
                        } else {
                          setGroupName("");
                        }
                      }}
                    >
                      <option value="">Select Strategy</option>
                      {strategyList.map((s: any) => (
                        <option value={s.id} key={s.id}>
                          {s.strategyName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Result list */}
              <div className="border border-gray-200 rounded-lg mb-6">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-600">
                    Search Results (click to select)
                  </span>
                </div>

                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                          Symbol
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                          Name
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                          Token
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                          Lot
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {scriptFilteredRows.map((row) => (
                        <tr
                          key={`${row.token}-${row.symbol}`}
                          className={`cursor-pointer transition-colors ${
                            selectedScriptRow?.token === row.token ||
                            selectedScriptRow?.kiteToken === row.token ||
                            selectedScriptRow?.angelToken === row.token
                              ? "bg-purple-100"
                              : "hover:bg-purple-50"
                          }`}
                          onClick={() => handleSelectionInstrument(row)}
                        >
                          <td className="px-3 py-1">{row.symbol}</td>
                          <td className="px-3 py-1">{row.name}</td>
                          <td className="px-3 py-1">{row.token}</td>
                          <td className="px-3 py-1">{row.lotsize}</td>
                        </tr>
                      ))}

                      {scriptFilteredRows.length === 0 && (
                        <tr>
                          <td
                            className="px-3 py-3 text-center text-gray-500"
                            colSpan={4}
                          >
                            No matching scrips found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setScriptSearch("");
                    setScriptExpiryFilter("");
                    setScriptOptionFilter("");
                    setChartSymbolSearch("");
                    setSelectedScriptRow(null);
                    setScriptTxnType("BUY");
                    setScriptProductType("");
                    setSelectedStrategyId("");
                    setGroupName("");
                  }}
                  className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded text-sm"
                >
                  Reset
                </button>

                <button
                  onClick={() => setScriptModalOpen(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded text-sm"
                >
                  Close
                </button>

                <button
                  onClick={handleScriptSave}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded text-sm font-medium"
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}








// import { useState, useEffect, useRef, useMemo } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { ModuleRegistry } from "ag-grid-community";
// import { AllCommunityModule } from "ag-grid-community";
// ModuleRegistry.registerModules([AllCommunityModule]);
// import { AgGridReact } from "ag-grid-react";
// import type { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";

// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-quartz.css";

// // 🔹 Type + Exchange options (Angel + Zerodha share same codes)
// type ExchangeOption = {
//   code: string;
//   fullForm: string;
// };

// const EXCHANGE_OPTIONS: ExchangeOption[] = [
//   { code: "NSE", fullForm: "National Stock Exchange" },
//   { code: "BSE", fullForm: "Bombay Stock Exchange" },
//   { code: "NFO", fullForm: "NSE Futures & Options Segment" },
//   { code: "BFO", fullForm: "BSE Futures & Options Segment" },
//   { code: "CDS", fullForm: "Currency Derivatives Segment" },
//   { code: "MCX", fullForm: "Multi Commodity Exchange" },
// ];

// export default function InstrumentFormAdmin() {
//   const apiUrl = import.meta.env.VITE_API_URL;

//   const [data, setData] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const [symbolPrefix, setSymbolPrefix] = useState("");
//   const [getslotSIze, setSlotSIze] = useState("");

//   const [duration, setDuration] = useState("DAY");
//   const [orderType, setOrderType] = useState("MARKET");
//   const [variety, setVariety] = useState("NORMAL");

//   const [searchTerm, setSearchTerm] = useState("");
//   const [debouncedSearch, setDebouncedSearch] = useState("");

//   const gridApiRef = useRef<GridApi | null>(null);

//   const [groupName, setGroupName] = useState("");
//   const [strategyList, setStrategyList] = useState<any[]>([]);
//   const [selectedStrategyId, setSelectedStrategyId] = useState("");

//   const [scriptModalOpen, setScriptModalOpen] = useState(false);
//   const [scriptSearch, setScriptSearch] = useState("");
//   const [scriptExpiryFilter, setScriptExpiryFilter] = useState("");
//   const [scriptOptionFilter, setScriptOptionFilter] = useState<"" | "CE" | "PE">("");
//   const [selectedScriptRow, setSelectedScriptRow] = useState<any | null>(null);
//   const [chartSymbolSearch, setChartSymbolSearch] = useState("");
//   const [scriptTxnType, setScriptTxnType] = useState<"" | "BUY" | "SELL">("BUY");
//   const [scriptProductType, setScriptProductType] = useState<
//     "" | "INTRADAY" | "DELIVERY" | "CARRYFORWARD" | "BO" | "MARGIN"
//   >("INTRADAY");

//   const [useKite, setUseKite] = useState(false);

//   // 🔹 Selected Exchange for filter on top (value contains "code - fullForm")
//   const [selectedExchange, setSelectedExchange] = useState<string>("");

//   // ---------- Common expiry normalizer ----------
//   const buildExpiryMeta = (rawExpiry: any) => {
//     if (!rawExpiry) return { expiryDateObj: null, expiryLabel: "" };

//     const s = String(rawExpiry).trim();
//     if (!s) return { expiryDateObj: null, expiryLabel: "" };

//     let d: Date | null = null;

//     // 1) YYYY-MM-DD  (Kite)
//     if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
//       d = new Date(s + "T00:00:00");
//     }
//     // 2) DD-MMM-YYYY / DD-MMM-YY (AngelOne etc.)
//     else if (/^\d{2}-[A-Za-z]{3}-\d{2,4}$/.test(s)) {
//       const [ddStr, monStrRaw, yyStr] = s.split("-");
//       const dd = Number(ddStr);
//       const monStr = monStrRaw.toUpperCase();
//       const monthMap: Record<string, number> = {
//         JAN: 0,
//         FEB: 1,
//         MAR: 2,
//         APR: 3,
//         MAY: 4,
//         JUN: 5,
//         JUL: 6,
//         AUG: 7,
//         SEP: 8,
//         OCT: 9,
//         NOV: 10,
//         DEC: 11,
//       };
//       const monthIndex = monthMap[monStr];
//       if (monthIndex !== undefined) {
//         let yearNum = Number(yyStr);
//         if (yyStr.length === 2) {
//           yearNum = 2000 + yearNum;
//         }
//         d = new Date(yearNum, monthIndex, dd);
//       }
//     }
//     // 3) Fallback: native Date parse
//     else {
//       const t = new Date(s);
//       if (!isNaN(t.getTime())) d = t;
//     }

//     if (!d) return { expiryDateObj: null, expiryLabel: "" };

//     const day = d.getDate().toString().padStart(2, "0");
//     const monthNames = [
//       "JAN",
//       "FEB",
//       "MAR",
//       "APR",
//       "MAY",
//       "JUN",
//       "JUL",
//       "AUG",
//       "SEP",
//       "OCT",
//       "NOV",
//       "DEC",
//     ];
//     const label = `${day}-${monthNames[d.getMonth()]}-${d.getFullYear()}`;

//     return { expiryDateObj: d, expiryLabel: label };
//   };

//   // ---------- Parse option symbol (only for strike & CE/PE) ----------
//   // Works for NIFTY02DEC2525800PE, NIFTY25NOV24500CE etc.
//   const parseOptionMeta = (symbolRaw: any) => {
//     const symbol = String(symbolRaw || "").toUpperCase();

//     // e.g. NIFTY02DEC2525800PE  or  NIFTY25NOV24500CE
//     const re = /^([A-Z]+)(\d{2})([A-Z]{3})(\d{2})(\d+)(CE|PE)$/;
//     const m = symbol.match(re);
//     if (!m) return null;

//     const [, underlying, dd, monStr, yy, strike, optType] = m;

//     const monthMap: Record<string, number> = {
//       JAN: 0,
//       FEB: 1,
//       MAR: 2,
//       APR: 3,
//       MAY: 4,
//       JUN: 5,
//       JUL: 6,
//       AUG: 7,
//       SEP: 8,
//       OCT: 9,
//       NOV: 10,
//       DEC: 11,
//     };
//     const monthIndex = monthMap[monStr];
//     if (monthIndex === undefined) return null;

//     const year = 2000 + Number(yy);
//     const day = Number(dd);
//     const dateObj = new Date(year, monthIndex, day);

//     const expiryLabel = `${day.toString().padStart(2, "0")}-${monStr}-${year}`;

//     return {
//       underlying,
//       expiryLabel,
//       expiryDate: dateObj,
//       strike: Number(strike),
//       optionType: optType as "CE" | "PE",
//     };
//   };

//   // ⭐ helper that always tries to extract strike / optionType / expiry
//   const getOptionMeta = (row: any) => {
//     const mainSymbol = row.symbol || row.kiteSymbol || row.angelSymbol || "";

//     const fromSymbol = parseOptionMeta(mainSymbol);
//     if (fromSymbol) return fromSymbol;

//     const name = String(row.name || "").toUpperCase();
//     const optMatch = name.match(/\b(CE|PE)\b/);
//     const strikeMatches = name.match(/(\d+)/g);

//     return {
//       underlying: "",
//       expiryLabel: row.expiryLabel || "",
//       expiryDate: row.expiryDateObj || null,
//       strike: strikeMatches
//         ? Number(strikeMatches[strikeMatches.length - 1])
//         : row.strike || 0,
//       optionType: (optMatch?.[1] as "CE" | "PE") || (row.syType as "CE" | "PE"),
//     };
//   };

//   // ---------- NORMALIZERS (AngelOne & Kite) ----------
//   const mapAngelToCommon = (row: any) => {
//     const { expiryDateObj, expiryLabel } = buildExpiryMeta(row.expiry);

//     return {
//       ...row,
//       token: String(row.token ?? ""),
//       symbol: String(row.symbol ?? ""),
//       name: row.name ?? "",
//       expiry: row.expiry ?? "",
//       strike: row.strike !== undefined ? Number(row.strike) : -1,
//       lotsize: row.lotsize !== undefined ? Number(row.lotsize) : 0,
//       instrumenttype: row.instrumenttype ?? "",
//       exch_seg: row.exch_seg ?? "",
//       tick_size: row.tick_size !== undefined ? Number(row.tick_size) : 0,
//       syType: row.instrumenttype ?? row.syType ?? "",
//       angelToken: String(row.token ?? ""),
//       angelSymbol: String(row.symbol ?? ""),
//       kiteToken: row.kiteToken ?? "",
//       kiteSymbol: row.kiteSymbol ?? "",
//       expiryDateObj,
//       expiryLabel,
//     };
//   };

//   const mapKiteToCommon = (row: any) => {
//     const { expiryDateObj, expiryLabel } = buildExpiryMeta(row.expiry);

//     // Try to derive strike if missing
//     let strike = row.strike;
//     if (!strike) {
//       const metaFromSymbol = parseOptionMeta(row.tradingsymbol);
//       if (metaFromSymbol) {
//         strike = metaFromSymbol.strike;
//       } else {
//         const m = String(row.name || "").match(/\d+/);
//         strike = m ? Number(m[0]) : 0;
//       }
//     }

//     return {
//       ...row,
//       token: String(row.exchange_token ?? ""),
//       symbol: String(row.tradingsymbol ?? ""),
//       name: row.name ?? "",
//       expiry: row.expiry ?? "",
//       strike: Number(strike),
//       lotsize: row.lot_size !== undefined ? Number(row.lot_size) : 0,
//       instrumenttype: row.instrument_type ?? "",
//       exch_seg: row.segment ?? row.exchange ?? "",
//       tick_size: row.tick_size !== undefined ? Number(row.tick_size) : 0,
//       syType: row.instrument_type ?? "",
//       kiteToken: String(row.exchange_token ?? ""),
//       kiteSymbol: String(row.tradingsymbol ?? ""),
//       angelToken: row.angelToken ?? "",
//       angelSymbol: row.angelSymbol ?? "",
//       expiryDateObj,
//       expiryLabel,
//     };
//   };

//   // ---------- Fetch instruments (AngelOne or Kite) ----------
//   const fetchData = async () => {
//     setLoading(true);
//     setError("");

//     try {
//       const endpoint = useKite ? "/kite/instrument" : "/agnelone/instrument";
//       const res = await axios.get(`${apiUrl}${endpoint}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });

//       if (res?.data?.status === true) {
//         const rawData = res?.data?.data || [];

//         const normalized = useKite
//           ? rawData.map((row: any) => mapKiteToCommon(row))
//           : rawData.map((row: any) => mapAngelToCommon(row));

//         setData(normalized);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err?.message || "Something went wrong");
//       setError(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------- Fetch strategies ----------
//   const fetchStrategies = async () => {
//     try {
//       const res = await axios.get(`${apiUrl}/admin/strategies`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID"),
//         },
//       });

//       if (res.data.status === true) {
//         setStrategyList(res.data.data || []);
//       } else {
//         toast.error(res.data.message);
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//     fetchStrategies();
//     setSearchTerm("");
//   }, [useKite]);

//   // ---------- Open Add/Edit Scrip modal ----------
//   const handleOpenScriptModal = () => {
//     setSelectedScriptRow(null);
//     setScriptModalOpen(true);
//     setScriptSearch("");
//     setChartSymbolSearch("");
//     setScriptExpiryFilter("");
//     setScriptOptionFilter("");
//     setScriptTxnType("BUY");
//     setScriptProductType("");
//     setSelectedStrategyId("");
//     setGroupName("");
//   };

//   // ---------- AG Grid ----------
//   const columnDefs = useMemo<ColDef[]>(
//     () => [

//       {
//         headerName: "Symbol",
//         field: "symbol",
//         minWidth: 250,
//         filter: "agTextColumnFilter",
//       },
//       { headerName: "Name", field: "name", minWidth: 120 },
  
//       { headerName: "Expiry", field: "expiryLabel", minWidth: 130 },
//     ],
//     [useKite]
//   );

//   const defaultColDef = useMemo<ColDef>(
//     () => ({
//       sortable: true,
//       resizable: true,
//       filter: true,
//       floatingFilter: true,
//     }),
//     []
//   );

//   const onGridReady = (e: GridReadyEvent) => {
//     gridApiRef.current = e.api;
//     e.api.sizeColumnsToFit();
//   };

//   // ---------- Debounced search (main grid) ----------
//   useEffect(() => {
//     const id = setTimeout(() => setDebouncedSearch(searchTerm), 150);
//     return () => clearTimeout(id);
//   }, [searchTerm]);

//   const rowMatchesQuery = (row: any, query: string) => {
//     const q = query.trim().toUpperCase();
//     if (!q) return true;

//     const symbol = String(row.symbol || "").toUpperCase();
//     const name = String(row.name || "").toUpperCase();
//     const token = String(row.token || "").toUpperCase();
//     const full = `${symbol} ${name} ${token}`;

//     return full.includes(q);
//   };

//   // 🔹 Main grid data, filtered by exchange + search
//   const filteredData = useMemo(() => {
//     let rows = data;

//     if (selectedExchange) {
//       const selectedCode = selectedExchange.split(" - ")[0].toUpperCase(); // e.g. "NFO"
//       rows = rows.filter(
//         (row) =>
//           String(row.exch_seg || "")
//             .toUpperCase()
//             .trim() === selectedCode
//       );
//     }

//     if (!debouncedSearch.trim()) return rows;
//     return rows.filter((row) => rowMatchesQuery(row, debouncedSearch));
//   }, [data, debouncedSearch, selectedExchange]);

//   // ---------- Base rows for modal filters (without expiry) ----------
//   const scriptBaseRows = useMemo(() => {
//     let rows = data.filter((row) => {
//       if (useKite) {
//         return row.kiteSymbol && row.kiteToken;
//       } else {
//         return row.angelSymbol && row.angelToken;
//       }
//     });

//     // Search by name/symbol/CE/PE (e.g. "NIFTY")
//     const qRaw = scriptSearch.trim().toUpperCase();
//     const tokens = qRaw.split(/\s+/).filter(Boolean);

//     if (tokens.length > 0) {
//       rows = rows.filter((row) => {
//         const symbol = String(row.symbol || "").toUpperCase();
//         const name = String(row.name || "").toUpperCase();
//         const haystack = `${symbol} ${name}`;
//         return tokens.every((t) => haystack.includes(t));
//       });
//     }

//     // Chart Symbol (Strike) filter – matches whatever you type (e.g. 26150)
//     const strikeQ = chartSymbolSearch.trim();
//     if (strikeQ) {
//       rows = rows.filter((row: any) => {
//         return (
//           (row.symbol &&
//             row.symbol.toUpperCase().includes(strikeQ.toUpperCase())) ||
//           (row.tradingsymbol &&
//             row.tradingsymbol.toUpperCase().includes(strikeQ.toUpperCase()))
//         );
//       });
//     }

//     // Option Type filter (CE/PE)
//     if (scriptOptionFilter) {
//       rows = rows.filter((row) => {
//         const meta = getOptionMeta(row);
//         return meta && meta.optionType === scriptOptionFilter;
//       });
//     }

//     return rows;
//   }, [data, scriptSearch, chartSymbolSearch, scriptOptionFilter, useKite]);

//   // ---------- Expiry dropdown: based on filtered rows (today → +3 months) ----------
//   const allExpiryOptions = useMemo(() => {
//     const MONTH_RANGE = 3; // ⭐ only next 3 months
//     const now = new Date();
//     const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//     const maxDate = new Date(
//       startOfToday.getFullYear(),
//       startOfToday.getMonth() + MONTH_RANGE,
//       startOfToday.getDate()
//     );

//     const map = new Map<string, { label: string; date: Date }>();

//     scriptBaseRows.forEach((row) => {
//       let d: Date | null = row.expiryDateObj || null;
//       let label: string = row.expiryLabel || "";

//       // fallback to parse from symbol if expiry field was empty
//       if (!d || !label) {
//         const meta = parseOptionMeta(row.symbol || row.kiteSymbol || row.angelSymbol);
//         if (meta) {
//           d = meta.expiryDate;
//           label = meta.expiryLabel;
//         }
//       }

//       if (!d || !label) return;
//       if (d < startOfToday || d > maxDate) return;

//       const key = d.toISOString().slice(0, 10);
//       if (!map.has(key)) {
//         map.set(key, { label, date: d });
//       }
//     });

//     return Array.from(map.entries())
//       .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
//       .map(([key, value]) => ({
//         key,
//         label: value.label,
//       }));
//   }, [scriptBaseRows]);

//   // ---------- Final filtered rows in Add/Edit Scrip modal (with expiry) ----------
//   const scriptFilteredRows = useMemo(() => {
//     let rows = [...scriptBaseRows];

//     // Expiry filter (dropdown)
//     if (scriptExpiryFilter) {
//       rows = rows.filter((row) => {
//         if (row.expiryLabel === scriptExpiryFilter) return true;
//         const meta = getOptionMeta(row);
//         return meta?.expiryLabel === scriptExpiryFilter;
//       });
//     }

//     return rows.slice(0, 300);
//   }, [scriptBaseRows, scriptExpiryFilter]);

//   // ---------- Save ----------
//   const handleScriptSave = async () => {
//     if (!selectedScriptRow) {
//       toast.error("Please select a scrip from the list");
//       return;
//     }

//     const lotSizeNum = Number(selectedScriptRow.lotsize || 0);
//     const priceNum = Number(selectedScriptRow.price || 0);
//     const slotSizeNum = Number(getslotSIze || 1);

//     const requiredFields = [
//       { label: "Token", value: selectedScriptRow.token },
//       { label: "Symbol", value: selectedScriptRow.symbol },
//       { label: "Name", value: selectedScriptRow.name },
//       { label: "Exchange Segment", value: selectedScriptRow.exch_seg },
//       { label: "AngelOne Token", value: selectedScriptRow.angelToken },
//       { label: "AngelOne Symbol", value: selectedScriptRow.angelSymbol },
//       { label: "Kite Token", value: selectedScriptRow.kiteToken },
//       { label: "Kite Symbol", value: selectedScriptRow.kiteSymbol },
//       { label: "Group Name", value: groupName },
//       { label: "Quantity (Lot Size)", value: lotSizeNum },
//       { label: "Product Type", value: scriptProductType },
//     ];

//     for (let item of requiredFields) {
//       if (!item.value || item.value === "" || item.value === " ") {
//         toast.error(`${item.label} is required.`);
//         return;
//       }
//     }

//     const payload = {
//       token: selectedScriptRow.token || "",
//       symbol: selectedScriptRow.symbol || "",
//       name: selectedScriptRow.name || "",
//       exch_seg: selectedScriptRow.exch_seg || "",
//       lotsize: lotSizeNum,
//       instrumenttype: selectedScriptRow.instrumenttype || "",
//       price: priceNum,
//       quantity: lotSizeNum,
//       transactiontype: scriptTxnType,
//       duration,
//       orderType,
//       variety,
//       productType: scriptProductType,
//       totalPrice: priceNum * lotSizeNum,
//       actualQuantity: lotSizeNum / slotSizeNum,
//       searchText: scriptSearch || "",
//       chartSymbol: chartSymbolSearch || "",
//       optionType: scriptOptionFilter || "",
//       expiry: selectedScriptRow.expiry || "",
//       expiryLabel: selectedScriptRow.expiryLabel || "",
//       strategyId: selectedStrategyId || "",
//       groupName: groupName,
//       angelOneToken: selectedScriptRow.angelToken || "",
//       angelOneSymbol: selectedScriptRow.angelSymbol || "",
//       kiteToken: selectedScriptRow.kiteToken || "",
//       kiteSymbol: selectedScriptRow.kiteSymbol || "",
//     };

//     try {
//       const res = await axios.post(
//         `${apiUrl}/admin/multiple/place/order`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         }
//       );

//       if (res?.data?.status === true) {
//         alert(res?.data?.message);
//         setVariety("NORMAL");
//         setDuration("DAY");
//         setOrderType("MARKET");
//         setScriptModalOpen(false);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   // ---------- Selection Handler ----------
//   const handleSelectionInstrument = async (raw: any) => {
//     const payload = {
//       exchange: raw.exch_seg,
//       tradingsymbol: raw.symbol,
//       symboltoken: raw.token,
//     };

//     try {
//       await fetchStrategies();

//       if (useKite) {
//         setSelectedScriptRow((prev: any) => ({
//           ...(prev || {}),
//           kiteToken: raw.exchange_token || raw.kiteToken || raw.token,
//           kiteSymbol: raw.kiteSymbol || raw.symbol,
//           angelToken: prev?.angelToken || "",
//           angelSymbol: prev?.angelSymbol || "",
//           kiteName: raw.name,
//           exch_seg: raw.exch_seg || raw.exchange,
//           lotsize: raw.lotsize,
//           price: 0,
//           expiry: raw.expiry,
//           expiryLabel: raw.expiryLabel,
//           expiryDateObj: raw.expiryDateObj,
//         }));

//         setSlotSIze(raw.lotsize);
//       } else {
//         try {
//           const res = await axios.post(
//             `${apiUrl}/agnelone/instrument/ltp`,
//             payload,
//             {
//               headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//                 AngelOneToken: localStorage.getItem("angel_token") || "",
//                 userid: localStorage.getItem("userID"),
//               },
//             }
//           );

//           if (res?.data?.status === true) {
//             const ltp = res?.data?.data?.data?.ltp || raw.price || 0;

//             setSelectedScriptRow((prev: any) => ({
//               ...(prev || {}),
//               angelToken: raw.angelToken || raw.token,
//               angelSymbol: raw.angelSymbol || raw.symbol,
//               kiteToken: prev?.kiteToken || "",
//               kiteSymbol: prev?.kiteSymbol || "",
//               token: raw.token,
//               symbol: raw.symbol,
//               name: raw.name,
//               exch_seg: raw.exch_seg,
//               lotsize: raw.lotsize,
//               instrumenttype: raw.instrumenttype,
//               price: ltp,
//               expiry: raw.expiry,
//               expiryLabel: raw.expiryLabel,
//               expiryDateObj: raw.expiryDateObj,
//             }));

//             setSlotSIze(raw.lotsize);
//           } else {
//             toast.error(res?.data?.message || "Something went wrong");
//           }
//         } catch (err: any) {
//           console.error(err);
//           toast.error(err.message || "Something went wrong");
//         }
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   // ---------- JSX ----------
//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <h2 className="text-xl font-semibold mb-4">Nifty Bank Instruments</h2>

//       <div className="flex justify-between items-center mb-4 gap-4">
//         <div className="w-full sm:w-80">
//           <input
//             type="text"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             placeholder='Search (e.g. "NIFTY02DEC2525800PE" or "NIFTY")'
//             className="border p-2 w-full rounded"
//           />
//         </div>

//         <div className="flex items-center gap-4">
//           {/* 🔹 Exchange Filter Dropdown */}
//           <div>
//             <label className="block text-xs font-medium text-gray-600 mb-1">
//               Exchange Filter
//             </label>
//             <select
//               value={selectedExchange}
//               onChange={(e) => setSelectedExchange(e.target.value)}
//               className="border rounded px-3 py-2 text-sm bg-white"
//             >
//               <option value="">All Exchanges</option>
//               {EXCHANGE_OPTIONS.map((ex) => {
//                 const value = `${ex.code} - ${ex.fullForm}`;
//                 return (
//                   <option key={ex.code} value={value}>
//                     {ex.code} - {ex.fullForm}
//                   </option>
//                 );
//               })}
//             </select>
//           </div>

//           <label className="flex items-center gap-2">
//             <input
//               type="checkbox"
//               checked={useKite}
//               onChange={(e) => setUseKite(e.target.checked)}
//               className="h-4 w-4"
//             />
//             Use Kite Instruments
//           </label>

//           <button
//             className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
//             onClick={handleOpenScriptModal}
//           >
//             Add/Edit
//           </button>
//         </div>
//       </div>

//       {loading && <p>Loading data...</p>}
//       {error && <p className="text-red-500">{error}</p>}
//       {!loading && !error && filteredData.length === 0 && <p>No data found.</p>}

//       {filteredData.length > 0 && (
//         <div
//           className="ag-theme-quartz compact-grid"
//           style={{ height: 540, width: "100%" }}
//         >
//           <AgGridReact
//             rowData={filteredData}
//             columnDefs={columnDefs}
//             defaultColDef={defaultColDef}
//             animateRows
//             rowSelection="single"
//             pagination
//             paginationPageSize={10000}
//             rowHeight={34}
//             suppressFieldDotNotation
//             onGridReady={onGridReady}
//             //  quickFilterText={searchTerm}
             
//           />
//         </div>
//       )}

//       {scriptModalOpen && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999999]">
//           <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl mx-3">
//             <div className="max-h-[90vh] overflow-y-auto p-6">
//               {/* Header */}
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-lg font-semibold">Add / Edit Scrip</h3>
//                 <button
//                   onClick={() => setScriptModalOpen(false)}
//                   className="text-gray-500 hover:text-black text-xl leading-none"
//                 >
//                   ×
//                 </button>
//               </div>

//               {/* SECTION 1: Scrip Details & Search */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <div className="flex items-center justify-between mb-3">
//                   <h4 className="text-sm font-semibold text-gray-700">
//                     Scrip Details & Search
//                   </h4>

//                   <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
//                     <input
//                       type="checkbox"
//                       checked={useKite}
//                       onChange={(e) => setUseKite(e.target.checked)}
//                       className="h-4 w-4"
//                     />
//                     Search in Kite Instruments (unchecked = AngelOne)
//                   </label>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Search Name / Symbol / CE / PE
//                     </label>

//                     <div className="flex gap-2">
//                       {/* Underlying dropdown (your existing logic) */}
//                       <select
//                         value={symbolPrefix}
//                         onChange={(e) => setSymbolPrefix(e.target.value)}
//                         className="border rounded px-3 py-2 text-sm bg-white"
//                         style={{ minWidth: "120px" }}
//                       >
//                         <option value="">Select</option>
//                         <option value="NIFTY">NIFTY</option>
//                         <option value="BANKNIFTY">BANKNIFTY</option>
//                       </select>

//                       <input
//                         type="text"
//                         value={scriptSearch}
//                         onChange={(e) => setScriptSearch(e.target.value)}
//                         placeholder="e.g. 26150 CE"
//                         className="border rounded px-3 py-2 w-full text-sm"
//                       />
//                     </div>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Chart Symbol (Strike)
//                     </label>
//                     <input
//                       type="text"
//                       placeholder="e.g. 26150"
//                       value={chartSymbolSearch}
//                       onChange={(e) => setChartSymbolSearch(e.target.value)}
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* SECTION 2: Filters & Order Settings */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <h4 className="text-sm font-semibold text-gray-700 mb-3">
//                   Filters & Order Settings
//                 </h4>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Option Type
//                     </label>
//                     <select
//                       value={scriptOptionFilter}
//                       onChange={(e) =>
//                         setScriptOptionFilter(e.target.value as "" | "CE" | "PE")
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">ALL</option>
//                       <option value="CE">CE (Call)</option>
//                       <option value="PE">PE (Put)</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Expiry (next 3 months)
//                     </label>
//                     <select
//                       value={scriptExpiryFilter}
//                       onChange={(e) => setScriptExpiryFilter(e.target.value)}
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">All Expiries</option>
//                       {allExpiryOptions.map((exp) => (
//                         <option key={exp.key} value={exp.label}>
//                           {exp.label}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Transaction Type
//                     </label>
//                     <select
//                       value={scriptTxnType}
//                       onChange={(e) =>
//                         setScriptTxnType(e.target.value as "" | "BUY" | "SELL")
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="BUY">BUY</option>
//                       <option value="SELL">SELL</option>
//                     </select>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Order Type
//                     </label>
//                     <select
//                       value={orderType}
//                       onChange={(e) => setOrderType(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Order Type</option>
//                       <option value="MARKET">MARKET</option>
//                       <option value="LIMIT">LIMIT</option>
//                       <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT</option>
//                       <option value="STOPLOSS_MARKET">STOPLOSS_MARKET</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Duration
//                     </label>
//                     <select
//                       value={duration}
//                       onChange={(e) => setDuration(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Duration</option>
//                       <option value="DAY">DAY</option>
//                       <option value="IOC">IOC</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Variety
//                     </label>
//                     <select
//                       value={variety}
//                       onChange={(e) => setVariety(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Variety</option>
//                       <option value="NORMAL">NORMAL</option>
//                       <option value="STOPLOSS">STOPLOSS</option>
//                       <option value="ROBO">ROBO</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* SECTION 3: Product & Strategy */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <h4 className="text-sm font-semibold text-gray-700 mb-3">
//                   Product & Strategy
//                 </h4>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Product Type
//                     </label>
//                     <select
//                       value={scriptProductType}
//                       onChange={(e) =>
//                         setScriptProductType(
//                           e.target.value as
//                             | ""
//                             | "INTRADAY"
//                             | "DELIVERY"
//                             | "CARRYFORWARD"
//                             | "BO"
//                             | "MARGIN"
//                         )
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">Select</option>
//                       <option value="INTRADAY">IntraDay MIS</option>
//                       <option value="DELIVERY">Longterm CNC</option>
//                       <option value="CARRYFORWARD">CARRYFORWARD</option>
//                       <option value="BO">Bracket Order </option>
//                       <option value="MARGIN">Margin Delivery</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Quantity in Lot
//                     </label>
//                     <input
//                       type="number"
//                       placeholder="Enter Quantity in Lot"
//                       value={selectedScriptRow?.lotsize || ""}
//                       onChange={(e) =>
//                         setSelectedScriptRow((prev: any) => ({
//                           ...(prev || {}),
//                           lotsize: e.target.value,
//                         }))
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm bg-white focus:ring-2 focus:ring-blue-500"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Select Strategy *
//                     </label>
//                     <select
//                       className="w-full border rounded px-3 py-2 text-sm"
//                       value={selectedStrategyId}
//                       onChange={(e) => {
//                         const strategyId = e.target.value;
//                         setSelectedStrategyId(strategyId);

//                         const selected: any = strategyList.find(
//                           (s: any) => s.id == strategyId
//                         );

//                         if (selected) {
//                           setGroupName(selected.strategyName);
//                         } else {
//                           setGroupName("");
//                         }
//                       }}
//                     >
//                       <option value="">Select Strategy</option>
//                       {strategyList.map((s: any) => (
//                         <option value={s.id} key={s.id}>
//                           {s.strategyName}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* SECTION 4: Result list */}
//               <div className="border border-gray-200 rounded-lg mb-6">
//                 <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
//                   <span className="text-xs font-semibold text-gray-600">
//                     Search Results (click to select)
//                   </span>
//                 </div>

//                 <div className="max-h-64 overflow-auto">
//                   <table className="w-full text-sm">
//                     <thead className="bg-gray-100 sticky top-0">
//                       <tr>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Symbol
//                         </th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Name
//                         </th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Token
//                         </th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Lot
//                         </th>
//                       </tr>
//                     </thead>

//                     <tbody>
//                       {scriptFilteredRows.map((row) => (
//                         <tr
//                           key={`${row.token}-${row.symbol}`}
//                           className={`cursor-pointer transition-colors ${
//                             selectedScriptRow?.token === row.token ||
//                             selectedScriptRow?.kiteToken === row.token ||
//                             selectedScriptRow?.angelToken === row.token
//                               ? "bg-purple-100"
//                               : "hover:bg-purple-50"
//                           }`}
//                           onClick={() => handleSelectionInstrument(row)}
//                         >
//                           <td className="px-3 py-1">{row.symbol}</td>
//                           <td className="px-3 py-1">{row.name}</td>
//                           <td className="px-3 py-1">{row.token}</td>
//                           <td className="px-3 py-1">{row.lotsize}</td>
//                         </tr>
//                       ))}

//                       {scriptFilteredRows.length === 0 && (
//                         <tr>
//                           <td
//                             className="px-3 py-3 text-center text-gray-500"
//                             colSpan={4}
//                           >
//                             No matching scrips found.
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>

//               {/* Footer buttons */}
//               <div className="flex justify-end gap-3">
//                 <button
//                   onClick={() => {
//                     setScriptSearch("");
//                     setScriptExpiryFilter("");
//                     setScriptOptionFilter("");
//                     setChartSymbolSearch("");
//                     setSelectedScriptRow(null);
//                     setScriptTxnType("BUY");
//                     setScriptProductType("");
//                     setSelectedStrategyId("");
//                     setGroupName("");
//                   }}
//                   className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded text-sm"
//                 >
//                   Reset
//                 </button>

//                 <button
//                   onClick={() => setScriptModalOpen(false)}
//                   className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded text-sm"
//                 >
//                   Close
//                 </button>

//                 <button
//                   onClick={handleScriptSave}
//                   className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded text-sm font-medium"
//                 >
//                   Save changes
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }





// import { useState, useEffect, useRef, useMemo } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { ModuleRegistry } from "ag-grid-community";
// import { AllCommunityModule } from "ag-grid-community";
// ModuleRegistry.registerModules([AllCommunityModule]);
// import { AgGridReact } from "ag-grid-react";
// import type { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";

// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-quartz.css";

// // 🔹 Type + Exchange options (Angel + Zerodha share same codes)
// type ExchangeOption = {
//   code: string;
//   fullForm: string;
// };

// const EXCHANGE_OPTIONS: ExchangeOption[] = [
//   { code: "NSE", fullForm: "National Stock Exchange" },
//   { code: "BSE", fullForm: "Bombay Stock Exchange" },
//   { code: "NFO", fullForm: "NSE Futures & Options Segment" },
//   { code: "BFO", fullForm: "BSE Futures & Options Segment" },
//   { code: "CDS", fullForm: "Currency Derivatives Segment" },
//   { code: "MCX", fullForm: "Multi Commodity Exchange" },
// ];

// export default function InstrumentFormAdmin() {
//   const apiUrl = import.meta.env.VITE_API_URL;

//   const [data, setData] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const [symbolPrefix, setSymbolPrefix] = useState("");
//   const [getslotSIze, setSlotSIze] = useState("");

//   const [duration, setDuration] = useState("DAY");
//   const [orderType, setOrderType] = useState("MARKET");
//   const [variety, setVariety] = useState("NORMAL");

//   // AG Grid Quick Filter ke liye state
//   const [quickFilterText, setQuickFilterText] = useState("");

//   const gridApiRef = useRef<GridApi | null>(null);

//   const [groupName, setGroupName] = useState("");
//   const [strategyList, setStrategyList] = useState<any[]>([]);
//   const [selectedStrategyId, setSelectedStrategyId] = useState("");

//   const [scriptModalOpen, setScriptModalOpen] = useState(false);
//   const [scriptSearch, setScriptSearch] = useState("");
//   const [scriptExpiryFilter, setScriptExpiryFilter] = useState("");
//   const [scriptOptionFilter, setScriptOptionFilter] = useState<"" | "CE" | "PE">("");
//   const [selectedScriptRow, setSelectedScriptRow] = useState<any | null>(null);
//   const [chartSymbolSearch, setChartSymbolSearch] = useState("");
//   const [scriptTxnType, setScriptTxnType] = useState<"" | "BUY" | "SELL">("BUY");
//   const [scriptProductType, setScriptProductType] = useState<
//     "" | "INTRADAY" | "DELIVERY" | "CARRYFORWARD" | "BO" | "MARGIN"
//   >("INTRADAY");

//   const [useKite, setUseKite] = useState(false);

//   // 🔹 Selected Exchange for filter on top (value contains "code - fullForm")
//   const [selectedExchange, setSelectedExchange] = useState<string>("");

//   // ---------- Common expiry normalizer ----------
//   const buildExpiryMeta = (rawExpiry: any) => {
//     if (!rawExpiry) return { expiryDateObj: null, expiryLabel: "" };

//     const s = String(rawExpiry).trim();
//     if (!s) return { expiryDateObj: null, expiryLabel: "" };

//     let d: Date | null = null;

//     // 1) YYYY-MM-DD  (Kite)
//     if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
//       d = new Date(s + "T00:00:00");
//     }
//     // 2) DD-MMM-YYYY / DD-MMM-YY (AngelOne etc.)
//     else if (/^\d{2}-[A-Za-z]{3}-\d{2,4}$/.test(s)) {
//       const [ddStr, monStrRaw, yyStr] = s.split("-");
//       const dd = Number(ddStr);
//       const monStr = monStrRaw.toUpperCase();
//       const monthMap: Record<string, number> = {
//         JAN: 0,
//         FEB: 1,
//         MAR: 2,
//         APR: 3,
//         MAY: 4,
//         JUN: 5,
//         JUL: 6,
//         AUG: 7,
//         SEP: 8,
//         OCT: 9,
//         NOV: 10,
//         DEC: 11,
//       };
//       const monthIndex = monthMap[monStr];
//       if (monthIndex !== undefined) {
//         let yearNum = Number(yyStr);
//         if (yyStr.length === 2) {
//           yearNum = 2000 + yearNum;
//         }
//         d = new Date(yearNum, monthIndex, dd);
//       }
//     }
//     // 3) Fallback: native Date parse
//     else {
//       const t = new Date(s);
//       if (!isNaN(t.getTime())) d = t;
//     }

//     if (!d) return { expiryDateObj: null, expiryLabel: "" };

//     const day = d.getDate().toString().padStart(2, "0");
//     const monthNames = [
//       "JAN",
//       "FEB",
//       "MAR",
//       "APR",
//       "MAY",
//       "JUN",
//       "JUL",
//       "AUG",
//       "SEP",
//       "OCT",
//       "NOV",
//       "DEC",
//     ];
//     const label = `${day}-${monthNames[d.getMonth()]}-${d.getFullYear()}`;

//     return { expiryDateObj: d, expiryLabel: label };
//   };

//   // ---------- Parse option symbol (only for strike & CE/PE) ----------
//   // Works for NIFTY02DEC2525800PE, NIFTY25NOV24500CE etc.
//   const parseOptionMeta = (symbolRaw: any) => {
//     const symbol = String(symbolRaw || "").toUpperCase();

//     // e.g. NIFTY02DEC2525800PE  or  NIFTY25NOV24500CE
//     const re = /^([A-Z]+)(\d{2})([A-Z]{3})(\d{2})(\d+)(CE|PE)$/;
//     const m = symbol.match(re);
//     if (!m) return null;

//     const [, underlying, dd, monStr, yy, strike, optType] = m;

//     const monthMap: Record<string, number> = {
//       JAN: 0,
//       FEB: 1,
//       MAR: 2,
//       APR: 3,
//       MAY: 4,
//       JUN: 5,
//       JUL: 6,
//       AUG: 7,
//       SEP: 8,
//       OCT: 9,
//       NOV: 10,
//       DEC: 11,
//     };
//     const monthIndex = monthMap[monStr];
//     if (monthIndex === undefined) return null;

//     const year = 2000 + Number(yy);
//     const day = Number(dd);
//     const dateObj = new Date(year, monthIndex, day);

//     const expiryLabel = `${day.toString().padStart(2, "0")}-${monStr}-${year}`;

//     return {
//       underlying,
//       expiryLabel,
//       expiryDate: dateObj,
//       strike: Number(strike),
//       optionType: optType as "CE" | "PE",
//     };
//   };

//   // ⭐ helper that always tries to extract strike / optionType / expiry
//   const getOptionMeta = (row: any) => {
//     const mainSymbol = row.symbol || row.kiteSymbol || row.angelSymbol || "";

//     const fromSymbol = parseOptionMeta(mainSymbol);
//     if (fromSymbol) return fromSymbol;

//     const name = String(row.name || "").toUpperCase();
//     const optMatch = name.match(/\b(CE|PE)\b/);
//     const strikeMatches = name.match(/(\d+)/g);

//     return {
//       underlying: "",
//       expiryLabel: row.expiryLabel || "",
//       expiryDate: row.expiryDateObj || null,
//       strike: strikeMatches
//         ? Number(strikeMatches[strikeMatches.length - 1])
//         : row.strike || 0,
//       optionType: (optMatch?.[1] as "CE" | "PE") || (row.syType as "CE" | "PE"),
//     };
//   };

//   // ---------- NORMALIZERS (AngelOne & Kite) ----------
//   const mapAngelToCommon = (row: any) => {
//     const { expiryDateObj, expiryLabel } = buildExpiryMeta(row.expiry);

//     return {
//       ...row,
//       token: String(row.token ?? ""),
//       symbol: String(row.symbol ?? ""),
//       name: row.name ?? "",
//       expiry: row.expiry ?? "",
//       strike: row.strike !== undefined ? Number(row.strike) : -1,
//       lotsize: row.lotsize !== undefined ? Number(row.lotsize) : 0,
//       instrumenttype: row.instrumenttype ?? "",
//       exch_seg: row.exch_seg ?? "",
//       tick_size: row.tick_size !== undefined ? Number(row.tick_size) : 0,
//       syType: row.instrumenttype ?? row.syType ?? "",
//       angelToken: String(row.token ?? ""),
//       angelSymbol: String(row.symbol ?? ""),
//       kiteToken: row.kiteToken ?? "",
//       kiteSymbol: row.kiteSymbol ?? "",
//       expiryDateObj,
//       expiryLabel,
//     };
//   };

//   const mapKiteToCommon = (row: any) => {
//     const { expiryDateObj, expiryLabel } = buildExpiryMeta(row.expiry);

//     // Try to derive strike if missing
//     let strike = row.strike;
//     if (!strike) {
//       const metaFromSymbol = parseOptionMeta(row.tradingsymbol);
//       if (metaFromSymbol) {
//         strike = metaFromSymbol.strike;
//       } else {
//         const m = String(row.name || "").match(/\d+/);
//         strike = m ? Number(m[0]) : 0;
//       }
//     }

//     return {
//       ...row,
//       token: String(row.exchange_token ?? ""),
//       symbol: String(row.tradingsymbol ?? ""),
//       name: row.name ?? "",
//       expiry: row.expiry ?? "",
//       strike: Number(strike),
//       lotsize: row.lot_size !== undefined ? Number(row.lot_size) : 0,
//       instrumenttype: row.instrument_type ?? "",
//       exch_seg: row.segment ?? row.exchange ?? "",
//       tick_size: row.tick_size !== undefined ? Number(row.tick_size) : 0,
//       syType: row.instrument_type ?? "",
//       kiteToken: String(row.exchange_token ?? ""),
//       kiteSymbol: String(row.tradingsymbol ?? ""),
//       angelToken: row.angelToken ?? "",
//       angelSymbol: row.angelSymbol ?? "",
//       expiryDateObj,
//       expiryLabel,
//     };
//   };

//   // ---------- Fetch instruments (AngelOne or Kite) ----------
//   const fetchData = async () => {
//     setLoading(true);
//     setError("");

//     try {
//       const endpoint = useKite ? "/kite/instrument" : "/agnelone/instrument";
//       const res = await axios.get(`${apiUrl}${endpoint}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });

//       console.log(res);
      

//       if (res?.data?.status === true) {
//         const rawData = res?.data?.data || [];

//         const normalized = useKite
//           ? rawData.map((row: any) => mapKiteToCommon(row))
//           : rawData.map((row: any) => mapAngelToCommon(row));

//         setData(normalized);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err?.message || "Something went wrong");
//       setError(err?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------- Fetch strategies ----------
//   const fetchStrategies = async () => {
//     try {
//       const res = await axios.get(`${apiUrl}/admin/strategies`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//           userid: localStorage.getItem("userID"),
//         },
//       });

//       if (res.data.status === true) {
//         setStrategyList(res.data.data || []);
//       } else {
//         toast.error(res.data.message);
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//     fetchStrategies();
//     setQuickFilterText(""); // Reset quick filter when switching data source
//   }, [useKite]);

 

// const handleOpenScriptModal = (rowData: any = null) => {
//   setSelectedScriptRow(rowData);
//   setScriptModalOpen(true);
//   setScriptSearch(rowData?.symbol || "");
//   setChartSymbolSearch("");
//   setScriptExpiryFilter("");
//   setScriptOptionFilter("");
//   setScriptTxnType("BUY");
//   setScriptProductType("INTRADAY");
//   setSelectedStrategyId("");
//   setGroupName("");
// };

// // AG Grid Column Definition:
// const columnDefs = useMemo<ColDef[]>(
//   () => [
//     {
//       headerName: "Token",
//       field: "token",
//       minWidth: 250,
//       filter: "agTextColumnFilter",
//     },
//     {
//       headerName: "Symbol",
//       field: "symbol",
//       minWidth: 250,
//       filter: "agTextColumnFilter",
//     },
//     {
//       headerName: "Kite Symbol",
//       field: "kite_tradingsymbol",
//       minWidth: 120,
//       filter: "agTextColumnFilter",
//     },
//     {
//       headerName: "Action",
//       cellRenderer: (params: any) => (
//         <button
//           onClick={() => handleOpenScriptModal(params.data)}
//           className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
//         >
//           Buy
//         </button>
//       ),
//       minWidth: 100,
//       sortable: false,
//       filter: false,
//     },
//   ],
//   [useKite]
// );


//   const defaultColDef = useMemo<ColDef>(
//     () => ({
//       sortable: true,
//       resizable: true,
//       filter: true,
//       floatingFilter: true,
//       flex: 1,
//       minWidth: 100,
//     }),
//     []
//   );

//   const onGridReady = (e: GridReadyEvent) => {
//     gridApiRef.current = e.api;
//     e.api.sizeColumnsToFit();
//   };

//   // ---------- Quick Filter Handler (AG Grid Built-in) ----------
//   const onFilterTextBoxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setQuickFilterText(e.target.value);
//   };

//   // 🔹 Main grid data, filtered by exchange
//   const filteredData = useMemo(() => {
//     let rows = data;

//     if (selectedExchange) {
//       const selectedCode = selectedExchange.split(" - ")[0].toUpperCase(); // e.g. "NFO"
//       rows = rows.filter(
//         (row) =>
//           String(row.exch_seg || "")
//             .toUpperCase()
//             .trim() === selectedCode
//       );
//     }

//     return rows;
//   }, [data, selectedExchange]);

//   // ---------- Base rows for modal filters (without expiry) ----------
//   const scriptBaseRows = useMemo(() => {
//     let rows = data.filter((row) => {
//       if (useKite) {
//         return row.kiteSymbol && row.kiteToken;
//       } else {
//         return row.angelSymbol && row.angelToken;
//       }
//     });

//     // Search by name/symbol/CE/PE (e.g. "NIFTY")
//     const qRaw = scriptSearch.trim().toUpperCase();
//     const tokens = qRaw.split(/\s+/).filter(Boolean);

//     if (tokens.length > 0) {
//       rows = rows.filter((row) => {
//         const symbol = String(row.symbol || "").toUpperCase();
//         const name = String(row.name || "").toUpperCase();
//         const haystack = `${symbol} ${name}`;
//         return tokens.every((t) => haystack.includes(t));
//       });
//     }

//     // Chart Symbol (Strike) filter – matches whatever you type (e.g. 26150)
//     const strikeQ = chartSymbolSearch.trim();
//     if (strikeQ) {
//       rows = rows.filter((row: any) => {
//         return (
//           (row.symbol &&
//             row.symbol.toUpperCase().includes(strikeQ.toUpperCase())) ||
//           (row.tradingsymbol &&
//             row.tradingsymbol.toUpperCase().includes(strikeQ.toUpperCase()))
//         );
//       });
//     }

//     // Option Type filter (CE/PE)
//     if (scriptOptionFilter) {
//       rows = rows.filter((row) => {
//         const meta = getOptionMeta(row);
//         return meta && meta.optionType === scriptOptionFilter;
//       });
//     }

//     return rows;
//   }, [data, scriptSearch, chartSymbolSearch, scriptOptionFilter, useKite]);

//   // ---------- Expiry dropdown: based on filtered rows (today → +3 months) ----------
//   const allExpiryOptions = useMemo(() => {
//     const MONTH_RANGE = 3; // ⭐ only next 3 months
//     const now = new Date();
//     const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//     const maxDate = new Date(
//       startOfToday.getFullYear(),
//       startOfToday.getMonth() + MONTH_RANGE,
//       startOfToday.getDate()
//     );

//     const map = new Map<string, { label: string; date: Date }>();

//     scriptBaseRows.forEach((row) => {
//       let d: Date | null = row.expiryDateObj || null;
//       let label: string = row.expiryLabel || "";

//       // fallback to parse from symbol if expiry field was empty
//       if (!d || !label) {
//         const meta = parseOptionMeta(row.symbol || row.kiteSymbol || row.angelSymbol);
//         if (meta) {
//           d = meta.expiryDate;
//           label = meta.expiryLabel;
//         }
//       }

//       if (!d || !label) return;
//       if (d < startOfToday || d > maxDate) return;

//       const key = d.toISOString().slice(0, 10);
//       if (!map.has(key)) {
//         map.set(key, { label, date: d });
//       }
//     });

//     return Array.from(map.entries())
//       .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
//       .map(([key, value]) => ({
//         key,
//         label: value.label,
//       }));
//   }, [scriptBaseRows]);

//   // ---------- Final filtered rows in Add/Edit Scrip modal (with expiry) ----------
//   const scriptFilteredRows = useMemo(() => {
//     let rows = [...scriptBaseRows];

//     // Expiry filter (dropdown)
//     if (scriptExpiryFilter) {
//       rows = rows.filter((row) => {
//         if (row.expiryLabel === scriptExpiryFilter) return true;
//         const meta = getOptionMeta(row);
//         return meta?.expiryLabel === scriptExpiryFilter;
//       });
//     }

//     return rows.slice(0, 300);
//   }, [scriptBaseRows, scriptExpiryFilter]);

//   // ---------- Save ----------
//   const handleScriptSave = async () => {
//     if (!selectedScriptRow) {
//       toast.error("Please select a scrip from the list");
//       return;
//     }

//     const lotSizeNum = Number(selectedScriptRow.lotsize || 0);
//     const priceNum = Number(selectedScriptRow.price || 0);
//     const slotSizeNum = Number(getslotSIze || 1);

//     const requiredFields = [
//       { label: "Token", value: selectedScriptRow.token },
//       { label: "Symbol", value: selectedScriptRow.symbol },
//       { label: "Name", value: selectedScriptRow.name },
//       { label: "Exchange Segment", value: selectedScriptRow.exch_seg },
//       { label: "AngelOne Token", value: selectedScriptRow.angelToken },
//       { label: "AngelOne Symbol", value: selectedScriptRow.angelSymbol },
//       { label: "Kite Token", value: selectedScriptRow.kiteToken },
//       { label: "Kite Symbol", value: selectedScriptRow.kiteSymbol },
//       { label: "Group Name", value: groupName },
//       { label: "Quantity (Lot Size)", value: lotSizeNum },
//       { label: "Product Type", value: scriptProductType },
//     ];

//     for (let item of requiredFields) {
//       if (!item.value || item.value === "" || item.value === " ") {
//         toast.error(`${item.label} is required.`);
//         return;
//       }
//     }

//     const payload = {
//       token: selectedScriptRow.token || "",
//       symbol: selectedScriptRow.symbol || "",
//       name: selectedScriptRow.name || "",
//       exch_seg: selectedScriptRow.exch_seg || "",
//       lotsize: lotSizeNum,
//       instrumenttype: selectedScriptRow.instrumenttype || "",
//       price: priceNum,
//       quantity: lotSizeNum,
//       transactiontype: scriptTxnType,
//       duration,
//       orderType,
//       variety,
//       productType: scriptProductType,
//       totalPrice: priceNum * lotSizeNum,
//       actualQuantity: lotSizeNum / slotSizeNum,
//       searchText: scriptSearch || "",
//       chartSymbol: chartSymbolSearch || "",
//       optionType: scriptOptionFilter || "",
//       expiry: selectedScriptRow.expiry || "",
//       expiryLabel: selectedScriptRow.expiryLabel || "",
//       strategyId: selectedStrategyId || "",
//       groupName: groupName,
//       angelOneToken: selectedScriptRow.angelToken || "",
//       angelOneSymbol: selectedScriptRow.angelSymbol || "",
//       kiteToken: selectedScriptRow.kiteToken || "",
//       kiteSymbol: selectedScriptRow.kiteSymbol || "",
//     };

//     try {
//       const res = await axios.post(
//         `${apiUrl}/admin/multiple/place/order`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         }
//       );

//       if (res?.data?.status === true) {
//         alert(res?.data?.message);
//         setVariety("NORMAL");
//         setDuration("DAY");
//         setOrderType("MARKET");
//         setScriptModalOpen(false);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong");
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   // ---------- Selection Handler ----------
//   const handleSelectionInstrument = async (raw: any) => {
//     const payload = {
//       exchange: raw.exch_seg,
//       tradingsymbol: raw.symbol,
//       symboltoken: raw.token,
//     };

//     try {
//       await fetchStrategies();

//       if (useKite) {
//         setSelectedScriptRow((prev: any) => ({
//           ...(prev || {}),
//           kiteToken: raw.exchange_token || raw.kiteToken || raw.token,
//           kiteSymbol: raw.kiteSymbol || raw.symbol,
//           angelToken: prev?.angelToken || "",
//           angelSymbol: prev?.angelSymbol || "",
//           kiteName: raw.name,
//           exch_seg: raw.exch_seg || raw.exchange,
//           lotsize: raw.lotsize,
//           price: 0,
//           expiry: raw.expiry,
//           expiryLabel: raw.expiryLabel,
//           expiryDateObj: raw.expiryDateObj,
//         }));

//         setSlotSIze(raw.lotsize);
//       } else {
//         try {
//           const res = await axios.post(
//             `${apiUrl}/agnelone/instrument/ltp`,
//             payload,
//             {
//               headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//                 AngelOneToken: localStorage.getItem("angel_token") || "",
//                 userid: localStorage.getItem("userID"),
//               },
//             }
//           );

//           if (res?.data?.status === true) {
//             const ltp = res?.data?.data?.data?.ltp || raw.price || 0;

//             setSelectedScriptRow((prev: any) => ({
//               ...(prev || {}),
//               angelToken: raw.angelToken || raw.token,
//               angelSymbol: raw.angelSymbol || raw.symbol,
//               kiteToken: prev?.kiteToken || "",
//               kiteSymbol: prev?.kiteSymbol || "",
//               token: raw.token,
//               symbol: raw.symbol,
//               name: raw.name,
//               exch_seg: raw.exch_seg,
//               lotsize: raw.lotsize,
//               instrumenttype: raw.instrumenttype,
//               price: ltp,
//               expiry: raw.expiry,
//               expiryLabel: raw.expiryLabel,
//               expiryDateObj: raw.expiryDateObj,
//             }));

//             setSlotSIze(raw.lotsize);
//           } else {
//             toast.error(res?.data?.message || "Something went wrong");
//           }
//         } catch (err: any) {
//           console.error(err);
//           toast.error(err.message || "Something went wrong");
//         }
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.message || "Something went wrong");
//     }
//   };

//   // ---------- JSX ----------
//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <h2 className="text-xl font-semibold mb-4">Nifty Bank Instruments</h2>

//       <div className="flex justify-between items-center mb-4 gap-4">
//         {/* AG Grid Quick Filter */}
//         <div className="w-full sm:w-80">
//           <input
//             type="text"
//             value={quickFilterText}
//             onChange={onFilterTextBoxChange}
//             placeholder='AG Grid Quick Filter (e.g. "NIFTY02DEC2525800PE" or "NIFTY")'
//             className="border p-2 w-full rounded"
//           />
//           <p className="text-xs text-gray-500 mt-1">
//             Type to filter across all columns. Each column also has individual filters.
//           </p>
//         </div>

//         <div className="flex items-center gap-4">
//           {/* 🔹 Exchange Filter Dropdown */}
//           <div>
//             <label className="block text-xs font-medium text-gray-600 mb-1">
//               Exchange Filter
//             </label>
//             <select
//               value={selectedExchange}
//               onChange={(e) => setSelectedExchange(e.target.value)}
//               className="border rounded px-3 py-2 text-sm bg-white"
//             >
//               <option value="">All Exchanges</option>
//               {EXCHANGE_OPTIONS.map((ex) => {
//                 const value = `${ex.code} - ${ex.fullForm}`;
//                 return (
//                   <option key={ex.code} value={value}>
//                     {ex.code} - {ex.fullForm}
//                   </option>
//                 );
//               })}
//             </select>
//           </div>

//           <label className="flex items-center gap-2">
//             <input
//               type="checkbox"
//               checked={useKite}
//               onChange={(e) => setUseKite(e.target.checked)}
//               className="h-4 w-4"
//             />
//             Use Kite Instruments
//           </label>

//           <button
//             className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
//             onClick={handleOpenScriptModal}
//           >
//             Add/Edit
//           </button>
//         </div>
//       </div>

//       {loading && <p>Loading data...</p>}
//       {error && <p className="text-red-500">{error}</p>}
//       {!loading && !error && filteredData.length === 0 && <p>No data found.</p>}

//       {filteredData.length > 0 && (
//         <div
//           className="ag-theme-quartz compact-grid"
//           style={{ height: 540, width: "100%" }}
//         >
//           <AgGridReact
//             rowData={filteredData}
//             columnDefs={columnDefs}
//             defaultColDef={defaultColDef}
//             animateRows
//             rowSelection="single"
//             pagination
//             paginationPageSize={10000}
//             rowHeight={34}
//             suppressFieldDotNotation
//             onGridReady={onGridReady}
//             quickFilterText={quickFilterText} // AG Grid quick filter prop
//           />
//         </div>
//       )}

//       {scriptModalOpen && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999999]">
//           <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl mx-3">
//             <div className="max-h-[90vh] overflow-y-auto p-6">
//               {/* Header */}
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-lg font-semibold">Add / Edit Scrip</h3>
//                 <button
//                   onClick={() => setScriptModalOpen(false)}
//                   className="text-gray-500 hover:text-black text-xl leading-none"
//                 >
//                   ×
//                 </button>
//               </div>

//               {/* SECTION 1: Scrip Details & Search */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <div className="flex items-center justify-between mb-3">
//                   <h4 className="text-sm font-semibold text-gray-700">
//                     Scrip Details & Search
//                   </h4>

//                   <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
//                     <input
//                       type="checkbox"
//                       checked={useKite}
//                       onChange={(e) => setUseKite(e.target.checked)}
//                       className="h-4 w-4"
//                     />
//                     Search in Kite Instruments (unchecked = AngelOne)
//                   </label>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Search Name / Symbol / CE / PE
//                     </label>

//                     <div className="flex gap-2">
//                       {/* Underlying dropdown (your existing logic) */}
//                       <select
//                         value={symbolPrefix}
//                         onChange={(e) => setSymbolPrefix(e.target.value)}
//                         className="border rounded px-3 py-2 text-sm bg-white"
//                         style={{ minWidth: "120px" }}
//                       >
//                         <option value="">Select</option>
//                         <option value="NIFTY">NIFTY</option>
//                         <option value="BANKNIFTY">BANKNIFTY</option>
//                       </select>

//                       <input
//                         type="text"
//                         value={scriptSearch}
//                         onChange={(e) => setScriptSearch(e.target.value)}
//                         placeholder="e.g. 26150 CE"
//                         className="border rounded px-3 py-2 w-full text-sm"
//                       />
//                     </div>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Chart Symbol (Strike)
//                     </label>
//                     <input
//                       type="text"
//                       placeholder="e.g. 26150"
//                       value={chartSymbolSearch}
//                       onChange={(e) => setChartSymbolSearch(e.target.value)}
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* SECTION 2: Filters & Order Settings */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <h4 className="text-sm font-semibold text-gray-700 mb-3">
//                   Filters & Order Settings
//                 </h4>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Option Type
//                     </label>
//                     <select
//                       value={scriptOptionFilter}
//                       onChange={(e) =>
//                         setScriptOptionFilter(e.target.value as "" | "CE" | "PE")
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">ALL</option>
//                       <option value="CE">CE (Call)</option>
//                       <option value="PE">PE (Put)</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Expiry (next 3 months)
//                     </label>
//                     <select
//                       value={scriptExpiryFilter}
//                       onChange={(e) => setScriptExpiryFilter(e.target.value)}
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">All Expiries</option>
//                       {allExpiryOptions.map((exp) => (
//                         <option key={exp.key} value={exp.label}>
//                           {exp.label}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Transaction Type
//                     </label>
//                     <select
//                       value={scriptTxnType}
//                       onChange={(e) =>
//                         setScriptTxnType(e.target.value as "" | "BUY" | "SELL")
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="BUY">BUY</option>
//                       <option value="SELL">SELL</option>
//                     </select>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Order Type
//                     </label>
//                     <select
//                       value={orderType}
//                       onChange={(e) => setOrderType(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Order Type</option>
//                       <option value="MARKET">MARKET</option>
//                       <option value="LIMIT">LIMIT</option>
//                       <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT</option>
//                       <option value="STOPLOSS_MARKET">STOPLOSS_MARKET</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Duration
//                     </label>
//                     <select
//                       value={duration}
//                       onChange={(e) => setDuration(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Duration</option>
//                       <option value="DAY">DAY</option>
//                       <option value="IOC">IOC</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Variety
//                     </label>
//                     <select
//                       value={variety}
//                       onChange={(e) => setVariety(e.target.value)}
//                       required
//                       className="border rounded px-3 py-2 w-full text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
//                     >
//                       <option value="">Select Variety</option>
//                       <option value="NORMAL">NORMAL</option>
//                       <option value="STOPLOSS">STOPLOSS</option>
//                       <option value="ROBO">ROBO</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* SECTION 3: Product & Strategy */}
//               <div className="border border-gray-200 rounded-lg p-4 mb-6">
//                 <h4 className="text-sm font-semibold text-gray-700 mb-3">
//                   Product & Strategy
//                 </h4>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Product Type
//                     </label>
//                     <select
//                       value={scriptProductType}
//                       onChange={(e) =>
//                         setScriptProductType(
//                           e.target.value as
//                             | ""
//                             | "INTRADAY"
//                             | "DELIVERY"
//                             | "CARRYFORWARD"
//                             | "BO"
//                             | "MARGIN"
//                         )
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm"
//                     >
//                       <option value="">Select</option>
//                       <option value="INTRADAY">IntraDay MIS</option>
//                       <option value="DELIVERY">Longterm CNC</option>
//                       <option value="CARRYFORWARD">CARRYFORWARD</option>
//                       <option value="BO">Bracket Order </option>
//                       <option value="MARGIN">Margin Delivery</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Quantity in Lot
//                     </label>
//                     <input
//                       type="number"
//                       placeholder="Enter Quantity in Lot"
//                       value={selectedScriptRow?.lotsize || ""}
//                       onChange={(e) =>
//                         setSelectedScriptRow((prev: any) => ({
//                           ...(prev || {}),
//                           lotsize: e.target.value,
//                         }))
//                       }
//                       className="border rounded px-3 py-2 w-full text-sm bg-white focus:ring-2 focus:ring-blue-500"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-xs font-medium text-gray-600 mb-1">
//                       Select Strategy *
//                     </label>
//                     <select
//                       className="w-full border rounded px-3 py-2 text-sm"
//                       value={selectedStrategyId}
//                       onChange={(e) => {
//                         const strategyId = e.target.value;
//                         setSelectedStrategyId(strategyId);

//                         const selected: any = strategyList.find(
//                           (s: any) => s.id == strategyId
//                         );

//                         if (selected) {
//                           setGroupName(selected.strategyName);
//                         } else {
//                           setGroupName("");
//                         }
//                       }}
//                     >
//                       <option value="">Select Strategy</option>
//                       {strategyList.map((s: any) => (
//                         <option value={s.id} key={s.id}>
//                           {s.strategyName}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* SECTION 4: Result list */}
//               <div className="border border-gray-200 rounded-lg mb-6">
//                 <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
//                   <span className="text-xs font-semibold text-gray-600">
//                     Search Results (click to select)
//                   </span>
//                 </div>

//                 <div className="max-h-64 overflow-auto">
//                   <table className="w-full text-sm">
//                     <thead className="bg-gray-100 sticky top-0">
//                       <tr>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Symbol
//                         </th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Name
//                         </th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Token
//                         </th>
//                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
//                           Lot
//                         </th>
//                       </tr>
//                     </thead>

//                     <tbody>
//                       {scriptFilteredRows.map((row) => (
//                         <tr
//                           key={`${row.token}-${row.symbol}`}
//                           className={`cursor-pointer transition-colors ${
//                             selectedScriptRow?.token === row.token ||
//                             selectedScriptRow?.kiteToken === row.token ||
//                             selectedScriptRow?.angelToken === row.token
//                               ? "bg-purple-100"
//                               : "hover:bg-purple-50"
//                           }`}
//                           onClick={() => handleSelectionInstrument(row)}
//                         >
//                           <td className="px-3 py-1">{row.symbol}</td>
//                           <td className="px-3 py-1">{row.name}</td>
//                           <td className="px-3 py-1">{row.token}</td>
//                           <td className="px-3 py-1">{row.lotsize}</td>
//                         </tr>
//                       ))}

//                       {scriptFilteredRows.length === 0 && (
//                         <tr>
//                           <td
//                             className="px-3 py-3 text-center text-gray-500"
//                             colSpan={4}
//                           >
//                             No matching scrips found.
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>

//               {/* Footer buttons */}
//               <div className="flex justify-end gap-3">
//                 <button
//                   onClick={() => {
//                     setScriptSearch("");
//                     setScriptExpiryFilter("");
//                     setScriptOptionFilter("");
//                     setChartSymbolSearch("");
//                     setSelectedScriptRow(null);
//                     setScriptTxnType("BUY");
//                     setScriptProductType("");
//                     setSelectedStrategyId("");
//                     setGroupName("");
//                   }}
//                   className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded text-sm"
//                 >
//                   Reset
//                 </button>

//                 <button
//                   onClick={() => setScriptModalOpen(false)}
//                   className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded text-sm"
//                 >
//                   Close
//                 </button>

//                 <button
//                   onClick={handleScriptSave}
//                   className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded text-sm font-medium"
//                 >
//                   Save changes
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       // Modal ke JSX me yeh fields add karen:
// <div className="border border-gray-200 rounded-lg p-4 mb-6">
//   <h4 className="text-sm font-semibold text-gray-700 mb-3">
//     Instrument Details
//   </h4>
//   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//     <div>
//       <label className="block text-xs font-medium text-gray-600 mb-1">
//         Instrument Symbol
//       </label>
//       <input
//         type="text"
//         value={selectedScriptRow?.symbol || ""}
//         readOnly
//         className="border rounded px-3 py-2 w-full text-sm bg-gray-100"
//       />
//     </div>
//     <div>
//       <label className="block text-xs font-medium text-gray-600 mb-1">
//         Lot Size
//       </label>
//       <input
//         type="number"
//         value={selectedScriptRow?.lotsize || ""}
//         readOnly
//         className="border rounded px-3 py-2 w-full text-sm bg-gray-100"
//       />
//     </div>
//     <div>
//       <label className="block text-xs font-medium text-gray-600 mb-1">
//         Quantity (in Lots)
//       </label>
//       <input
//         type="number"
//         value={getslotSIze || ""}
//         onChange={(e) => setSlotSIze(e.target.value)}
//         className="border rounded px-3 py-2 w-full text-sm"
//       />
//     </div>
//   </div>
// </div>


//     </div>
//   );
// }


