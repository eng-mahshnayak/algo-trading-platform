import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import * as XLSX from 'xlsx';
import { Select, DatePicker,Button } from "antd";
import dayjs from "dayjs";
import "antd/dist/reset.css"; // or "antd/dist/antd.css" for older versions
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { getSocket } from "../../socket/Socket";


type Tick = {
  mode: 1 | 2 | 3;
  exchangeType: number;
  token: string;              // e.g. "47667"
  sequenceNumber: number;
  exchangeTimestamp: string;  // ISO
  ltpPaiseOrRaw: number;      // e.g. 10225
  ltp: number;                // e.g. 102.25
};

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
  status: string;        // e.g., "rejected"
  orderstatus: string;   // duplicate in your sample; we’ll show `status`
  updatetime: string;    // e.g., "24-Oct-2025 13:21:19"
  exchtime: string;
  exchorderupdatetime: string;
  fillid: string;
  filltime: string;
  fillprice:string;
  fillsize:string;
  parentorderid: string;
  uniqueorderid: string;
  exchangeorderid: string;
   createdAt:string;
};

// util: tiny debounce hook so search feels snappy
function useDebounced<T>(value: T, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v as T;
}

const PAGE_SIZE_DEFAULT = 10;

const statusColor = (status: string) => {
  const s = status?.toLowerCase();
  if (s === "complete" || s === "filled" || s === "success") return "#16a34a"; // green
  if (s === "rejected" || s === "cancelled" || s === "canceled") return "#ef4444"; // red
  if (s === "pending" || s === "open" || s === "queued") return "#f59e0b"; // amber
  return "#64748b"; // slate
};

