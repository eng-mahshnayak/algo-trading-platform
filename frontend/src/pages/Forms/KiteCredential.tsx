import { FC, useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { 
  Shield, 
  Key, 
  Eye, 
  EyeOff, 
  User, 
  Fingerprint,
  Save,
  RefreshCw,
  CheckCircle,
  Lock
} from "lucide-react";

const KiteCredential: FC = () => {
  const apiUrl = import.meta.env.VITE_API_URL;

  // Form fields
  const [clientId, setClientId] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [pin, setPin] = useState("");
  const [apiKey, setApiKey] = useState("");

  // Toggles
  const [showTotp, setShowTotp] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${apiUrl}/kite/appcredential/get`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            AngelOneToken: localStorage.getItem("angel_token"),
          },
        });

        if (res.data.status) {
          setClientId(res.data.data.clientId || "");
          setTotpSecret(res.data.data.totpSecret || "");
          setPin(res.data.data.pin || "");
          setApiKey(res.data.data.apiKey || "");
          if (res.data.data.clientId) {
            setIsSaved(true);
          }
        }
      } catch (err) {
        toast.error("Failed to load credentials");
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const reqData = {
        clientId: clientId,
        totpSecret: totpSecret,
        apiKey: apiKey,
        pin: pin,
      };

      const res = await axios.post(`${apiUrl}/kite/appcredential/create`, reqData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          "AngelOneToken": localStorage.getItem("angel_token") || "",
        },
      });

      if (res.data.status == true) {
        toast.success(res?.data?.message);
        setIsSaved(true);
      } else {
        toast.error(res?.data?.message || "Something went wrong");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-start justify-center pt-10 p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#FB3800]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Simple Form Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-8 lg:p-10">
          <div className="w-full">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-3">
                <div className="bg-[#FB3800]/10 p-3 rounded-2xl">
                  <Shield className="h-8 w-8 text-[#FB3800]" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Kite Credentials</h2>
              <p className="text-sm text-gray-500 mt-1">
                Configure your Kite API credentials
              </p>
              {isSaved && (
                <div className="mt-3 inline-flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-700 font-medium">Credentials Saved</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Kite Client ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4 inline mr-2 text-[#FB3800]" />
                  Kite Client ID
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Enter your Kite client ID"
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl 
                           text-gray-900 placeholder-gray-400
                           focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] 
                           transition-all duration-200 outline-none"
                />
              </div>

              {/* Kite Password / PIN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="h-4 w-4 inline mr-2 text-[#FB3800]" />
                  Kite Password
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPin ? "text" : "password"}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter your Kite password"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl 
                             text-gray-900 placeholder-gray-400
                             focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] 
                             transition-all duration-200 outline-none pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPin ? (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Key className="h-4 w-4 inline mr-2 text-[#FB3800]" />
                  API Key
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl 
                           text-gray-900 placeholder-gray-400
                           focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] 
                           transition-all duration-200 outline-none"
                />
              </div>

              {/* API Secret (TOTP Secret) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Fingerprint className="h-4 w-4 inline mr-2 text-[#FB3800]" />
                  API Secret
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showTotp ? "text" : "password"}
                    value={totpSecret}
                    onChange={(e) => setTotpSecret(e.target.value)}
                    placeholder="Enter your API secret"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl 
                             text-gray-900 placeholder-gray-400
                             focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] 
                             transition-all duration-200 outline-none pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTotp(!showTotp)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showTotp ? (
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
                         disabled:hover:scale-100 mt-4"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="animate-spin h-5 w-5" />
                    Saving...
                  </div>
                ) : (
                  <>
                    <Save className="h-5 w-5 inline mr-2" />
                    Save Credentials
                  </>
                )}
              </button>

              {/* Security Note */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-400 flex items-center justify-center gap-2">
                  <Shield className="h-3 w-3" />
                  Encrypted & securely stored
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KiteCredential;