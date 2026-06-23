import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { SiRclone } from "react-icons/si";

import { RiDeleteBin5Fill } from "react-icons/ri";

import { IoCreateSharp } from "react-icons/io5";
import { FiSearch, FiRefreshCw, FiTrendingUp } from "react-icons/fi";
import {
  HiDotsHorizontal,
  HiPlus,

  HiOutlineDocumentAdd,
  HiOutlineUserAdd,
  HiX,

  HiOutlineCreditCard,

  HiOutlineUser,
  HiOutlineMail,
  HiOutlineKey,

  HiOutlineCloudUpload,
  HiOutlineExclamationCircle,
  HiOutlineTrash,
} from "react-icons/hi";
import { MdOutlineEditNote } from "react-icons/md";

const apiUrl = import.meta.env.VITE_API_URL;

type Role = "admin" | "user" | "clone-user";
type UserRow = {
  id: number;
  firstName?: string | null;
  password?: string | null;
  lastName?: string | null;
  email: string;
  username: string;
  phoneNumber?: string | null;
  role: Role;
  isChecked: boolean;
  brokerName?: string | null;
  brokerImageLink?: string | null;
  strategyName?: string | null;
  strategyDis?: string | null;
  packageName?: string | null;
  packageDis?: string | null;
  packageDate?: string | null;
  DematFund: any;
};

type UserForm = {
  firstName: string;
  password?: string | null;
  lastName: string;
  email: string;
  username: string;
  phoneNumber: string;
  role: Role;
  isChecked: boolean;
  brokerName: string;
  brokerImageLink: string;
  strategyName: string;
  strategyDis: string;
  packageName: string;
  packageDis: string;
  DematFund: any;
  packageDate: string;
};

const emptyForm: UserForm = {
  firstName: "",
  lastName: "",
  password: "",
  email: "",
  username: "",
  phoneNumber: "",
  role: "user",
  isChecked: false,
  brokerName: "",
  brokerImageLink: "",
  strategyName: "",
  strategyDis: "",
  packageName: "",
  packageDis: "",
  packageDate: "",
  DematFund: 0,
};

const UserClone: React.FC = () => {
  const navigate = useNavigate();
  const gridRef = useRef<AgGridReact>(null);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [createForm, setCreateForm] = useState<UserForm>(emptyForm);
  const [editForm, setEditForm] = useState<UserForm>(emptyForm);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserRow | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingUserId, setUploadingUserId] = useState<number | null>(null);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [openActionId, setOpenActionId] = useState<number | null>(null);
  const [actionButtonRect, setActionButtonRect] = useState<DOMRect | null>(null);
  const [actionButtonNode, setActionButtonNode] = useState<HTMLElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brokers, setBrokers] = useState<any[]>([]);

  const actionMenuRef = useRef<HTMLDivElement>(null);

  const updateCreateForm = (field: keyof UserForm, value: string | boolean | number) => {
    setCreateForm((prev) => ({ ...prev, [field]: value } as UserForm));
  };

  const updateEditForm = (field: keyof UserForm, value: string | boolean | number) => {
    setEditForm((prev) => ({ ...prev, [field]: value } as UserForm));
  };

  const fetchBrokers = async () => {
    try {
      const res = await axios.get(`${apiUrl}/admin/broker`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });
      if (res?.data?.data.length) {
        setBrokers(res?.data?.data);
      } else {
        setBrokers([]);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/admin/clone-users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID") || "",
        },
      });
      if (res.data.status === true) {
        setUsers(res.data.data || []);
      } else {
        toast.error(res.data.message || "Failed to fetch users");
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchBrokers();
  }, []);

  // Filter users based on search
  const filteredUsers = users.filter((user) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(q) ||
      user.lastName?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      user.username?.toLowerCase().includes(q) ||
      user.phoneNumber?.toLowerCase().includes(q) ||
      user.brokerName?.toLowerCase().includes(q)
    );
  });

useEffect(() => {
  if (gridRef.current?.api) {
    gridRef.current.api.setGridOption(
      "quickFilterText",
      searchTerm
    );
  }
}, [searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node) &&
        actionButtonNode &&
        !actionButtonNode.contains(event.target as Node)
      ) {
        setOpenActionId(null);
        setActionButtonRect(null);
        setActionButtonNode(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [actionButtonNode]);

  // Handle Escape key to close modals
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isCreateModalOpen) handleCloseCreateModal();
        if (isEditModalOpen) handleCloseEditModal();
        if (isDeleteModalOpen) handleCloseDeleteModal();
        if (isFileModalOpen) handleCloseFileModal();
        setOpenActionId(null);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isCreateModalOpen, isEditModalOpen, isDeleteModalOpen, isFileModalOpen]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.email.trim() || !createForm.phoneNumber.trim()) {
      toast.error("Email and phoneNumber are required");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      ...createForm,
      packageDate: createForm.packageDate || null,
    };

    try {
      const res = await axios.post(`${apiUrl}/admin/clone-users`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID") || "",
        },
      });
      if (res.data.status === true) {
        toast.success(res.data.message || "User created successfully");
        handleCloseCreateModal();
        fetchUsers();
      } else {
        toast.error(res.data.message || "Failed to create user");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (user: UserRow) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      password: user.password || "",
      username: user.username || "",
      phoneNumber: user.phoneNumber || "",
      role: user.role || "user",
      isChecked: user.isChecked || false,
      brokerName: user.brokerName || "",
      brokerImageLink: user.brokerImageLink || "",
      strategyName: user.strategyName || "",
      strategyDis: user.strategyDis || "",
      packageName: user.packageName || "",
      packageDis: user.packageDis || "",
      packageDate: user.packageDate ? user.packageDate.slice(0, 10) : "",
      DematFund: user.DematFund || 0,
    });
    setIsEditModalOpen(true);
    closeActionMenu();
  };

  const handleDeleteClick = (user: UserRow) => {
    setDeletingUser(user);
    setIsDeleteModalOpen(true);
    closeActionMenu();
  };

  const handleUpdate = async () => {
    if (!editingUser) {
      toast.error("No user selected");
      return;
    }
    if (!editForm.email.trim() || !editForm.username.trim()) {
      toast.error("Email and Username are required");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      ...editForm,
      packageDate: editForm.packageDate || null,
    };

    try {
      const res = await axios.put(
        `${apiUrl}/admin/clone-users/${editingUser.id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            AngelOneToken: localStorage.getItem("angel_token") || "",
            userid: localStorage.getItem("userID") || "",
          },
        }
      );
      if (res.data.status === true) {
        toast.success(res.data.message || "User updated successfully");
        handleCloseEditModal();
        fetchUsers();
      } else {
        toast.error(res.data.message || "Failed to update user");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    setIsSubmitting(true);
    try {
      const res = await axios.delete(`${apiUrl}/admin/clone-users/${deletingUser.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID") || "",
        },
      });
      if (res.data.status === true) {
        toast.success(res.data.message || "User deleted successfully");
        handleCloseDeleteModal();
        fetchUsers();
      } else {
        toast.error(res.data.message || "Failed to delete user");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateOrder = (userId: number, username: any, brokerName: any) => {
    try {
      navigate(`/order-admin/${userId}/${username}/${brokerName}`);
      closeActionMenu();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    }
  };

  // const handleOpenFileModal = (userId: number) => {
  //   setUploadingUserId(userId);
  //   setExcelFile(null);
  //   setIsFileModalOpen(true);
  //   if (fileInputRef.current) {
  //     fileInputRef.current.value = "";
  //   }
  //   closeActionMenu();
  // };



  const handleCloseFileModal = () => {
    setIsFileModalOpen(false);
    setUploadingUserId(null);
    setExcelFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedExtensions = [".xls", ".xlsx"];
    const fileName = file.name.toLowerCase();
    const isValid = allowedExtensions.some((ext) => fileName.endsWith(ext));
    if (!isValid) {
      toast.error("Please select a valid Excel file (.xls or .xlsx)");
      e.target.value = "";
      setExcelFile(null);
      return;
    }
    setExcelFile(file);
  };

  const handleExcelUpload = async () => {
    if (!uploadingUserId) {
      toast.error("User not selected");
      return;
    }
    if (!excelFile) {
      toast.error("Please select an Excel file first");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("file", excelFile);
    formData.append("userId", String(uploadingUserId));

    try {
      const res = await axios.post(
        `${apiUrl}/admin/clone-users/upload-excel`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            AngelOneToken: localStorage.getItem("angel_token") || "",
            userid: uploadingUserId || "",
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (res.data.status === true) {
        toast.success(res.data.message || "Excel uploaded successfully");
        handleCloseFileModal();
        fetchUsers();
      } else {
        toast.error(res.data.message || "Failed to process Excel");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseCreateModal = () => {
    if (isSubmitting) return;
    setIsCreateModalOpen(false);
    setCreateForm(emptyForm);
  };

  const handleCloseEditModal = () => {
    if (isSubmitting) return;
    setIsEditModalOpen(false);
    setEditingUser(null);
    setEditForm(emptyForm);
  };

  const handleCloseDeleteModal = () => {
    if (isSubmitting) return;
    setIsDeleteModalOpen(false);
    setDeletingUser(null);
  };

  const toggleActionMenu = (userId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const button = e.currentTarget as HTMLButtonElement;
    const rect = button.getBoundingClientRect();

    if (openActionId === userId) {
      setOpenActionId(null);
      setActionButtonRect(null);
      setActionButtonNode(null);
    } else {
      setActionButtonRect(rect);
      setActionButtonNode(button);
      setOpenActionId(userId);
    }
  };

  const closeActionMenu = () => {
    setOpenActionId(null);
    setActionButtonRect(null);
    setActionButtonNode(null);
  };

  const getDropdownStyle = (): React.CSSProperties => {
    if (!actionButtonRect) return { display: "none" };
    return {
      position: "fixed",
      top: actionButtonRect.bottom + 5,
      left: Math.min(actionButtonRect.left - 100, window.innerWidth - 200),
      zIndex: 9999,
    };
  };

  // AG Grid column definitions
  const columnDefs: any[] = [
    {
      headerName: "#",
      width: 70,
      minWidth: 60,
      valueGetter: (params: any) => params.node.rowIndex + 1,
      cellStyle: { textAlign: "center", fontWeight: "500" },
      sortable: false,
      filter: false,
    },
    {
      field: "name",
      headerName: "User",
      valueGetter: (params: any) => {
        const firstName = params.data.firstName || "";
        const lastName = params.data.lastName || "";
        return `${firstName} ${lastName}`.trim();
      },
      width: 180,
      minWidth: 150,
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#FB3800] to-orange-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">{params.value?.charAt(0) || "U"}</span>
          </div>
          <span className="font-medium text-gray-800">{params.value || "-"}</span>
        </div>
      ),
    },
    {
      field: "email",
      headerName: "Email",
      width: 220,
      minWidth: 200,
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-2">
          <HiOutlineMail className="text-gray-400" size={14} />
          <span className="text-sm">{params.value}</span>
        </div>
      ),
    },
    {
      field: "username",
      headerName: "Username",
      width: 130,
      minWidth: 110,
      cellRenderer: (params: any) => (
        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">@{params.value}</span>
      ),
    },
    {
      field: "phoneNumber",
      headerName: "Phone",
      width: 140,
      minWidth: 120,
    },
    {
      field: "DematFund",
      headerName: "Fund",
      width: 120,
      minWidth: 100,
      valueFormatter: (params: any) => {
        return params.value ? `₹${Number(params.value).toLocaleString('en-IN')}` : '₹0';
      },
      cellRenderer: (params: any) => (
        <span className="font-semibold text-green-600">{params.value ? `₹${Number(params.value).toLocaleString('en-IN')}` : '₹0'}</span>
      ),
    },
    {
      field: "brokerName",
      headerName: "Broker",
      width: 130,
      minWidth: 110,
      cellRenderer: (params: any) => (
        <span className="inline-flex px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
          {params.value || "-"}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 80,
      minWidth: 80,
      cellRenderer: (params: any) => (
        <button
          onClick={(e) => toggleActionMenu(params.data.id, e)}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-all"
        >
          <HiDotsHorizontal className="h-5 w-5 text-gray-500" />
        </button>
      ),
      sortable: false,
      filter: false,
      resizable: false,
    },
  ];

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
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0',
  });

  const totalUsers = users.length;
  const totalFunds = users.reduce((sum, user) => sum + (Number(user.DematFund) || 0), 0);
  const cloneUsers = users.filter(u => u.role === 'clone-user').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 md:px-6 lg:px-8 py-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-[#FB3800] to-orange-500 rounded-xl">
              <SiRclone className="text-white" size={24} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">User Clone Management</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            Manage and clone user accounts with ease
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Total Users</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{totalUsers}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <HiOutlineUser className="text-blue-500" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Clone Users</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{cloneUsers}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <HiOutlineUserAdd className="text-green-500" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Total Funds</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">₹{totalFunds.toLocaleString('en-IN')}</p>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg">
                <HiOutlineCreditCard className="text-orange-500" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Active Brokers</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{users.filter(u => u.brokerName).length}</p>
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
                  placeholder="Search by name, email, username, or broker..."
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
              <HiPlus size={16} />
              Create User
            </button>

            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all"
            >
              <FiRefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-[#FB3800]/20 rounded-full"></div>
                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-[#FB3800] rounded-full animate-spin border-t-transparent"></div>
              </div>
              <p className="mt-4 text-gray-500">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <SiRclone className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No users found</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                Get started by creating your first user account
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FB3800] to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-[#FB3800] transition-all shadow-sm"
              >
                <HiPlus size={16} />
                Create User
              </button>
            </div>
          ) : (
            <div className="ag-theme-alpine" style={{ height: 550, width: "100%" }}>
              <AgGridReact
                ref={gridRef}
                rowData={filteredUsers}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                getRowStyle={getRowStyle}
                pagination={true}
                paginationPageSize={20}
                paginationPageSizeSelector={[10, 20, 50, 100]}
                enableCellTextSelection={true}
                ensureDomOrder={true}
                rowHeight={55}
                headerHeight={48}
                animateRows={true}
                onGridReady={(params) => params.api.sizeColumnsToFit()}
              />
            </div>
          )}
        </div>
      </div>

      {/* Floating Dropdown Menu */}
      {openActionId !== null && actionButtonRect && (
        <div
          ref={actionMenuRef}
          style={getDropdownStyle()}
          className="fixed w-48 bg-white rounded-xl shadow-2xl border border-gray-200 z-[9999] overflow-hidden"
        >
          <div className="py-2">
            <button
              onClick={() => {
                const user = users.find(u => u.id === openActionId);
                if (user) handleEditClick(user);
              }}
              className="flex items-center w-full gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              <MdOutlineEditNote className="w-4 h-4" />
              <span>Update User</span>
            </button>
            <button
              onClick={() => {
                const user = users.find(u => u.id === openActionId);
                if (user) handleDeleteClick(user);
              }}
              className="flex items-center w-full gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <RiDeleteBin5Fill className="w-4 h-4" />
              <span>Delete User</span>
            </button>
        
            <button
              onClick={() => {
                const user = users.find(u => u.id === openActionId);
                if (user) {
                  handleCreateOrder(user.id, user.username, user.brokerName);
                }
              }}
              className="flex items-center w-full gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
            >
              <IoCreateSharp className="w-4 h-4" />
              <span>Create Order</span>
            </button>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4 z-[99999]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-[#FB3800] to-orange-500 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <HiOutlineUserAdd className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Create User</h2>
                  <p className="text-orange-100 text-sm">Add a new user to the system</p>
                </div>
              </div>
              <button
                onClick={handleCloseCreateModal}
                disabled={isSubmitting}
                className="text-white/80 hover:text-white transition"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            <form className="p-6 space-y-5" onSubmit={handleCreate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={createForm.firstName}
                    onChange={(e) => updateCreateForm("firstName", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                    placeholder="Enter first name"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={createForm.lastName}
                    onChange={(e) => updateCreateForm("lastName", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                    placeholder="Enter last name"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <div className="relative">
                    <HiOutlineMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => updateCreateForm("email", e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                      placeholder="user@example.com"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    value={createForm.phoneNumber}
                    onChange={(e) => updateCreateForm("phoneNumber", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                    placeholder="+91 9876543210"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <HiOutlineKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={createForm.password || ""}
                      onChange={(e) => updateCreateForm("password", e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                      placeholder="Enter password"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Broker</label>
                  <select
                    value={createForm.brokerName}
                    onChange={(e) => updateCreateForm("brokerName", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                    disabled={isSubmitting}
                  >
                    <option value="">Select a broker</option>
                    {brokers.map((broker) => (
                      <option key={broker.brokerName} value={broker.brokerName}>{broker.brokerName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-[#FB3800] to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-[#FB3800] transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Creating...
                    </>
                  ) : (
                    'Create User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <MdOutlineEditNote className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Edit User</h2>
                  <p className="text-blue-100 text-sm">Update user information</p>
                </div>
              </div>
              <button
                onClick={handleCloseEditModal}
                disabled={isSubmitting}
                className="text-white/80 hover:text-white transition"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => updateEditForm("firstName", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => updateEditForm("lastName", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <div className="relative">
                    <HiOutlineMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => updateEditForm("email", e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phoneNumber}
                    onChange={(e) => updateEditForm("phoneNumber", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => updateEditForm("username", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <HiOutlineKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={editForm.password || ""}
                      onChange={(e) => updateEditForm("password", e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Broker</label>
                  <select
                    value={editForm.brokerName}
                    onChange={(e) => updateEditForm("brokerName", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    disabled={isSubmitting}
                  >
                    <option value="">Select broker</option>
                    {brokers.map((broker) => (
                      <option key={broker.brokerName} value={broker.brokerName}>{broker.brokerName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Demat Fund</label>
                  <input
                    type="number"
                    value={editForm.DematFund}
                    onChange={(e) => updateEditForm("DematFund", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Updating...
                    </>
                  ) : (
                    'Update User'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && deletingUser && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <HiOutlineTrash className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Delete User</h2>
                  <p className="text-red-100 text-sm">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={handleCloseDeleteModal}
                disabled={isSubmitting}
                className="text-white/80 hover:text-white transition"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <HiOutlineExclamationCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-red-800 font-medium">Warning: This action is permanent</p>
                    <p className="text-sm text-red-700 mt-1">
                      Are you sure you want to delete user <span className="font-semibold">{deletingUser.firstName} {deletingUser.lastName}</span>?
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-5 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <HiOutlineTrash className="w-4 h-4" />
                    Delete User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILE UPLOAD MODAL */}
      {isFileModalOpen && uploadingUserId && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <HiOutlineCloudUpload className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Upload Excel</h2>
                  <p className="text-purple-100 text-sm">For User ID: {uploadingUserId}</p>
                </div>
              </div>
              <button
                onClick={handleCloseFileModal}
                disabled={isSubmitting}
                className="text-white/80 hover:text-white transition"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
                <HiOutlineDocumentAdd className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-2">Click to browse or drag & drop</p>
                <p className="text-xs text-gray-500 mb-4">Supports .xls, .xlsx files</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={handleExcelChange}
                  className="hidden"
                  id="excel-file-input"
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="excel-file-input"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'}`}
                >
                  <HiOutlineCloudUpload className="w-4 h-4" />
                  Browse Files
                </label>
              </div>

              {excelFile && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HiOutlineDocumentAdd className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700 truncate">{excelFile.name}</span>
                    </div>
                    {!isSubmitting && (
                      <button
                        onClick={() => {
                          setExcelFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <HiX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseFileModal}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExcelUpload}
                disabled={!excelFile || isSubmitting}
                className={`px-5 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${excelFile && !isSubmitting ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <HiOutlineCloudUpload className="w-4 h-4" />
                    Upload File
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserClone;