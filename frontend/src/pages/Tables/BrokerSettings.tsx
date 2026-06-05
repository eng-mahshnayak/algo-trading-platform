import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { 
  FiGrid, 
  FiRefreshCw, 
  FiCheckCircle, 
  FiActivity,
  FiExternalLink,
  FiShield,
  FiZap
} from "react-icons/fi";

const BrokerSettings = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBrokers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${apiUrl}/admin/broker`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });

      if (data?.status === true) {
        const list = Array.isArray(data.data) ? data.data : [];
        setBrokers(list);
      } else if (data?.status === false && data?.message === "Unauthorized") {
        toast.error("Unauthorized User");
        localStorage.clear();
      } else {
        toast.error(data?.message || "Something went wrong");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBrokers();
    setRefreshing(false);
    toast.success("Brokers list refreshed");
  };

  useEffect(() => {
    fetchBrokers();
  }, []);

  // Skeleton loader component
  const BrokerSkeleton = () => (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="relative flex flex-col w-full rounded-xl border border-gray-100 p-6 bg-white shadow-sm"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-gray-200"></div>
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="h-10 bg-gray-200 rounded-lg mt-4"></div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 md:px-6 lg:px-8 py-6">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-r from-[#FB3800] to-orange-500 rounded-xl">
                  <FiGrid className="text-white" size={24} />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  Supported Brokers
                </h1>
              </div>
              <p className="text-gray-500 text-sm ml-12">
                Connect your trading account seamlessly with our supported brokers
              </p>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50"
            >
              <FiRefreshCw className={`${refreshing ? "animate-spin" : ""}`} size={16} />
              <span className="text-sm">Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        {!loading && brokers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FiGrid className="text-blue-500" size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Total Brokers</p>
                  <p className="text-2xl font-bold text-gray-800">{brokers.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <FiCheckCircle className="text-green-500" size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Active Connections</p>
                  <p className="text-2xl font-bold text-gray-800">{brokers.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <FiActivity className="text-orange-500" size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Uptime</p>
                  <p className="text-2xl font-bold text-gray-800">99.9%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && <BrokerSkeleton />}

        {/* Empty State */}
        {!loading && brokers.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <FiGrid className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Brokers Available
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Currently there are no brokers configured. Please check back later or contact support.
            </p>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FB3800] to-orange-500 text-white rounded-xl hover:shadow-lg transition-all duration-200"
            >
              <FiRefreshCw size={18} />
              Refresh Now
            </button>
          </div>
        )}

        {/* Broker Cards */}
        {!loading && brokers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brokers.map((b: any) => (
              <div
                key={b.id}
                className="group relative bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs font-medium text-green-600">Active</span>
                </div>

                <div className="p-6">
                  {/* Logo and Name */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-300">
                      {b.brokerLink ? (
                        <img
                          src={b.brokerLink}
                          alt={b.brokerName}
                          className="w-10 h-10 object-contain"
                        />
                      ) : (
                        <span className="text-xl font-bold bg-gradient-to-r from-[#FB3800] to-orange-500 bg-clip-text text-transparent">
                          {b.brokerName?.charAt(0) || "B"}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h2 className="font-bold text-gray-800 text-lg truncate">
                        {b.brokerName}
                      </h2>
                      {b.tag && (
                        <p className="text-sm text-gray-500 mt-0.5 truncate">{b.tag}</p>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-5">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <FiShield size={12} className="text-green-500" />
                      <span>Secure Integration</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <FiZap size={12} className="text-orange-500" />
                      <span>Real-time Data</span>
                    </div>
                  </div>

                  {/* Connect Button */}
                  <button
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-600 rounded-lg font-medium text-sm hover:bg-gradient-to-r hover:from-[#FB3800] hover:to-orange-500 hover:text-white transition-all duration-200"
                  >
                    <span>Connect</span>
                    <FiExternalLink size={14} />
                  </button>
                </div>

                {/* Hover Gradient Border */}
                <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-[#FB3800]/20 transition-colors pointer-events-none"></div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Note */}
        {!loading && brokers.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              More brokers coming soon. Stay tuned for updates!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrokerSettings;