import { FC, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { 
  Lock, 
  Eye, 
  EyeOff, 
  Shield,
  RefreshCw,
  CheckCircle
} from "lucide-react";

const ChangePassword: FC = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.put(
        `${apiUrl}/auth/update-password`,
        {
          currentPassword,
          newPassword,
          confirmPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success(res.data.message);
      setIsSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
   <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-start justify-center pt-8 p-4 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#FB3800]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Simple Form Card - No scroll */}
<div className="relative w-full max-w-md -mt-12">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 lg:p-10">
          <div className="w-full">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <div className="bg-[#FB3800]/10 p-3 rounded-2xl">
                  <Lock className="h-8 w-8 text-[#FB3800]" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
              <p className="text-sm text-gray-500 mt-1">
                Update your account password
              </p>
              {isSuccess && (
                <div className="mt-3 inline-flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-700 font-medium">Password Updated!</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Lock className="h-4 w-4 inline mr-2 text-[#FB3800]" />
                  Current Password
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl 
                             text-gray-900 placeholder-gray-400
                             focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] 
                             transition-all duration-200 outline-none pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showCurrentPassword ? (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Lock className="h-4 w-4 inline mr-2 text-[#FB3800]" />
                  New Password
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl 
                             text-gray-900 placeholder-gray-400
                             focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] 
                             transition-all duration-200 outline-none pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showNewPassword ? (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Lock className="h-4 w-4 inline mr-2 text-[#FB3800]" />
                  Confirm Password
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl 
                             text-gray-900 placeholder-gray-400
                             focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] 
                             transition-all duration-200 outline-none pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showConfirmPassword ? (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#FB3800] to-orange-500 
                         text-white py-3 rounded-xl font-semibold
                         hover:shadow-lg hover:shadow-[#FB3800]/20 hover:scale-[1.02] 
                         transform transition-all duration-200
                         disabled:opacity-60 disabled:cursor-not-allowed
                         disabled:hover:scale-100 mt-2"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="animate-spin h-5 w-5" />
                    Updating...
                  </div>
                ) : (
                  <>
                    <Lock className="h-5 w-5 inline mr-2" />
                    Update Password
                  </>
                )}
              </button>

              {/* Security Note */}
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-400 flex items-center justify-center gap-2">
                  <Shield className="h-3 w-3" />
                  Your password is encrypted and securely stored
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;