export default function OrderTableAdmin() {

  const apiUrl = import.meta.env.VITE_API_URL;

   const navigate = useNavigate();

  const [profitAndLossData, setProfitAndLossData] = useState<number>(0);

  const [orders, setOrders] = useState<Order[]>([]);
   
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 50);

  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_DEFAULT);
  const [page, setPage] = useState<number>(1);

  const [showForm, setShowForm] = useState(false); // ✅ control modal visibility
   const [showFormUpdate, setShowFormUpdate] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null); // ✅ store clicked item

  const [selectedScrip, setSelectedScrip] = useState<string>("LOCAL_TABLE");

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const [getPrice, setOnlyPrice] = useState("");
  const [getslotSIze, setSlotSIze] = useState("");


  console.log(getPrice,getslotSIze,'byueee');

  // Live ticks: keep a token -> current LTP map
  const [ltpByToken, setLtpByToken] = useState<Record<string, number>>({});
  
  useEffect(() => {


        const socket = getSocket();
      
          const onTick = (tick: Tick) => {
            
            setLtpByToken((prev) => {
              const curr = prev[tick.token];
              if (curr === tick.ltp) return prev; // avoid useless re-render
              return { ...prev, [tick.token]: tick.ltp };
            });
          };
      
          socket.on("tick", onTick);

    let cancelled = false;

    async function fetchOrders() {
     
      try {
        const {data} = await axios.get(`${apiUrl}/admin/get/table/order`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
              "userid":localStorage.getItem("userID")
             
            },
          });


       if(data.status==true) {

        console.log(data.data);
        

        setOrders(data.data);

       }else if(data.status==false&&data.message=='Unauthorized'){

         toast.error('Unauthorized User');

            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("termsAccepted");
            localStorage.removeItem("feed_token");
            localStorage.removeItem("refresh_token");
           
       }else{

         toast.error(data?.message||"Something went wrong");
          // alert(data?.message)
       }
        
      } catch (err: any) {

        console.log(err);
        
         toast.error(err?.message || "Something went wrong");
         
      } finally {
        if (!cancelled) setLoading(false);
      }


       // 2️⃣ Third API: (example)
         const getAllTodayTrade = await axios.get(`${apiUrl}/order/dummydatatrade`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
           "userid":localStorage.getItem("userID")
        },
      });


     
      setProfitAndLossData(getAllTodayTrade?.data?.pnl)


    }

    fetchOrders();
 
  }, []);

  // reset to page 1 whenever the search or page size changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return orders;

    return orders.filter((o) => {
      // fields to search across
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
        // also allow searching numbers like price/quantity
        ` ${o.price ?? ""} ${o.quantity ?? ""} ${o.averageprice ?? ""}`;
      return haystack.includes(q);
    });
  }, [orders, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);


    const handleUpdateClick = async(item: any) => {

      const payload = {
      exchange: item.exchange,
      tradingsymbol: item.tradingsymbol,
      symboltoken:item.symboltoken,
    };

     const res = await axios.post(`${apiUrl}/order/get/ltp`, payload, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                "AngelOneToken": localStorage.getItem("angel_token") || "",
            },
          });

           if(res?.data?.status==true) {

             item.totalPrice = res?.data?.data.data.ltp*item.quantity

            setOnlyPrice(res?.data?.data.data.ltp)
            setSlotSIze(item.quantity)  
            setSelectedItem({...item});
            setShowForm(true);

           }else{

            toast.error(res?.data?.message || "Something went wrong");
           }
    }

      const handleSellClick = async(item: any) => {

      const payload = {
      exchange: item.exchange,
      tradingsymbol: item.tradingsymbol,
      symboltoken:item.symboltoken,
    };

     const res = await axios.post(`${apiUrl}/order/get/ltp`, payload, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                "AngelOneToken": localStorage.getItem("angel_token") || "",
            },
          });


          console.log(item,'item data');
          

           if(res?.data?.status==true) {

            item.totalPrice = res?.data?.data.data.ltp*item.quantity
            setOnlyPrice(res?.data?.data.data.ltp)
            setSlotSIze(item.quantity)  
            setSelectedItem({...item});
           setShowFormUpdate(true)

           }else{

            toast.error(res?.data?.message || "Something went wrong");
           }
    }


    const handleCancelClick = async (item: any) => {

    try {
         let res = await axios.post(`${apiUrl}/order/cancel/order`, item, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
              "AngelOneToken": localStorage.getItem("angel_token") || "",
               "userid":localStorage.getItem("userID")
            },
          })


          console.log(res.data);
          

      if(res.data.status==true) {

         toast.success(res.data.message);

        

      }else if(res.data.status==false&&res.data.status=='Unauthorized'){
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("termsAccepted");
            localStorage.removeItem("feed_token");
            localStorage.removeItem("refresh_token");
           
       }
       else{

        toast.error(res.data.message || "Something went wrong");
         
      }   
    } catch (error:any) {

      setError(error.message)

        toast.error(error.messagee || "Something went wrong");

    }

      }

      // ✅ Handle Update Form Submit
    const handleSubmit = async(e: React.FormEvent) => {

      try {
        
         e.preventDefault()

           const ok = window.confirm(
              "You are updating Data.\nDo you want to continue?"
            );

            if (ok) {
             
        let res = await axios.put(`${apiUrl}/order/modify/order`, selectedItem, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                "AngelOneToken": localStorage.getItem("angel_token") || "",
                 "userid":localStorage.getItem("userID")
            },
          }) 
 
      if(res.data.status==true) {

         toast.success(res.data.message);

      }else if(res.data.status==false&&res.data.status=='Unauthorized'){
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("termsAccepted");
            localStorage.removeItem("feed_token");
            localStorage.removeItem("refresh_token"); 
            
             toast.error("Unauthorized");
       }
       else{

         toast.error(res.data.message || "Something went wrong");
      }   
               
             
    } else {

        toast.error("Cancelled");
        return;
    }

      } catch (error:any) {

           toast.error(error.message || "Something went wrong");
      }    
  }

     // ✅ Handle Sell Form Submit
    const handleSubmitUpdate = async(e: React.FormEvent) => {

         e.preventDefault()

        let reqData = {

            userId:selectedItem.userId,    
            variety: selectedItem.variety,
            symbol: selectedItem.tradingsymbol,
            token: selectedItem.symboltoken,
            transactiontype: "SELL",
            exch_seg: selectedItem.exchange,
            orderType: selectedItem.ordertype,
            producttype: selectedItem.productType || "INTRADAY",
            productType: selectedItem.productType || "INTRADAY",
            duration:selectedItem.duration || "DAY",
            price: selectedItem.price,
            totalPrice:selectedItem.totalPrice,
            actualQuantity:selectedItem.actualQuantity,
            squareoff: "0",
            stoploss: "0",
            quantity: selectedItem.quantity,

        }
         
         
        let res = await axios.post(`${apiUrl}/order/place/order`, reqData, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                "AngelOneToken": localStorage.getItem("angel_token") || "",
                 "userid":localStorage.getItem("userID")
            },
          }) 
 
      if(res.data.status==true) {

         toast.success(res.data.message);

      }else if(res.data.status==false&&res.data.status=='Unauthorized'){
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("termsAccepted");
            localStorage.removeItem("feed_token");
            localStorage.removeItem("refresh_token");  
       }
       else{

         toast.error(res.data.message || "Something went wrong");
      }   
          
    }

     const handleExcelDownload = () => {


      //  window.open(`${apiUrl}/users/export/orders`, "_blank");

        // Convert data to worksheet
        const worksheet = XLSX.utils.json_to_sheet(orders);
        // Create a workbook
        const workbook = XLSX.utils.book_new();
        // Append the worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        // Generate an Excel file
        XLSX.writeFile(workbook, "orders.xlsx");
      };


      const handleGetDates = async ()=>{
          
        let res = await axios.post(`${apiUrl}/order/datefilter/order`, dateRange, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                "AngelOneToken": localStorage.getItem("angel_token") || "",
                 "userid":localStorage.getItem("userID")
            },
          }) 

          if(res.data.status==true) {

                    setOrders(Array.isArray(res.data.data) ? res.data.data : []);
                    setPage(1); // make sure pagination shows first page
                    toast.success(res.data?.message || "Filtered orders loaded");

      }else if(res.data.status==false&&res.data.status=='Unauthorized'){
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("termsAccepted");
            localStorage.removeItem("feed_token");
            localStorage.removeItem("refresh_token");  
       }
       else{

         toast.error(res.data.message || "Something went wrong");
      }   
          
      }


      // 🧩 Function to handle selection
  const handleSelectChange = (value: string) => {

    setSelectedScrip(value)
       
     if(value=='ANGEL_TABLE') {
      
        navigate(`/angel/order`);

     }if(value=='LOCAL_TABLE'){

       navigate(`/admin/order`);
     }
  };


  // 5) also reset to page 1 when the dataset itself changes
useEffect(() => {
  setPage(1);
}, [orders]); // 🔑 ensures current page is valid after any new data

// 6) your existing search reset is fine
useEffect(() => {
  setPage(1);
}, [debouncedSearch, pageSize]);

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif" }}>
      <h2 style={{ marginBottom: 12 }}>Orders</h2>

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
    onChange={handleSelectChange}
   options={[
            { label: "Angel Table", value: "ANGEL_TABLE" },
             { label: "Local Table", value: "LOCAL_TABLE" },
         
          ]}
  />

  

<div>
  
</div>
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
    <Button onClick={handleGetDates} className="ml-3">
        Get Dates
      </Button>

    <div className="flex items-center gap-3 mt-4">
  <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-2 text-center">
    <div className="text-xs text-gray-500 font-medium">PNL</div>
    <div
      className={`text-lg font-semibold mt-0.5 ${
        profitAndLossData >= 0 ? 'text-emerald-600' : 'text-red-600'
      }`}
    >
      ₹{profitAndLossData?.toFixed(2)}
    </div>
  </div>
</div>


      
  
</div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
  <input
    type="text"
    placeholder="Search by Order ID, Symbol, Type, Status, Exchange, Message..."
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
  {/* Excel Download Button */}
  <button
    onClick={handleExcelDownload}
    style={{
      padding: "10px 16px",
      backgroundColor: "#3b82f6", // Blue-500
      color: "white",
      border: "none",
      borderRadius: 8,
      cursor: "pointer",
      fontSize: 14,
      transition: "background-color 0.2s",
    }}
    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")} // Blue-600 on hover
    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
  >
    Excel Download
  </button>
