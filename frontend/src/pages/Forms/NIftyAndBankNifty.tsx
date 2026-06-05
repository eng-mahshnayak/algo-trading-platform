// import { useState } from "react";
// import axios from "axios";

// export default function InstrumentForm() {
//   const [search, setSearch] = useState(""); // input value
//   const [results, setResults] = useState<any[]>([]); // dropdown data
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   // ✅ Function to call POST API
//   const handleSearch = async (query: string) => {
//     setLoading(true);
//     setError("");
//     try {
//       const res = await axios.post("http://localhost:5000/api/users/get-instrument", {
//         search: query
//       });

//       console.log(res.data);
      
//       setResults(res.data.data); // backend returns filtered data
//     } catch (err: any) {
//       setError(err.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ Handle input change
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value;
//     setSearch(value);
//     if (value.trim() !== "") {
//       handleSearch(value);
//     } else {
//       setResults([]);
//     }
//   };

//   return (
//     <div className="p-4 max-w-lg mx-auto">
//       <h2 className="font-semibold mb-2">Search Instrument</h2>
//       <input
//         type="text"
//         value={search}
//         onChange={handleChange}
//         placeholder="Type symbol..."
//         className="border p-2 rounded w-full mb-2"
//       />

//       {loading && <p>Loading...</p>}
//       {error && <p style={{ color: "red" }}>{error}</p>}

//       {/* Dropdown results */}
//       {results.length > 0 && (
//         <ul className="border rounded bg-white shadow max-h-64 overflow-y-auto">
//           {results.map((item) => (
//             <li
//               key={item.token}
//               className="p-2 hover:bg-blue-100 cursor-pointer"
//               onClick={() => {
//                 setSearch(item.symbol); // set input to selected value
//                 setResults([]); // hide dropdown
//               }}
//             >
//               {item.symbol} — {item.name} ({item.token})
//             </li>
//           ))}
//         </ul>
        
//       )}
//     </div>
//   );
// }






// import { useState, useEffect } from "react";
// import axios from "axios";

// export default function InstrumentForm() {
//   const [data, setData] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   // ✅ Fetch API Data (GET request)
//   const fetchData = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const res = await axios.get("http://localhost:5000/api/users/get-instrument"); 

//       const allData = await res.data.data || [];

//       console.log(allData);

//       // ✅ Filter only "Nifty Bank" (case-insensitive match)
//       const filtered = allData.filter((item: any) =>
//         item.name?.includes("NIFTY")
//       );

//       setData(filtered);
//     } catch (err: any) {
//       setError(err.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ Fetch data once when page loads
//   useEffect(() => {
//     fetchData();
//   }, []);

//   return (
//     <div className="p-6 max-w-3xl mx-auto">
//       <h2 className="text-xl font-semibold mb-4">Nifty Bank Instruments</h2>

//       {loading && <p>Loading data...</p>}
//       {error && <p className="text-red-500">{error}</p>}

//       {!loading && !error && data.length === 0 && (
//         <p>No data found for "Nifty Bank"</p>
//       )}

//       {data.length > 0 && (
//         <table className="w-full border border-gray-300 rounded-lg">
//           <thead className="bg-gray-200">
//             <tr>
//               <th className="p-2 border">Token</th>
//               <th className="p-2 border">Symbol</th>
//               <th className="p-2 border">Name</th>
//               <th className="p-2 border">Exchange</th>
//                <th className="p-2 border">BUYE</th>
//                 <th className="p-2 border">SALE</th>
//             </tr>
//           </thead>
//           <tbody>
//             {data.map((item) => (
//               <tr key={item.token} className="hover:bg-blue-50">
//                 <td className="p-2 border">{item.token}</td>
//                 <td className="p-2 border">{item.symbol}</td>
//                 <td className="p-2 border">{item.name}</td>
//                 <td className="p-2 border">{item.exch_seg}</td>
//                 <td className="p-2 border text-center">
//                 <button className="bg-green-500 hover:bg-green-600 text-white font-medium px-3 py-1 rounded-lg shadow-sm transition">
//                     Buy This Item
//                 </button>
//                 </td>
//                 <td className="p-2 border text-center">
//                 <button className="bg-red-500 hover:bg-red-600 text-white font-medium px-3 py-1 rounded-lg shadow-sm transition">
//                     Sell This Item
//                 </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}
//     </div>
//   );
// }





// table code only  

// import { useState, useEffect } from "react";
// import axios from "axios";

// export default function InstrumentForm() {
//   const [data, setData] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [selectedItem, setSelectedItem] = useState<any | null>(null); // ✅ store clicked item
//   const [showForm, setShowForm] = useState(false); // ✅ control modal visibility
//   const [duration, setDuration] = useState("");
//   const [orderType, setOrderType] = useState("");
//     const [variety, setVariety] = useState("");

//   // ✅ Fetch API Data (GET request)
//   const fetchData = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const res = await axios.get("http://localhost:5000/api/order/get/instrument");

//       const allData = res.data.data || [];

//       // ✅ Filter only "Nifty Bank" data
//     //   const filtered = allData.filter((item: any) =>{
//     //     console.log(item);
//     //     item.name?.includes("NIFTY")
//     //   });

//     // const filtered = allData.filter((item: any) => {
//     // if (!item.name) return false; // guard if name is undefined

//     // const index = item.name.indexOf("NIFTY"); // find position of "NIFTY"

//     // // keep only if "NIFTY" is found after 5th character (index >= 5)
//     // return index >= 5;
//     // });




  
//      console.log(allData);
     


    

//       setData(allData);
//     } catch (err: any) {
//       setError(err.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   // ✅ Handle Buy Button Click
//   const handleBuyClick = async(item: any) => {

//     let obj = {
//         exchange:item.exch_seg,
//         tradingsymbol:item.symbol,
//         symboltoken:item.token
//     }

//     let res = await axios.post('http://localhost:5000/api/order/get/ltp',obj)

//     console.log(res.data.data,'ltp price');
    
  
//     item.price = res.data.data.ltp
    

//     setSelectedItem(item);
//     setShowForm(true);
//   };

//   // ✅ Handle Form Submit
//   const handleSubmit = async(e: React.FormEvent) => {
//     e.preventDefault();

//     const formData = {
//       token: selectedItem.token,
//       symbol: selectedItem.symbol,
//       name: selectedItem.name,
//       exch_seg: selectedItem.exch_seg,
//       price:selectedItem.price,
//       quantity:selectedItem.lotsize,
//       duration:duration,
//       orderType:orderType,
//       variety:variety,
//     };

//     console.log("🧾 Form Submitted:", formData);

//     // Example: You can call your POST API here
//    let res = await axios.post("http://localhost:5000/api/order/place/order", formData)

//    console.log(res);
   

//     alert(`Buy order placed for ${selectedItem.name}`);
//     setShowForm(false);
//     setVariety("")
//     setDuration("");
//     setOrderType("");
//   };

//   return (
//     <div className="p-6 max-w-5xl mx-auto">
//       <h2 className="text-xl font-semibold mb-4">Nifty Bank Instruments</h2>

//       {loading && <p>Loading data...</p>}
//       {error && <p className="text-red-500">{error}</p>}

//       {!loading && !error && data.length === 0 && (
//         <p>No data found for "Nifty Bank"</p>
//       )}

//       {data.length > 0 && (
//         <table className="w-full border border-gray-300 rounded-lg">
//           <thead className="bg-gray-200">
//             <tr>
//               <th className="p-2 border">Token</th>
//               <th className="p-2 border">Symbol</th>
//               <th className="p-2 border">Name</th>
//               <th className="p-2 border">Exchange</th>
//               <th className="p-2 border">Buy</th>
//               <th className="p-2 border">Sell</th>
//             </tr>
//           </thead>
//           <tbody>
//             {data.map((item) => (
//               <tr key={item.token} className="hover:bg-blue-50">
//                 <td className="p-2 border">{item.token}</td>
//                 <td className="p-2 border">{item.symbol}</td>
//                 <td className="p-2 border">{item.name}</td>
//                 <td className="p-2 border">{item.exch_seg}</td>
//                 <td className="p-2 border text-center">
//                   <button
//                     onClick={() => handleBuyClick(item)}
//                     className="bg-green-500 hover:bg-green-600 text-white font-medium px-3 py-1 rounded-lg shadow-sm transition"
//                   >
//                     Buy This Item
//                   </button>
//                 </td>
//                 <td className="p-2 border text-center">
//                   <button className="bg-red-500 hover:bg-red-600 text-white font-medium px-3 py-1 rounded-lg shadow-sm transition">
//                     Sell This Item
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}

//       {/* ✅ Modal Form */}
//       {showForm && selectedItem && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
//           <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
//             <h3 className="text-lg font-semibold mb-4 text-center">
//               Buy Order — {selectedItem.name}
//             </h3>

//             <form onSubmit={handleSubmit} className="space-y-4">
//                  <div>
//                 <label className="block text-sm font-medium">Token</label>
//                 <input
//                   type="text"
//                   value={selectedItem.token}
//                   readOnly
//                   className="border p-2 w-full rounded bg-gray-100"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium">Exchange</label>
//                 <input
//                   type="text"
//                   value={selectedItem.exch_seg}
//                   readOnly
//                   className="border p-2 w-full rounded bg-gray-100"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium">Symbol</label>
//                 <input
//                   type="text"
//                   value={selectedItem.symbol}
//                   readOnly
//                   className="border p-2 w-full rounded bg-gray-100"
//                 />
//               </div>

//                <div>
//                 <label className="block text-sm font-medium">Price</label>
//                 <input
//                   type="text"
//                   value={selectedItem.price}
//                   readOnly
//                   className="border p-2 w-full rounded bg-gray-100"
//                 />
//               </div>

//               {/* <div>
//                 <label className="block text-sm font-medium">Price</label>
//                 <input
//                   type="number"
//                   value={price}
//                   onChange={(e) => setPrice(e.target.value)}
//                   placeholder="Enter price"
//                   required
//                   className="border p-2 w-full rounded"
//                 />
//               </div> */}

//               {/* <div>
//                 <label className="block text-sm font-medium">Quantity</label>
//                 <input
//                   type="number"
//                   value={quantity}
//                   onChange={(e) => setQuantity(e.target.value)}
//                   placeholder="Enter quantity"
//                   required
//                   className="border p-2 w-full rounded"
//                 />
//               </div> */}

//                <div>
//                 <label className="block text-sm font-medium">Quantity</label>
//                 <input
//                   type="text"
//                   value={selectedItem.lotsize}
//                   readOnly
//                   className="border p-2 w-full rounded bg-gray-100"
//                 />
//               </div>

//               {/* ✅ Added Order Type Dropdown */}
//       <div>
//         <label className="block text-sm font-medium">Order Type</label>
//         <select
//           value={orderType}
//           onChange={(e) => setOrderType(e.target.value)}
//           required
//           className="border p-2 w-full rounded bg-gray-50 focus:ring-2 focus:ring-blue-500"
//         >
//           <option value="">Select Order Type</option>
//           <option value="MARKET">MARKET</option>
//           <option value="LIMIT">LIMIT</option>
//           <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT</option>
//           <option value="STOPLOSS_MARKET">STOPLOSS_MARKET</option>
//         </select>
//       </div>

//        <div>
//         <label className="block text-sm font-medium">Duration</label>
//         <select
//           value={duration}
//           onChange={(e) => setDuration(e.target.value)}
//           required
//           className="border p-2 w-full rounded bg-gray-50 focus:ring-2 focus:ring-blue-500"
//         >
//           <option value="">Select Duration </option>
//           <option value="DAY">DAY</option>
//           <option value="IOC">IOC</option>
//         </select>
//       </div>


//  <div>
//         <label className="block text-sm font-medium">Variety</label>
//         <select
//           value={variety}
//           onChange={(e) => setVariety(e.target.value)}
//           required
//           className="border p-2 w-full rounded bg-gray-50 focus:ring-2 focus:ring-blue-500"
//         >
//           <option value="">Select Duration </option>
//            <option value="NORMAL">NORMAL</option>
//           <option value="STOPLOSS">STOPLOSS</option>
//           <option value="ROBO">ROBO</option>
//         </select>
//       </div>



             

//               <div className="flex justify-between mt-6">
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





// import { useState, useEffect,useMemo } from "react";
// import axios from "axios";

// export default function InstrumentForm() {
//   const [data, setData] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [selectedItem, setSelectedItem] = useState<any | null>(null); // ✅ store clicked item
//   const [showForm, setShowForm] = useState(false); // ✅ control modal visibility
//   const [duration, setDuration] = useState("");
//   const [orderType, setOrderType] = useState("");
//     const [variety, setVariety] = useState("");

//     const [searchTerm, setSearchTerm] = useState("");
//     const [debouncedTerm, setDebouncedTerm] = useState("");


//     useEffect(() => {
//   const t = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300);
//   return () => clearTimeout(t);
// }, [searchTerm]);

// // const filteredData = useMemo(() => {
// //   if (!debouncedTerm || debouncedTerm.length < 3) return data;
// //   const q = debouncedTerm.toLowerCase();
// //   return data.filter((item) => {
// //     const token = String(item.token ?? "").toLowerCase();
// //     const symbol = String(item.symbol ?? "").toLowerCase();
// //     const name = String(item.name ?? "").toLowerCase();
// //     const exch = String(item.exch_seg ?? "").toLowerCase();
// //     return (
// //       token.includes(q) ||
// //       symbol.includes(q) ||
// //       name.includes(q) ||
// //       exch.includes(q)
// //     );
// //   });
// // }, [data, debouncedTerm]);

//  const filteredData = useMemo(() => {
//     if (!debouncedTerm || debouncedTerm.length < 3) return data;
//     const q = debouncedTerm;

//     return data.filter((item) => {
//       const token = String(item.token ?? "").toLowerCase();
//       const symbol = String(item.symbol ?? "").toLowerCase();
//       const name = String(item.name ?? "").toLowerCase();
//       const exch = String(item.exch_seg ?? "").toLowerCase();

//       // check: whole-field contains OR any word starts-with / includes the query
//     //   const fields = [token, symbol, name, exch];

//     const fields = [symbol];

//       return fields.some((field) => {
//         if (!field) return false;
//         if (field.includes(q)) return true;
//         const words = field.split(/\s+/g);
//         return words.some((w) => w.startsWith(q) || w.includes(q));
//       });
//     });
//   }, [data, debouncedTerm]);

//   // ✅ Fetch API Data (GET request)
//   const fetchData = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const res = await axios.get("http://localhost:5000/api/order/get/instrument");

//       const allData = res.data.data || [];



//       setData(allData);
//     } catch (err: any) {
//       setError(err.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   // ✅ Handle Buy Button Click
//   const handleBuyClick = async(item: any) => {

//     let obj = {
//         exchange:item.exch_seg,
//         tradingsymbol:item.symbol,
//         symboltoken:item.token
//     }

//     let res = await axios.post('http://localhost:5000/api/order/get/ltp',obj)

//     console.log(res.data.data,'ltp price');
    
  
//     item.price = res.data.data.ltp
    

//     setSelectedItem(item);
//     setShowForm(true);
//   };

//   // ✅ Handle Form Submit
//   const handleSubmit = async(e: React.FormEvent) => {
//     e.preventDefault();

//     const formData = {
//       token: selectedItem.token,
//       symbol: selectedItem.symbol,
//       name: selectedItem.name,
//       exch_seg: selectedItem.exch_seg,
//       price:selectedItem.price,
//       quantity:selectedItem.lotsize,
//       duration:duration,
//       orderType:orderType,
//       variety:variety,
//     };

//     console.log("🧾 Form Submitted:", formData);

//     // Example: You can call your POST API here
//    let res = await axios.post("http://localhost:5000/api/order/place/order", formData)

//    console.log(res);
   

//     alert(`Buy order placed for ${selectedItem.name}`);
//     setShowForm(false);
//     setVariety("")
//     setDuration("");
//     setOrderType("");
//   };

//   return (
//     <div className="p-6 max-w-5xl mx-auto">
//       <h2 className="text-xl font-semibold mb-4">Nifty Bank Instruments</h2>

//       <div className="flex justify-end mb-4">
//   <div className="w-full sm:w-80">
//     <input
//       type="text"
//       value={searchTerm}
//       onChange={(e) => setSearchTerm(e.target.value)}
//       placeholder="Search (min 3 chars)"
//       className="border p-2 w-full rounded"
//     />
//   </div>
// </div>

//       {loading && <p>Loading data...</p>}
//       {error && <p className="text-red-500">{error}</p>}

//       {!loading && !error && data.length === 0 && (
//         <p>No data found for "Nifty Bank"</p>
//       )}

//       {data.length > 0 && (
//         <table className="w-full border border-gray-300 rounded-lg">
//           <thead className="bg-gray-200">
//             <tr>
//               <th className="p-2 border">Token</th>
//               <th className="p-2 border">Symbol</th>
//               <th className="p-2 border">Name</th>
//               <th className="p-2 border">Exchange</th>
//               <th className="p-2 border">Buy</th>
//               <th className="p-2 border">Sell</th>
//             </tr>
//           </thead>
//           <tbody>
//             {filteredData.map((item) => (
//               <tr key={item.token} className="hover:bg-blue-50">
//                 <td className="p-2 border">{item.token}</td>
//                 <td className="p-2 border">{item.symbol}</td>
//                 <td className="p-2 border">{item.name}</td>
//                 <td className="p-2 border">{item.exch_seg}</td>
//                 <td className="p-2 border text-center">
//                   <button
//                     onClick={() => handleBuyClick(item)}
//                     className="bg-green-500 hover:bg-green-600 text-white font-medium px-3 py-1 rounded-lg shadow-sm transition"
//                   >
//                     Buy This Item
//                   </button>
//                 </td>
//                 <td className="p-2 border text-center">
//                   <button className="bg-red-500 hover:bg-red-600 text-white font-medium px-3 py-1 rounded-lg shadow-sm transition">
//                     Sell This Item
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}

//       {/* ✅ Modal Form */}
//       {showForm && selectedItem && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
//           <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
//             <h3 className="text-lg font-semibold mb-4 text-center">
//               Buy Order — {selectedItem.name}
//             </h3>

//             <form onSubmit={handleSubmit} className="space-y-4">
//                  <div>
//                 <label className="block text-sm font-medium">Token</label>
//                 <input
//                   type="text"
//                   value={selectedItem.token}
//                   readOnly
//                   className="border p-2 w-full rounded bg-gray-100"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium">Exchange</label>
//                 <input
//                   type="text"
//                   value={selectedItem.exch_seg}
//                   readOnly
//                   className="border p-2 w-full rounded bg-gray-100"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium">Symbol</label>
//                 <input
//                   type="text"
//                   value={selectedItem.symbol}
//                   readOnly
//                   className="border p-2 w-full rounded bg-gray-100"
//                 />
//               </div>

//                <div>
//                 <label className="block text-sm font-medium">Price</label>
//                 <input
//                   type="text"
//                   value={selectedItem.price}
//                   readOnly
//                   className="border p-2 w-full rounded bg-gray-100"
//                 />
//               </div>
//                <div>
//                 <label className="block text-sm font-medium">Quantity</label>
//                 <input
//                   type="text"
//                   value={selectedItem.lotsize}
//                   readOnly
//                   className="border p-2 w-full rounded bg-gray-100"
//                 />
//               </div>

//               {/* ✅ Added Order Type Dropdown */}
//       <div>
//         <label className="block text-sm font-medium">Order Type</label>
//         <select
//           value={orderType}
//           onChange={(e) => setOrderType(e.target.value)}
//           required
//           className="border p-2 w-full rounded bg-gray-50 focus:ring-2 focus:ring-blue-500"
//         >
//           <option value="">Select Order Type</option>
//           <option value="MARKET">MARKET</option>
//           <option value="LIMIT">LIMIT</option>
//           <option value="STOPLOSS_LIMIT">STOPLOSS_LIMIT</option>
//           <option value="STOPLOSS_MARKET">STOPLOSS_MARKET</option>
//         </select>
//       </div>

//        <div>
//         <label className="block text-sm font-medium">Duration</label>
//         <select
//           value={duration}
//           onChange={(e) => setDuration(e.target.value)}
//           required
//           className="border p-2 w-full rounded bg-gray-50 focus:ring-2 focus:ring-blue-500"
//         >
//           <option value="">Select Duration </option>
//           <option value="DAY">DAY</option>
//           <option value="IOC">IOC</option>
//         </select>
//       </div>


//  <div>
//         <label className="block text-sm font-medium">Variety</label>
//         <select
//           value={variety}
//           onChange={(e) => setVariety(e.target.value)}
//           required
//           className="border p-2 w-full rounded bg-gray-50 focus:ring-2 focus:ring-blue-500"
//         >
//           <option value="">Select Duration </option>
//            <option value="NORMAL">NORMAL</option>
//           <option value="STOPLOSS">STOPLOSS</option>
//           <option value="ROBO">ROBO</option>
//         </select>
//       </div>



             

//               <div className="flex justify-between mt-6">
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
// ----------------------------------------------------------

export default function NIftyAndBankNifty() {

  const apiUrl = import.meta.env.VITE_API_URL;


  const [data, setData] = useState<any[]>([]);
    const [dataexcel, setDataExcel] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

   const [getPrice, setOnlyPrice] = useState("");
      const [getslotSIze, setSlotSIze] = useState("");

  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [duration, setDuration] = useState("");
  const [orderType, setOrderType] = useState("");
  const [variety, setVariety] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");

  const gridApiRef = useRef<GridApi | null>(null);


    function formatOptionSymbol(symbol:any) {

    symbol = String(symbol).toUpperCase().trim();

    // Regex patterns
    const optionPattern = /^(NIFTY|BANKNIFTY)(\d{2})([A-Z]{3})(\d{2})(\d+)(CE|PE)$/;
    const futurePattern = /^(NIFTY|BANKNIFTY)(\d{2})([A-Z]{3})(\d{2})FUT$/;

    // 👉 Option format: NIFTY30DEC2530000PE
    const opt = symbol.match(optionPattern);
    if (opt) {
      const [, underlying, day, month, year, strike, optionType] = opt;
      const expiry = `${day}${month}${year}`;
      return `${underlying} ${expiry} ${Number(strike)} ${optionType}`;
    }

    // 👉 Future format: NIFTY25NOV25FUT
    const fut = symbol.match(futurePattern);
    if (fut) {
      const [, underlying, day, month, year] = fut;
      const expiry = `${day}${month}${year}`;
      return `${underlying} ${expiry} FUT`;
    }

  // 👉 Fallback (like NIFTY, Nifty 50, etc.)
  return symbol;
}


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
      const res = await axios.get(`${apiUrl}/order/get/instrument`,  {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                "AngelOneToken": localStorage.getItem("angel_token") || "",
            },
          });

           console.log(res?.data,'heello');

       if(res?.data?.status==true) {

      let allData = res?.data?.data || [];

    // allData = allData.filter((item: any) => {
    //   const name = String(item.name || item.symbol || "").toUpperCase();
    //   // return name.includes("NIFTY") || name.includes("BANK");

    //    return name.includes("NIFTY")
    // });

      allData = allData
        .filter((item:any) => {
          const name = String( item.symbol || "").toUpperCase();
          return name.startsWith("NIFTY") || name.startsWith("BANKNIFTY");
        })
        .map((item:any) => {

          const symbol = String(item.symbol || "").toUpperCase();

          const formattedName = formatOptionSymbol(symbol);

          let optionSymbol = "-";

           if (symbol.endsWith("CE")) optionSymbol = "CE";
          else if (symbol.endsWith("PE")) optionSymbol = "PE";
          else if (symbol.endsWith("FUT")) optionSymbol = "FUT";
          else if (symbol.endsWith("-EQ")) optionSymbol = "EQ";


          return { ...item, formattedName,optionSymbol };
        });


       
          

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
      { headerName: "Token", field: "token", minWidth: 20,  },
       { headerName: "Option Symbol", field: "optionSymbol", minWidth: 20,  },
      { headerName: "Symbol", field: "formattedName", minWidth: 250, filter: "agTextColumnFilter" },
  // { headerName: "Formate", field: "formattedName", minWidth: 100, },
      { headerName: "Name", field: "name", minWidth: 80, },
      { headerName: "Exchange", field: "exch_seg", width: 140 },
       { headerName: "Lot-Size", field: "lotsize", width: 90 },
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


    console.log(dataexcel);
    

    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataexcel);
    // Create a workbook
    const workbook = XLSX.utils.book_new();
    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    // Generate an Excel file
    XLSX.writeFile(workbook, "instrument.xlsx");
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
            paginationPageSize={100}
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



