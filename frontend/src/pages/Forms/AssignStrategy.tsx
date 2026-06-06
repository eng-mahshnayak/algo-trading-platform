import { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AgGridReact } from "ag-grid-react";
import {  Save } from "lucide-react";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { RiDeleteBin6Fill } from "react-icons/ri";
import { MdOutlineEditNote } from "react-icons/md";
import { 
  FiSearch, 
  FiRefreshCw, 
  FiTrendingUp, 
  FiActivity,
  FiX,
  FiPlus
} from "react-icons/fi";

type Strategy = {
  id: number;
  strategyName: string;
  strategyDis: string;
  maxLotSize: number | null;
};

const apiUrl = import.meta.env.VITE_API_URL;

const AssignStrategy: React.FC = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [strategyName, setStrategyName] = useState("");
  const [strategyDis, setStrategyDis] = useState("");
  const [maxLotSize, setMaxLotSize] = useState<number | "">("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [editName, setEditName] = useState("");
  const [editDis, setEditDis] = useState("");
  const [editMaxLotSize, setEditMaxLotSize] = useState<number | "">("");
  const [isUpdating, setIsUpdating] = useState(false);

  const gridRef = useRef<AgGridReact>(null);

  const filteredStrategies = strategies.filter(
    (strategy) =>
      strategy.strategyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      strategy.strategyDis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columnDefs = [
    {
      headerName: "#",
      valueGetter: "node.rowIndex + 1",
      width: 70,
      minWidth: 60,
      cellStyle: { textAlign: "center", fontWeight: "500" },
      sortable: false,
      filter: false,
    },
    {
      headerName: "Strategy Name",
      field: "strategyName",
      flex: 1,
      minWidth: 200,
      filter: true,
      sortable: true,
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#FB3800] to-orange-500 flex items-center justify-center">
            <FiActivity size={14} className="text-white" />
          </div>
          <span className="font-medium text-gray-800">{params.value}</span>
        </div>
      ),
    },
    {
      headerName: "Description",
      field: "strategyDis",
      flex: 1.5,
      minWidth: 250,
      filter: true,
      sortable: true,
      cellRenderer: (params: any) => (
        <div className="flex flex-col">
          <span className="text-sm text-gray-600">{params.value || "-"}</span>
        </div>
      ),
    },
    {
      headerName: "Max Lot Size",
      field: "maxLotSize",
      width: 130,
      minWidth: 120,
      filter: true,
      sortable: true,
      cellRenderer: (params: any) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
          {params.value !== null && params.value !== undefined ? params.value : "Unlimited"}
        </span>
      ),
    },
    {
      headerName: "Actions",
      width: 120,
      minWidth: 100,
      sortable: false,
      filter: false,
      pinned: "right" as const,
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEditClick(params.data)}
            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit"
          >
            <MdOutlineEditNote size={18} />
          </button>
          <button
            onClick={() => handleDelete(params.data.id)}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <RiDeleteBin6Fill size={16} />
          </button>
        </div>
      ),
    },
  ];

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      suppressMovable: true,
      cellStyle: {
        borderRight: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        userSelect: "text",
      },
    }),
    []
  );

  const getRowStyle = () => ({
    height: "60px",
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid #e2e8f0",
  });

  const fetchStrategies = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/admin/strategies`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID") || "",
        },
      });

      if (res.data.status === true) {
        setStrategies(res.data.data || []);
      } else {
        toast.error(res.data.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch strategies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategies();
    setSearchTerm("");
  }, []);

useEffect(() => {
  if (gridRef.current?.api) {
    gridRef.current.api.setGridOption(
      "quickFilterText",
      searchTerm
    );
  }
}, [searchTerm]);

  const isDuplicateName = (name: string, excludeId?: number): boolean => {
    const normalizedName = name.trim().toLowerCase();
    return strategies.some(
      (strategy) =>
        strategy.strategyName.toLowerCase() === normalizedName &&
        strategy.id !== excludeId
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!strategyName.trim()) {
      return toast.error("Please enter a strategy name");
    }

    if (isDuplicateName(strategyName)) {
      return toast.error(
        `Strategy with name "${strategyName}" already exists. Please use a different name.`
      );
    }

    setIsCreating(true);

    const payload: any = {
      strategyName: strategyName.trim(),
      strategyDis: strategyDis.trim(),
    };

    if (maxLotSize !== "" && maxLotSize !== null) {
      payload.maxLotSize = Number(maxLotSize);
    }

    try {
      const res = await axios.post(`${apiUrl}/admin/strategies`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID") || "",
        },
      });

      if (res.data.status === true) {
        toast.success("Strategy created successfully!");
        setStrategyName("");
        setStrategyDis("");
        setMaxLotSize("");
        setIsCreateModalOpen(false);
        fetchStrategies();
      } else {
        toast.error(res.data.message);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "Failed to create strategy";
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditClick = (strategy: Strategy) => {
    setEditingStrategy(strategy);
    setEditName(strategy.strategyName);
    setEditDis(strategy.strategyDis);
    setEditMaxLotSize(strategy.maxLotSize ?? "");
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStrategy) return;

    if (
      editName.trim().toLowerCase() !== editingStrategy.strategyName.toLowerCase()
    ) {
      if (isDuplicateName(editName, editingStrategy.id)) {
        return toast.error(
          `Strategy with name "${editName}" already exists. Please use a different name.`
        );
      }
    }

    setIsUpdating(true);

    const payload: any = {
      id: editingStrategy.id,
      strategyName: editName.trim(),
      strategyDis: editDis.trim(),
    };

    if (editMaxLotSize !== "" && editMaxLotSize !== null) {
      payload.maxLotSize = Number(editMaxLotSize);
    }

    try {
      const res = await axios.put(`${apiUrl}/admin/strategies`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID") || "",
        },
      });

      if (res.data.status === true) {
        toast.success("Strategy updated successfully!");
        setIsEditModalOpen(false);
        setEditingStrategy(null);
        fetchStrategies();
      } else {
        toast.error(res.data.message);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "Failed to update strategy";
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this strategy?"))
      return;

    try {
      const res = await axios.delete(`${apiUrl}/admin/strategies/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID") || "",
        },
      });

      if (res.data.status === true) {
        toast.success("Strategy deleted successfully!");
        fetchStrategies();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete strategy");
    }
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setStrategyName("");
    setStrategyDis("");
    setMaxLotSize("");
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingStrategy(null);
    setEditName("");
    setEditDis("");
    setEditMaxLotSize("");
  };

  const totalStrategies = strategies.length;
  const hasMaxLot = strategies.filter(s => s.maxLotSize !== null && s.maxLotSize > 0).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 md:px-6 lg:px-8 py-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-[#FB3800] to-orange-500 rounded-xl">
              <FiActivity className="text-white" size={24} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Strategy Management</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            Create and manage trading strategies with lot size limits
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Total Strategies</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{totalStrategies}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <FiActivity className="text-blue-500" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">With Lot Limits</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{hasMaxLot}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <FiTrendingUp className="text-green-500" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Unlimited</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{totalStrategies - hasMaxLot}</p>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg">
                <FiActivity className="text-orange-500" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Active Rate</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">100%</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <FiTrendingUp className="text-purple-500" size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search by strategy name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                />
              </div>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#FB3800] to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-[#FB3800] transition-all shadow-sm"
            >
              <FiPlus size={16} />
              Create Strategy
            </button>

            <button
              onClick={fetchStrategies}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all"
            >
              <FiRefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-[#FB3800]/20 rounded-full"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-[#FB3800] rounded-full animate-spin border-t-transparent"></div>
            </div>
            <p className="mt-4 text-gray-500">Loading strategies...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && strategies.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiActivity className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              No strategies yet
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Create your first trading strategy to get started
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FB3800] to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-[#FB3800] transition-all shadow-sm"
            >
              <FiPlus size={16} />
              Create Strategy
            </button>
          </div>
        )}

        {/* AG Grid Table */}
        {!loading && strategies.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="ag-theme-alpine" style={{ height: 500, width: "100%" }}>
              <AgGridReact
                ref={gridRef}
                rowData={filteredStrategies}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                getRowStyle={getRowStyle}
                pagination={true}
                paginationPageSize={20}
                paginationPageSizeSelector={[10, 20, 50, 100]}
                enableCellTextSelection={true}
                ensureDomOrder={true}
                suppressCellFocus={false}
                rowHeight={55}
                headerHeight={48}
                animateRows={true}
              />
            </div>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-auto overflow-hidden">
            <div className="bg-gradient-to-r from-[#FB3800] to-orange-500 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FiPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Create Strategy</h2>
                  <p className="text-orange-100 text-sm">Add a new trading strategy</p>
                </div>
              </div>
              <button
                onClick={handleCloseCreateModal}
                className="text-white/80 hover:text-white transition"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Strategy Name *
                </label>
                <input
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all outline-none"
                  value={strategyName}
                  onChange={(e) => setStrategyName(e.target.value)}
                  placeholder="Enter strategy name"
                  required
                  disabled={isCreating}
                />
                <p className="text-xs text-gray-500 mt-1">Strategy name must be unique</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Strategy Description
                </label>
                <textarea
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all outline-none resize-none"
                  value={strategyDis}
                  onChange={(e) => setStrategyDis(e.target.value)}
                  placeholder="Enter strategy description"
                  rows={3}
                  disabled={isCreating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Lot Size
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all outline-none"
                  value={maxLotSize}
                  onChange={(e) => setMaxLotSize(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Enter max lot size (optional)"
                  min="0"
                  disabled={isCreating}
                />
                <p className="text-xs text-gray-500 mt-1">Maximum lot size allowed for this strategy</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-all"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-[#FB3800] to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-[#FB3800] transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      Create Strategy
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-auto overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <MdOutlineEditNote className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Update Strategy</h2>
                  <p className="text-blue-100 text-sm">Edit strategy details</p>
                </div>
              </div>
              <button
                onClick={handleCloseEditModal}
                className="text-white/80 hover:text-white transition"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Strategy Name *
                </label>
                <input
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  disabled={isUpdating}
                />
                <p className="text-xs text-gray-500 mt-1">Strategy name must be unique</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Strategy Description
                </label>
                <textarea
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
                  value={editDis}
                  onChange={(e) => setEditDis(e.target.value)}
                  rows={3}
                  disabled={isUpdating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Lot Size
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  value={editMaxLotSize}
                  onChange={(e) => setEditMaxLotSize(e.target.value === "" ? "" : Number(e.target.value))}
                  min="0"
                  disabled={isUpdating}
                />
                <p className="text-xs text-gray-500 mt-1">Maximum lot size allowed for this strategy</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-all"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Updating...
                    </>
                  ) : (
                    "Update Strategy"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignStrategy;