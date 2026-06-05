import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import * as XLSX from 'xlsx';
import { toast } from "react-toastify";
// --- AG Grid v31+ (modular) ------------------------------
import { ModuleRegistry } from "ag-grid-community";
import { AllCommunityModule } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]); // ✅ REQUIRED



import { AgGridReact } from "ag-grid-react";
import type {
  ColDef,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { useInstrumentStore } from "../../instrumentStore";
// ----------------------------------------------------------




export default function InstrumentForm() {

  const apiUrl = import.meta.env.VITE_API_URL;

  const { dataRedish, setDataRedish, shouldFetchRedish } = useInstrumentStore();

  // const [fundData, setFundData] = useState<number>(0);

  const [data, setData] = useState<any[]>([]);
    const [dataexcel, setDataExcel] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

   const [getPrice, setOnlyPrice] = useState("");
      const [getslotSIze, setSlotSIze] = useState("");

  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [duration, setDuration] = useState("DAY");
  const [orderType, setOrderType] = useState("MARKET");
  const [variety, setVariety] = useState("NORMAL");

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");

  const gridApiRef = useRef<GridApi | null>(null);



//     function formatOptionSymbol(symbol:any) {

//     symbol = String(symbol).toUpperCase().trim();

//     // Regex patterns
//     const optionPattern = /^(NIFTY|BANKNIFTY)(\d{2})([A-Z]{3})(\d{2})(\d+)(CE|PE)$/;
//     const futurePattern = /^(NIFTY|BANKNIFTY)(\d{2})([A-Z]{3})(\d{2})FUT$/;

//     // 👉 Option format: NIFTY30DEC2530000PE
//     const opt = symbol.match(optionPattern);
//     if (opt) {
//       const [, underlying, day, month, year, strike, optionType] = opt;
//       const expiry = `${day}${month}${year}`;
//       return `${underlying} ${expiry} ${Number(strike)} ${optionType}`;
//     }

//     // 👉 Future format: NIFTY25NOV25FUT
//     const fut = symbol.match(futurePattern);
//     if (fut) {
//       const [, underlying, day, month, year] = fut;
//       const expiry = `${day}${month}${year}`;
//       return `${underlying} ${expiry} FUT`;
//     }

//   // 👉 Fallback (like NIFTY, Nifty 50, etc.)
//   return symbol;
// }



  // debounce search
  
  
  useEffect(() => {




    const t = setTimeout(() => setDebouncedTerm(searchTerm.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // filter client-side (you can rely on quickFilter only if you prefer)
  const filteredData = useMemo(() => {
    if (!debouncedTerm || debouncedTerm.length < 3) return data;
    const q = debouncedTerm;
    return data.filter((item) => {
      const symbol = String(item.symbol ?? "").toLowerCase();
      if (!symbol) return false;
      if (symbol.includes(q)) return true;
      return symbol.split(/\s+/g).some((w) => w.startsWith(q) || w.includes(q));
    });
  }, [data, debouncedTerm]);

  // fetch data
  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {


      if (!dataRedish || shouldFetchRedish()) {

        console.log('============backend api hit==========');
        

           const res = await axios.get(`${apiUrl}/order/mongodb/instrument`,  {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                "AngelOneToken": localStorage.getItem("angel_token") || "",
            },
          });

           console.log(res?.data,'heello');

       if(res?.data?.status==true) {

      let allData = res?.data?.data || [];

   
      

            setDataExcel(allData)
            setData(allData);
            setDataRedish(allData);

       }else{

         toast.error(res?.data?.message || "Something went wrong");

       }

      }
   

 
    } catch (err: any) {

       toast.error(err?.message || "Something went wrong");
      
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Buy
  const handleBuyClick = async (item: any) => {

    const payload = {
      exchange: item.exch_seg,
      tradingsymbol: item.symbol,
      symboltoken: item.token,
    };    
     try{
          const res = await axios.post(`${apiUrl}/order/get/ltp`, payload, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                "AngelOneToken": localStorage.getItem("angel_token") || "",
            },
          });

           if(res?.data?.status==true) {

             item.price = res?.data?.data.data.ltp
             item.transactiontype = 'BUY'
             item.totalPrice = item.price*item.lotsize
             setOnlyPrice(res?.data?.data.data.ltp)
             setSlotSIze(item.lotsize)
             setSelectedItem({ ...item });
             setShowForm(true);

           }else{

             toast.error(res?.data?.message || "Something went wrong");
           }
     }catch(err:any) {

       toast.error(err.message || "Something went wrong");
     }
    
  };

  // Sell (placeholder)
  const handleSellClick = async(item: any) => {

      const payload = {
      exchange: item.exch_seg,
      tradingsymbol: item.symbol,
      symboltoken: item.token,
    };
     try{
          const res = await axios.post(`${apiUrl}/order/get/ltp`, payload, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                "AngelOneToken": localStorage.getItem("angel_token") || "",
            },
          });

           if(res?.data?.status==true) {

             item.price = res?.data?.data.data.ltp
             item.transactiontype = 'SELL'
            item.totalPrice = item.price*item.lotsize
             setSelectedItem({ ...item });
             setOnlyPrice(res?.data?.data.data.ltp)
             setSlotSIze(item.lotsize)
             setShowForm(true);

           }else{

            toast.error(res?.data?.message || "Something went wrong");
           }
     }catch(err:any) {

      toast.error(err.message || "Something went wrong");
     }
  };

  // AG Grid columns
  const columnDefs = useMemo<ColDef[]>(
    () => [
      { headerName: "Token", field: "token", minWidth: 60,  },
       { headerName: "Symbol Num", field: "SyNum", minWidth: 20,  },
         { headerName: "Type", field: "syType", minWidth: 20,  },
      { headerName: "Symbol", field: "symbol", minWidth: 250, filter: "agTextColumnFilter" },
  // { headerName: "Formate", field: "formattedName", minWidth: 100, },
      { headerName: "Name", field: "name", minWidth: 80, },
      // { headerName: "Exchange", field: "exch_seg", width: 140 },
       { headerName: "Lot-Size", field: "lotsize", width: 110 },
      {
        headerName: "Buy",
        field: "buy",
        width: 100,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams) => (
          <button
            onClick={() => handleBuyClick(params.data)}
            className="bg-green-500 hover:bg-green-600 text-white font-medium px-3 py-1 rounded-lg shadow-sm transition"
          >
            Buy
          </button>
        ),
      },
      {
        headerName: "Sell",
        field: "sell",
        width: 100,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams) => (
          <button
            onClick={() => handleSellClick(params.data)}
            className="bg-red-500 hover:bg-red-600 text-white font-medium px-3 py-1 rounded-lg shadow-sm transition"
          >
            Sell
          </button>
        ),
      },
    ],
    []
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

  // sync quick filter with debouncedTerm
  useEffect(() => {
    if (!gridApiRef.current) return;
    const quick = debouncedTerm && debouncedTerm.length >= 3 ? debouncedTerm : "";
    gridApiRef.current.setGridOption("quickFilterText", quick);
  }, [debouncedTerm]);

  // submit order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedItem) return;

    const formData = {
      token: selectedItem.token,
      symbol: selectedItem.symbol,
      name: selectedItem.name,
      exch_seg: selectedItem.exch_seg,
      price: selectedItem.price,
      quantity: selectedItem.lotsize,
      transactiontype:selectedItem.transactiontype,
      duration,
      orderType,
      variety,
      productType:selectedItem.productType,
      totalPrice:selectedItem.totalPrice,
      actualQuantity: Number(selectedItem.totalPrice) / Number(selectedItem.price)
      
    };

    //     // 1️⃣ First API: user fund
    //     const res = await axios.get(
    //       `${apiUrl}/users/get/user/fund`,
    //       {
    //         headers: {
    //           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    //           "AngelOneToken": localStorage.getItem("angel_token") || "",
    //         },
    //       }
    //     );

       
    //    let fundData = res?.data?.data
    //    setFundData(fundData?.availablecash||0);


    //   //  if(fundData>selectedItem.price) {

      try{
      const res = await axios.post(
      `${apiUrl}/order/place/order`,
      formData,
      {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
              "AngelOneToken": localStorage.getItem("angel_token") || "",
            },
          }
    );



    

    if(res?.data?.status==true) {

      alert(res?.data?.message)
      setShowForm(false);
      setVariety("");
      setDuration("");
      setOrderType("");
   
   
    }else{

      toast.error(res?.data?.message || "Something went wrong");
         
    }
  
    }catch(err:any) {

       toast.error(err.message || "Something went wrong");
    }

      //  }else{
      // toast.error("Fund is not available");
      //  }
  };
  

  // Function to handle Excel download
  const handleExcelDownload = () => {

    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataexcel);
    // Create a workbook
    const workbook = XLSX.utils.book_new();
    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    // Generate an Excel file
    XLSX.writeFile(workbook, "instrument.xlsx");
  };


   const handleKeyUp = async (e: React.KeyboardEvent<HTMLInputElement>) => {

    const value = e.currentTarget.value;

     if(value.length>=3) {
        
        try {

          const res = await axios.get(`${apiUrl}/order/mongodb/instrument/search/${value}`,  {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                    "AngelOneToken": localStorage.getItem("angel_token") || "",
                },
              });

           console.log(res?.data,'heello');

            if(res?.data?.status==true) {

            let allData = res?.data?.data || [];

            setDataExcel(allData)

            setData(allData);

       }else{

         toast.error(res?.data?.message || "Something went wrong");

       }

 
    } catch (err: any) {

       toast.error(err?.message || "Something went wrong");
      
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }

     }else if(value.length>=0){
       await fetchData();
         
     }else{
       toast.error("Press More Then 2 Keys"); 
     }

     
   
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Nifty Bank Instruments</h2>

      {/* Search box */}
      {/* <div className="flex justify-end mb-4">
        <div className="w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search symbol (min 3 chars)"
            className="border p-2 w-full rounded"
          />
        </div>

        

        <div>
          excel download
        </div>

       
      </div> */}


      <div className="flex justify-end mb-4 gap-4">
  <div className="w-full sm:w-80">
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
       onKeyUp={handleKeyUp}         
      placeholder="Search symbol (min 3 chars)"
      className="border p-2 w-full rounded"
    />
  </div>
  <div>
    <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"    onClick={handleExcelDownload}>
      Excel Download
    </button>
  </div>
</div>

      {loading && <p>Loading data...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && data.length === 0 && (
        <p>No data found for "Nifty Bank"</p>
      )}

      {/* AG Grid table */}
      {data.length > 0 && (
        <div className="ag-theme-quartz" style={{ height: 540, width: "100%" }}>
          <AgGridReact
            rowData={filteredData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            animateRows
            rowSelection="single"
            pagination
            paginationPageSize={10000}
            onGridReady={onGridReady}
            suppressFieldDotNotation
          />
        </div>
      )}

      {/* Modal Form */}
      {showForm && selectedItem && (
        <div className="fixed inset-0 bg-backdrop-md bg-opacity-50 flex items-center justify-center z-9999">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <h3 className="text-lg font-semibold mb-4 text-center">
              Buy Order — {selectedItem.name}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-medium">Token</label>
                <input
                  type="text"
                  value={selectedItem.token}
                  readOnly
                  className="border p-2 w-full rounded bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Exchange</label>
                <input
                  type="text"
                  value={selectedItem.exch_seg}
                  readOnly
                  className="border p-2 w-full rounded bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Symbol</label>
                <input
                  type="text"
                  value={selectedItem.symbol}
                  readOnly
                  className="border p-2 w-full rounded bg-gray-100"
                />
              </div>

               <div>
                <label className="block text-sm font-medium">Total Price</label>
                <input
                  type="text"
                  value={Number(selectedItem.totalPrice).toFixed(2)}
                  className="border p-2 w-full rounded bg-gray-100"
                />
              </div>

             

              <div>
                <label className="block text-sm font-medium">Quantity</label>
                <input
                  type="text"
                  value={selectedItem.lotsize}
                  onChange={(e) =>
                  setSelectedItem({ 
                   ...selectedItem, // keep existing fields (token, name, etc.)
                   lotsize: e.target.value,
                   price: (Number(e.target.value) / Number(getslotSIze)) * Number(getPrice),
                   totalPrice : (Number(e.target.value)) * Number(getPrice)
                   })
                }
                  className="border p-2 w-full rounded bg-gray-100"
                />
              </div>

               <div>
                <label className="block text-sm font-medium">Price</label>
                <input
                  type="text"
                  value={Number(selectedItem.price).toFixed(2)}
                  className="border p-2 w-full rounded bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Order Type</label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  required
                  className="border p-2 w-full rounded bg-gray-50 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Order Type</option>
                  <option value="MARKET">MARKET</option>
                  <option value="LIMIT">LIMIT</option>
                  <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT</option>
                  <option value="STOPLOSS_MARKET">STOPLOSS_MARKET</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                  className="border p-2 w-full rounded bg-gray-50 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Duration</option>
                  <option value="DAY">DAY</option>
                  <option value="IOC">IOC</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Variety</label>
                <select
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  required
                  className="border p-2 w-full rounded bg-gray-50 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Variety</option>
                  <option value="NORMAL">NORMAL</option>
                  <option value="STOPLOSS">STOPLOSS</option>
                  <option value="ROBO">ROBO</option>
                </select>
              </div>

               {/* Radio Buttons Section */}
  <div className="mt-3">
    <label className="block text-sm font-medium mb-1">Product Type</label>
    <div className="flex items-center gap-4">
      <label className="flex items-center gap-2">
        <input
          type="radio"
          name="productType"
          value="MIS"
          checked={selectedItem.productType === "MIS"}
          onChange={(e) =>
            setSelectedItem({ ...selectedItem, productType: e.target.value })
          }
        />
        <span>IntraDay MIS</span>
      </label>

      <label className="flex items-center gap-2">
        <input
          type="radio"
          name="productType"
          value="CNC"
          checked={selectedItem.productType === "CNC"}
          onChange={(e) =>
            setSelectedItem({ ...selectedItem, productType: e.target.value })
          }
        />
        <span>Longterm CNC</span>
      </label>
    </div>
  </div>

  


              
              </div>
              <div className="flex justify-end mt-6 gap-4">
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
    </div>
  );
}



