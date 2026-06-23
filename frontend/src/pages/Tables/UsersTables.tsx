
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { useNavigate } from "react-router-dom";

import {
  FiSearch,
  FiUser,
  FiCalendar,
  FiTrendingUp,
  FiUsers,
  FiKey,
  FiCheckCircle,
  FiXCircle,
  FiEdit,
  FiPackage,
  FiDatabase,
  FiShield,
  FiServer,
  FiPlus,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { HiDotsHorizontal } from "react-icons/hi";

type Role = "admin" | "user" | "clone-user";

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
  angelCredential?: AngelCredential;
  packageName?: string | null;
  strategyName?: string | null;
  strategyDis?: string | null;
  packageDis?: string | null;
  packageDate?: string | null;
  packageFromDate?: string | null;
  sourceName: any;
  employeeName: any;
  password: any;
  assignEmp: any;
  source: any;
  publicIp: any;
  instanceId: any;
  status: any;
  DematFund: number;
  riskMngtActive: boolean;
  riskLimit: number;
  showPopup: boolean;
  popupHtmlContent: any;
};

type EditForm = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phoneNumber: string;
  role: Role;
  isChecked: boolean;
  password: string;
  brokerName: string;
  brokerImageLink: string;
  strategyName: string;
  strategyDis: string;
  packageName: string;
  packageDis: string;
  packageFromDate: string;
  packageDate: string;
  updatedAt: any;
  sourceName: any;
  employeeName: any;
  publicIp: any;
  instanceId: any;
  status: any;
  DematFund: number;
  riskMngtActive: boolean;
  riskLimit: number;
  showPopup: boolean;
  popupHtmlContent: any;
};

const API_URL = import.meta.env.VITE_API_URL;
const apiCRMURL = import.meta.env.VITE__CRM_API_URL;

export default function UsersTables() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [search, setSearch] = useState("");

  const [strategyList, setStrategyList] = useState<any[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState("");

    const navigate = useNavigate();

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [menuDirection, setMenuDirection] = useState<"bottom" | "top">("bottom");

  console.log(menuDirection);
  
  const [brokers, setBrokers] = useState<any[]>([]);

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const gridRef = useRef<AgGridReact>(null);

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isPackageAssignModalOpen, setIsPackageAssignModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);

  const [selectedUserForGroup, setSelectedUserForGroup] = useState<User | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [date, setDate] = useState("");
  const [packageFromDate, setPackageFromDate] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  const [sourceList, setSourceList] = useState<string[]>([]);
  const [employeeList, setEmployeeList] = useState<string[]>([]);

  console.log(sourceList,employeeList);
  

  // Create User Form States
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [broker, setBroker] = useState("");
  const [email, setEmail] = useState("");
  const [mob, setMob] = useState("");
  const [password, setPassword] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_URL}/users/get-users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });

      const payload = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setUsers(payload);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchBrokers = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/broker`, {
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
      setError(err?.response?.data?.message || err?.message || "Failed to load brokers");
    }
  };

  const getEmployeeList = async () => {
    try {
      const res = await axios.get(`${apiCRMURL}/employee/get`);
      return {
        status: true,
        data: res.data.map((emp: any) => emp.name),
      };
    } catch (error) {
      console.error("Employee API error", error);
      return { status: false, data: [] };
    }
  };

  const getSourceList = async () => {
    try {
      const res = await axios.get(`${apiCRMURL}/customers/get-batches`);
      return {
        status: true,
        data: res.data.map((item: any) => item.source_name),
      };
    } catch (error) {
      console.error("Source API error", error);
      return { status: false, data: [] };
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchBrokers();

    const fetchSourceAndEmployee = async () => {
      let sourceData = await getSourceList();
      if (sourceData.status) setSourceList(sourceData.data);

      let employeeRes = await getEmployeeList();
      if (employeeRes.status) setEmployeeList(employeeRes.data);
    };

    fetchSourceAndEmployee();
  }, []);

  useEffect(() => {
    const onScroll = () => { if (openMenuId) setOpenMenuId(null); };
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isGroupModalOpen && !creating) closeGroupModal();
        else if (isPackageAssignModalOpen) closePackageModal();
        else if (isEditModalOpen) handleCloseEditModal();
        else if (isCreateUserModalOpen) setIsCreateUserModalOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isGroupModalOpen, isPackageAssignModalOpen, isEditModalOpen, isCreateUserModalOpen, creating]);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter((u) => {
      const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase();
      return (
        u.email?.toLowerCase().includes(q) ||
        String(u.id).includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.phoneNumber?.toLowerCase?.().includes(q) ||
        u.strategyName?.toLowerCase?.().includes(q) ||
        fullName.includes(q) ||
        u.role?.toLowerCase().includes(q) ||
        u.instanceId?.toLowerCase().includes(q) ||
        u.publicIp?.toLowerCase().includes(q) ||
        (u.brokerName ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, search]);

  const fullName = (u: User) => [u.firstName, u.lastName].filter(Boolean).join(" ") || "-";

  // Create User Handler
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isChecked) {
      toast.error("Please accept the Terms and Conditions before signing up.");
      return;
    }

    setCreateLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        mob: mob,
        password: password,
        isChecked: isChecked,
        broker: broker,
      });

      if (response.data.status === true) {
        toast.success("User created successfully!");
        setIsCreateUserModalOpen(false);
        setFirstName("");
        setLastName("");
        setEmail("");
        setMob("");
        setPassword("");
        setBroker("");
        setIsChecked(false);
        fetchUsers();
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const handleGenerateToken = async (user: User) => {
    try {
      const response = await axios.get(`${API_URL}/awsadmin/aws/instance-status/${user.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}`, UserId: user.id },
      });
      const data = response.data;
      if (data.success === true) {
        toast.success(`Instance ${data.data.instanceState} !`);
      } else {
        toast.error(data?.data?.error || "Failed to fetch tokens");
      }
    } catch (error: any) {
      toast.error(error?.message || "Something went wrong");
    }
  };

  const handleRowCreateInstance = async (user: User) => {
    try {
      const confirmInstance = window.confirm("Are you sure you want to create this instance?");
      if (!confirmInstance) return;

      const loadingToastId = toast.loading("Creating instance... Please wait");

      try {
        const { data } = await axios.get(`${API_URL}/awsadmin/instance/create`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}`, userId: `${user.id}` },
          timeout: 1000 * 60 * 20,
        });

        toast.dismiss(loadingToastId);

        if (data.success === true || data.statusCode === 201) {
          toast.success("Instance Created Successfully!");
          setTimeout(() => window.location.reload(), 1500);
        } else {
          toast.error(data.message || "Failed to create instance");
        }
      } catch (error: any) {
        toast.dismiss(loadingToastId);
        toast.error(error.response?.data?.message || error.message || "Failed to create instance");
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const startInstance = async (user: User) => {
    try {
      const loadingToastId = toast.loading("Starting instance... Please wait");

      const response = await axios.get(`${API_URL}/awsadmin/aws/start-instance/${user.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          UserId: user.id,
        },
      });

      toast.dismiss(loadingToastId);

      const data = response.data;

      if (data.success === true) {
        toast.success(`Instance ${data.data.state} !`);
      } else {
        toast.error(data?.data?.error || "Failed to fetch tokens");
      }
    } catch (error: any) {
      toast.error(error?.message || "Something went wrong");
    }
  };

  const handleRowLogin = async (user: User) => {
    try {
      const { data } = await axios.get(
        `${API_URL}/admin/login/totp/angelone`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            userId: `${user.id}`,
          },
        }
      );

      if (data.status === true) {
        let angel_auth_token = data.data.jwtToken;
        let angel_refresh_token = data.data.refreshToken;
        let angel_feed_token = data.data.feedToken;

        localStorage.setItem("angel_token", angel_auth_token);
        localStorage.setItem("angel_feed_token", angel_refresh_token);
        localStorage.setItem("angel_refresh_token", angel_feed_token);
        localStorage.setItem("userID", String(user.id));

        toast.success("Login Successful in AngelOne!");
      } else {
        toast.error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const stopInstance = async (user: User) => {
    try {
      const loadingToastId = toast.loading("Stoping instance... Please wait");

      const response = await axios.get(`${API_URL}/awsadmin/aws/stop-instance/${user.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          UserId: user.id,
        },
      });

      toast.dismiss(loadingToastId);

      const data = response.data;

      if (data.success === true) {
        toast.success(`Instance ${data.data.state} !`);
      } else {
        toast.error(data?.data?.error || "Failed to fetch tokens");
      }
    } catch (error: any) {
      toast.error(error?.message || "Something went wrong");
    }
  };

  const deleteInstance = async (user: User) => {
    try {
      const loadingToastId = toast.loading("Deleting instance... Please wait");

      const response = await axios.delete(`${API_URL}/awsadmin/aws/delete-instance/${user.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          UserId: user.id,
        },
      });

      toast.dismiss(loadingToastId);

      const data = response.data;

      if (data.success === true) {
        toast.success(`Instance Deleted `);
      } else {
        toast.error(data?.data?.error || "Failed to fetch tokens");
      }
    } catch (error: any) {
      toast.error(error?.message || "Something went wrong");
    }
  };

  const fetchStrategies = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/strategies`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
          userid: localStorage.getItem("userID"),
        },
      });

      if (res.data.status === true) {
        setStrategyList(res.data.data || []);
      } else {
        toast.error(res.data.message);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRowCreateGroup = async (user: User) => {
    setOpenMenuId(null);
    setSelectedUserForGroup(user);
    setGroupName("");
    setGroupDescription("");
    await fetchStrategies();
    setIsPackageAssignModalOpen(true);
  };

  const submitCreateStrtegy = async () => {
    if (!selectedUserForGroup) return;

    const reqData = {
      strategyName: groupName,
      strategyDis: groupDescription,
      id: selectedUserForGroup.id,
    };

    try {
      const createRes = await axios.put(`${API_URL}/users/package/update`, reqData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });

      if (createRes.data.status === true) {
        toast.success(createRes.data.message);
        fetchUsers();
        setIsPackageAssignModalOpen(false);
      } else {
        toast.error(createRes?.data?.message);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to assign Group");
    }
  };

  const handleRowUpdateProfile = (user: User) => {
    setOpenMenuId(null);
    setEditingUser(user);

    const isoDate = user.packageDate ? user.packageDate.slice(0, 10) : "";
    const isoDateFrom = user.packageFromDate ? user.packageFromDate.slice(0, 10) : "";

    const form: EditForm = {
      id: user.id,
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      email: user.email,
      username: user.username,
      phoneNumber: user.phoneNumber ?? "",
      role: user.role,
      isChecked: user.isChecked,
      password: user.password,
      brokerName: user.brokerName ?? "",
      brokerImageLink: user.brokerImageLink ?? "",
      strategyName: user.strategyName ?? "",
      strategyDis: user.strategyDis ?? "",
      packageName: user.packageName ?? "",
      packageDis: user.packageDis ?? "",
      packageDate: isoDate,
      packageFromDate: isoDateFrom,
      updatedAt: user.updatedAt,
      sourceName: user.source || "",
      employeeName: user.assignEmp || "",
      publicIp: user.publicIp,
      instanceId: user.instanceId,
      DematFund: user.DematFund ?? 0,
      riskMngtActive: user.riskMngtActive ?? false,
      riskLimit: user.riskLimit ?? 0,
      showPopup: user.showPopup ?? true,
      status: user.status,
      popupHtmlContent: user.popupHtmlContent,
    };

    setEditForm(form);
    setIsEditModalOpen(true);
  };

  const toggleMenu = (id: number, buttonElement: HTMLButtonElement) => {
    buttonRef.current = buttonElement;
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  const closeGroupModal = () => {
    setIsGroupModalOpen(false);
    setSelectedUserForGroup(null);
  };

  const closePackageModal = () => {
    setIsPackageAssignModalOpen(false);
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
      packageDate: date,
      packageFromDate: packageFromDate,
    };

    try {
      setCreating(true);
      const createRes = await axios.put(`${API_URL}/users/package/update`, reqObj, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });

      if (createRes.data.status) {
        toast.success(createRes.data.message || "Package assigned");
        fetchUsers();
      } else {
        toast.error(createRes.data.message || "Failed to assign package");
      }
      closeGroupModal();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to assign package");
    } finally {
      setCreating(false);
    }
  };

  const updateEditForm = <K extends keyof EditForm>(key: K, value: EditForm[K]) => {
    setEditForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
    setEditForm(null);
  };

  const handleUpdate = async () => {
    if (!editForm || !editingUser) return;

    try {
      const payload: any = {
        firstName: editForm.firstName || null,
        lastName: editForm.lastName || null,
        email: editForm.email,
        username: editForm.username,
        phoneNumber: editForm.phoneNumber || null,
        role: editForm.role,
        isChecked: editForm.isChecked,
        brokerName: editForm.brokerName || null,
        brokerImageLink: editForm.brokerImageLink || null,
        strategyName: editForm.strategyName || null,
        strategyDis: editForm.strategyDis || null,
        packageName: editForm.packageName || null,
        packageDis: editForm.packageDis || null,
        packageDate: editForm.packageDate || null,
        packageFromDate: editForm.packageFromDate,
        source: editForm.sourceName || null,
        assignEmp: editForm.employeeName || null,
        publicIp: editForm.publicIp || null,
        CLIENT_PUBLIC_IP: editForm.publicIp || null,
        CLIENT_LOCAL_IP: editForm.publicIp || null,
        instanceId: editForm.instanceId || null,
        DematFund: editForm.DematFund,
        riskMngtActive: editForm.riskMngtActive,
        riskLimit: editForm.riskLimit,
        showPopup: editForm.showPopup,
        status: editForm.status,
        popupHtmlContent: editForm.popupHtmlContent,
      };

      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }

      const res = await axios.put(`${API_URL}/admin/clone-users/${editingUser.id}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });

      if (res.data.status) {
        toast.success(res.data.message || "User updated successfully");
        handleCloseEditModal();
        fetchUsers();
      } else {
        toast.error(res.data.message || "Failed to update user");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update user");
    }
  };


  const brokersetup = async (user: User)=> {

       console.log(user.brokerName,'=====================user==========');

       if(user.brokerName==='angelone') {

        navigate("/angelonecredential");

       } else if(user.brokerName==='kite') {

         navigate("/kitecredential");
        
       } else if(user.brokerName==='finvasia') {

         navigate("/finavasiacredential");
        
       } else if(user.brokerName==='kotak neo') {

         navigate("/kotakcredential");
        
       }else if(user.brokerName==='fyers') {
        
         navigate("/fyerscredential");

       }else if(user.brokerName==='groww') {

         navigate("/growwcredential");
        
       }else if(user.brokerName==='upstox') {

        //  navigate("/about");
        
       }

      
       
  }

  useEffect(() => {
    if (!buttonRef.current || !openMenuId) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const menuHeight = 280;
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;

    const direction = spaceBelow >= menuHeight || spaceBelow >= spaceAbove ? "bottom" : "top";
    setMenuDirection(direction);

    const x = buttonRect.right - 176;
    const y = direction === "bottom" ? buttonRect.bottom + 4 : buttonRect.top - menuHeight - 4;

    setMenuPosition({ x, y });
  }, [openMenuId]);

  const ActionsMenu = ({ user }: { user: User }) => (
    <div className="fixed z-[9999] bg-white shadow-2xl border border-gray-200 rounded-xl w-52 text-sm overflow-hidden backdrop-blur-sm"
      style={{ left: `${menuPosition.x}px`, top: `${menuPosition.y}px` }}>
      <button onClick={() => { handleGenerateToken(user); setOpenMenuId(null); }}
        className="flex items-center gap-2 w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-600">
        <FiKey className="h-4 w-4" /><span>Instance Status</span>
      </button>
      <button onClick={() => { handleRowCreateInstance(user); setOpenMenuId(null); }}
        className="flex items-center gap-2 w-full text-left px-4 py-3 hover:bg-green-50 transition-colors text-gray-700 hover:text-green-600">
        <FiServer className="h-4 w-4" /><span>Create Instance</span>
      </button>
      <button onClick={() => { handleRowCreateGroup(user); setOpenMenuId(null); }}
        className="flex items-center gap-2 w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors text-gray-700 hover:text-purple-600">
        <FiTrendingUp className="h-4 w-4" /><span>Assign Group</span>
      </button>
      <button onClick={() => { handleRowUpdateProfile(user); setOpenMenuId(null); }}
        className="flex items-center gap-2 w-full text-left px-4 py-3 hover:bg-amber-50 transition-colors text-gray-700 hover:text-amber-600">
        <FiEdit className="h-4 w-4" /><span>Update Profile</span>
      </button>
        <button onClick={() => { brokersetup(user); setOpenMenuId(null); }}
        className="flex items-center gap-2 w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-600">
        <FiKey className="h-4 w-4" /><span>Broker Setup</span>
      </button>
      <div className="border-t border-gray-100 my-1"></div>
      <button onClick={() => { handleRowLogin(user); setOpenMenuId(null); }}
        className="flex items-center gap-2 w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors text-gray-700 hover:text-indigo-600">
        <FiPackage className="h-4 w-4" /><span>Login User</span>
      </button>
      <button onClick={() => { startInstance(user); setOpenMenuId(null); }}
        className="flex items-center gap-2 w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-600">
        <FiKey className="h-4 w-4" /><span>Instance Start</span>
      </button>
      <button onClick={() => { stopInstance(user); setOpenMenuId(null); }}
        className="flex items-center gap-2 w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-600">
        <FiKey className="h-4 w-4" /><span>Instance Stop</span>
      </button>
      <button onClick={() => { deleteInstance(user); setOpenMenuId(null); }}
        className="flex items-center gap-2 w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-600">
        <FiKey className="h-4 w-4" /><span>Instance Delete</span>
      </button>
    </div>
  );

  const columnDefs: ColDef<any>[] = useMemo(() => [
    { field: undefined, headerName: '#', width: 70, cellRenderer: (params: any) => (
        <div className="flex items-center justify-center h-full"><span className="bg-gray-100 text-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-xs">{params.node.rowIndex + 1}</span></div>
      ) },
    { field: 'id', headerName: 'ID', width: 80, cellRenderer: (params: any) => (<span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">#{params.value}</span>) },
    { field: 'firstName', headerName: 'User', width: 180, cellRenderer: (params: any) => (<div className="font-medium text-gray-900">{fullName(params.data)}</div>) },
    { field: 'email', headerName: 'Email', width: 220, cellRenderer: (params: any) => (<div className="text-sm text-gray-700">{params.data.email}</div>) },
    { field: 'password', headerName: 'Password', width: 220, cellRenderer: (params: any) => (<div className="text-sm text-gray-700">{params.data.password}</div>) },
    { field: 'username', headerName: 'Username', width: 140, cellRenderer: (params: any) => (<span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs">@{params.value}</span>) },
    { field: 'brokerName', headerName: 'Broker', width: 130, cellRenderer: (params: any) => (<span>{params.value || '-'}</span>) },
    { field: 'instanceId', headerName: 'Instance ID', width: 160, cellRenderer: (params: any) => params.value ? (<span className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-xs font-medium">{params.value}</span>) : (<span className="text-gray-400">-</span>) },
    { field: 'publicIp', headerName: 'Public IP', width: 140, cellRenderer: (params: any) => params.value ? (<span className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-medium">{params.value}</span>) : (<span className="text-gray-400">-</span>) },
    { field: 'status', headerName: 'Status', width: 120, cellRenderer: (params: any) => params.value ? (<span className={`px-2 py-1 rounded-full text-xs font-medium ${params.value === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{params.value}</span>) : (<span className="text-gray-400">-</span>) },
    { field: 'strategyName', headerName: 'Group', width: 150, cellRenderer: (params: any) => params.value ? (<span className="bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full text-xs font-medium">{params.value}</span>) : (<span className="text-gray-400">-</span>) },
    { field: 'angelLoginUser', headerName: 'Login', width: 100, cellRenderer: (params: any) => (<span className={`px-3 py-1 rounded-full text-xs font-medium ${params.value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{params.value ? 'Yes' : 'No'}</span>) },
    { field: undefined, headerName: 'Actions', width: 80, cellRenderer: (params: any) => (
        <button ref={buttonRef as any} onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleMenu(params.data.id, e.currentTarget as HTMLButtonElement); }}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-all"><HiDotsHorizontal className="h-5 w-5 text-gray-500" /></button>
      ) }
  ], []);

  const defaultColDef = useMemo(() => ({
    resizable: true, sortable: true, filter: true, wrapHeaderText: true, autoHeaderHeight: true, suppressMovable: true,
    enableCellTextSelection: true, suppressCellFocus: true,
    cellStyle: { borderRight: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' },
  }), []);

  const onGridReady = useCallback((params: any) => { gridRef.current = params; }, []);

  const totalUsers = users.length;
  const activeLogins = users.filter(u => u.angelLoginUser).length;
  const withPackages = users.filter(u => u.packageName).length;
  const withStrategies = users.filter(u => u.strategyName).length;

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
          <p className="text-gray-500 text-sm ml-12">Manage all users, their packages, and groups</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-400 uppercase">Total Users</p><p className="text-2xl font-bold text-gray-800 mt-1">{totalUsers}</p></div>
              <div className="p-2 bg-blue-50 rounded-lg"><FiUser className="text-blue-500" size={20} /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-400 uppercase">Active Logins</p><p className="text-2xl font-bold text-green-600 mt-1">{activeLogins}</p></div>
              <div className="p-2 bg-green-50 rounded-lg"><FiCheckCircle className="text-green-500" size={20} /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-400 uppercase">Packages</p><p className="text-2xl font-bold text-purple-600 mt-1">{withPackages}</p></div>
              <div className="p-2 bg-purple-50 rounded-lg"><FiPackage className="text-purple-500" size={20} /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-400 uppercase">Groups</p><p className="text-2xl font-bold text-orange-600 mt-1">{withStrategies}</p></div>
              <div className="p-2 bg-orange-50 rounded-lg"><FiTrendingUp className="text-orange-500" size={20} /></div>
            </div>
          </div>
        </div>

        {/* Search Bar - Changed Refresh to Create User */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                placeholder="Search by name, email, phone, username, or ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
              {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>}
            </div>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">{filtered.length} / {users.length} users</div>
            <button onClick={() => setIsCreateUserModalOpen(true)} 
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#FB3800] to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-[#FB3800] transition-all shadow-sm">
              <FiPlus size={16} /> Create User
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (<div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm"><div className="relative"><div className="w-12 h-12 border-4 border-[#FB3800]/20 rounded-full"></div><div className="absolute top-0 left-0 w-12 h-12 border-4 border-[#FB3800] rounded-full animate-spin border-t-transparent"></div></div><p className="mt-4 text-gray-500">Loading users...</p></div>)}

        {/* Error State */}
        {error && !loading && (<div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6"><div className="flex items-center gap-3"><FiXCircle className="h-5 w-5 text-red-500" /><div><p className="font-medium text-red-800">Error Loading Users</p><p className="text-sm text-red-600">{error}</p></div></div></div>)}

        {/* Empty State */}
        {!loading && !error && users.length === 0 && (<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center"><div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6"><FiUser className="h-10 w-10 text-gray-400" /></div><h3 className="text-xl font-bold text-gray-700 mb-2">No users found</h3><p className="text-gray-500 mb-6">Get started by adding your first user</p><button onClick={() => setIsCreateUserModalOpen(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FB3800] to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-[#FB3800] transition-all shadow-sm"><FiPlus size={16} />Create User</button></div>)}

        {/* AG Grid */}
        {!loading && !error && users.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="ag-theme-alpine" style={{ height: 550, width: '100%' }}>
              <AgGridReact ref={gridRef} rowData={filtered} columnDefs={columnDefs} defaultColDef={defaultColDef}
                enableCellTextSelection={true} ensureDomOrder={true} onGridReady={onGridReady} animateRows={true}
                rowSelection="single" suppressRowClickSelection={true} pagination={true} paginationPageSize={50}
                paginationPageSizeSelector={[25, 50, 100]} domLayout="normal" rowHeight={55} headerHeight={48} />
            </div>
          </div>
        )}

        {/* Portal Dropdown */}
        {openMenuId && filtered.find((u: any) => u.id === openMenuId) && createPortal(<ActionsMenu user={filtered.find((u: any) => u.id === openMenuId)! as User} />, document.body)}

        {/* Create User Modal */}
        {isCreateUserModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCreateUserModalOpen(false)} />
            <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-[#FB3800] to-orange-500 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FiPlus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Create New User</h3>
                    <p className="text-orange-100 text-sm">Add a new user to the system</p>
                  </div>
                </div>
                <button onClick={() => setIsCreateUserModalOpen(false)} className="text-white hover:text-orange-100 transition p-2 rounded-lg hover:bg-white/10">
                  ✕
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={handleCreateUserSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="First name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="Enter email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="Enter mobile number"
                      value={mob}
                      onChange={(e) => setMob(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Broker <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all outline-none text-sm"
                      value={broker}
                      onChange={(e) => setBroker(e.target.value)}
                      required
                    >
                      <option value="">Choose a broker</option>
                      {brokers.map((b: any) => (
                        <option key={b.id} value={b.brokerName}>
                          {b.brokerName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all outline-none text-sm pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showPassword ? (
                          <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                        ) : (
                          <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Use 8+ characters with letters & numbers
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={isChecked}
                      onChange={(e) => setIsChecked(e.target.checked)}
                      className="w-4 h-4 text-[#FB3800] rounded border-gray-300 focus:ring-[#FB3800]/20"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                      I agree to the Terms and Conditions
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={createLoading}
                    className="w-full bg-gradient-to-r from-[#FB3800] to-orange-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#FB3800]/20 hover:scale-[1.02] transform transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2"
                  >
                    {createLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Creating User...
                      </div>
                    ) : (
                      <>
                        <FiPlus className="h-5 w-5 inline mr-2" />
                        Create User
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Package Modal */}
        {isGroupModalOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeGroupModal} /><div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden"><div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4 flex items-center gap-3"><div className="p-2 bg-white/20 rounded-lg"><FiPackage className="h-5 w-5 text-white" /></div><div><h3 className="text-lg font-semibold text-white">Assign Package</h3><p className="text-indigo-100 text-sm">Assign a package to {selectedUserForGroup?.firstName}</p></div></div><div className="p-6 space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Package Name *</label><input value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="Enter package name" autoFocus /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Package Description</label><textarea value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" rows={3} placeholder="Enter package description" /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label><div className="relative"><FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} /><input type="date" value={packageFromDate} onChange={(e) => setPackageFromDate(e.target.value)} className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" /></div></div><div><label className="block text-sm font-medium text-gray-700 mb-1">End Date</label><div className="relative"><FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} /><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" /></div></div></div></div><div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3"><button onClick={closeGroupModal} disabled={creating} className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-all">Cancel</button><button onClick={submitCreateGroup} disabled={creating} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2">{creating ? (<><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>Assigning...</>) : (<><FiPackage size={14} />Assign Package</>)}</button></div></div></div>)}

        {/* Strategy Assign Modal */}
        {isPackageAssignModalOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closePackageModal} /><div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden"><div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 flex items-center gap-3"><div className="p-2 bg-white/20 rounded-lg"><FiTrendingUp className="h-5 w-5 text-white" /></div><div><h3 className="text-lg font-semibold text-white">Assign Group</h3><p className="text-purple-100 text-sm">Choose a Group for {selectedUserForGroup?.firstName}</p></div></div><div className="p-6"><div><label className="block text-sm font-medium text-gray-700 mb-1">Select Group *</label><select className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all" value={selectedStrategyId} onChange={(e) => { setSelectedStrategyId(e.target.value); const selected = strategyList.find((s: any) => s.id == e.target.value); if (selected) { setGroupName(selected.strategyName); setGroupDescription(selected.strategyDis); } }}><option value="">Choose a group</option>{strategyList.map((s: any) => (<option value={s.id} key={s.id}>{s.strategyName}</option>))}</select></div>{selectedStrategyId && (<div className="mt-4 p-4 bg-purple-50 rounded-lg"><h4 className="font-medium text-purple-900 mb-1">Selected Group</h4><p className="text-sm text-purple-700">{groupDescription}</p></div>)}</div><div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3"><button onClick={closePackageModal} className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-all">Cancel</button><button onClick={submitCreateStrtegy} className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all flex items-center gap-2"><FiTrendingUp size={14} />Assign Group</button></div></div></div>)}

        {/* Edit Modal */}
        {isEditModalOpen && editForm && (<div className="fixed inset-0 z-[99999] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseEditModal} />
        <div className="relative z-10 w-full max-w-4xl bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto"><div className="sticky top-0 bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 flex justify-between items-center"><div className="flex items-center gap-3"><div className="p-2 bg-white/20 rounded-lg"><FiEdit className="h-5 w-5 text-white" /></div><div><h3 className="text-lg font-semibold text-white">Update User Profile</h3><p className="text-amber-100 text-sm">Editing {editingUser?.firstName}'s information</p></div></div><button onClick={handleCloseEditModal} className="text-white hover:text-amber-100 transition p-2 rounded-lg hover:bg-white/10">✕</button></div><div className="p-6 space-y-6"><div className="bg-gray-50 rounded-xl p-5"><h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><FiUser className="h-5 w-5 text-blue-500" />Personal Information</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">First Name</label><input type="text" value={editForm.firstName} onChange={(e) => updateEditForm("firstName", e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label><input type="text" value={editForm.lastName} onChange={(e) => updateEditForm("lastName", e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" value={editForm.email} onChange={(e) => updateEditForm("email", e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Username *</label><input type="text" value={editForm.username} onChange={(e) => updateEditForm("username", e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label><input type="text" value={editForm.phoneNumber} onChange={(e) => updateEditForm("phoneNumber", e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Role</label><select value={editForm.role} onChange={(e) => updateEditForm("role", e.target.value as Role)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"><option value="user">User</option><option value="clone-user">Clone User</option></select></div><div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200"><input id="edit-isChecked" type="checkbox" checked={editForm.isChecked} onChange={(e) => updateEditForm("isChecked", e.target.checked)} className="rounded focus:ring-blue-500 h-4 w-4 text-blue-600" /><label htmlFor="edit-isChecked" className="text-sm font-medium text-gray-700">Account Verified</label></div></div></div><div className="bg-gray-50 rounded-xl p-5"><h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><FiDatabase className="h-5 w-5 text-purple-500" />Broker & Group</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Public IP</label><input type="text" value={editForm.publicIp || ""} onChange={(e) => updateEditForm("publicIp", e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Instance ID</label><input type="text" value={editForm.instanceId || ""} onChange={(e) => updateEditForm("instanceId", e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Broker Name</label><select value={editForm.brokerName} onChange={(e) => { const selectedBroker = brokers.find(b => b.brokerName === e.target.value); updateEditForm("brokerName", selectedBroker?.brokerName); updateEditForm("brokerImageLink", selectedBroker?.brokerLink); }} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"><option value="">Select broker</option>{brokers.map((broker) => (<option key={broker.brokerName} value={broker.brokerName}>{broker.brokerName}</option>))}</select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Broker Image URL</label><input type="text" value={editForm.brokerImageLink} onChange={(e) => updateEditForm("brokerImageLink", e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all" readOnly /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label><input type="text" value={editForm.strategyName} onChange={(e) => updateEditForm("strategyName", e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Group Description</label><textarea value={editForm.strategyDis} onChange={(e) => updateEditForm("strategyDis", e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all" rows={2} /></div></div></div><div className="bg-gray-50 rounded-xl p-5"><h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><FiPackage className="h-5 w-5 text-indigo-500" />Package Details</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label><input type="text" value={editForm.packageName} onChange={(e) => updateEditForm("packageName", e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Package Description</label><textarea value={editForm.packageDis} onChange={(e) => updateEditForm("packageDis", e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" rows={2} /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label><div className="relative"><FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} /><input type="date" value={editForm.packageFromDate} onChange={(e) => updateEditForm("packageFromDate", e.target.value)} className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" /></div></div><div><label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
        <div className="relative"><FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} /><input type="date" value={editForm.packageDate} onChange={(e) => updateEditForm("packageDate", e.target.value)} className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" /></div></div></div></div><div className="bg-gray-50 rounded-xl p-5">
       
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          </div>
          
          
          
          </div>
          <div className="bg-gray-50 rounded-xl p-5"><h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><FiShield className="h-5 w-5 text-red-500" />Risk & Popup Settings</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Demat Fund (₹)</label><input type="number" step="1000" value={editForm.DematFund} onChange={(e) => updateEditForm("DematFund", parseFloat(e.target.value) || 0)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Risk Limit (₹)</label><input type="number" step="1000" value={editForm.riskLimit} onChange={(e) => updateEditForm("riskLimit", parseFloat(e.target.value) || 0)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Public IP</label><input type="text" value={editForm.publicIp || ""} onChange={(e) => updateEditForm("publicIp", e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Instance ID</label><input type="text" value={editForm.instanceId || ""} onChange={(e) => updateEditForm("instanceId", e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><input type="text" value={editForm.status || ""} onChange={(e) => updateEditForm("status", e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">HTML Content</label><input type="text" value={editForm.popupHtmlContent || ""} onChange={(e) => updateEditForm("popupHtmlContent", e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all" /></div><div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200"><input id="edit-riskMngtActive" type="checkbox" checked={editForm.riskMngtActive} onChange={(e) => updateEditForm("riskMngtActive", e.target.checked)} className="rounded focus:ring-red-500 h-4 w-4 text-red-600" /><label htmlFor="edit-riskMngtActive" className="text-sm font-medium text-gray-700">Enable Risk Management</label></div><div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200"><input id="edit-showPopup" type="checkbox" checked={editForm.showPopup} onChange={(e) => updateEditForm("showPopup", e.target.checked)} className="rounded focus:ring-green-500 h-4 w-4 text-green-600" /><label htmlFor="edit-showPopup" className="text-sm font-medium text-gray-700">Show Popup Notifications</label></div></div></div></div><div className="sticky bottom-0 px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3"><button onClick={handleCloseEditModal} className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-all">Cancel</button><button onClick={handleUpdate} className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all flex items-center gap-2"><FiEdit size={14} />Update User</button></div></div></div>)}
      </div>
    </div>
  );
}