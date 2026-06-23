


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
//   const { userId, username ,broker} = useParams();
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
//     brokerName: "" as any,
//     // brokerInstrument: null as any,

//   };

//   type FormDataType = typeof defaultValues;

//   const [formData, setFormData] = useState<FormDataType>(defaultValues);
//   const [loadingSubmit, setLoadingSubmit] = useState(false);

//   const [searchTerm, setSearchTerm] = useState("");
//   const [searchResults, setSearchResults] = useState<InstrumentWithKey[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [allInstruments, setAllInstruments] = useState<InstrumentWithKey[]>([]);
//   const [selectedInstrument, setSelectedInstrument] = useState<InstrumentWithKey | null>(null);

//   // Debounce timer ref
//   const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

//   const hiddenFields: (keyof FormDataType)[] = [
//   "brokerName",
// ];

//   // Load all instruments once
//   useEffect(() => {
//     const loadInstruments = async () => {
//       try {
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
//     setSelectedInstrument(item); // Store selected instrument
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
//     if (!formData.exchange)
//       return toast.error("Select exchange");

//     if (!selectedInstrument) {
//       toast.error("No instrument selected!");
//       return;
//     }

//     // formData.brokerInstrument = selectedInstrument
//     formData.brokerName = broker
    

//     // Aap yahan apni API call update kar sakte hain
//     // Example:

//     setLoadingSubmit(true);
//     try {
//       const res = await axios.post(
//         `${apiUrl}/admin/manual/create`,
//         { ...formData, instrument: selectedInstrument },
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         }
//       );
//       if (res?.data?.status) {
//         toast.success("Order created successfully!");
//         setFormData(defaultValues);
//         setSearchTerm("");
//         navigate(`/admin/user-clone`);
//       } else {
//         toast.error(res?.data?.message || "Order failed");
//       }
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err?.message || "Something went wrong");
//     } finally {
//       setLoadingSubmit(false);
//     }
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
//          {(Object.keys(formData) as (keyof FormDataType)[])
//   .filter((field) => !hiddenFields.includes(field))
//   .map((field) => (
//     <div key={field} className="flex flex-col">
//       <label className="text-xs font-semibold text-gray-700 mb-1">
//         {field}
//       </label>

//       {field === "transactiontype" ? (
//         <select
//           name={field}
//           value={formData[field]}
//           onChange={handleChange}
//           className="border p-2 rounded text-sm"
//         >
//           <option value="">Select Transaction</option>
//           <option value="BUY">BUY</option>
//           <option value="SELL">SELL</option>
//         </select>
//       ) : field === "exchange" ? (
//         <select
//           name={field}
//           value={formData[field]}
//           onChange={handleChange}
//           className="border p-2 rounded text-sm"
//         >
//           <option value="">Select Exchange</option>
//           <option value="BSE">BSE</option>
//           <option value="NSE">NSE</option>
//           <option value="NFO">NFO</option>
//           <option value="MCX">MCX</option>
//           <option value="BFO">BFO</option>
//           <option value="CDS">CDS</option>
//         </select>
//       ) : field === "duration" ? (
//         <select
//           name={field}
//           value={formData[field]}
//           onChange={handleChange}
//           className="border p-2 rounded text-sm"
//         >
//           <option value="DAY">DAY</option>
//           <option value="IOC">IOC</option>
//         </select>
//       ) : field === "price" ||
//         field === "totalPrice" ||
//         field === "triggerprice" ||
//         field === "squareoff" ||
//         field === "stoploss" ||
//         field === "trailingstoploss" ||
//         field === "lotSize" ||
//         field === "buyPrice" ||
//         field === "sellPrice" ? (
//         <input
//           type="number"
//           name={field}
//           value={formData[field]}
//           onChange={handleChange}
//           className="border p-2 rounded text-sm"
//         />
//       ) : field === "buyTime" || field === "sellTime" ? (
//         <input
//           type="datetime-local"
//           name={field}
//           value={formData[field]}
//           onChange={handleChange}
//           className="border p-2 rounded text-sm"
//         />
//       ) : (
//         <input
//           type="text"
//           name={field}
//           value={formData[field]}
//           onChange={handleChange}
//           className="border p-2 rounded text-sm"
//         />
//       )}
//     </div>
//   ))}

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
import { Search, X, RefreshCw, TrendingUp, TrendingDown, Wallet, Clock, AlertCircle, DollarSign } from "lucide-react";

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
const normalize = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null) return "";
  return String(val)
    .toLowerCase()
    .replace(/[\s_\-\/\\]+/g, "")
    .replace(/[^a-z0-9]/g, "");
};

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

  const optionSide = symbol.slice(-2).toLowerCase();

  let scaledStrike = "";
  if (strikeRaw) {
    const strikeNum = parseFloat(strikeRaw);
    if (!isNaN(strikeNum)) {
      const asInt = Math.round(strikeNum);
      const asStr = String(asInt);
      if (asStr.endsWith("00")) {
        scaledStrike = String(asInt / 100);
      }
    }
  }

  const parts: string[] = [];
  parts.push(
    normSymbol,
    normName,
    normExpiry,
    normStrikeRaw,
    normExch,
    normInstrType,
    normLot
  );

  if (scaledStrike) {
    const normScaled = normalize(scaledStrike);
    parts.push(normScaled);

    if (optionSide) {
      parts.push(normalize(scaledStrike + optionSide));
      if (name) {
        parts.push(normalize(name + scaledStrike + optionSide));
      }
      parts.push(normalize(symbol + scaledStrike + optionSide));
    }
  }

  return normalize(parts.join(" "));
};

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
      if (results.length >= 10) break;
    }
  }
  return results;
};

export default function OrderAdminPage() {
  const navigate = useNavigate();
  const { userId, username, broker } = useParams();
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
    brokerName: "",
  };

  type FormDataType = typeof defaultValues;

  const [formData, setFormData] = useState<FormDataType>(defaultValues);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<InstrumentWithKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [allInstruments, setAllInstruments] = useState<InstrumentWithKey[]>([]);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentWithKey | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const hiddenFields: (keyof FormDataType)[] = ["brokerName"];

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
        setSearchResults([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const performSearch = useCallback(
    (query: string) => {
      if (!query || query.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        setLoading(true);
        const filtered = filterInstruments(allInstruments, query);
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

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSearchChange(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setIsSearchFocused(false);
  };

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
    setSelectedInstrument(item);
    setIsSearchFocused(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    let updated: FormDataType = {
      ...formData,
      [name]: value,
    };

    if (name === "lotSize" || name === "price") {
      const lot = Number(name === "lotSize" ? value : formData.lotSize);
      const priceVal = Number(name === "price" ? value : formData.price);
      const total = lot * priceVal;
      updated.totalPrice = Number(total.toFixed(2));
    }

    setFormData(updated);
  };

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

    formData.brokerName = broker || "";

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
        setSelectedInstrument(null);
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

  const getExchangeColor = (exchange: string) => {
    const colors: Record<string, string> = {
      NSE: "bg-blue-100 text-blue-700",
      BSE: "bg-purple-100 text-purple-700",
      NFO: "bg-green-100 text-green-700",
      MCX: "bg-orange-100 text-orange-700",
      BFO: "bg-pink-100 text-pink-700",
      CDS: "bg-cyan-100 text-cyan-700",
    };
    return colors[exchange] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 mt-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Place Order</h1>
              <p className="text-sm text-gray-500 mt-1">
                {username && `User: ${username}`} {userId && `• ID: ${userId}`}
              </p>
            </div>
            {selectedInstrument && (
              <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-700">Selected:</span>
                <span className="text-sm font-semibold text-gray-900">{selectedInstrument.symbol}</span>
                <span className={`text-xs px-2 py-1 rounded ${getExchangeColor(selectedInstrument.exch_seg || "")}`}>
                  {selectedInstrument.exch_seg}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Search & Instrument Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" ref={searchRef}>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Search Instrument
              </label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchInputChange}
                    onFocus={() => setIsSearchFocused(true)}
                    placeholder="NIFTY, 26300, 263pe, BANKNIFTY..."
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {loading && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg p-3 z-50">
                    <div className="flex items-center gap-2 text-blue-600">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Searching...</span>
                    </div>
                  </div>
                )}

                {searchResults.length > 0 && isSearchFocused && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
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
                          className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 text-sm">{item.symbol}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${getExchangeColor(item.exch_seg || "")}`}>
                                {item.exch_seg}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 uppercase">{item.instrumenttype}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                            <span>{item.name}</span>
                            {item.expiry && (
                              <>
                                <span className="text-gray-300">|</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {item.expiry}
                                </span>
                              </>
                            )}
                            {prettyStrike && (
                              <>
                                <span className="text-gray-300">|</span>
                                <span>Strike: {prettyStrike}</span>
                              </>
                            )}
                            {cepe && (
                              <span className={`font-semibold ${cepe === 'ce' ? 'text-green-600' : 'text-red-600'}`}>
                                {cepe.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {searchTerm && searchResults.length === 0 && !loading && isSearchFocused && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
                    <div className="flex items-center gap-2 text-gray-500">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">No instruments found</span>
                    </div>
                  </div>
                )}
              </div>

              {selectedInstrument && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{selectedInstrument.symbol}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{selectedInstrument.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">₹{formData.price.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">LTP</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-blue-200">
                    <div>
                      <p className="text-[10px] text-gray-500">Exchange</p>
                      <p className="text-xs font-medium">{selectedInstrument.exch_seg}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">Lot Size</p>
                      <p className="text-xs font-medium">{selectedInstrument.lotsize}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">Total Value</p>
                      <p className="text-xs font-medium">₹{formData.totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Type Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Settings</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Variety</label>
                  <select
                    name="variety"
                    value={formData.variety}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="STOPLOSS">STOPLOSS</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Order Type</label>
                  <select
                    name="ordertype"
                    value={formData.ordertype}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="MARKET">MARKET</option>
                    <option value="LIMIT">LIMIT</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Product Type</label>
                  <select
                    name="producttype"
                    value={formData.producttype}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="INTRADAY">INTRADAY</option>
                    <option value="DELIVERY">DELIVERY</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Duration</label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="DAY">DAY</option>
                    <option value="IOC">IOC</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Transaction Type - Prominent */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      Transaction Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, transactiontype: "BUY" });
                        }}
                        className={`py-3 rounded-lg font-semibold text-sm transition-all ${
                          formData.transactiontype === "BUY"
                            ? "bg-green-600 text-white shadow-lg shadow-green-200"
                            : "bg-green-50 text-green-600 border-2 border-green-200 hover:bg-green-100"
                        }`}
                      >
                        <TrendingUp className="h-4 w-4 inline mr-2" />
                        BUY
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, transactiontype: "SELL" });
                        }}
                        className={`py-3 rounded-lg font-semibold text-sm transition-all ${
                          formData.transactiontype === "SELL"
                            ? "bg-red-600 text-white shadow-lg shadow-red-200"
                            : "bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100"
                        }`}
                      >
                        <TrendingDown className="h-4 w-4 inline mr-2" />
                        SELL
                      </button>
                    </div>
                  </div>

                  {/* Exchange */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">
                      Exchange
                    </label>
                    <select
                      name="exchange"
                      value={formData.exchange}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="">Select Exchange</option>
                      <option value="BSE">BSE</option>
                      <option value="NSE">NSE</option>
                      <option value="NFO">NFO</option>
                      <option value="MCX">MCX</option>
                      <option value="BFO">BFO</option>
                      <option value="CDS">CDS</option>
                    </select>
                  </div>

                  {/* Price & Quantity */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-1">
                        Price
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        step="0.05"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-1">
                        Lot Size
                      </label>
                      <input
                        type="number"
                        name="lotSize"
                        value={formData.lotSize}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Total Value */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Total Value</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ₹{formData.totalPrice.toFixed(2)}
                        </p>
                      </div>
                      <Wallet className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>

                  {/* SL/TP Section */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-1">
                        Stoploss
                      </label>
                      <input
                        type="number"
                        name="stoploss"
                        value={formData.stoploss}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        step="0.05"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-1">
                        Trigger Price
                      </label>
                      <input
                        type="number"
                        name="triggerprice"
                        value={formData.triggerprice}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        step="0.05"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-1">
                        Square Off
                      </label>
                      <input
                        type="number"
                        name="squareoff"
                        value={formData.squareoff}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        step="0.05"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-1">
                        Trailing Stoploss
                      </label>
                      <input
                        type="number"
                        name="trailingstoploss"
                        value={formData.trailingstoploss}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        step="0.05"
                      />
                    </div>
                  </div>

                  {/* ====== TRADE DETAILS SECTION - Buy/Sell Price & Time ====== */}
                  <div className="border-t border-gray-200 pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Trade Details
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Buy Section */}
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <label className="text-xs font-semibold text-green-700 block mb-2 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Buy Details
                        </label>
                        <div className="space-y-2">
                          <div>
                            <label className="text-[10px] text-gray-500 block">Buy Price</label>
                            <input
                              type="number"
                              name="buyPrice"
                              value={formData.buyPrice}
                              onChange={handleChange}
                              className="w-full border border-gray-300 rounded-lg p-1.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                              step="0.05"
                              placeholder="Enter buy price"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 block">Buy Time</label>
                            <input
                              type="datetime-local"
                              name="buyTime"
                              value={formData.buyTime}
                              onChange={handleChange}
                              className="w-full border border-gray-300 rounded-lg p-1.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Sell Section */}
                      <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                        <label className="text-xs font-semibold text-red-700 block mb-2 flex items-center gap-1">
                          <TrendingDown className="h-3 w-3" />
                          Sell Details
                        </label>
                        <div className="space-y-2">
                          <div>
                            <label className="text-[10px] text-gray-500 block">Sell Price</label>
                            <input
                              type="number"
                              name="sellPrice"
                              value={formData.sellPrice}
                              onChange={handleChange}
                              className="w-full border border-gray-300 rounded-lg p-1.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                              step="0.05"
                              placeholder="Enter sell price"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 block">Sell Time</label>
                            <input
                              type="datetime-local"
                              name="sellTime"
                              value={formData.sellTime}
                              onChange={handleChange}
                              className="w-full border border-gray-300 rounded-lg p-1.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hidden fields */}
                  {Object.keys(formData)
                    .filter((field) => hiddenFields.includes(field as keyof FormDataType))
                    .map((field) => (
                      <input
                        key={field}
                        type="hidden"
                        name={field}
                        value={formData[field as keyof FormDataType] as string}
                      />
                    ))}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loadingSubmit}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-lg font-semibold text-sm hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200 disabled:from-gray-400 disabled:to-gray-500 disabled:shadow-none disabled:cursor-not-allowed"
                  >
                    {loadingSubmit ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Placing Order...
                      </span>
                    ) : (
                      "Place Order"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}