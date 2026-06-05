import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { 
  FiSearch, 
  FiRefreshCw, 
  FiUsers, 
  FiUserCheck,
  FiAlertCircle,
  FiX,
  FiCalendar,
  FiTag,
  FiFileText,
  FiTrendingUp,
  FiTrendingDown
} from "react-icons/fi";

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

  // Cell renderers
  const pnlCellRenderer = (params: any) => {
    const value = params.value;
    const n = Number(value);
    const isPositive = n > 0;
    const isNegative = n < 0;

    if (n === 0 || isNaN(n)) {
      return <span className="text-gray-400">₹0.00</span>;
    }

    return (
      <span className={`inline-flex items-center gap-1 font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive && <FiTrendingUp size={12} />}
        {isNegative && <FiTrendingDown size={12} />}
        {new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 2,
        }).format(n)}
      </span>
    );
  };

  const statusCellRenderer = (params: any) => {
    const status = params.value;
    if (!status || status === "-") {
      return <span className="text-gray-400">—</span>;
    }
    const isSuccess = status.toLowerCase().includes('success') || status.toLowerCase().includes('active');
    const isError = status.toLowerCase().includes('error') || status.toLowerCase().includes('failed');
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        isSuccess ? 'bg-green-100 text-green-700' : 
        isError ? 'bg-red-100 text-red-700' : 
        'bg-yellow-100 text-yellow-700'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${
          isSuccess ? 'bg-green-500' : 
          isError ? 'bg-red-500' : 
          'bg-yellow-500'
        }`} />
        {status}
      </span>
    );
  };

  // Column Definitions
  const columnDefs = useMemo(() => [
    {
      headerName: "#",
      width: 70,
      minWidth: 60,
      maxWidth: 80,
      valueGetter: "node.rowIndex + 1",
      cellStyle: { textAlign: "center", fontWeight: "500" },
      sortable: false,
      filter: false,
    },
    {
      field: "firstName",
      headerName: "User",
      width: 200,
      minWidth: 160,
      cellRenderer: (params: any) => {
        const u = params.data;
        const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || "-";
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">{name}</span>
            <span className="text-xs text-gray-400">{u.email || "-"}</span>
          </div>
        );
      },
      filter: "agTextColumnFilter",
    },
    {
      field: "username",
      headerName: "Username",
      width: 150,
      minWidth: 130,
      cellRenderer: (params: any) => (
        <code className="text-xs font-mono text-gray-600">@{params.value || "-"}</code>
      ),
      filter: "agTextColumnFilter",
    },
    {
      field: "brokerName",
      headerName: "Broker",
      width: 130,
      minWidth: 110,
      valueFormatter: (params: any) => params.value || "-",
      cellRenderer: (params: any) => (
        <span className="inline-flex px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">
          {params.value || "-"}
        </span>
      ),
      filter: "agTextColumnFilter",
    },
    {
      field: "angelFund",
      headerName: "Fund",
      width: 140,
      minWidth: 120,
      cellRenderer: pnlCellRenderer,
      filter: "agNumberColumnFilter",
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      minWidth: 120,
      cellRenderer: statusCellRenderer,
      filter: "agTextColumnFilter",
    },
    {
      field: "message",
      headerName: "Message",
      minWidth: 250,
      flex: 1,
      cellRenderer: (params: any) => (
        <span className="text-sm text-gray-500 truncate block" title={params.value}>
          {params.value || "—"}
        </span>
      ),
      filter: "agTextColumnFilter",
    },
  ], []);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 100,
    cellStyle: { display: 'flex', alignItems: 'center' },
  }), []);

  const getRowStyle = () => ({
    height: '65px',
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
      setError(err?.response?.data?.message || err?.message || "Failed to load users");
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
    console.log("Grid ready", params);
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
        { headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } }
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
      toast.error("Package name is required.");
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
        { headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } }
      );

      if (createRes.data.status) {
        toast.success("Package created successfully");
        fetchUsers();
        closeGroupModal();
      } else {
        toast.error(createRes?.data?.message);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to create package");
    } finally {
      setCreating(false);
    }
  };

  // Calculate stats
  const totalUsers = users.length;
  const activeBrokers = users.filter(u => u.brokerName).length;
  const totalFund = users.reduce((sum, u) => sum + (Number(u.angelFund) || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 md:px-6 lg:px-8 py-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-[#FB3800] to-orange-500 rounded-xl">
              <FiUsers className="text-white" size={24} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">User Management</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            Manage and monitor all user accounts and their funds
          </p>
        </div>

        {/* Stats Cards */}
        {!loading && !error && users.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Total Users</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{totalUsers}</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FiUsers className="text-blue-500" size={20} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Active Brokers</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{activeBrokers}</p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <FiUserCheck className="text-green-500" size={20} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Total Fund</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      minimumFractionDigits: 0,
                    }).format(totalFund)}
                  </p>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg">
                  <FiTrendingUp className="text-purple-500" size={20} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Avg Fund/User</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      minimumFractionDigits: 0,
                    }).format(totalUsers > 0 ? totalFund / totalUsers : 0)}
                  </p>
                </div>
                <div className="p-2 bg-orange-50 rounded-lg">
                  <FiUserCheck className="text-orange-500" size={20} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                  placeholder="Search by name, email, username..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={fetchUsers}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#FB3800] to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-[#FB3800] transition-all disabled:opacity-50 shadow-sm"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-[#FB3800]/20 rounded-full"></div>
                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-[#FB3800] rounded-full animate-spin border-t-transparent"></div>
              </div>
              <p className="mt-4 text-gray-500">Loading user data...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="flex flex-col items-center">
              <div className="p-3 bg-red-100 rounded-full mb-4">
                <FiAlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load users</h3>
              <p className="text-gray-600 mb-4 max-w-md">{error}</p>
              <button
                onClick={fetchUsers}
                className="px-5 py-2.5 bg-gradient-to-r from-[#FB3800] to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-[#FB3800] transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && users.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="flex flex-col items-center">
              <div className="p-3 bg-gray-100 rounded-full mb-4">
                <FiUsers className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">There are no users to display at the moment.</p>
            </div>
          </div>
        )}

        {/* AG Grid Table */}
        {!loading && !error && users.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="ag-theme-alpine" style={{ height: "550px", width: "100%" }}>
              <AgGridReact
                ref={gridRef}
                rowData={users}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                pagination={true}
                paginationPageSize={25}
                paginationPageSizeSelector={[10, 25, 50, 100]}
                onGridReady={onGridReady}
                suppressCellFocus={true}
                animateRows={true}
                enableCellTextSelection={true}
                ensureDomOrder={true}
                getRowStyle={getRowStyle}
                rowHeight={60}
                headerHeight={48}
                overlayNoRowsTemplate={'<div class="flex justify-center items-center h-full text-gray-400">No users found</div>'}
              />
            </div>
          </div>
        )}
      </div>

      {/* Create Package Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeGroupModal} />
          <div className="relative z-50 w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden animate-fadeIn">
            <div className="bg-gradient-to-r from-[#FB3800] to-orange-500 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FiTag className="text-white" size={20} />
                <h3 className="text-lg font-semibold text-white">Create Package</h3>
              </div>
              <button onClick={closeGroupModal} className="text-white hover:text-gray-200 transition">
                <FiX size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Package Name *</label>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                  placeholder="Enter package name"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                  placeholder="Optional package description..."
                  rows={3}
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={closeGroupModal}
                disabled={creating}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={submitCreateGroup}
                disabled={creating}
                className="px-4 py-2 bg-gradient-to-r from-[#FB3800] to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-[#FB3800] transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Creating...
                  </>
                ) : (
                  'Create & Assign'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Strategy Modal */}
      {isPackageAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closePackageModal} />
          <div className="relative z-50 w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden animate-fadeIn">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FiFileText className="text-white" size={20} />
                <h3 className="text-lg font-semibold text-white">Assign Strategy</h3>
              </div>
              <button onClick={closePackageModal} className="text-white hover:text-gray-200 transition">
                <FiX size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Strategy *</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                  value={selectedStrategyId}
                  onChange={(e) => setSelectedStrategyId(e.target.value)}
                >
                  <option value="">Choose a strategy</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                  rows={3}
                  placeholder="Optional strategy notes..."
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={closePackageModal}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={submitCreateStrategy}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all"
              >
                Create & Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}