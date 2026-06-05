import axios from "axios";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiTrendingUp, FiActivity } from "react-icons/fi";

export default function TradeChart() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const [totalTrades, setTotalTrades] = useState(0);
  const [totalOpen, setTotalOpen] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/admin/get/recent/order`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            AngelOneToken: localStorage.getItem("angel_token") || "",
          },
        });

        if (data.status == true) {
          setTotalTrades(data.totalSellTrades || 0);
          setTotalOpen(data.totalOpenPositions || 0);
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

  const stats = [
    {
      title: "Total Trades",
      value: totalTrades,
      icon: <FiTrendingUp size={24} />,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-500"
    },
    {
      title: "Open Positions",
      value: totalOpen,
      icon: <FiActivity size={24} />,
      bgColor: "bg-orange-50",
      iconColor: "text-orange-500"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-3 rounded-xl ${stat.bgColor}`}>
              <div className={stat.iconColor}>{stat.icon}</div>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
            {loading ? (
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <h4 className="text-2xl font-bold text-gray-800">{stat.value}</h4>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}