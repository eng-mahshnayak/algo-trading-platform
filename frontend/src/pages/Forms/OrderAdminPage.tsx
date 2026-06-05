




// import { useState, useEffect, useCallback, useRef } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { useParams, useNavigate } from "react-router-dom";

// // --------- TYPES ----------
// type Instrument = {
//   id?: string | number;
//   token: string;
//   symbol: string;
//   name: string;
//   expiry?: string;
//   strike?: string;
//   lotsize?: string | number;
//   instrumenttype?: string;
//   exch_seg?: string;
//   tick_size?: string;
// };

// type InstrumentWithKey = Instrument & {
//   searchKey?: string;
// };

// // ---------- HELPERS ----------

// // Normalize helper: remove spaces/symbols + lowercase
// const normalize = (val: string | number | undefined | null): string => {
//   if (val === undefined || val === null) return "";
//   return String(val)
//     .toLowerCase()
//     .replace(/[\s_\-\/\\]+/g, "") // remove spaces and separators
//     .replace(/[^a-z0-9]/g, ""); // keep only a-z0-9
// };

// // Build ONE big searchable string per instrument (enhanced)
// const buildSearchKey = (item: Instrument): string => {
//   const symbol = item.symbol || "";
//   const name = item.name || "";
//   const expiry = (item.expiry || "").toString();
//   const strikeRaw = (item.strike || "").toString();
//   const exch = item.exch_seg || "";
//   const instrType = item.instrumenttype || "";
//   const lot = item.lotsize || "";

//   const normSymbol = normalize(symbol);
//   const normName = normalize(name);
//   const normExpiry = normalize(expiry);
//   const normStrikeRaw = normalize(strikeRaw);
//   const normExch = normalize(exch);
//   const normInstrType = normalize(instrType);
//   const normLot = normalize(lot);

//   // option side (CE/PE)
//   const optionSide = symbol.slice(-2).toLowerCase(); // "ce" / "pe" / something else

//   // Create scaled strike (e.g. 26300 -> 263)
//   let scaledStrike = "";
//   if (strikeRaw) {
//     const strikeNum = parseFloat(strikeRaw);
//     if (!isNaN(strikeNum)) {
//       const asInt = Math.round(strikeNum);
//       const asStr = String(asInt);
//       if (asStr.endsWith("00")) {
//         scaledStrike = String(asInt / 100); // 26300 -> "263"
//       }
//     }
//   }

//   const parts: string[] = [];

//   // Base fields (more like AG Grid quick filter style)
//   parts.push(
//     normSymbol,
//     normName,
//     normExpiry,
//     normStrikeRaw,
//     normExch,
//     normInstrType,
//     normLot
//   );

//   // Strike variations + CE/PE combos
//   if (scaledStrike) {
//     const normScaled = normalize(scaledStrike); // "263"
//     parts.push(normScaled); // 263

//     if (optionSide) {
//       // 263pe
//       parts.push(normalize(scaledStrike + optionSide));

//       // name + 263pe
//       if (name) {
//         parts.push(normalize(name + scaledStrike + optionSide));
//       }

//       // symbol + 263pe (redundant but safe)
//       parts.push(normalize(symbol + scaledStrike + optionSide));
//     }
//   }

//   return normalize(parts.join(" "));
// };

// // Filter list using the precomputed searchKey (max 10 results)
// const filterInstruments = (
//   list: InstrumentWithKey[],
//   query: string
// ): InstrumentWithKey[] => {
//   const q = normalize(query);
//   if (!q) return [];

//   const results: InstrumentWithKey[] = [];

//   for (const item of list) {
//     if (item.searchKey && item.searchKey.includes(q)) {
//       results.push(item);
//       if (results.length >= 10) break; // 🔹 limit suggestions to 10
//     }
//   }

//   return results;
// };

// export default function OrderAdminPage() {
//   const navigate = useNavigate();
//   const { userId, username } = useParams();
//   const apiUrl = import.meta.env.VITE_API_URL;

//   const defaultValues = {
//     userId: userId || "",
//     username: username || "",
//     variety: "NORMAL",
//     ordertype: "MARKET",
//     producttype: "INTRADAY",
//     tradingsymbol: "",
//     transactiontype: "",
//     exchange: "",
//     symboltoken: "",
//     instrumenttype: "",
//     duration: "DAY",
//     price: 0,
//     totalPrice: 0,
//     lotSize: "",
//     triggerprice: 0,
//     squareoff: "0",
//     stoploss: "0",
//     trailingstoploss: "0",
//     buyPrice: "",
//     sellPrice: "",
//     buyTime: "",
//     sellTime: "",
//   };

//   type FormDataType = typeof defaultValues;

//   const [formData, setFormData] = useState<FormDataType>(defaultValues);
//   const [loadingSubmit, setLoadingSubmit] = useState(false);

//   const [searchTerm, setSearchTerm] = useState("");
//   const [searchResults, setSearchResults] = useState<InstrumentWithKey[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [allInstruments, setAllInstruments] = useState<InstrumentWithKey[]>([]);

//   // Debounce timer ref
//   const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

//   // Load all instruments once
//   useEffect(() => {
//     const loadInstruments = async () => {
//       try {
//         // const res = await axios.get(`${apiUrl}/agnelone/instrument`, {
//         const res = await axios.get(`${apiUrl}/agnelone/instrumentnew`, {  
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//             AngelOneToken: localStorage.getItem("angel_token") || "",
//           },
//         });

//         if (res?.data?.status) {
//           const rawList: Instrument[] = res.data.data || [];
//           // attach searchKey to each item
//           const withKeys: InstrumentWithKey[] = rawList.map((item) => ({
//             ...item,
//             searchKey: buildSearchKey(item),
//           }));
//           setAllInstruments(withKeys);
//         } else {
//           toast.error(res?.data?.message || "Failed to load instruments");
//         }
//       } catch (err) {
//         console.error(err);
//         toast.error("Failed to load instruments");
//       }
//     };

//     loadInstruments();
//   }, [apiUrl]);

//   // Actual search logic (no debounce here)
//   const performSearch = useCallback(
//     (query: string) => {
//       if (!query || query.length < 2) {
//         setSearchResults([]);
//         return;
//       }
//       try {
//         setLoading(true);
//         const filtered = filterInstruments(allInstruments, query);
//         // filtered already max 10
//         setSearchResults(filtered);
//       } catch (err) {
//         console.error(err);
//         toast.error("Search failed");
//       } finally {
//         setLoading(false);
//       }
//     },
//     [allInstruments]
//   );

//   // Debounced wrapper for search input
//   const handleSearchChange = (value: string) => {
//     setSearchTerm(value);

//     if (debounceRef.current) {
//       clearTimeout(debounceRef.current);
//     }

//     debounceRef.current = setTimeout(() => {
//       performSearch(value);
//     }, 300);
//   };

//   // Input change for search box
//   const handleSearchInputChange = (
//     e: React.ChangeEvent<HTMLInputElement>
//   ) => {
//     handleSearchChange(e.target.value);
//   };

//   // Fetch LTP
//   const getLTP = async (item: Instrument): Promise<number | null> => {
//     try {
//       const payload = {
//         exchange: item.exch_seg,
//         tradingsymbol: item.symbol,
//         symboltoken: item.token,
//       };
//       const res = await axios.post(
//         `${apiUrl}/agnelone/instrument/ltp`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//             AngelOneToken: localStorage.getItem("angel_token") || "",
//             userid: localStorage.getItem("userID") || "",
//           },
//         }
//       );
//       return res?.data?.data?.data?.ltp || 0;
//     } catch (err) {
//       console.error(err);
//       toast.error("LTP fetch failed");
//       return null;
//     }
//   };

//   // Handle item selection from dropdown
//   const handleItemSelect = async (item: InstrumentWithKey) => {
//     const ltp = await getLTP(item);
//     const price = ltp ?? 0;
//     const lot = Number(item.lotsize || 0);
//     const total = Number(price) * lot;

//     setFormData((prev: any) => ({
//       ...prev,
//       tradingsymbol: item.symbol,
//       exchange: item.exch_seg || "",
//       symboltoken: item.token,
//       instrumenttype: item.instrumenttype || "",
//       lotSize: item.lotsize || "",
//       price: Number(price),
//       totalPrice: Number(total.toFixed(2)),
//     }));

//     setSearchTerm(item.symbol);
//     setSearchResults([]);
//   };

//   // Handle form field changes
//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
//   ) => {
//     const { name, value } = e.target;

//     let updated: FormDataType = {
//       ...formData,
//       [name]: value,
//     };

//     // recalc total price when price / lotSize changes
//     if (name === "lotSize" || name === "price") {
//       const lot = Number(name === "lotSize" ? value : formData.lotSize);
//       const priceVal = Number(name === "price" ? value : formData.price);
//       const total = lot * priceVal;
//       updated.totalPrice = Number(total.toFixed(2));
//     }

//     setFormData(updated);
//   };

//   // Submit order
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!formData.tradingsymbol)
//       return toast.error("Please select a symbol");
//     if (!formData.transactiontype)
//       return toast.error("Select transaction type");
//     if (!formData.exchange) return toast.error("Select exchange");

//     console.log(formData,'===============formData==============');
    
//     setLoadingSubmit(true);
//     // try {
//     //   const res = await axios.post(
//     //     `${apiUrl}/admin/manual/create`,
//     //     formData,
//     //     {
//     //       headers: {
//     //         Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//     //       },
//     //     }
//     //   );

//     //   if (res?.data?.status) {
//     //     toast.success("Order created successfully!");
//     //     setFormData(defaultValues);
//     //     setSearchTerm("");
//     //     navigate(`/admin/user-clone`);
//     //   } else {
//     //     toast.error(res?.data?.message || "Order failed");
//     //   }
//     // } catch (err: any) {
//     //   console.error(err);
//     //   toast.error(err?.message || "Something went wrong");
//     // } finally {
//     //   setLoadingSubmit(false);
//     // }
//   };

//   return (
//     <div className="p-6 mt-16">
//       {/* SEARCH BOX */}
//       <div className="relative w-full sm:w-96 mb-6">
//         <input
//           type="text"
//           value={searchTerm}
//           onChange={handleSearchInputChange}
//           placeholder="Search: NIFTY02DEC2526300PE, 26300, 263pe, nifty263pe, 02dec2025 ..."
//           className="border p-2 w-full rounded"
//         />
//         {searchResults.length > 0 && (
//           <div className="absolute top-12 left-0 right-0 bg-white border rounded shadow-lg max-h-72 overflow-y-auto z-50 text-sm">
//             {searchResults.map((item) => {
//               const cepe = item.symbol?.slice(-2) || "";
//               let prettyStrike = item.strike;
//               if (item.strike) {
//                 const strikeNum = parseFloat(item.strike as any);
//                 if (!isNaN(strikeNum)) {
//                   const asInt = Math.round(strikeNum);
//                   const asStr = String(asInt);
//                   if (asStr.endsWith("00")) {
//                     prettyStrike = (asInt / 100).toString();
//                   }
//                 }
//               }
//               return (
//                 <div
//                   key={item.id || item.token}
//                   onClick={() => handleItemSelect(item)}
//                   className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
//                 >
//                   <div className="flex justify-between">
//                     <p className="font-semibold">{item.symbol}</p>
//                     <span className="text-[11px] text-gray-500">
//                       {item.exch_seg} • {item.instrumenttype}
//                     </span>
//                   </div>
//                   <p className="text-xs text-gray-600">
//                     {item.name} • Exp: {item.expiry} • Strike: {prettyStrike}{" "}
//                     {cepe}
//                   </p>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//         {loading && (
//           <p className="text-blue-500 text-xs mt-1">Searching...</p>
//         )}
//       </div>

//       {/* FORM */}
//       <form onSubmit={handleSubmit}>
//         <div className="p-6 space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
//           {(Object.keys(formData) as (keyof FormDataType)[]).map((field) => (
//             <div key={field} className="flex flex-col">
//               <label className="text-xs font-semibold text-gray-700 mb-1">
//                 {field}
//               </label>

//               {field === "transactiontype" ? (
//                 <select
//                   name={field}
//                   value={formData[field]}
//                   onChange={handleChange}
//                   className="border p-2 rounded text-sm"
//                 >
//                   <option value="">Select Transaction</option>
//                   <option value="BUY">BUY</option>
//                   <option value="SELL">SELL</option>
//                 </select>
//               ) : field === "exchange" ? (
//                 <select
//                   name={field}
//                   value={formData[field]}
//                   onChange={handleChange}
//                   className="border p-2 rounded text-sm"
//                 >
//                   <option value="">Select Exchange</option>
//                   <option value="BSE">BSE</option>
//                   <option value="NSE">NSE</option>
//                   <option value="NFO">NFO</option>
//                   <option value="MCX">MCX</option>
//                   <option value="BFO">BFO</option>
//                   <option value="CDS">CDS</option>
//                 </select>
//               ) : field === "duration" ? (
//                 <select
//                   name={field}
//                   value={formData[field]}
//                   onChange={handleChange}
//                   className="border p-2 rounded text-sm"
//                 >
//                   <option value="DAY">DAY</option>
//                   <option value="IOC">IOC</option>
//                 </select>
//               ) : field === "price" ||
//                 field === "totalPrice" ||
//                 field === "triggerprice" ||
//                 field === "squareoff" ||
//                 field === "stoploss" ||
//                 field === "trailingstoploss" ||
//                 field === "lotSize" ||
//                 field === "buyPrice" ||
//                 field === "sellPrice" ? (
//                 <input
//                   type="number"
//                   name={field}
//                   value={formData[field]}
//                   onChange={handleChange}
//                   className="border p-2 rounded text-sm"
//                 />
//               ) : field === "buyTime" || field === "sellTime" ? (
//                 <input
//                   type="datetime-local"
//                   name={field}
//                   value={formData[field]}
//                   onChange={handleChange}
//                   className="border p-2 rounded text-sm"
//                 />
//               ) : (
//                 <input
//                   type="text"
//                   name={field}
//                   value={formData[field]}
//                   onChange={handleChange}
//                   className="border p-2 rounded text-sm"
//                 />
//               )}
//             </div>
//           ))}
//         </div>

//         {/* SUBMIT */}
//         <div className="mt-6 flex justify-center">
//           <button
//             type="submit"
//             disabled={loadingSubmit}
//             className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 disabled:bg-gray-400 text-sm"
//           >
//             {loadingSubmit ? "Submitting..." : "Submit Order"}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }


import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";

// --------- TYPES ----------
type Instrument = {
  id?: string | number;
  token: string;
  symbol: string;
  name: string;
  expiry?: string;
  strike?: string;
  lotsize?: string | number;
  instrumenttype?: string;
  exch_seg?: string;
  tick_size?: string;
};

type InstrumentWithKey = Instrument & {
  searchKey?: string;
};

// ---------- HELPERS ----------

// Normalize helper: remove spaces/symbols + lowercase
const normalize = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null) return "";
  return String(val)
    .toLowerCase()
    .replace(/[\s_\-\/\\]+/g, "") // remove spaces and separators
    .replace(/[^a-z0-9]/g, ""); // keep only a-z0-9
};

// Build ONE big searchable string per instrument (enhanced)
const buildSearchKey = (item: Instrument): string => {
  const symbol = item.symbol || "";
  const name = item.name || "";
  const expiry = (item.expiry || "").toString();
  const strikeRaw = (item.strike || "").toString();
  const exch = item.exch_seg || "";
  const instrType = item.instrumenttype || "";
  const lot = item.lotsize || "";

  const normSymbol = normalize(symbol);
  const normName = normalize(name);
  const normExpiry = normalize(expiry);
  const normStrikeRaw = normalize(strikeRaw);
  const normExch = normalize(exch);
  const normInstrType = normalize(instrType);
  const normLot = normalize(lot);

  // option side (CE/PE)
  const optionSide = symbol.slice(-2).toLowerCase(); // "ce" / "pe" / something else

  // Create scaled strike (e.g. 26300 -> 263)
  let scaledStrike = "";
  if (strikeRaw) {
    const strikeNum = parseFloat(strikeRaw);
    if (!isNaN(strikeNum)) {
      const asInt = Math.round(strikeNum);
      const asStr = String(asInt);
      if (asStr.endsWith("00")) {
        scaledStrike = String(asInt / 100); // 26300 -> "263"
      }
    }
  }

  const parts: string[] = [];

  // Base fields (more like AG Grid quick filter style)
  parts.push(
    normSymbol,
    normName,
    normExpiry,
    normStrikeRaw,
    normExch,
    normInstrType,
    normLot
  );

  // Strike variations + CE/PE combos
  if (scaledStrike) {
    const normScaled = normalize(scaledStrike); // "263"
    parts.push(normScaled); // 263

    if (optionSide) {
      // 263pe
      parts.push(normalize(scaledStrike + optionSide));

      // name + 263pe
      if (name) {
        parts.push(normalize(name + scaledStrike + optionSide));
      }

      // symbol + 263pe (redundant but safe)
      parts.push(normalize(symbol + scaledStrike + optionSide));
    }
  }

  return normalize(parts.join(" "));
};

// Filter list using the precomputed searchKey (max 10 results)
const filterInstruments = (
  list: InstrumentWithKey[],
  query: string
): InstrumentWithKey[] => {
  const q = normalize(query);
  if (!q) return [];

  const results: InstrumentWithKey[] = [];

  for (const item of list) {
    if (item.searchKey && item.searchKey.includes(q)) {
      results.push(item);
      if (results.length >= 10) break; // 🔹 limit suggestions to 10
    }
  }

  return results;
};

export default function OrderAdminPage() {
  const navigate = useNavigate();
  const { userId, username ,broker} = useParams();
  const apiUrl = import.meta.env.VITE_API_URL;

  const defaultValues = {
    userId: userId || "",
    username: username || "",
    variety: "NORMAL",
    ordertype: "MARKET",
    producttype: "INTRADAY",
    tradingsymbol: "",
    transactiontype: "",
    exchange: "",
    symboltoken: "",
    instrumenttype: "",
    duration: "DAY",
    price: 0,
    totalPrice: 0,
    lotSize: "",
    triggerprice: 0,
    squareoff: "0",
    stoploss: "0",
    trailingstoploss: "0",
    buyPrice: "",
    sellPrice: "",
    buyTime: "",
    sellTime: "",
    brokerName: "" as any,
    // brokerInstrument: null as any,

  };

  type FormDataType = typeof defaultValues;

  const [formData, setFormData] = useState<FormDataType>(defaultValues);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<InstrumentWithKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [allInstruments, setAllInstruments] = useState<InstrumentWithKey[]>([]);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentWithKey | null>(null);

  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hiddenFields: (keyof FormDataType)[] = [
  "brokerName",
];

  // Load all instruments once
  useEffect(() => {
    const loadInstruments = async () => {
      try {
        const res = await axios.get(`${apiUrl}/agnelone/instrumentnew`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            AngelOneToken: localStorage.getItem("angel_token") || "",
          },
        });

        if (res?.data?.status) {
          const rawList: Instrument[] = res.data.data || [];
          // attach searchKey to each item
          const withKeys: InstrumentWithKey[] = rawList.map((item) => ({
            ...item,
            searchKey: buildSearchKey(item),
          }));
          setAllInstruments(withKeys);
        } else {
          toast.error(res?.data?.message || "Failed to load instruments");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load instruments");
      }
    };

    loadInstruments();
  }, [apiUrl]);

  // Actual search logic (no debounce here)
  const performSearch = useCallback(
    (query: string) => {
      if (!query || query.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        setLoading(true);
        const filtered = filterInstruments(allInstruments, query);
        // filtered already max 10
        setSearchResults(filtered);
      } catch (err) {
        console.error(err);
        toast.error("Search failed");
      } finally {
        setLoading(false);
      }
    },
    [allInstruments]
  );

  // Debounced wrapper for search input
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Input change for search box
  const handleSearchInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    handleSearchChange(e.target.value);
  };

  // Fetch LTP
  const getLTP = async (item: Instrument): Promise<number | null> => {
    try {
      const payload = {
        exchange: item.exch_seg,
        tradingsymbol: item.symbol,
        symboltoken: item.token,
      };
      const res = await axios.post(
        `${apiUrl}/agnelone/instrument/ltp`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            AngelOneToken: localStorage.getItem("angel_token") || "",
            userid: localStorage.getItem("userID") || "",
          },
        }
      );
      return res?.data?.data?.data?.ltp || 0;
    } catch (err) {
      console.error(err);
      toast.error("LTP fetch failed");
      return null;
    }
  };

  // Handle item selection from dropdown
  const handleItemSelect = async (item: InstrumentWithKey) => {
    const ltp = await getLTP(item);
    const price = ltp ?? 0;
    const lot = Number(item.lotsize || 0);
    const total = Number(price) * lot;

    setFormData((prev: any) => ({
      ...prev,
      tradingsymbol: item.symbol,
      exchange: item.exch_seg || "",
      symboltoken: item.token,
      instrumenttype: item.instrumenttype || "",
      lotSize: item.lotsize || "",
      price: Number(price),
      totalPrice: Number(total.toFixed(2)),
    }));

    setSearchTerm(item.symbol);
    setSearchResults([]);
    setSelectedInstrument(item); // Store selected instrument
  };

  // Handle form field changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    let updated: FormDataType = {
      ...formData,
      [name]: value,
    };

    // recalc total price when price / lotSize changes
    if (name === "lotSize" || name === "price") {
      const lot = Number(name === "lotSize" ? value : formData.lotSize);
      const priceVal = Number(name === "price" ? value : formData.price);
      const total = lot * priceVal;
      updated.totalPrice = Number(total.toFixed(2));
    }

    setFormData(updated);
  };

  // Submit order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tradingsymbol)
      return toast.error("Please select a symbol");
    if (!formData.transactiontype)
      return toast.error("Select transaction type");
    if (!formData.exchange)
      return toast.error("Select exchange");

    if (!selectedInstrument) {
      toast.error("No instrument selected!");
      return;
    }

    // formData.brokerInstrument = selectedInstrument
    formData.brokerName = broker
    

    // Aap yahan apni API call update kar sakte hain
    // Example:

    setLoadingSubmit(true);
    try {
      const res = await axios.post(
        `${apiUrl}/admin/manual/create`,
        { ...formData, instrument: selectedInstrument },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );
      if (res?.data?.status) {
        toast.success("Order created successfully!");
        setFormData(defaultValues);
        setSearchTerm("");
        navigate(`/admin/user-clone`);
      } else {
        toast.error(res?.data?.message || "Order failed");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="p-6 mt-16">
      {/* SEARCH BOX */}
      <div className="relative w-full sm:w-96 mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchInputChange}
          placeholder="Search: NIFTY02DEC2526300PE, 26300, 263pe, nifty263pe, 02dec2025 ..."
          className="border p-2 w-full rounded"
        />
        {searchResults.length > 0 && (
          <div className="absolute top-12 left-0 right-0 bg-white border rounded shadow-lg max-h-72 overflow-y-auto z-50 text-sm">
            {searchResults.map((item) => {
              const cepe = item.symbol?.slice(-2) || "";
              let prettyStrike = item.strike;
              if (item.strike) {
                const strikeNum = parseFloat(item.strike as any);
                if (!isNaN(strikeNum)) {
                  const asInt = Math.round(strikeNum);
                  const asStr = String(asInt);
                  if (asStr.endsWith("00")) {
                    prettyStrike = (asInt / 100).toString();
                  }
                }
              }
              return (
                <div
                  key={item.id || item.token}
                  onClick={() => handleItemSelect(item)}
                  className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                >
                  <div className="flex justify-between">
                    <p className="font-semibold">{item.symbol}</p>
                    <span className="text-[11px] text-gray-500">
                      {item.exch_seg} • {item.instrumenttype}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {item.name} • Exp: {item.expiry} • Strike: {prettyStrike}{" "}
                    {cepe}
                  </p>
                </div>
              );
            })}
          </div>
        )}
        {loading && (
          <p className="text-blue-500 text-xs mt-1">Searching...</p>
        )}
      </div>

      

      {/* FORM */}
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
         {(Object.keys(formData) as (keyof FormDataType)[])
  .filter((field) => !hiddenFields.includes(field))
  .map((field) => (
    <div key={field} className="flex flex-col">
      <label className="text-xs font-semibold text-gray-700 mb-1">
        {field}
      </label>

      {field === "transactiontype" ? (
        <select
          name={field}
          value={formData[field]}
          onChange={handleChange}
          className="border p-2 rounded text-sm"
        >
          <option value="">Select Transaction</option>
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
        </select>
      ) : field === "exchange" ? (
        <select
          name={field}
          value={formData[field]}
          onChange={handleChange}
          className="border p-2 rounded text-sm"
        >
          <option value="">Select Exchange</option>
          <option value="BSE">BSE</option>
          <option value="NSE">NSE</option>
          <option value="NFO">NFO</option>
          <option value="MCX">MCX</option>
          <option value="BFO">BFO</option>
          <option value="CDS">CDS</option>
        </select>
      ) : field === "duration" ? (
        <select
          name={field}
          value={formData[field]}
          onChange={handleChange}
          className="border p-2 rounded text-sm"
        >
          <option value="DAY">DAY</option>
          <option value="IOC">IOC</option>
        </select>
      ) : field === "price" ||
        field === "totalPrice" ||
        field === "triggerprice" ||
        field === "squareoff" ||
        field === "stoploss" ||
        field === "trailingstoploss" ||
        field === "lotSize" ||
        field === "buyPrice" ||
        field === "sellPrice" ? (
        <input
          type="number"
          name={field}
          value={formData[field]}
          onChange={handleChange}
          className="border p-2 rounded text-sm"
        />
      ) : field === "buyTime" || field === "sellTime" ? (
        <input
          type="datetime-local"
          name={field}
          value={formData[field]}
          onChange={handleChange}
          className="border p-2 rounded text-sm"
        />
      ) : (
        <input
          type="text"
          name={field}
          value={formData[field]}
          onChange={handleChange}
          className="border p-2 rounded text-sm"
        />
      )}
    </div>
  ))}

        </div>

        {/* SUBMIT */}
        <div className="mt-6 flex justify-center">
          <button
            type="submit"
            disabled={loadingSubmit}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 disabled:bg-gray-400 text-sm"
          >
            {loadingSubmit ? "Submitting..." : "Submit Order"}
          </button>
        </div>
      </form>
    </div>
  );
}
