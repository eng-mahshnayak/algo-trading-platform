import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import {
  FiPlus,
  FiSettings,
  FiEdit2,
  FiGlobe,
  FiMail,
  FiPhone,
  FiUpload,
  FiX,
  FiTrendingUp,
  FiRefreshCw,
  FiActivity,
} from "react-icons/fi";
import { RiDeleteBin6Fill } from "react-icons/ri";
import { MdOutlineEditNote } from "react-icons/md";

/* ================= TYPES ================= */
export type PlatformSetting = {
  id: number;
  email: string;
  phoneSupport: string;
  whatsappSupport: string;
  website: string;
  softwareName: string;
  softwareTitle: string;
  softwareLogo: string;
  isActive: boolean;
};

const apiUrl = import.meta.env.VITE_API_URL;

/* ================= TOGGLE SWITCH COMPONENT ================= */
const ToggleSwitch = ({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) => {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FB3800]"></div>
      <span className="ml-3 text-sm font-medium text-gray-700">
        {value ? "Active" : "Inactive"}
      </span>
    </label>
  );
};

/* ================= COMPONENT ================= */
const PlatformSettingsPage: React.FC = () => {
  const [data, setData] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState<string>("");
  
  const gridRef = useRef<AgGridReact>(null);

  /* ===== Modal State ===== */
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<PlatformSetting | null>(null);

  /* ===== Form State ===== */
  const [form, setForm] = useState<Omit<PlatformSetting, "id">>({
    email: "",
    phoneSupport: "",
    whatsappSupport: "",
    website: "",
    softwareName: "",
    softwareTitle: "",
    softwareLogo: "",
    isActive: false,
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ================= COLUMN DEFINITIONS ================= */
  const columnDefs: ColDef<PlatformSetting>[] = [
    {
      headerName: "#",
      width: 70,
      minWidth: 60,
      valueGetter: (p) => (p.node ? p.node.rowIndex! + 1 : ""),
      cellStyle: { textAlign: "center", fontWeight: "500" },
      sortable: false,
      filter: false,
    },
    {
      headerName: "Software",
      field: "softwareName",
      flex: 1,
      minWidth: 180,
      sortable: true,
      filter: true,
      cellRenderer: (p: any) => (
        <div className="flex items-center gap-2">
          {p.data?.softwareLogo ? (
            <img src={p.data.softwareLogo} className="w-6 h-6 rounded object-contain" alt="logo" />
          ) : (
            <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
              <FiSettings size={12} className="text-gray-400" />
            </div>
          )}
          <span className="font-medium text-gray-800">{p.value}</span>
        </div>
      ),
    },
    {
      headerName: "Email",
      field: "email",
      flex: 1,
      minWidth: 200,
      sortable: true,
      filter: true,
      cellRenderer: (p: any) => (
        <div className="flex items-center gap-2">
          <FiMail size={14} className="text-gray-400" />
          <span>{p.value}</span>
        </div>
      ),
    },
    {
      headerName: "Phone",
      field: "phoneSupport",
      width: 140,
      minWidth: 120,
      sortable: true,
      filter: true,
      cellRenderer: (p: any) => (
        <div className="flex items-center gap-2">
          <FiPhone size={14} className="text-gray-400" />
          <span>{p.value || "-"}</span>
        </div>
      ),
    },
    {
      headerName: "WhatsApp",
      field: "whatsappSupport",
      width: 140,
      minWidth: 120,
      sortable: true,
      filter: true,
      cellRenderer: (p: any) => (
        <div className="flex items-center gap-2">
          <FiPhone size={14} className="text-green-500" />
          <span>{p.value || "-"}</span>
        </div>
      ),
    },
    {
      headerName: "Website",
      field: "website",
      width: 180,
      minWidth: 160,
      sortable: true,
      filter: true,
      cellRenderer: (p: any) => (
        <a href={p.value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate flex items-center gap-1">
          <FiGlobe size={14} />
          <span>{p.value || "-"}</span>
        </a>
      ),
    },
    {
      headerName: "Status",
      field: "isActive",
      width: 110,
      minWidth: 100,
      sortable: true,
      filter: true,
      cellRenderer: (p: any) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          p.value ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${p.value ? "bg-green-500" : "bg-red-500"}`} />
          {p.value ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      headerName: "Actions",
      field: "id",
      width: 100,
      minWidth: 90,
      sortable: false,
      filter: false,
      pinned: "right",
      cellRenderer: (p: any) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEdit(p.data)}
            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit"
          >
            <MdOutlineEditNote size={18} />
          </button>
          <button
            onClick={() => handleDelete(p.data.id)}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <RiDeleteBin6Fill size={16} />
          </button>
        </div>
      ),
    },
  ];

  const defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100,
    cellStyle: {
      display: "flex",
      alignItems: "center",
      borderRight: "1px solid #e2e8f0",
    },
  };

  const getRowStyle = () => ({
    height: "55px",
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid #e2e8f0",
  });

  /* ================= API ================= */
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/admin/platform-settings`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });
      if (res.data.status) {
        const mappedData = res.data.data.map((item: any) => ({
          id: item.id,
          email: item.email,
          phoneSupport: item.phone_support,
          whatsappSupport: item.whatsapp_support,
          website: item.website,
          softwareName: item.software_name,
          softwareTitle: item.software_title,
          softwareLogo: item.software_logo,
          isActive: item.isActive,
        }));
        setData(mappedData);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

useEffect(() => {
  if (gridRef.current?.api) {
    gridRef.current.api.setGridOption(
      "quickFilterText",
      search
    );
  }
}, [search]);

  const handleCreate = async () => {
    try {
      const formData = new FormData();
      formData.append("email", form.email);
      formData.append("phoneSupport", form.phoneSupport);
      formData.append("whatsappSupport", form.whatsappSupport);
      formData.append("website", form.website);
      formData.append("softwareName", form.softwareName);
      formData.append("softwareTitle", form.softwareTitle);
      formData.append("isActive", String(form.isActive));

      if (fileInputRef.current?.files?.[0]) {
        formData.append("softwareLogo", fileInputRef.current.files[0]);
      }

      const res = await axios.post(`${apiUrl}/admin/platform-settings`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.status) {
        toast.success("Platform setting created ✅");
        setIsCreateOpen(false);
        resetForm();
        fetchData();
      } else {
        toast.error(res.data?.message || res.data?.err || res.data?.error);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleUpdate = async () => {
    if (!editingRow) return;
    try {
      const formData = new FormData();
      formData.append("email", form.email);
      formData.append("phoneSupport", form.phoneSupport);
      formData.append("whatsappSupport", form.whatsappSupport);
      formData.append("website", form.website);
      formData.append("softwareName", form.softwareName);
      formData.append("softwareTitle", form.softwareTitle);
      formData.append("isActive", String(form.isActive));

      if (fileInputRef.current?.files?.[0]) {
        formData.append("softwareLogo", fileInputRef.current.files[0]);
      }

      const res = await axios.put(`${apiUrl}/admin/platform-settings/${editingRow.id}`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.status) {
        toast.success("Platform setting updated ✅");
        setIsEditOpen(false);
        setEditingRow(null);
        resetForm();
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this setting?")) return;
    try {
      const res = await axios.delete(`${apiUrl}/admin/platform-settings/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });
      if (res.data.status) {
        toast.success("Deleted successfully ✅");
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  /* ================= HELPERS ================= */
  const resetForm = () => {
    setForm({
      email: "",
      phoneSupport: "",
      whatsappSupport: "",
      website: "",
      softwareName: "",
      softwareTitle: "",
      softwareLogo: "",
      isActive: false,
    });
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openEdit = (row: PlatformSetting) => {
    setEditingRow(row);
    setForm({ ...row });
    setLogoPreview(row.softwareLogo || null);
    setIsEditOpen(true);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Stats
  const totalPlatforms = data.length;
  const activePlatforms = data.filter(s => s.isActive).length;
  const inactivePlatforms = data.filter(s => !s.isActive).length;

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 md:px-6 lg:px-8 py-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-[#FB3800] to-orange-500 rounded-xl">
              <FiSettings className="text-white" size={24} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Platform Settings</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            Manage and configure all your platform settings in one place
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Total Platforms</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{totalPlatforms}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <FiSettings className="text-blue-500" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Active Platforms</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{activePlatforms}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <FiActivity className="text-green-500" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Inactive Platforms</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{inactivePlatforms}</p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <FiX className="text-red-500" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Active Rate</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {totalPlatforms > 0 ? Math.round((activePlatforms / totalPlatforms) * 100) : 0}%
                </p>
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
                <FiGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search by software name, email, or website..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                />
              </div>
            </div>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#FB3800] to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-[#FB3800] transition-all shadow-sm"
            >
              <FiPlus size={16} />
              Add Platform
            </button>

            <button
              onClick={fetchData}
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
            <p className="mt-4 text-gray-500">Loading platforms...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && data.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiSettings className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              No platforms yet
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Get started by creating your first platform configuration
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FB3800] to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-[#FB3800] transition-all shadow-sm"
            >
              <FiPlus size={16} />
              Add Platform
            </button>
          </div>
        )}

        {/* AG Grid Table */}
        {!loading && data.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="ag-theme-alpine" style={{ height: 500, width: "100%" }}>
              <AgGridReact
                ref={gridRef}
                rowData={data}
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

      {/* Create Platform Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-auto overflow-hidden">
            <div className="bg-gradient-to-r from-[#FB3800] to-orange-500 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FiPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Create Platform</h2>
                  <p className="text-orange-100 text-sm">Add a new platform configuration</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  resetForm();
                }}
                className="text-white/80 hover:text-white transition"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Software Name *
                  </label>
                  <div className="relative">
                    <FiSettings className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      name="softwareName"
                      value={form.softwareName}
                      onChange={onChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                      placeholder="Enter software name"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Software Title
                  </label>
                  <input
                    type="text"
                    name="softwareTitle"
                    value={form.softwareTitle}
                    onChange={onChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                    placeholder="Enter software title"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                    placeholder="admin@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Support
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="tel"
                      name="phoneSupport"
                      value={form.phoneSupport}
                      onChange={onChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                      placeholder="+91 1234567890"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp Support
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="tel"
                      name="whatsappSupport"
                      value={form.whatsappSupport}
                      onChange={onChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                      placeholder="+91 1234567890"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <div className="relative">
                  <FiGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    name="website"
                    value={form.website}
                    onChange={onChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <ToggleSwitch
                    value={form.isActive}
                    onChange={(value) => setForm({ ...form, isActive: value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Software Logo
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                      <FiUpload size={16} className="text-[#FB3800]" />
                      <span className="text-sm">Upload</span>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLogoChange}
                        className="hidden"
                        accept="image/*"
                      />
                    </label>
                    {logoPreview && (
                      <div className="relative">
                        <img src={logoPreview} alt="Preview" className="h-8 w-auto rounded border" />
                        <button
                          onClick={() => {
                            setLogoPreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                        >
                          <FiX size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-5 py-2 bg-gradient-to-r from-[#FB3800] to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-[#FB3800] transition-all shadow-sm"
              >
                Create Platform
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Platform Modal */}
      {isEditOpen && editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-auto overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FiEdit2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Edit Platform</h2>
                  <p className="text-blue-100 text-sm">Update platform configuration</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditOpen(false);
                  setEditingRow(null);
                  resetForm();
                }}
                className="text-white/80 hover:text-white transition"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Software Name *
                  </label>
                  <div className="relative">
                    <FiSettings className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      name="softwareName"
                      value={form.softwareName}
                      onChange={onChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Software Title
                  </label>
                  <input
                    type="text"
                    name="softwareTitle"
                    value={form.softwareTitle}
                    onChange={onChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Support
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="tel"
                      name="phoneSupport"
                      value={form.phoneSupport}
                      onChange={onChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp Support
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="tel"
                      name="whatsappSupport"
                      value={form.whatsappSupport}
                      onChange={onChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <div className="relative">
                  <FiGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    name="website"
                    value={form.website}
                    onChange={onChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <ToggleSwitch
                    value={form.isActive}
                    onChange={(value) => setForm({ ...form, isActive: value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Software Logo
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                      <FiUpload size={16} className="text-blue-500" />
                      <span className="text-sm">Upload</span>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLogoChange}
                        className="hidden"
                        accept="image/*"
                      />
                    </label>
                    {logoPreview && (
                      <div className="relative">
                        <img src={logoPreview} alt="Preview" className="h-8 w-auto rounded border" />
                        <button
                          onClick={() => {
                            setLogoPreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                        >
                          <FiX size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsEditOpen(false);
                  setEditingRow(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm"
              >
                Update Platform
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformSettingsPage;