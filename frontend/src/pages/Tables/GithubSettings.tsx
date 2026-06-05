import { useEffect, useState, ChangeEvent, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import {
  FiPlus,
  FiGithub,
  FiMail,
  FiGitBranch,
  FiLink,
  FiKey,
  FiRefreshCw,
  FiFolder,
  FiX,
  FiSearch,
  FiActivity,
  FiTrendingUp,
} from "react-icons/fi";
import { MdOutlineEditNote } from "react-icons/md";
import { RiDeleteBin6Fill } from "react-icons/ri";

const apiUrl = import.meta.env.VITE_API_URL;

interface GithubSetting {
  id: number;
  github_repo_url: string;
  github_branch: string;
  github_token: string;
  admin_email: string;
  createdAt?: string;
  updatedAt?: string;
}

interface FormData {
  github_repo_url: string;
  github_branch: string;
  github_token: string;
  admin_email: string;
}

const GithubSettings = () => {
  const [data, setData] = useState<GithubSetting[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editingRow, setEditingRow] = useState<GithubSetting | null>(null);
  const [search, setSearch] = useState<string>("");
  
  const gridRef = useRef<AgGridReact>(null);

  const [form, setForm] = useState<FormData>({
    github_repo_url: "",
    github_branch: "main",
    github_token: "",
    admin_email: "",
  });

  // Column Definitions
  const columnDefs: ColDef<GithubSetting>[] = [
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
      headerName: "Repository URL",
      field: "github_repo_url",
      flex: 1.5,
      minWidth: 350,
      sortable: true,
      filter: "agTextColumnFilter",
      cellRenderer: (p: any) => (
        <a
          href={p.value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline truncate flex items-center gap-2"
          style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis" }}
        >
          <FiLink size={14} className="text-gray-400" />
          <span>{p.value}</span>
        </a>
      ),
    },
    {
      headerName: "Branch",
      field: "github_branch",
      width: 120,
      minWidth: 100,
      sortable: true,
      filter: "agTextColumnFilter",
      cellRenderer: (p: any) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-700">
          <FiGitBranch size={12} />
          {p.value || "main"}
        </span>
      ),
    },
    {
      headerName: "Admin Email",
      field: "admin_email",
      width: 220,
      minWidth: 200,
      sortable: true,
      filter: "agTextColumnFilter",
      cellRenderer: (p: any) => (
        <div className="flex items-center gap-2">
          <FiMail size={14} className="text-gray-400" />
          <span className="text-sm">{p.value}</span>
        </div>
      ),
    },
    {
      headerName: "Created At",
      field: "createdAt",
      width: 180,
      minWidth: 160,
      sortable: true,
      filter: "agDateColumnFilter",
      valueFormatter: (p: any) => {
        if (!p.value) return "-";
        return new Date(p.value).toLocaleString();
      },
    },
    {
      headerName: "Actions",
      field: "id",
      width: 120,
      minWidth: 100,
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
  };

  const getRowStyle = () => ({
    height: "48px",
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid #e2e8f0",
  });

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/admin/githubsetting`);
      if (res.data.status) {
        setData(res.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (gridRef.current && gridRef.current.api) {
      gridRef.current.api.setQuickFilter(search);
    }
  }, [search]);

  const handleCreate = async (): Promise<void> => {
    if (!form.github_repo_url) {
      toast.error("GitHub Repo URL is required");
      return;
    }
    if (!form.github_token) {
      toast.error("GitHub Token is required");
      return;
    }
    if (!form.admin_email) {
      toast.error("Admin Email is required");
      return;
    }

    try {
      const res = await axios.post(`${apiUrl}/admin/githubsetting`, form);
      if (res.data.status) {
        toast.success("GitHub setting created successfully ✅");
        setIsCreateOpen(false);
        resetForm();
        fetchData();
      } else {
        toast.error(res.data.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleUpdate = async (): Promise<void> => {
    if (!editingRow) return;

    try {
      const res = await axios.put(
        `${apiUrl}/admin/githubsetting/${editingRow.id}`,
        form
      );
      if (res.data.status) {
        toast.success("GitHub setting updated successfully ✅");
        setIsEditOpen(false);
        setEditingRow(null);
        resetForm();
        fetchData();
      } else {
        toast.error(res.data.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    if (!window.confirm("Are you sure you want to delete this GitHub setting?")) return;
    try {
      const res = await axios.delete(`${apiUrl}/admin/githubsetting/${id}`);
      if (res.data.status) {
        toast.success("Deleted successfully ✅");
        fetchData();
      } else {
        toast.error(res.data.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const resetForm = (): void => {
    setForm({
      github_repo_url: "",
      github_branch: "main",
      github_token: "",
      admin_email: "",
    });
  };

  const openEdit = (row: GithubSetting): void => {
    setEditingRow(row);
    setForm({
      github_repo_url: row.github_repo_url,
      github_branch: row.github_branch,
      github_token: row.github_token,
      admin_email: row.admin_email,
    });
    setIsEditOpen(true);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onGridReady = (params: any) => {
    params.api.sizeColumnsToFit();
  };

  // Stats
  const totalConfigs = data.length;
  const activeRepos = data.length;
  const successRate = "100%";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 md:px-6 lg:px-8 py-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-[#FB3800] to-orange-500 rounded-xl">
              <FiGithub className="text-white" size={24} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">GitHub Integration</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            Manage GitHub repository configurations for auto deployment
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Total Configs</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{totalConfigs}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <FiFolder className="text-blue-500" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Active Repos</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{activeRepos}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <FiGitBranch className="text-green-500" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Success Rate</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{successRate}</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <FiTrendingUp className="text-purple-500" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Connected</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{totalConfigs}</p>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg">
                <FiActivity className="text-orange-500" size={20} />
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
                  placeholder="Search by repo URL, branch, or email..."
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
              Add Configuration
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
            <p className="mt-4 text-gray-500">Loading configurations...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && data.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiGithub className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              No GitHub configurations yet
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Add your first GitHub repository configuration to enable auto deployment
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FB3800] to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-[#FB3800] transition-all shadow-sm"
            >
              <FiPlus size={16} />
              Add Configuration
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
                onGridReady={onGridReady}
                rowHeight={48}
                headerHeight={48}
                enableCellTextSelection={true}
                ensureDomOrder={true}
              />
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-auto overflow-hidden">
            <div className="bg-gradient-to-r from-[#FB3800] to-orange-500 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FiGithub className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Add Configuration</h2>
                  <p className="text-orange-100 text-sm">Configure repository settings</p>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Repo URL *
                </label>
                <div className="relative">
                  <FiLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    name="github_repo_url"
                    value={form.github_repo_url}
                    onChange={onChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                    placeholder="https://github.com/username/repo.git"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch *
                </label>
                <div className="relative">
                  <FiGitBranch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    name="github_branch"
                    value={form.github_branch}
                    onChange={onChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                    placeholder="main"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Token *
                </label>
                <div className="relative">
                  <FiKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    name="github_token"
                    value={form.github_token}
                    onChange={onChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                    placeholder="ghp_xxxxxxxxxxxxxx"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Email *
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="email"
                    name="admin_email"
                    value={form.admin_email}
                    onChange={onChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                    placeholder="admin@example.com"
                    required
                  />
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
                Create Config
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-auto overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FiGithub className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Edit Configuration</h2>
                  <p className="text-blue-100 text-sm">Update repository settings</p>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Repo URL *
                </label>
                <div className="relative">
                  <FiLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    name="github_repo_url"
                    value={form.github_repo_url}
                    onChange={onChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch *
                </label>
                <div className="relative">
                  <FiGitBranch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    name="github_branch"
                    value={form.github_branch}
                    onChange={onChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Token *
                </label>
                <div className="relative">
                  <FiKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    name="github_token"
                    value={form.github_token}
                    onChange={onChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Email *
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="email"
                    name="admin_email"
                    value={form.admin_email}
                    onChange={onChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
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
                Update Config
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GithubSettings;