import { ArrowUpIcon } from "../../icons";
import Badge from "../ui/badge/Badge";
import axios from "axios";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiRefreshCw, FiUsers } from "react-icons/fi";

export default function EcommerceMetrics() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const [userLength, setUserLength] = useState("");
  const [loading, setLoading] = useState(true);

  const handleGenerateToken = async () => {
    toast.info("Token generation feature coming soon!");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/admin/get/totalusers`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            AngelOneToken: localStorage.getItem("angel_token") || "",
          },
        });

        if (data.status == true) {
          setUserLength(data.data);
        } else if (data.status == false && data.message == 'Unauthorized') {
          localStorage.clear();
          navigate("/");
        } else {
          toast.error(data.error);
        }
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {/* Generate Token Card */}
      <div className="bg-gradient-to-r from-[#FB3800] to-orange-500 rounded-xl shadow-sm p-6 text-white">
        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-white/20 rounded-xl mb-4">
            <FiRefreshCw size={28} className="text-white" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Generate Token</h3>
          <p className="text-white/80 text-sm mb-4">Create a new trading token for your account</p>
          <button
            onClick={handleGenerateToken}
            className="px-5 py-2 bg-white text-[#FB3800] rounded-lg font-medium hover:bg-white/90 transition-all"
          >
            Generate Now
          </button>
        </div>
      </div>

      {/* Total Users Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <FiUsers size={24} className="text-blue-500" />
          </div>
        </div>
        <div>
          <span className="text-sm text-gray-500">Total Users</span>
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-1"></div>
          ) : (
            <h4 className="text-2xl font-bold text-gray-800 mt-1">{userLength}</h4>
          )}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100">
          <Badge color="success">
            <ArrowUpIcon />
            11.01%
          </Badge>
          <span className="text-xs text-gray-400 ml-2">vs last month</span>
        </div>
      </div>
    </div>
  );
}