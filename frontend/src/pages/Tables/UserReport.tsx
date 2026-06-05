
// // src/pages/UsersTables.tsx
// import { useEffect, useMemo, useRef, useState } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { EllipsisVerticalIcon } from "@heroicons/react/24/solid";

// type Role = "admin" | "user";

// export type AngelCredential = {
//   clientId: string;
//   totpSecret: string;
//   password: string;
// };

// export type User = {
//   id: number;
//   firstName?: string | null;
//   lastName?: string | null;
//   email: string;
//   username: string;
//   phoneNumber?: string | null;
//   role: Role;
//   isChecked: boolean;
//   brokerName?: string | null;
//   brokerImageLink?: string | null;
//   angelLoginUser?: boolean | null;
//   authToken?: string | null;
//   feedToken?: string | null;
//   refreshToken?: string | null;
//   resetCode?: string | null;
//   resetCodeExpire?: string | null;
//   createdAt: string; // ISO
//   updatedAt: string; // ISO
//   angelCredential: AngelCredential;
//   packageName:string;
//   strategyName:string;
//   strategyDis:any
// };



// const API_URL = import.meta.env.VITE_API_URL; // e.g. "http://localhost:5001/api"

// export default function UserReport() {
//   const [users, setUsers] = useState<User[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string>("");
//   const [search, setSearch] = useState("");
//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);


//   const [strategyList, setStrategyList] = useState([]); // all strategies from backend
// const [selectedStrategyId, setSelectedStrategyId] = useState(""); // dropdown selected id


//   // actions menu state
//   const [openMenuId, setOpenMenuId] = useState<number | null>(null);
//   const tableRef = useRef<HTMLDivElement | null>(null);

//   // ==== Create Group Modal state ====
//   const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
//     const [isPackageAssignModalOpen, setIsPackageAssignModalOpen] = useState(false);
//   const [selectedUserForGroup, setSelectedUserForGroup] = useState<User | null>(
//     null
//   );
//   const [groupName, setGroupName] = useState("");
//     const [date, setDate] = useState("");
//   const [groupDescription, setGroupDescription] = useState("");
//   const [creating, setCreating] = useState(false);

//   const fetchUsers = async () => {
//     try {
//       setLoading(true);
//       setError("");

//       const res = await axios.get(`${API_URL}/users/get-users`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           AngelOneToken: localStorage.getItem("angel_token") || "",
//         },
//       });

//       const payload = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
//       setUsers(payload);
//     } catch (err: any) {
//       setError(
//         err?.response?.data?.message || err?.message || "Failed to load users"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   // Close actions menu when clicking outside the table
//   useEffect(() => {
//     const onDocClick = (e: MouseEvent) => {
//       if (!tableRef.current) return;
//       if (!tableRef.current.contains(e.target as Node)) {
//         setOpenMenuId(null);
//       }
//     };
//     document.addEventListener("click", onDocClick);
//     return () => document.removeEventListener("click", onDocClick);
//   }, []);

//   // Close modal on Escape
//   useEffect(() => {
//     const onKey = (e: KeyboardEvent) => {
//       if (e.key === "Escape" && isGroupModalOpen && !creating) {
//         closeGroupModal();
//       }
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [isGroupModalOpen, creating]);

//   // Filter (client-side)
//   const filtered = useMemo(() => {
//     if (!search.trim()) return users;
//     const q = search.toLowerCase();
//     return users.filter((u) => {
//       const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase();
//       return (
//         u.email?.toLowerCase().includes(q) ||
//         u.username?.toLowerCase().includes(q) ||
//         u.phoneNumber?.toLowerCase?.().includes(q) ||
//         fullName.includes(q) ||
//         u.role?.toLowerCase().includes(q) ||
//         (u.brokerName ?? "").toLowerCase().includes(q)
//       );
//     });
//   }, [users, search]);

//   // Pagination (client-side)
//   const total = filtered.length;
//   const totalPages = Math.max(1, Math.ceil(total / pageSize));
//   const currentPage = Math.min(page, totalPages);
//   const start = (currentPage - 1) * pageSize;
//   const pageRows = filtered.slice(start, start + pageSize);

//   // const fmtDate = (iso?: string) =>
//   //   iso ? new Date(iso).toLocaleString("en-IN") : "-";

//   const fullName = (u: User) =>
//     [u.firstName, u.lastName].filter(Boolean).join(" ") || "-";

//   const handleGenerateToken = async (user: User) => {
//     try {
//       const response = await axios.get(`${API_URL}/admin/getuser/profile`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           UserId: user.id,
//         },
//       });

//       const data = response.data;

//       if (data.status === true) {
//         const angel_auth_token = data.data.authToken;
//         const angel_refresh_token = data.data.refreshToken;
//         const angel_feed_token = data.data.feedToken;
//         const userID = data.data.id;

//         // ✅ fixed the storage order
//         localStorage.setItem("angel_token", angel_auth_token || "");
//         localStorage.setItem("angel_feed_token", angel_feed_token || "");
//         localStorage.setItem("angel_refresh_token", angel_refresh_token || "");
//         localStorage.setItem("userID", String(userID));

//         toast.success("Successful: fetched AngelOne tokens!");
//       } else {
//         toast.error(data?.data?.error || "Failed to fetch tokens");
//       }
//     } catch (error: any) {
//       toast.error(error?.message || "Something went wrong");
//     }
//   };

//   // ─── Row Action handlers ───────────────────────────────────────────
//   const handleRowLogin = async (user: User) => {
    
//       try {
          
//          const {data} = await axios.get(
//           `${API_URL}/admin/login/totp/angelone`,
//           {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//               userId: `${user.id}`,
//             },
//           }
//         );

  
//        if(data.status==true) {
       
//        let angel_auth_token = data.data.jwtToken
//        let angel_refresh_token = data.data.refreshToken
//        let angel_feed_token = data.data.feedToken

//        localStorage.setItem("angel_token", angel_auth_token);
//        localStorage.setItem("angel_feed_token", angel_refresh_token);
//         localStorage.setItem("angel_refresh_token", angel_feed_token);
//          localStorage.setItem("userID", String(user.id));

    
//         toast.success("Login Successful in AngelOne!");
//        }else{
//          toast.error(data.message);
//        }


//       } catch (error:any) {
//         toast.error(error.message);
//       }
    

//   };



//   const fetchStrategies = async () => {
//   try {
//     const res = await axios.get(`${API_URL}/admin/strategies`, {
//       headers: {
//         Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//         AngelOneToken: localStorage.getItem("angel_token") || "",
//         userid: localStorage.getItem("userID"),
//       },
//     });

//     console.log(res);
    

//     if (res.data.status === true) {
//       setStrategyList(res.data.data || []);
//     } else {
//       toast.error(res.data.message);
//     }
//   } catch (err:any) {
//     toast.error(err.message);
//   }
// };

//   const handleRowCreateGroup = async(user: User) => {

//     setOpenMenuId(null);
//     setSelectedUserForGroup(user);
//     setGroupName("");
//     setGroupDescription("");
    
//    await fetchStrategies(); // ⭐ load all strategies first

//   setIsPackageAssignModalOpen(true);
//   };

//   const submitCreateStrtegy  = async function () {
 
//     let reqData = {
//       strategyName:groupName,
//       strategyDis:groupDescription,
//       id:selectedUserForGroup?.id
      
//     }

//     // 1) Create the group — adjust endpoint if different
//       const createRes = await axios.put(
//         `${API_URL}/users/package/update`,
//         reqData,
//          {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         }
//       );

//       if(createRes.data.status==true) {
//         toast.success(createRes.data.message);
//           fetchUsers()
//       }else{
//          toast.error( createRes?.data?.message);
//       }
      

     


//   }


  

//     const handleAssignPackage = (user: User) => {

//     //  toast.info(`Currently not Working ${user.id}`);
//     setOpenMenuId(null);
//     setSelectedUserForGroup(user);
//     setGroupName("");
//     setGroupDescription("");
//     setIsGroupModalOpen(true);
//   };

//   const handleRowUpdateProfile = (user: User) => {
   
//     toast.info(`Currently not Working ${user.id}`);
//   };

//   const toggleMenu = (id: number) => {
//     setOpenMenuId((prev) => (prev === id ? null : id));
//   };

//   // ==== Create Group Modal handlers ====
//   const closeGroupModal = () => {
   
//     setIsGroupModalOpen(false);
//     setSelectedUserForGroup(null);
//   };


//     // ==== Create Group Modal handlers ====
//   const closePackageModal = () => {

//     setIsPackageAssignModalOpen(false);

//   };

//   const submitCreateGroup = async () => {

//     if (!groupName.trim() || !selectedUserForGroup) {
//       toast.error("Group name is required.");
//       return;
//     }
    
//     let reqObj = {
//       id:selectedUserForGroup.id,
//        packageName:groupName,
//        packageDis:groupDescription,
//        packageDate:date

//     }

//     try {

//       setCreating(true);

//       // 1) Create the group — adjust endpoint if different
//       const createRes = await axios.put(
//         `${API_URL}/users/package/update`,
//         reqObj,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//           },
//         }
//       );

//       console.log(createRes);
      

//       closeGroupModal();

    
//     } catch (err: any) {
//       toast.error(
//         err?.response?.data?.message || err?.message || "Failed to create group"
//       );
//     } finally {
//       setCreating(false);
//     }
//   };

//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-start gap-3">
//         <h2 className="text-xl font-semibold">Users</h2>

//         {/* Search next to heading */}
//         <div className="flex gap-3 md:ml-4">
//           <input
//             className="border rounded px-3 py-2 w-90"
//             placeholder="Search name, email, username, phone..."
//             value={search}
//             onChange={(e) => {
//               setSearch(e.target.value);
//               setPage(1);
//             }}
//           />
//           <button
//             onClick={fetchUsers}
//             className="rounded bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
//           >
//             Refresh
//           </button>
//         </div>
//       </div>

//       {/* Status */}
//       {loading && <p>Loading…</p>}
//       {!!error && <p className="text-red-600">{error}</p>}
//       {!loading && !error && users.length === 0 && <p>No users found.</p>}

//       {/* Table */}
//       {!loading && !error && users.length > 0 && (
//         <div ref={tableRef} className="w-full overflow-auto rounded border">
//           <table className="min-w-[1100px] w-full text-sm">
//             <thead className="bg-gray-50">
//               <tr className="text-left">
//                 <th className="px-3 py-2 border-b">#</th>
//                 <th className="px-3 py-2 border-b">Name</th>
//                 <th className="px-3 py-2 border-b">Email</th>
//                 <th className="px-3 py-2 border-b">Username</th>
//                  <th className="px-3 py-2 border-b">Phone</th>
//                   <th className="px-3 py-2 border-b">createdAt</th>
//                     <th className="px-3 py-2 border-b">Angel Login</th>
                 
//                   {/* <th className="px-3 py-2 border-b">Assign Package</th>
//                    <th className="px-3 py-2 border-b">Assign Strategy</th> */}
               
//                 {/* <th className="px-3 py-2 border-b">Broker</th> */}
              
//                 {/* <th className="px-3 py-2 border-b">AngelClientId</th> */}
//                 <th className="px-3 py-2 border-b text-center">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {pageRows.map((u, idx) => (
//                 <tr key={u.id} className="odd:bg-white even:bg-gray-50">
//                   <td className="px-3 py-2 border-b">{start + idx + 1}</td>
//                   <td className="px-3 py-2 border-b">{fullName(u)}</td>
//                   <td className="px-3 py-2 border-b">{u.email}</td>
//                   <td className="px-3 py-2 border-b">{u.username}</td>
//                   <td className="px-3 py-2 border-b">{u.phoneNumber ?? "-"}</td>
//                   {/* <td className="px-3 py-2 border-b">{u.brokerName ?? "-"}</td> */}

//                   {/* <td className="px-3 py-2 border-b">{u.packageName ?? "-"}</td> 
//                    <td className="px-3 py-2 border-b">{u.strategyName ?? "-"}</td> */}
                  
//                    <td className="px-3 py-2 border-b">{u.createdAt ?? "-"}</td>
//                   <td
//                     className={`px-3 py-2 border-b font-medium text-center ${
//                       u.angelLoginUser
//                         ? "text-green-700 bg-green-50"
//                         : "text-red-700 bg-red-50"
//                     }`}
//                   >
//                     {u.angelLoginUser ? "Yes" : "No"}
//                   </td>

//                   {/* <td className="px-3 py-2 border-b">
//                     {u?.angelCredential?.clientId}
//                   </td> */}

//                   {/* Actions menu (3-dots) */}
//                   <td className="px-3 py-2 border-b text-center relative">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         toggleMenu(u.id);
//                       }}
//                       className="p-1 hover:bg-gray-100 rounded inline-flex"
//                       aria-label="Actions"
//                     >
//                       <EllipsisVerticalIcon className="h-5 w-5 text-gray-600" />
//                     </button>

//                     {openMenuId === u.id && (
//                       <div
//                         onClick={(e) => e.stopPropagation()}
//                         className="absolute right-2 top-8 z-20 bg-white shadow-lg border rounded-md w-44 text-sm overflow-hidden"
//                       >
//                         <button
//                           onClick={() => handleGenerateToken(u)}
//                           className="block w-full text-left px-4 py-2 hover:bg-gray-100"
//                         >
//                           Get Token
//                         </button>
//                         <button
//                           onClick={() => handleRowLogin(u)}
//                           className="block w-full text-left px-4 py-2 hover:bg-gray-100"
//                         >
//                           Login User
//                         </button>
//                         <button
//                           onClick={() => handleRowCreateGroup(u)}
//                           className="block w-full text-left px-4 py-2 hover:bg-gray-100"
//                         >
//                           Assign Group
//                         </button>
//                         <button
//                           onClick={() => handleRowUpdateProfile(u)}
//                           className="block w-full text-left px-4 py-2 hover:bg-gray-100"
//                         >
//                           Update Profile
//                         </button>
//                         {/* <button
//                             onClick={() => window.open(`${import.meta.env.VITE_API_URL_FORNTEND}/new/deshboard`, "_blank")}
//                           >
//                             View Client Dashboard
//                           </button> */}

//                           <button
//                             onClick={() =>
//                               window.location.href = `${import.meta.env.VITE_API_URL_FORNTEND}/new/deshboard`
//                             }
//                              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
//                           >
//                             View Client Dashboard
//                           </button>

//                            <button
//                             className="block w-full text-left px-4 py-2 hover:bg-gray-100"
//                              onClick={() => handleAssignPackage(u)}
                            
//                           >
//                            Assign Package
//                           </button>
                         
//                       </div>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* Pagination */}
//       {!loading && !error && total > 0 && (
//         <div className="mt-4 flex items-center gap-3 flex-wrap">
//           <span className="text-sm text-gray-600">
//             Showing {start + 1}-{Math.min(start + pageSize, total)} of {total}
//           </span>

//           <select
//             value={pageSize}
//             onChange={(e) => {
//               setPageSize(Number(e.target.value));
//               setPage(1);
//             }}
//             className="border rounded px-2 py-1"
//           >
//             {[10, 25, 50, 100].map((n) => (
//               <option key={n} value={n}>
//                 {n} / page
//               </option>
//             ))}
//           </select>

//           <div className="ml-auto flex gap-2">
//             <button
//               disabled={currentPage <= 1}
//               onClick={() => setPage((p) => Math.max(1, p - 1))}
//               className={`px-3 py-1 rounded border ${
//                 currentPage <= 1
//                   ? "text-gray-400 border-gray-200"
//                   : "hover:bg-gray-100"
//               }`}
//             >
//               Prev
//             </button>
//           </div>

//           <span className="px-2 py-1 text-sm">
//             Page {currentPage} / {totalPages}
//           </span>

//           <div className="flex gap-2">
//             <button
//               disabled={currentPage >= totalPages}
//               onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//               className={`px-3 py-1 rounded border ${
//                 currentPage >= totalPages
//                   ? "text-gray-400 border-gray-200"
//                   : "hover:bg-gray-100"
//               }`}
//             >
//               Next
//             </button>
//           </div>
//         </div>
//       )}

//       {/* ==== this is Create Package Form ==== */}
//       {isGroupModalOpen && (
//         <div
//           className="fixed inset-0 z-40 flex items-center justify-center"
//           aria-modal="true"
//           role="dialog"
//         >
//           {/* Backdrop */}
//           <div
//             className="absolute inset-0 bg-black/40"
//             onClick={closeGroupModal}
//           />

//           {/* Modal Card */}
//           <div className="relative z-50 w-full max-w-md rounded-lg bg-white shadow-xl border">
//             <div className="px-5 py-4 border-b">
//               <h3 className="text-lg font-semibold">Package Name</h3>
//               {/* <p className="text-sm text-gray-600 mt-1">
//                 Package Name{" "}
//                 <span className="font-medium">
//                   {selectedUserForGroup ? selectedUserForGroup.username : "-"}
//                 </span>{" "}
//                 to a new group.
//               </p> */}
//             </div>

//             <div className="px-5 py-4 space-y-3">
//               <div>
//                 <label className="block text-sm mb-1">Package Name *</label>
//                 <input
//                   value={groupName}
//                   onChange={(e) => setGroupName(e.target.value)}
//                   className="w-full border rounded px-3 py-2"
//                   placeholder="Package Name"
//                   autoFocus
//                 />
//               </div>

//                <div>
//               <label className="block text-sm mb-1">Select Date</label>
//               <input
//                 type="date"
//                 value={date}
//                 onChange={(e) => setDate(e.target.value)}
//                 className="w-full border rounded px-3 py-2"
//               />
//             </div>
//               <div>
//                 <label className="block text-sm mb-1">Description</label>
//                 <textarea
//                   value={groupDescription}
//                   onChange={(e) => setGroupDescription(e.target.value)}
//                   className="w-full border rounded px-3 py-2"
//                   placeholder="Optional notes…"
//                   rows={3}
//                 />
//               </div>
//             </div>

//             <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
//               <button
//                 onClick={closeGroupModal}
//                 disabled={creating}
//                 className="px-4 py-2 rounded border hover:bg-gray-50 disabled:opacity-60"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={submitCreateGroup}
//                 disabled={creating}
//                 className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
//               >
//                 {creating ? "Creating…" : "Create & Assign"}
//               </button>

//             </div>
//           </div>
//         </div>
//       )}


//       {/*  this is Assign Group Form  */}

//       {isPackageAssignModalOpen && (
//   <div className="fixed inset-0 z-40 flex items-center justify-center">
//     <div className="absolute inset-0 bg-black/40" onClick={closePackageModal} />

//     <div className="relative z-50 w-full max-w-md rounded-lg bg-white shadow-xl border">
//       <div className="px-5 py-4 border-b">
//         <h3 className="text-lg font-semibold">Assign Strategy</h3>
//       </div>

//       <div className="px-5 py-4 space-y-3">

//         {/* 🔽 Strategy Dropdown */}
//         <div>
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
//                 setGroupDescription(selected.strategyDis);
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

        

//         {/* Description */}
//         <div>
//           <label className="block text-sm mb-1">Description</label>
//           <textarea
//             value={groupDescription}
//             onChange={(e) => setGroupDescription(e.target.value)}
//             className="w-full border rounded px-3 py-2"
//             rows={3}
//             placeholder="Optional notes..."
//           />
//         </div>
//       </div>

//       <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
//         <button
//           onClick={closePackageModal}
//           className="px-4 py-2 rounded border hover:bg-gray-50"
//         >
//           Cancel
//         </button>

//         <button
//           onClick={submitCreateStrtegy}
//           className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
//         >
//           Create & Assign
//         </button>
//       </div>
//     </div>
//   </div>
// )}
//     </div>
//   );
// }


import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

type Role = "admin" | "user";

export type AngelCredential = {
  clientId: string;
  totpSecret: string;
  password: string;
};

export type User = {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  username: string;
  phoneNumber?: string | null;
  role: Role;
  isChecked: boolean;
  brokerName?: string | null;
  brokerImageLink?: string | null;
  angelLoginUser?: boolean | null;
  authToken?: string | null;
  feedToken?: string | null;
  refreshToken?: string | null;
  resetCode?: string | null;
  resetCodeExpire?: string | null;
  createdAt: string;
  updatedAt: string;
  angelCredential: AngelCredential;
  packageName: string;
  strategyName: string;
  packageDate: string;
  angelFund: any;
  status: any;
  message: any;
};

const API_URL = import.meta.env.VITE_API_URL;

export default function UserReport() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [search, setSearch] = useState("");

  // AG Grid ref
  const gridRef = useRef<AgGridReact>(null);

  // Modal states
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isPackageAssignModalOpen, setIsPackageAssignModalOpen] = useState(false);
  const [selectedUserForGroup, setSelectedUserForGroup] = useState<User | null>(null);
  const [groupName, setGroupName] = useState("");
  const [date, setDate] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedStrategyId, setSelectedStrategyId] = useState("");

  // Column Definitions
  const [columnDefs] = useState<any>([
    {
      headerName: "Sr No.",
      valueGetter: "node.rowIndex + 1",
      width: 100,
      minWidth: 80,
      maxWidth: 120,
      cellStyle: {
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      headerClass: 'text-center',
      sortable: false,
      filter: false,
    },
    {
      field: "firstName",
      headerName: "Name",
      width: 200,
      minWidth: 150,
      cellStyle: {
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start'
      },
      valueGetter: (params: any) => {
        const u = params.data;
        return [u.firstName, u.lastName].filter(Boolean).join(" ") || "-";
      },
      filter: "agTextColumnFilter",
    },
    {
      field: "username",
      headerName: "Username",
      filter: "agTextColumnFilter",
      width: 180,
      minWidth: 150,
      cellStyle: {
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start'
      }
    },
    {
      field: "brokerName",
      headerName: "Broker",
      filter: "agTextColumnFilter",
      valueFormatter: (params: any) => params.value || "-",
      width: 150,
      minWidth: 120,
      cellStyle: {
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start'
      }
    },
    {
      field: "angelFund",
      headerName: "Fund",
      valueFormatter: (params: any) =>
        params.value != null ? `₹${Number(params.value).toFixed(2)}` : "-",
      filter: "agNumberColumnFilter",
      width: 150,
      minWidth: 120,
      cellStyle: {
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start'
      }
    },
    {
      field: "status",
      headerName: "Status",
      valueFormatter: (params: any) => params.value || "-",
      filter: "agTextColumnFilter",
      width: 200,
      minWidth: 150,
      cellStyle: {
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start'
      }
    },
    {
      field: "message",
      headerName: "Message",
      valueFormatter: (params: any) => params.value || "-",
      filter: "agTextColumnFilter",
      flex: 1,
      width: 600,
      minWidth: 580,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start'
      }
    },
  ]);

  // Default column definitions
  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 120,
    autoHeight: true,
    cellStyle: {
      display: 'flex',
      alignItems: 'center',
      borderRight: '1px solid #e2e8f0'
    },
    headerClass: 'font-semibold text-gray-700'
  }), []);

  // Custom styles
  const getRowStyle = () => ({
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0'
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_URL}/admin/angel/funds/refresh`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });

      const payload = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setUsers(payload);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to load users"
      );
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Quick filter for search
  useEffect(() => {
    if (gridRef.current && gridRef.current.api) {
      (gridRef.current.api as any).setQuickFilter(search);
    }
  }, [search]);

  // Close modals on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isGroupModalOpen && !creating) closeGroupModal();
        if (isPackageAssignModalOpen) closePackageModal();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isGroupModalOpen, isPackageAssignModalOpen, creating]);

  const onGridReady = (params: any) => {

    console.log("Grid ready",params);
  };

  // Modal functions
  const closeGroupModal = () => {
    setIsGroupModalOpen(false);
    setSelectedUserForGroup(null);
    setGroupName("");
    setDate("");
    setGroupDescription("");
  };

  const closePackageModal = () => {
    setIsPackageAssignModalOpen(false);
    setSelectedStrategyId("");
    setGroupDescription("");
  };

  const submitCreateStrategy = async () => {
    if (!selectedStrategyId) {
      toast.error("Please select a strategy");
      return;
    }

    const reqData = {
      strategyName: groupName,
      strategyDis: groupDescription,
      id: selectedUserForGroup?.id
    };

    try {
      setCreating(true);
      const createRes = await axios.put(
        `${API_URL}/users/package/update`,
        reqData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      if (createRes.data.status) {
        toast.success(createRes.data.message);
        fetchUsers();
        closePackageModal();
      } else {
        toast.error(createRes?.data?.message);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create strategy");
    } finally {
      setCreating(false);
    }
  };

  const submitCreateGroup = async () => {
    if (!groupName.trim() || !selectedUserForGroup) {
      toast.error("Group name is required.");
      return;
    }

    const reqObj = {
      id: selectedUserForGroup.id,
      packageName: groupName,
      packageDis: groupDescription,
      packageDate: date
    };

    try {
      setCreating(true);
      const createRes = await axios.put(
        `${API_URL}/users/package/update`,
        reqObj,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      if (createRes.data.status) {
        toast.success("Package created successfully");
        fetchUsers();
        closeGroupModal();
      } else {
        toast.error(createRes?.data?.message);
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to create package"
      );
    } finally {
      setCreating(false);
    }
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(8)].map((_, index) => (
        <div key={index} className="flex space-x-4 animate-pulse">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
              <p className="text-gray-600">Manage and monitor all user accounts and their funds</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  className="pl-10 pr-4 py-3 w-full lg:w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white! font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {!loading && !error && users.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2  gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-100 text-green-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v1m0 6v1m0 1v1m6-13h2a2 2 0 012 2v2a2 2 0 01-2 2h-2m-6 0H6a2 2 0 01-2-2V6a2 2 0 012-2h2m0 0V4a2 2 0 012-2h4a2 2 0 012 2v2M6 8h12" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Brokers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter(u => u.brokerName).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Loading State */}
          {loading && (
            <div className="p-8">
              <div className="flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
              <p className="text-center text-gray-600 text-lg">Loading user data...</p>
              <div className="mt-8">
                <LoadingSkeleton />
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load users</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
              <button
                onClick={fetchUsers}
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && users.length === 0 && (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600 mb-6">There are no users to display at the moment.</p>
              <button
                onClick={fetchUsers}
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Refresh Data
              </button>
            </div>
          )}

          {/* Data Grid */}
          {!loading && !error && users.length > 0 && (
            <div className="ag-theme-alpine custom-ag-grid" style={{ height: 600, width: '100%' }}>
              <AgGridReact
                ref={gridRef}
                rowData={users}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                pagination={true}
                paginationPageSize={25}
                onGridReady={onGridReady}
                suppressCellFocus={true}
                animateRows={true}
                enableCellTextSelection={true}
                ensureDomOrder={true}
                getRowStyle={getRowStyle}
                rowHeight={60}
                headerHeight={60}
              />
            </div>
          )}
        </div>

        {/* Modals */}
        {/* Create Package Modal */}
        {isGroupModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={closeGroupModal} />
            <div className="relative z-50 w-full max-w-md transform transition-all">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <h3 className="text-lg font-semibold">Create Package</h3>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Package Name *</label>
                    <input
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="Enter package name"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="Optional package description..."
                      rows={3}
                    />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
                  <button
                    onClick={closeGroupModal}
                    disabled={creating}
                    className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 transition-colors duration-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitCreateGroup}
                    disabled={creating}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 flex items-center"
                  >
                    {creating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      'Create & Assign'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assign Strategy Modal */}
        {isPackageAssignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closePackageModal} />
            <div className="relative z-50 w-full max-w-md transform transition-all">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-600 to-green-700 text-white">
                  <h3 className="text-lg font-semibold">Assign Strategy</h3>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Strategy *</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                      value={selectedStrategyId}
                      onChange={(e) => setSelectedStrategyId(e.target.value)}
                    >
                      <option value="">Choose a strategy</option>
                      {/* Add your strategy options here */}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                      rows={3}
                      placeholder="Optional strategy notes..."
                    />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
                  <button
                    onClick={closePackageModal}
                    className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitCreateStrategy}
                    className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 focus:ring-2 focus:ring-green-500 transition-all duration-200"
                  >
                    Create & Assign
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}