</div>


      {/* Table */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }} className="max-w-[1080px]">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                {[
                  "Action",
                  "Order ID",
                  "Symbol",
                
                  //  "Time",
                  "Traded Qty",
                   "Traded Price",
                      "Traded Value",
                    "Traded Time",
                    "Current Price",
                    "Current Traded Value",
                      "PnL",
                  "Transaction Type",
                    "Status",
                      "Order Qty",
                  "Order Price",
                  "Type",
                  "Product Type",
                  "Message",
                  "variety",
                
                   "Token",
                  // "Exchange",
                  // "Variety",
                  "createdAt",
                   "Update",
                   "Cancel"
                ].map((h) => (

                  <th
                    key={h}
                    style={{
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
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={11} style={{ padding: 16, textAlign: "center" }}>
                    Loading orders…
                  </td>
                </tr>
              )}

              {error && !loading && (
                <tr>
                  <td colSpan={11} style={{ padding: 16, color: "#ef4444" }}>
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && current.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ padding: 16, textAlign: "center", color: "#64748b" }}>
                    No orders found.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                current.map((o) => {
                   const live = o.symboltoken ? ltpByToken[o.symboltoken] : undefined;
                  return(
                  <tr key={o.orderid} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={td}>
                      <button
                        onClick={() => handleSellClick(o)}
                        disabled={o.transactiontype === "SELL"} // 👈 disable when SELL
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 12,
                          color: "white",
                          background: statusColor("complete"),
                          textTransform: "capitalize",
                          opacity: o.transactiontype === "SELL" ? 0.5 : 1, // 👈 visual dim when disabled
                          cursor: o.transactiontype === "SELL" ? "not-allowed" : "pointer",
                        }}
                      >
                        Sell
                      </button>
                    </td>
                    <td style={td}>{o.orderid}</td>
                     
                      
                    <td style={td} title={o.tradingsymbol}>
                      
                      <strong>{o.tradingsymbol}</strong>
                    </td>
                     <td style={td} title={`Filled: ${o.filledshares} / Unfilled: ${o.unfilledshares}`}>
                      {o.quantity}
                    </td>
                     
                        <td style={td}>{o.fillprice}</td>

                          <td style={td}>{Number(o.fillprice)*Number(o.quantity)}</td>
                        
                        <td style={td}>{o.filltime}</td>
                         <td style={{ ...td, fontWeight: 600 }}>
                        {live}
                      </td>
                       <td style={{ ...td, fontWeight: 600 }}>
                        {Number(live)*Number(o.quantity)}
                      </td>

                       <td style={td}>
                      {live !== undefined
                        ? ((  live-Number(o.fillprice)) * Number(o.fillsize)).toFixed(2)
                        : "—"}
                    </td>

                       {/* <td style={td}>
                      {live !== undefined
                        ? ((  live-Number(o.fillprice)) * Number(1)).toFixed(2)
                        : "—"}
                    </td> */}

                      
                    <td style={td}>{o.transactiontype}</td>
                    <td style={td}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 12,
                          color: "white",
                          background: statusColor(o.status),
                          textTransform: "capitalize",
                        }}
                        title={o.orderstatus}
                      >
                        {o.status || o.orderstatus || "-"}
                      </span>
                    </td>
                     <td style={td}>{o.price}</td>

                        <td style={td}>{o.quantity}</td>
                   
                    <td style={td}>{o.ordertype}</td>
                    <td style={td}>{o.producttype}</td>
                   
                  
                   
                    <td style={{ ...td, maxWidth: 380 }}>
                      <span title={o.text} style={{ display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 360 }}>
                        {o.text || "—"}
                      </span>
                    </td>
                    {/* <td style={td}>{o.exchange}</td>
                    <td style={td}>{o.variety}</td> */}
                    <td style={td}>{o.variety}</td>
                     
                      
                      <td style={td}>{o.symboltoken}</td>
                    <td style={td}>{o.createdAt}</td>
                    <td style={td}>
                      <button
                        onClick={() => handleUpdateClick(o)}
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 12,
                          color: "white",
                          background: statusColor(o.status),
                          textTransform: "capitalize",
                        }}
                     
                      >
                        Update
                      </button>
                    </td>
                     <td style={td}>
                      <button
                        onClick={() => handleCancelClick(o)}
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 12,
                          color: "white",
                          background: statusColor(o.status),
                          textTransform: "capitalize",
                        }}
                     
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
              )})}
            </tbody>
          </table>
        </div>

        {/* Footer / pagination */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12 }}>
          <div style={{ fontSize: 13, color: "#475569" }}>
            Showing <strong>{current.length}</strong> of <strong>{filtered.length}</strong> filtered (
            {orders.length} total)
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={btn(page === 1)}
            >
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


 {/* ✅ Modal Form */}
      {showForm && selectedItem && (

<div
  style={{
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingTop: "80px"      // 👈 add this
  }}
  className="flex items-start justify-center z-[1000]"
>
  <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
    <h3 className="text-xl font-semibold mb-4 text-center">
      Update Order
    </h3>

    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ===== SECTION: Basic / IDs ===== */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          Basic Info
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">User ID</label>
            <input
              type="number"
              value={selectedItem.userId ?? ""}
              readOnly
              className="border p-2 w-full rounded bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Order ID</label>
            <input
              type="text"
              value={selectedItem.orderid ?? ""}
              readOnly
              className="border p-2 w-full rounded bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Unique Order ID</label>
            <input
              type="text"
              value={selectedItem.uniqueorderid ?? ""}
              readOnly
              className="border p-2 w-full rounded bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Parent Order ID</label>
            <input
              type="text"
              value={selectedItem.parentorderid ?? ""}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  parentorderid: e.target.value,
                })
              }
              className="border p-2 w-full rounded"
            />
          </div>
        </div>
      </div>

      {/* ===== SECTION: Instrument ===== */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          Instrument
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Symbol</label>
            <input
              type="text"
              value={selectedItem.tradingsymbol ?? ""}
              readOnly
              className="border p-2 w-full rounded bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Token</label>
            <input
              type="text"
              value={selectedItem.symboltoken ?? ""}
              readOnly
              className="border p-2 w-full rounded bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Exchange</label>
            <input
              type="text"
              value={selectedItem.exchange ?? ""}
              readOnly
              className="border p-2 w-full rounded bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Product Type</label>
            <input
              type="text"
              value={selectedItem.producttype ?? ""}
              readOnly
              className="border p-2 w-full rounded bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Instrument Type</label>
            <input
              type="text"
              value={selectedItem.instrumenttype ?? ""}
              readOnly
              className="border p-2 w-full rounded bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Option Type</label>
            <input
              type="text"
              value={selectedItem.optiontype ?? ""}
              readOnly
              className="border p-2 w-full rounded bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Strike Price</label>
            <input
              type="number"
              step="0.01"
              value={selectedItem.strikeprice ?? ""}
              readOnly
              className="border p-2 w-full rounded bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Expiry Date</label>
            <input
              type="text"
              value={selectedItem.expirydate ?? ""}
              readOnly
              className="border p-2 w-full rounded bg-gray-100"
            />
          </div>
        </div>
      </div>

      {/* ===== SECTION: Order Parameters ===== */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          Order Parameters
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Variety</label>
            <input
              type="text"
              value={selectedItem.variety ?? ""}
              onChange={(e) =>
                setSelectedItem({ ...selectedItem, variety: e.target.value })
              }
              className="border p-2 w-full rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Product Type</label>
            <input
              type="text"
              value={selectedItem.producttype ?? ""}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  producttype: e.target.value,
                })
              }
              className="border p-2 w-full rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Transaction Type</label>
            <select
              value={selectedItem.transactiontype ?? "BUY"}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  transactiontype: e.target.value,
                })
              }
              className="border p-2 w-full rounded"
            >
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Duration</label>
            <input
              type="text"
              value={selectedItem.duration ?? ""}
              onChange={(e) =>
                setSelectedItem({ ...selectedItem, duration: e.target.value })
              }
              className="border p-2 w-full rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Order Type</label>
            <select
              value={selectedItem.ordertype ?? "MARKET"}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  ordertype: e.target.value,
                  ...(e.target.value === "MARKET" ? { price: "" } : {}),
                })
              }
              className="border p-2 w-full rounded"
            >
              <option value="MARKET">MARKET</option>
              <option value="LIMIT">LIMIT</option>
              <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT</option>
              <option value="STOPLOSS_MARKET">STOPLOSS_MARKET</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Trigger Price</label>
            <input
              type="number"
              step="0.01"
              value={selectedItem.triggerprice ?? ""}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  triggerprice: e.target.value,
                })
              }
              className="border p-2 w-full rounded"
            />
          </div>
        </div>
      </div>

      {/* ===== SECTION: Quantity & Pricing ===== */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          Quantity & Pricing
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Quantity</label>
            <input
              type="number"
              min={1}
              value={selectedItem.quantity ?? ""}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  quantity: e.target.value,
                  totalPrice:
                    Number(e.target.value || 0) *
                    Number(selectedItem.price || 0),
                })
              }
              className="border p-2 w-full rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Actual Quantity</label>
            <input
              type="number"
              value={selectedItem.actualQuantity ?? ""}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  actualQuantity: e.target.value,
                })
              }
              className="border p-2 w-full rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Price{" "}
              {selectedItem.ordertype === "MARKET" ? "(auto / LTP)" : ""}
            </label>
            <input
              type="number"
              step="0.01"
              value={selectedItem.price ?? ""}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  price: e.target.value,
                  totalPrice:
                    Number(selectedItem.quantity || 0) *
                    Number(e.target.value || 0),
                })
              }
              readOnly={selectedItem.ordertype === "MARKET"}
              className={`border p-2 w-full rounded ${
                selectedItem.ordertype === "MARKET"
                  ? "bg-gray-100 cursor-not-allowed"
                  : "bg-white"
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Total Price</label>
            <input
              type="text"
              value={
                selectedItem.totalPrice != null
                  ? Number(selectedItem.totalPrice).toFixed(2)
                  : ""
              }
              readOnly
              className="border p-2 w-full rounded bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Disclosed Quantity</label>
            <input
              type="number"
              value={selectedItem.disclosedquantity ?? ""}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  disclosedquantity: e.target.value,
                })
              }
              className="border p-2 w-full rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Lot Size</label>
            <input
              type="number"
              value={selectedItem.lotsize ?? ""}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  lotsize: e.target.value,
                })
              }
              className="border p-2 w-full rounded"
            />
          </div>
        </div>
      </div>

      {/* ===== SECTION: Risk / SL / Square-off ===== */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          Risk Management
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium">Square-off</label>
            <input
              type="number"
              step="0.01"
              value={selectedItem.squareoff ?? ""}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  squareoff: e.target.value,
                })
              }
              className="border p-2 w-full rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Stop Loss</label>
            <input
              type="number"
              step="0.01"
              value={selectedItem.stoploss ?? ""}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  stoploss: e.target.value,
                })
              }
              className="border p-2 w-full rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Trailing Stop Loss
            </label>
            <input
              type="number"
              step="0.01"
              value={selectedItem.trailingstoploss ?? ""}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  trailingstoploss: e.target.value,
                })
              }
              className="border p-2 w-full rounded"
            />
          </div>
        </div>
      </div>

      {/* ===== SECTION: Status & Time ===== */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          Status & Time
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Status</label>
            <input
              type="text"
              value={selectedItem.status ?? ""}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  status: e.target.value,
                })
              }
              className="border p-2 w-full rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Order Status</label>
            <input
              type="text"
              value={selectedItem.orderstatus ?? ""}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  orderstatus: e.target.value,
                })
              }
              className="border p-2 w-full rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Update Time</label>
            <input
              type="text"
              value={selectedItem.updatetime ?? ""}
              readOnly
              className="border p-2 w-full rounded bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Exchange Time</label>
            <input
              type="text"
              value={selectedItem.exchtime ?? ""}
              readOnly
              className="border p-2 w-full rounded bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Exch. Order Update Time
            </label>
            <input
              type="text"
              value={selectedItem.exchorderupdatetime ?? ""}
              readOnly
              className="border p-2 w-full rounded bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Cancel Size</label>
            <input
              type="number"
              value={selectedItem.cancelsize ?? ""}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  cancelsize: e.target.value,
                })
              }
              className="border p-2 w-full rounded"
            />
          </div>
        </div>
      </div>

      {/* ===== SECTION: Trade Fill Info ===== */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          Trade / Fill Info
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Traded Value</label>
            <input
              type="number"
              step="0.01"
              value={selectedItem.tradedValue ?? ""}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  tradedValue: e.target.value,
                })
              }
              className="border p-2 w-full rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Fill Price</label>
            <input
              type="number"
              step="0.01"
              value={selectedItem.fillprice ?? ""}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  fillprice: e.target.value,
                })
              }
              className="border p-2 w-full rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Fill Size</label>
            <input
              type="number"
              value={selectedItem.fillsize ?? ""}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  fillsize: e.target.value,
                })
              }
              className="border p-2 w-full rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Fill ID</label>
            <input
              type="text"
              value={selectedItem.fillid ?? ""}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  fillid: e.target.value,
                })
              }
              className="border p-2 w-full rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Fill Time</label>
            <input
              type="text"
              value={selectedItem.filltime ?? ""}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  filltime: e.target.value,
                })
              }
              className="border p-2 w-full rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Average Price</label>
            <input
              type="number"
              step="0.01"
              value={selectedItem.averageprice ?? ""}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  averageprice: e.target.value,
                })
              }
              className="border p-2 w-full rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Filled Shares</label>
            <input
              type="number"
              value={selectedItem.filledshares ?? ""}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  filledshares: e.target.value,
                })
              }
              className="border p-2 w-full rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Unfilled Shares</label>
            <input
              type="number"
              value={selectedItem.unfilledshares ?? ""}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  unfilledshares: e.target.value,
                })
              }
              className="border p-2 w-full rounded"
            />
          </div>
        </div>
      </div>

      {/* ===== SECTION: Meta / Tag / Remarks ===== */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          Meta / Remarks
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium">Order Tag</label>
            <input
              type="text"
              value={selectedItem.ordertag ?? ""}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  ordertag: e.target.value,
                })
              }
              className="border p-2 w-full rounded"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium">Text / Remarks</label>
            <textarea
              value={selectedItem.text ?? ""}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  text: e.target.value,
                })
              }
              rows={3}
              className="border p-2 w-full rounded"
            />
          </div>

           <div className="col-span-2">
          <label className="block text-sm font-medium"> Sync Order Changes with Angel One</label>
          <select
            value={selectedItem.flag ?? ""} 
            onChange={(e) =>
              setSelectedItem({
                ...selectedItem,
                flag: e.target.value === "true" ? true : false, // convert string → boolean
              })
            }
            className="border p-2 w-full rounded bg-white"
          >
            <option value="">Select Flag</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        </div>


        </div>
      </div>

      {/* ===== Actions ===== */}
      <div className="flex justify-between pt-4 border-t">
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg"
        >
          Submit Order
        </button>
      </div>
    </form>
  </div>
</div>


      )}

  {showFormUpdate && selectedItem && (
     <div
  style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)" }}
  className="flex items-center justify-center z-[1000]"
>
  <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
    <h3 className="text-lg font-semibold mb-4 text-center">Sell Order</h3>

    <form onSubmit={handleSubmitUpdate} className="space-y-4">
      {/* Row 1: Order Id + Symbol */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Order Id</label>
          <input
            type="text"
            value={selectedItem.orderid}
            readOnly
            className="border p-2 w-full rounded bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Symbol</label>
          <input
            type="text"
            value={selectedItem.tradingsymbol}
            readOnly
            className="border p-2 w-full rounded bg-gray-100"
          />
        </div>
      </div>


       <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Token</label>
          <input
            type="text"
            value={selectedItem.symboltoken}
            readOnly
            className="border p-2 w-full rounded bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Variety</label>
          <input
            type="text"
            value={selectedItem.variety}
            readOnly
            className="border p-2 w-full rounded bg-gray-100"
          />
        </div>
      </div>

       <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Exchange</label>
          <input
            type="text"
            value={selectedItem.exchange}
            readOnly
            className="border p-2 w-full rounded bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Product Type</label>
          <input
            type="text"
            value={selectedItem.producttype}
            readOnly
            className="border p-2 w-full rounded bg-gray-100"
          />
        </div>
      </div>

      
{/* Row 3: Order Type (full width) */}
        <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium">Order Type</label>
        <select
          value={selectedItem.ordertype}
          onChange={(e) =>
            setSelectedItem({
              ...selectedItem,
              ordertype: e.target.value,
              ...(e.target.value === "MARKET" ? { price: "" } : {}),
            })
          }
          className="border p-2 w-full rounded bg-gray-100"
        >
          <option value="MARKET">MARKET</option>
          <option value="LIMIT">LIMIT</option>
          <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT</option>
          <option value="STOPLOSS_MARKET">STOPLOSS_MARKET</option>
        </select>
      </div>

       <div>
                <label className="block text-sm font-medium">Require Fund</label>
                <input
                  type="text"
                  value={Number(selectedItem.totalPrice).toFixed(2)}
                  className="border p-2 w-full rounded bg-gray-100"
                />
              </div>

      </div>

    
      {/* Row 2: Quantity + Price */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Quantity</label>
          <input
            type="number"
            min={1}
            value={selectedItem.quantity}
            onChange={(e) =>
              setSelectedItem({ 
                ...selectedItem,
                 quantity: e.target.value,
                 totalPrice : (Number(e.target.value)) * Number(getPrice)
                 })
            }
            className="border p-2 w-full rounded bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">
            Price
          </label>
          <input
            type="number"
            step="0.01"
            value={Number(selectedItem.price).toFixed(2)}
             className="border p-2 w-full rounded bg-gray-100"
            
          />
        </div>
      </div>

      

      {/* Actions */}
      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={() => setShowFormUpdate(false)}
          className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg"
        >
          Submit Order
        </button>
      </div>
    </form>
  </div>
</div>
 )}

    </div>
  );
}

const td: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 14,
  color: "#0f172a",
  whiteSpace: "nowrap",
  verticalAlign: "top",
};

const btn = (disabled: boolean): React.CSSProperties => ({
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  background: disabled ? "#f1f5f9" : "white",
  color: disabled ? "#94a3b8" : "#0f172a",
  cursor: disabled ? "not-allowed" : "pointer",
});
