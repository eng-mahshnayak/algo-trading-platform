import { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { FiSearch } from "react-icons/fi";
import {
  FiShield,
  FiRefreshCw,
  FiSave,
  FiAlertTriangle,
  FiUsers,
  FiEdit2,
  FiCheckCircle,
  FiXCircle,
  FiTrendingUp,
  FiDollarSign,
  FiActivity
} from "react-icons/fi";
import { HiDotsHorizontal } from "react-icons/hi";

interface RiskUser {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  username: string;
  riskMngtActive: boolean;
  riskLimit: number;
}

const API_URL = import.meta.env.VITE_API_URL;

export default function RiskManagement() {
  const [users, setUsers] = useState<RiskUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editingRisk, setEditingRisk] = useState<{ [key: number]: Partial<RiskUser> }>({});
  const [saving, setSaving] = useState<{ [key: number]: boolean }>({});
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<RiskUser | null>(null);
  const [editFormData, setEditFormData] = useState({ riskMngtActive: false, riskLimit: 0 });
  
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const gridRef = useRef<AgGridReact>(null);

  const fetchUsersRisk = async () => {
    try {
      setLoading(true);
      setError("");
      
      const res = await axios.get(`${API_URL}/admin/risk-management/users-risk`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      });
      
      if (res.data.success) {
        setUsers(res.data.data);
      } else {
        setError(res.data.message || "Failed to fetch users");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const updateUserRisk = async (userId: number, data: { riskMngtActive?: boolean; riskLimit?: number }) => {
    try {
      setSaving(prev => ({ ...prev, [userId]: true }));
      
      const res = await axios.put(
        `${API_URL}/admin/risk-management/users-risk/${userId}`,
        data,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } }
      );
      
      if (res.data.success) {
        toast.success("Risk settings updated successfully");
        fetchUsersRisk();
        setEditingRisk(prev => {
          const newState = { ...prev };
          delete newState[userId];
          return newState;
        });
      } else {
        toast.error(res.data.message || "Failed to update");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update risk settings");
    } finally {
      setSaving(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleInlineEdit = (userId: number, field: keyof RiskUser, value: any) => {
    setEditingRisk(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: value }
    }));
  };

  const saveInlineEdit = (userId: number) => {
    const changes = editingRisk[userId];
    if (changes && Object.keys(changes).length > 0) {
      updateUserRisk(userId, changes);
    } else {
      setEditingRisk(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    }
  };

  const cancelInlineEdit = (userId: number) => {
    setEditingRisk(prev => {
      const newState = { ...prev };
      delete newState[userId];
      return newState;
    });
  };

  const toggleRiskActive = (user: RiskUser) => {
    updateUserRisk(user.id, { riskMngtActive: !user.riskMngtActive });
  };

  const openEditModal = (user: RiskUser) => {
    setSelectedUserForEdit(user);
    setEditFormData({
      riskMngtActive: user.riskMngtActive,
      riskLimit: user.riskLimit
    });
    setOpenMenuId(null);
  };

  const saveModalEdit = async () => {
    if (!selectedUserForEdit) return;
    await updateUserRisk(selectedUserForEdit.id, editFormData);
    setSelectedUserForEdit(null);
  };

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(user => 
      user.email?.toLowerCase().includes(q) ||
      user.username?.toLowerCase().includes(q) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(q) ||
      user.id.toString().includes(q)
    );
  }, [users, search]);

  const fullName = (user: RiskUser) => 
    [user.firstName, user.lastName].filter(Boolean).join(" ") || "-";

  const toggleMenu = (id: number, buttonElement: HTMLButtonElement) => {
    buttonRef.current = buttonElement;
    setOpenMenuId(prev => (prev === id ? null : id));
  };

  useEffect(() => {
    if (!buttonRef.current || !openMenuId) return;
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const menuHeight = 150;
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    
    const direction = spaceBelow >= menuHeight || spaceBelow >= spaceAbove ? "bottom" : "top";
    const x = buttonRect.right - 176;
    const y = direction === "bottom" ? buttonRect.bottom + 4 : buttonRect.top - menuHeight - 4;
    
    setMenuPosition({ x, y });
  }, [openMenuId]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!openMenuId) return;
      if (!buttonRef.current || !buttonRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [openMenuId]);

  const ActionsMenu = ({ user }: { user: RiskUser }) => (
    <div
      className="fixed z-[9999] bg-white shadow-xl border border-gray-100 rounded-xl w-56 text-sm overflow-hidden"
      style={{ left: `${menuPosition.x}px`, top: `${menuPosition.y}px` }}
    >
      <button
        onClick={() => openEditModal(user)}
        className="flex items-center gap-3 w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors text-gray-700 hover:text-orange-600"
      >
        <FiEdit2 className="h-4 w-4" />
        <span>Edit Risk Settings</span>
      </button>
      <div className="h-px bg-gray-100 my-1"></div>
      <button
        onClick={() => toggleRiskActive(user)}
        className="flex items-center gap-3 w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-600"
      >
        {user.riskMngtActive ? (
          <>
            <FiXCircle className="h-4 w-4" />
            <span>Disable Risk Management</span>
          </>
        ) : (
          <>
            <FiCheckCircle className="h-4 w-4" />
            <span>Enable Risk Management</span>
          </>
        )}
      </button>
    </div>
  );

  const columnDefs: ColDef<any>[] = useMemo(() => [
    {
      field: undefined,
      headerName: '#',
      width: 70,
      cellRenderer: (params: any) => {
        const rowIndex = params.node.rowIndex;
        return (
          <div className="flex items-center justify-center h-full">
            <span className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 rounded-full w-7 h-7 flex items-center justify-center text-xs font-medium">
              {rowIndex + 1}
            </span>
          </div>
        );
      }
    },
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      cellClass: 'font-mono text-xs text-gray-500'
    },
    {
      field: 'firstName',
      headerName: 'User',
      width: 220,
      cellRenderer: (params: any) => {
        const user = params.data as RiskUser;
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900">{fullName(user)}</span>
            <span className="text-xs text-gray-500 mt-0.5">{user.email}</span>
          </div>
        );
      }
    },
    {
      field: 'username',
      headerName: 'Username',
      width: 150,
      cellRenderer: (params: any) => (
        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
          @{params.value}
        </span>
      )
    },
    {
      field: 'riskMngtActive',
      headerName: 'Risk Status',
      width: 160,
      cellRenderer: (params: any) => {
        const user = params.data as RiskUser;
        const isEditing = editingRisk[user.id]?.riskMngtActive !== undefined;
        const value = isEditing ? editingRisk[user.id].riskMngtActive : user.riskMngtActive;
        
        return (
          <div className="flex items-center gap-2">
            {editingRisk[user.id] !== undefined ? (
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={value}
                  onChange={(e) => handleInlineEdit(user.id, 'riskMngtActive', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            ) : (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`}></span>
                {value ? 'Active' : 'Inactive'}
              </span>
            )}
          </div>
        );
      }
    },
    {
      field: 'riskLimit',
      headerName: 'Risk Limit',
      width: 180,
      cellRenderer: (params: any) => {
        const user = params.data as RiskUser;
        const isEditing = editingRisk[user.id]?.riskLimit !== undefined;
        const value: any = isEditing ? editingRisk[user.id].riskLimit : user.riskLimit;
        
        return (
          <div className="flex items-center gap-2">
            {editingRisk[user.id] !== undefined ? (
              <input
                type="number"
                min="0"
                step="1000"
                value={value}
                onChange={(e) => handleInlineEdit(user.id, 'riskLimit', parseFloat(e.target.value) || 0)}
                className="w-36 px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            ) : (
              <span className={`inline-flex items-center gap-1 font-semibold ${value > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                <FiDollarSign className="h-3.5 w-3.5" />
                {value?.toLocaleString() || 0}
              </span>
            )}
          </div>
        );
      }
    },
    {
      field: undefined,
      headerName: 'Actions',
      width: 200,
      cellRenderer: (params: any) => {
        const user = params.data as RiskUser;
        const isEditing = editingRisk[user.id] !== undefined;
        
        if (isEditing) {
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => saveInlineEdit(user.id)}
                disabled={saving[user.id]}
                className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all text-xs font-medium shadow-sm"
              >
                {saving[user.id] ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => cancelInlineEdit(user.id)}
                className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all text-xs font-medium"
              >
                Cancel
              </button>
            </div>
          );
        }
        
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleRiskActive(user)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                user.riskMngtActive
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {user.riskMngtActive ? 'Disable' : 'Enable'}
            </button>
            <button
              ref={buttonRef as any}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                toggleMenu(user.id, e.currentTarget as HTMLButtonElement);
              }}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-all"
            >
              <HiDotsHorizontal className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        );
      }
    }
  ], [editingRisk, saving]);

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
    wrapHeaderText: true,
    autoHeaderHeight: true,
    enableCellTextSelection: true,
    suppressCellFocus: true,
    cellStyle: {
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center'
    }
  }), []);

  useEffect(() => {
    fetchUsersRisk();
  }, []);

  const activeRiskCount = users.filter(u => u.riskMngtActive).length;
  const totalRiskLimit = users.reduce((sum, u) => sum + (u.riskLimit || 0), 0);
  const avgRiskLimit = users.length > 0 ? totalRiskLimit / users.length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 md:px-6 lg:px-8 py-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl">
              <FiShield className="text-white" size={24} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Risk Management</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            Monitor and control user risk limits across the platform
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Total Users</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{users.length}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <FiUsers className="text-blue-500" size={22} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Active Risk</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{activeRiskCount}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <FiCheckCircle className="text-green-500" size={22} />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {((activeRiskCount / users.length) * 100).toFixed(0)}% of total users
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Total Risk Limit</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">₹{totalRiskLimit.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl">
                <FiAlertTriangle className="text-orange-500" size={22} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Average Limit</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">₹{avgRiskLimit.toFixed(0)}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <FiTrendingUp className="text-purple-500" size={22} />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Refresh Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                placeholder="Search by name, email, username, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                {filteredUsers.length} / {users.length} users
              </div>
              <button
                onClick={fetchUsersRisk}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
              >
                <FiRefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-orange-100 rounded-full"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-orange-500 rounded-full animate-spin border-t-transparent"></div>
            </div>
            <p className="mt-4 text-gray-500">Loading risk data...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-3">
              <FiXCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium text-red-800">Error Loading Data</p>
                <p className="text-sm text-red-600 mt-0.5">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* AG Grid Table */}
        {!loading && !error && users.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="ag-theme-alpine" style={{ height: '550px', width: '100%' }}>
              <AgGridReact
                ref={gridRef}
                rowData={filteredUsers}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                animateRows={true}
                pagination={true}
                paginationPageSize={50}
                paginationPageSizeSelector={[25, 50, 100]}
                rowHeight={60}
                headerHeight={48}
                overlayNoRowsTemplate={'<div class="flex justify-center items-center h-full text-gray-400">No users found</div>'}
              />
            </div>
          </div>
        )}

        {/* Portal Dropdown Menu */}
        {openMenuId && filteredUsers.find(u => u.id === openMenuId) && (
          createPortal(
            <ActionsMenu user={filteredUsers.find(u => u.id === openMenuId)!} />,
            document.body
          )
        )}

        {/* Edit Modal */}
        {selectedUserForEdit && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedUserForEdit(null)}
            />
            <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
              <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <FiShield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Risk Settings</h3>
                    <p className="text-orange-100 text-sm mt-0.5">
                      {fullName(selectedUserForEdit)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Risk Management Status
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={editFormData.riskMngtActive}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, riskMngtActive: e.target.checked }))}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    <span className="ml-3 text-sm text-gray-700 font-medium">
                      {editFormData.riskMngtActive ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Risk Limit Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={editFormData.riskLimit}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, riskLimit: parseFloat(e.target.value) || 0 }))}
                      className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      placeholder="Enter amount"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Maximum risk exposure allowed for this user
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
                <button
                  onClick={() => setSelectedUserForEdit(null)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={saveModalEdit}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 transition-all flex items-center gap-2 font-medium shadow-sm"
                >
                  <FiSave className="h-4 w-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}