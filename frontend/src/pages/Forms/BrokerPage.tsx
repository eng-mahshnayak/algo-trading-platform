import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { FiEdit2, FiPlus, FiBriefcase, FiImage, FiTag, FiSearch, FiRefreshCw, FiTrendingUp, FiX } from "react-icons/fi";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";

import { RiDeleteBin6Fill } from "react-icons/ri";
import { MdOutlineEditNote } from "react-icons/md";

type Strategy = {
  id: number;
  strategyName: string;  
  strategyDis: string;    
  brokerName: string;
  brokerLink: string;
  tag: any;
};

const apiUrl = import.meta.env.VITE_API_URL;

const BrokerPage: React.FC = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [strategyName, setStrategyName] = useState(""); 
  const [strategyDis, setStrategyDis] = useState("");   
  const [searchText, setSearchText] = useState("");
  const [filteredStrategies, setFilteredStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(false);

  // edit modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState<Strategy | null>(null);
  const [editName, setEditName] = useState("");
  const [editDis, setEditDis] = useState("");
  const [editTag, setEditTag] = useState("");

  // Stats
  const totalBrokers = strategies.length;
  const brokersWithImages = strategies.filter(s => s.brokerLink?.trim()).length;
  const uniqueTags = new Set(strategies.map(s => s.tag).filter(Boolean)).size;

  // AG Grid column definitions
  const [columnDefs] = useState<any>([
    {
      headerName: "#",
      width: 70,
      minWidth: 60,
      valueGetter: (params: any) => params.node.rowIndex + 1,
      sortable: false,
      filter: false,
      cellStyle: { textAlign: "center", fontWeight: "500" },
    },
    {
      headerName: "Broker Name",
      field: "brokerName",
      flex: 1.2,
      minWidth: 180,
      sortable: true,
      filter: true,
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
            <HiOutlineBuildingOffice2 size={14} className="text-white" />
          </div>
          <span className="font-medium text-gray-800">{params.value}</span>
        </div>
      ),
    },
    
    {
      headerName: "Logo",
      field: "brokerLink",
      width: 100,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => (
        params.value ? (
          <img src={params.value} alt="Broker Logo" className="h-8 w-auto object-contain rounded" />
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        )
      ),
    },
    {
      headerName: "Actions",
      width: 120,
      minWidth: 100,
      sortable: false,
      filter: false,
      pinned: "right",
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEditClick(params.data)}
            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit broker"
          >
            <MdOutlineEditNote size={18} />
          </button>
          <button
            onClick={() => handleDelete(params.data.id)}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete broker"
          >
            <RiDeleteBin6Fill size={16} />
          </button>
        </div>
      ),
    }
  ]);

  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100,
    cellStyle: {
      display: 'flex',
      alignItems: 'center',
      borderRight: '1px solid #e2e8f0',
    },
  };

  const getRowStyle = () => ({
    height: '55px',
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0',
  });

  // API function: fetch all brokers
  const fetchStrategies = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/admin/broker`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID") || "",
        },
      });

      if (res.data.status === true) {
        setStrategies(res.data.data || []);
        setFilteredStrategies(res.data.data || []);
      } else {
        toast.error(res.data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, []);

  // Search functionality
  useEffect(() => {
    if (searchText.trim() === "") {
      setFilteredStrategies(strategies);
    } else {
      const filtered = strategies.filter(broker =>
        broker.brokerName?.toLowerCase().includes(searchText.toLowerCase()) ||
        broker.tag?.toLowerCase().includes(searchText.toLowerCase()) ||
        broker.brokerLink?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredStrategies(filtered);
    }
  }, [searchText, strategies]);

  // Create Broker
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!strategyName.trim()) {
      toast.error("Please enter broker name");
      return;
    }

    const newStrategy = {
      brokerName: strategyName,
      brokerLink: strategyDis,
      tag: editTag
    };

    try {
      const res = await axios.post(`${apiUrl}/admin/broker`, newStrategy, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID") || "",
        },
      });

      if (res.data.status === true) {
        toast.success(res?.data?.message || "Broker created successfully!");
        setStrategyName("");
        setStrategyDis("");
        setEditTag("");
        setIsCreateModalOpen(false);
        fetchStrategies();
      } else {
        toast.error(res.data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Open Edit Modal
  const handleEditClick = (strategy: Strategy) => {
    setEditingBroker(strategy);
    setEditName(strategy.brokerName || "");
    setEditDis(strategy.brokerLink || "");
    setEditTag(strategy.tag || "");
    setIsEditModalOpen(true);
  };

  // Save Edit
  const handleUpdate = async () => {
    if (!editName.trim()) {
      toast.error("Please enter broker name");
      return;
    }

    if (!editingBroker) {
      toast.error("No broker selected");
      return;
    }

    const payload = {
      id: editingBroker.id,
      brokerName: editName,
      brokerLink: editDis,
      tag: editTag
    };

    try {
      const res = await axios.put(`${apiUrl}/admin/broker`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID") || "",
        },
      });

      if (res.data.status === true) {
        toast.success("Broker updated successfully!");
        setIsEditModalOpen(false);
        setEditingBroker(null);
        fetchStrategies();
      } else {
        toast.error(res.data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Delete
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this broker?")) return;

    try {
      const res = await axios.delete(`${apiUrl}/admin/broker/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID") || "",
        },
      });

      if (res.data.status === true) {
        fetchStrategies();
        toast.success("Broker deleted successfully!");
      } else {
        toast.error(res.data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Close modals
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setStrategyName("");
    setStrategyDis("");
    setEditTag("");
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingBroker(null);
    setEditName("");
    setEditTag("");
    setEditDis("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 md:px-6 lg:px-8 py-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-[#FB3800] to-orange-500 rounded-xl">
              <FiBriefcase className="text-white" size={24} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Broker Management</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            Manage and organize all your brokers in one place
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Total Brokers</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{totalBrokers}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <HiOutlineBuildingOffice2 className="text-blue-500" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">With Logos</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{brokersWithImages}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <FiImage className="text-green-500" size={20} />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {totalBrokers > 0 ? Math.round((brokersWithImages / totalBrokers) * 100) : 0}% of total
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Unique Tags</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{uniqueTags}</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <FiTag className="text-purple-500" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Active Rate</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">100%</p>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg">
                <FiTrendingUp className="text-orange-500" size={20} />
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
                  placeholder="Search by broker name, tag, or link..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                />
              </div>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#FB3800] to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-[#FB3800] transition-all shadow-sm"
            >
              <FiPlus size={16} />
              Add Broker
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
            <p className="mt-4 text-gray-500">Loading brokers...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredStrategies.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiBriefcase className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              {searchText ? "No brokers found" : "No brokers yet"}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              {searchText 
                ? `No brokers match "${searchText}". Try a different search term.`
                : "Get started by creating your first broker configuration"}
            </p>
            {!searchText && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FB3800] to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-[#FB3800] transition-all shadow-sm"
              >
                <FiPlus size={16} />
                Add Broker
              </button>
            )}
          </div>
        )}

        {/* AG Grid Table */}
        {!loading && filteredStrategies.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="ag-theme-alpine" style={{ height: 500, width: "100%" }}>
              <AgGridReact
                rowData={filteredStrategies}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                getRowStyle={getRowStyle}
                pagination={true}
                paginationPageSize={20}
                paginationPageSizeSelector={[10, 20, 50, 100]}
                animateRows={true}
                rowSelection="single"
                onGridReady={(params) => params.api.sizeColumnsToFit()}
                rowHeight={55}
                headerHeight={48}
                enableCellTextSelection={true}
                ensureDomOrder={true}
              />
            </div>
          </div>
        )}
      </div>

      {/* Create Broker Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-auto overflow-hidden">
            <div className="bg-gradient-to-r from-[#FB3800] to-orange-500 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FiPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Add Broker</h2>
                  <p className="text-orange-100 text-sm">Add a new broker to your system</p>
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
                  Broker Name *
                </label>
                <div className="relative">
                  <HiOutlineBuildingOffice2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={strategyName}
                    onChange={(e) => setStrategyName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all outline-none"
                    placeholder="Enter broker name"
                    required
                  />
                </div>
              </div>

             

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo URL
                </label>
                <div className="relative">
                  <FiImage className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={strategyDis}
                    onChange={(e) => setStrategyDis(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all outline-none"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Direct link to broker's logo image</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-[#FB3800] to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-[#FB3800] transition-all shadow-sm"
                >
                  Add Broker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Broker Modal */}
      {isEditModalOpen && editingBroker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-auto overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FiEdit2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Edit Broker</h2>
                  <p className="text-blue-100 text-sm">Update broker details</p>
                </div>
              </div>
              <button
                onClick={handleCloseEditModal}
                className="text-white/80 hover:text-white transition"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Broker Name *
                </label>
                <div className="relative">
                  <HiOutlineBuildingOffice2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    required
                  />
                </div>
              </div>

            

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo URL
                </label>
                <div className="relative">
                  <FiImage className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={editDis}
                    onChange={(e) => setEditDis(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm"
                >
                  Update Broker
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokerPage;