import { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import { toast } from "react-toastify";

import Input from "../form/input/InputField";
import Label from "../form/Label";
import axios from "axios";
import { 
  User, 
  Mail, 
  Phone, 
  Building2,
  Save,
  X,
  RefreshCw,
  CheckCircle,
  Edit2,
  UserCircle
} from "lucide-react";

interface UserInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  username: string;
  brokerName: string;
  bio: string;
  image: File | null;
}

export default function UserInfoCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const [broker, setBroker] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  
  const [userInfo, setUserInfo] = useState<UserInfo>({
    id: 1,
    firstName: "",
    lastName: "",
    brokerName: "",
    email: "",
    username: "",
    phoneNumber: "",
    bio: "",
    image: null,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await axios.get(`${apiUrl}/users/getuser/profile`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            AngelOneToken: localStorage.getItem("angel_token") || "",
          },
        });
        
        setUserInfo(res.data.data);
        setBroker(res.data.data.brokerName);
      } catch (err: any) {
        console.error("API fetch error:", err);
      }
    };
    fetchUserData();
  }, []);

  const handleChange = (field: keyof UserInfo, value: any) => {
    setUserInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("id", String(userInfo.id));
      formData.append("firstName", userInfo.firstName);
      formData.append("lastName", userInfo.lastName);
      formData.append("email", userInfo.email);
      formData.append("phoneNumber", userInfo.phoneNumber);
      formData.append("brokerName", broker);
      formData.append("bio", userInfo.bio);
      if (userInfo.image) {
        formData.append("image", userInfo.image);
      }

      const response = await axios.put(`${apiUrl}/users/profile/update`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          "AngelOneToken": localStorage.getItem("angel_token") || "",
        },
      });

      const updatedUser = response.data.user;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUserInfo(updatedUser);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      closeModal();
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-[#FB3800]/10 p-2.5 rounded-xl">
            <UserCircle className="h-6 w-6 text-[#FB3800]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            <p className="text-sm text-gray-500">Manage your profile details</p>
          </div>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#FB3800] bg-[#FB3800]/10 rounded-xl hover:bg-[#FB3800]/20 transition-colors"
        >
          <Edit2 className="h-4 w-4" />
          Edit Profile
        </button>
      </div>

      {/* User Info Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</p>
            <p className="mt-1 text-sm text-gray-900 font-medium">
              {userInfo.firstName} {userInfo.lastName}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Username</p>
            <p className="mt-1 text-sm text-gray-900 font-medium">@{userInfo.username}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</p>
            <p className="mt-1 text-sm text-gray-900 font-medium">{userInfo.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</p>
            <p className="mt-1 text-sm text-gray-900 font-medium">{userInfo.phoneNumber}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Broker</p>
            <p className="mt-1 text-sm text-gray-900 font-medium">{userInfo.brokerName || "Not set"}</p>
          </div>
        </div>
      </div>

      {/* Modal - Edit Profile */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-lg m-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-[#FB3800]/10 p-2 rounded-xl">
                <User className="h-5 w-5 text-[#FB3800]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Edit Profile</h3>
                <p className="text-xs text-gray-500">Update your personal information</p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="p-6 space-y-4">
              {/* Success Message */}
              {isSaved && (
                <div className="flex items-center gap-2 bg-green-50 px-4 py-2.5 rounded-xl border border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">Profile updated successfully!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    <User className="h-3.5 w-3.5 inline mr-1.5 text-[#FB3800]" />
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={userInfo.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    className="mt-1.5 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl 
                             text-gray-900 placeholder-gray-400
                             focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] 
                             transition-all duration-200 outline-none text-sm"
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    <User className="h-3.5 w-3.5 inline mr-1.5 text-[#FB3800]" />
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={userInfo.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    className="mt-1.5 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl 
                             text-gray-900 placeholder-gray-400
                             focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] 
                             transition-all duration-200 outline-none text-sm"
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  <User className="h-3.5 w-3.5 inline mr-1.5 text-[#FB3800]" />
                  Username <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  value={userInfo.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  className="mt-1.5 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl 
                           text-gray-900 placeholder-gray-400
                           focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] 
                           transition-all duration-200 outline-none text-sm"
                  placeholder="Enter username"
                  required
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  <Mail className="h-3.5 w-3.5 inline mr-1.5 text-[#FB3800]" />
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email"
                  value={userInfo.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="mt-1.5 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl 
                           text-gray-900 placeholder-gray-400
                           focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] 
                           transition-all duration-200 outline-none text-sm"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  <Phone className="h-3.5 w-3.5 inline mr-1.5 text-[#FB3800]" />
                  Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  value={userInfo.phoneNumber}
                  onChange={(e) => handleChange("phoneNumber", e.target.value)}
                  className="mt-1.5 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl 
                           text-gray-900 placeholder-gray-400
                           focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] 
                           transition-all duration-200 outline-none text-sm"
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  <Building2 className="h-3.5 w-3.5 inline mr-1.5 text-[#FB3800]" />
                  Broker <span className="text-red-500">*</span>
                </Label>
                <select
                  value={broker}
                  onChange={(e) => setBroker(e.target.value)}
                  className="mt-1.5 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl 
                           text-gray-900 focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] 
                           transition-all duration-200 outline-none text-sm"
                  required
                >
                  <option value="">Select Broker</option>
                  <option value="Angelone">Angelone</option>
                  <option value="5Paisa">5Paisa</option>
                  <option value="AliceBlue">AliceBlue</option>
                  <option value="Binance">Binance</option>
                  <option value="BitBns">BitBns</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#FB3800] to-orange-500 
                         text-white text-sm font-semibold rounded-xl hover:shadow-lg 
                         hover:shadow-[#FB3800]/20 hover:scale-[1.02] transform transition-all duration-200
                         disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}