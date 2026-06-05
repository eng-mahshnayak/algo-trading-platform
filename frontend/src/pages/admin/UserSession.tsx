import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { 
  FiSearch, 
  FiRefreshCw, 
  FiTrash2, 
  FiUsers,
  FiClock,
  FiLogOut,
  FiLogIn,
  FiActivity,
  FiX,
  FiUser
} from "react-icons/fi";

/* ================= TYPES ================= */

export type UserSession = {
  id: number;
  userId: number;
  login_at: string;
  logout_at: string | null;
  display_name: string | null;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  user_name?: string;
};

/* ================= CONFIG ================= */

const API_URL = import.meta.env.VITE_API_URL;

/* ================= COMPONENT ================= */

export default function UserSessionPage() {
  const gridRef = useRef<AgGridReact>(null);

  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [searchUserId, setSearchUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  const totalPages = Math.ceil(totalRecords / pageSize);

  /* ================= COLUMNS ================= */

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: "",
        checkboxSelection: true,
        headerCheckboxSelection: true,
        width: 50,
        pinned: "left",
      },
      {
        headerName: "#",
        width: 80,
        valueGetter: (p: any) => (page - 1) * pageSize + (p.node.rowIndex + 1),
        cellStyle: { textAlign: "center", fontWeight: "500" },
      },
      {
        field: "user_name",
        headerName: "User",
        width: 180,
        minWidth: 150,
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FB3800] to-orange-500 flex items-center justify-center text-white text-xs font-bold">
              {params.value?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-800">{params.value || "-"}</span>
              <span className="text-xs text-gray-400">ID: {params.data.userId}</span>
            </div>
          </div>
        ),
        cellStyle: { display: "flex", alignItems: "center" },
      },
      {
        field: "display_name",
        headerName: "Address / Details",
        width: 350,
        minWidth: 300,
        flex: 1,
        cellRenderer: (params: any) => (
          <div className="flex flex-col">
            <span className="text-sm text-gray-700">{params.value || "-"}</span>
            <span className="text-xs text-gray-400 mt-0.5">
              {params.data?.login_at ? new Date(params.data.login_at).toLocaleDateString() : ""}
            </span>
          </div>
        ),
      },
      {
        field: "login_at",
        headerName: "Login Time",
        width: 180,
        minWidth: 160,
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-2">
            <FiLogIn className="text-green-500" size={14} />
            <span className="text-sm">{new Date(params.value).toLocaleString()}</span>
          </div>
        ),
      },
      {
        field: "logout_at",
        headerName: "Logout Time",
        width: 180,
        minWidth: 160,
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-2">
            <FiLogOut className="text-red-500" size={14} />
            <span className="text-sm">{params.value ? new Date(params.value).toLocaleString() : "-"}</span>
          </div>
        ),
      },
      {
        field: "is_active",
        headerName: "Status",
        width: 120,
        cellRenderer: (params: any) => (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            params.value ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${params.value ? "bg-green-500" : "bg-red-500"}`} />
            {params.value ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        headerName: "Action",
        width: 100,
        pinned: "right",
        cellRenderer: (params: any) => (
          <button
            onClick={() => deleteOne(params.data.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
          >
            <FiTrash2 size={12} />
            Delete
          </button>
        ),
      },
    ],
    [page, pageSize]
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      wrapText: true,
      autoHeight: true,
      cellStyle: {
        display: "flex",
        alignItems: "center",
        borderRight: "1px solid #e2e8f0",
      },
    }),
    []
  );

  const getRowStyle = () => ({
    height: "65px",
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid #e2e8f0",
  });

  /* ================= API ================= */

  const fetchSessions = async (pageNo = page, size = pageSize) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_URL}/admin/getusersession/data`,
        {
          params: {
            page: pageNo,
            size,
            userId: searchUserId || undefined,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      setSessions(res.data.data || []);
      setTotalRecords(res.data.pagination?.totalRecords || 0);
      setPage(pageNo);
      setPageSize(size);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to fetch sessions");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */

  const deleteOne = async (id: number) => {
    if (!confirm("Delete this session?")) return;

    try {
      await axios.delete(`${API_URL}/admin/deleteusersession/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });
      toast.success("Session deleted");
      fetchSessions(page, pageSize);
    } catch {
      toast.error("Delete failed");
    }
  };

  const deleteSelected = async () => {
    const selected = gridRef.current?.api.getSelectedRows() || [];
    if (!selected.length) {
      toast.info("No rows selected");
      return;
    }
    if (!confirm(`Delete ${selected.length} sessions?`)) return;

    const ids = selected.map((r: UserSession) => r.id);
    try {
      await axios.post(
        `${API_URL}/admin/deleteusersession/many`,
        { ids },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } }
      );
      toast.success("Selected sessions deleted");
      fetchSessions(page, pageSize);
    } catch {
      toast.error("Bulk delete failed");
    }
  };

  /* ================= EFFECT ================= */

  useEffect(() => {
    fetchSessions(1, pageSize);
  }, []);

  // Calculate stats
  const activeSessions = sessions.filter(s => s.is_active).length;
  const totalUsers = new Set(sessions.map(s => s.userId)).size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 md:px-6 lg:px-8 py-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-[#FB3800] to-orange-500 rounded-xl">
              <FiClock className="text-white" size={24} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">User Sessions</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            Monitor and manage user login sessions across the platform
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{totalRecords}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <FiClock className="text-blue-500" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Active Sessions</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{activeSessions}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <FiActivity className="text-green-500" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Unique Users</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{totalUsers}</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <FiUsers className="text-purple-500" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Inactive</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{totalRecords - activeSessions}</p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <FiLogOut className="text-red-500" size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="number"
                placeholder="Search by User ID"
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-56 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
              />
            </div>

            <button
              onClick={() => fetchSessions(1, pageSize)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#FB3800] to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-[#FB3800] transition-all shadow-sm"
            >
              <FiSearch size={16} />
              Search
            </button>

            <button
              onClick={() => {
                setSearchUserId("");
                fetchSessions(1, pageSize);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all"
            >
              <FiX size={16} />
              Clear
            </button>

            <div className="flex-1"></div>

            <button
              onClick={deleteSelected}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all shadow-sm"
            >
              <FiTrash2 size={16} />
              Delete Selected
            </button>

            <button
              onClick={() => fetchSessions(page, pageSize)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all"
            >
              <FiRefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* AG Grid Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="ag-theme-alpine" style={{ height: "550px", width: "100%" }}>
            <AgGridReact
              ref={gridRef}
              rowData={sessions}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              getRowStyle={getRowStyle}
              rowSelection="multiple"
              rowHeight={60}
              headerHeight={48}
              enableCellTextSelection={true}
              ensureDomOrder={true}
              suppressRowClickSelection={true}
              suppressPaginationPanel={true}
              loading={loading}
              animateRows={true}
              overlayLoadingTemplate={'<div class="flex justify-center items-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FB3800]"></div><span class="ml-3 text-gray-500">Loading sessions...</span></div>'}
              overlayNoRowsTemplate={'<div class="flex justify-center items-center h-full text-gray-400">No sessions found</div>'}
            />
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap justify-between items-center gap-4 mt-6">
          <div className="text-sm text-gray-500">
            Showing page <span className="font-semibold text-gray-700">{page}</span> of{" "}
            <span className="font-semibold text-gray-700">{totalPages}</span> | Total records:{" "}
            <span className="font-semibold text-gray-700">{totalRecords}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              disabled={page === 1}
              onClick={() => fetchSessions(page - 1, pageSize)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <button
              disabled={page === totalPages}
              onClick={() => fetchSessions(page + 1, pageSize)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>

            <select
              value={pageSize}
              onChange={(e) => fetchSessions(1, Number(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FB3800]/20"
            >
              {[10, 25, 50, 100, 500, 1000].map((s) => (
                <option key={s} value={s}>{s} / page</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}