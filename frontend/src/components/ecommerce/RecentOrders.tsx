import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiShoppingCart, FiRefreshCw } from "react-icons/fi";

type Summary = { totalOrder: number; orderData: any[] };

const apiUrl = import.meta.env.VITE_API_URL;

export default function RecentOrders() {
  const navigate = useNavigate();
  const [openOrder, setOpenOrders] = useState<number>(0);
  const [trade, setTrade] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary>({
    totalOrder: 0,
    orderData: [],
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/admin/get/recent/order`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            AngelOneToken: localStorage.getItem("angel_token") || "",
          },
        });

        if (data.status == true) {
          setOpenOrders(data?.totalOpenPositions);
          setTrade(data?.totalSellTrades);
          setSummary({
            totalOrder: data?.todayOrderCount || 0,
            orderData: data?.recentOrders || [],
          });
        } else if (data.status == false && data.message == 'Unauthorized') {
          localStorage.clear();
          navigate("/");
        } else {
          toast.error(data.error);
        }
      } catch (err) {
        console.log("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "complete" || s === "filled") return "text-green-600 bg-green-50";
    if (s === "rejected" || s === "cancelled") return "text-red-600 bg-red-50";
    if (s === "pending" || s === "open") return "text-yellow-600 bg-yellow-50";
    return "text-gray-600 bg-gray-50";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
            <FiShoppingCart className="text-white" size={18} />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#FB3800]"></div>
                    <span className="text-gray-400 text-sm">Loading orders...</span>
                  </div>
                </td>
              </tr>
            ) : summary?.orderData?.slice(0, 5).map((item: any, index: any) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4">
                  <span className="font-medium text-gray-800">{item.tradingsymbol}</span>
                </td>
                <td className="py-3 px-4">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600">
                    {item.orderid}
                  </code>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                    item.transactiontype === "BUY" 
                      ? "bg-green-100 text-green-700" 
                      : "bg-red-100 text-red-700"
                  }`}>
                    {item.transactiontype}
                  </span>
                </td>
                <td className="py-3 px-4 font-medium text-gray-700">{item.fillsize}</td>
                <td className="py-3 px-4 font-medium text-gray-700">₹{Number(item.fillprice).toFixed(2)}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
            {!loading && summary?.orderData?.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <FiShoppingCart size={32} className="text-gray-300" />
                    <span>No recent orders found</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}