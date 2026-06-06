import { JSX, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useBrokerApi } from "../../api/brokers/brokerSelector";
import TradeReportChart from "../Charts/TradeReportChart";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiTrendingUp,
  FiTrendingDown,
  FiShoppingCart,
  FiRefreshCw,
  FiArrowUp,
  FiArrowDown,
  FiXCircle,
  FiAlertTriangle,
  FiPieChart,
  FiBarChart2,
  FiList
} from "react-icons/fi";

import { IndianRupee } from "lucide-react";
import {
  RiExchangeDollarLine,
  RiWallet3Line,
  RiArrowUpDownLine
} from "react-icons/ri";

import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const rupee = (n: number) =>
  (Number(n) || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  });

type Summary = { totalOrder: number; orderData: any[] };

type Row = { label: string; value: number; dot: string; icon: JSX.Element };

function buildRows(orderList: any[] = []): Row[] {
  let buy = 0,
    sell = 0,
    cancelled = 0,
    rejected = 0;

  for (const o of orderList) {
    const tt = String(o?.transactiontype ?? "").toUpperCase();
    const st = String(o?.orderstatus ?? "").toLowerCase();

    if (tt === "BUY" && st === "complete") buy++;
    else if (tt === "SELL" && st === "complete") sell++;
    else if (st === "cancelled") cancelled++;
    else if (st === "rejected") rejected++;
  }

  return [
    {
      label: "Buy",
      value: buy,
      dot: "bg-gradient-to-r from-green-400 to-emerald-500",
      icon: <FiArrowUp className="text-white" size={14} />
    },
    {
      label: "Sell",
      value: sell,
      dot: "bg-gradient-to-r from-red-400 to-red-500",
      icon: <FiArrowDown className="text-white" size={14} />
    },
    {
      label: "Cancelled",
      value: cancelled,
      dot: "bg-gradient-to-r from-blue-400 to-cyan-500",
      icon: <FiXCircle className="text-white" size={14} />
    },
    {
      label: "Rejected",
      value: rejected,
      dot: "bg-gradient-to-r from-amber-400 to-orange-500",
      icon: <FiAlertTriangle className="text-white" size={14} />
    },
  ];
}

export default function DashboardPretty() {
  
  const apiUrl = import.meta.env.VITE_API_URL;
  const { api, image, brokerName, role } = useBrokerApi();


  console.log(brokerName);
  

  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [fundData, setFundData] = useState(0);
  const [totalTradedData, setTotalTradedData] = useState(0);
  const [totalOpenOrderData, setTotalOpenOrderData] = useState(0);
  const [profitAndLossData, setProfitAndLossData] = useState(0);
  const [chartData, setChartData] = useState([]);

  const [summary, setSummary] = useState<Summary>({
    totalOrder: 0,
    orderData: [],
  });

  const [rows, setRows] = useState<Row[]>([
    {
      label: "Buy",
      value: 0,
      dot: "bg-gradient-to-r from-green-400 to-emerald-500",
      icon: <FiArrowUp className="text-white" size={14} />
    },
    {
      label: "Sell",
      value: 0,
      dot: "bg-gradient-to-r from-red-400 to-red-500",
      icon: <FiArrowDown className="text-white" size={14} />
    },
    {
      label: "Cancelled",
      value: 0,
      dot: "bg-gradient-to-r from-blue-400 to-cyan-500",
      icon: <FiXCircle className="text-white" size={14} />
    },
    {
      label: "Rejected",
      value: 0,
      dot: "bg-gradient-to-r from-amber-400 to-orange-500",
      icon: <FiAlertTriangle className="text-white" size={14} />
    },
  ]);

  function timeAgo(timestamp: any) {
    if (!timestamp) return "";

    const now: any = new Date();
    const past: any = new Date(timestamp);
    const diffMs = now - past;

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const fundRes = await api.getFund();
      setFundData(fundRes.data.data?.availablecash || 0);

      const ordersRes = await api.getTodayOrder();
      const orderStatusData = buildRows(ordersRes?.data?.data?.totalOrders || []);
      setRows(orderStatusData);

      setSummary({
        totalOrder: ordersRes?.data?.data?.totalOrders?.length || 0,
        orderData: ordersRes?.data?.data?.totalOrders || []
      });

      const tradeRes = await api.getTodayTrade();
      
      setTotalTradedData(tradeRes.data.totalTraded || 0);
      setTotalOpenOrderData(tradeRes.data.totalOpen || 0);
      setProfitAndLossData(tradeRes.data.pnl || 0);
      setChartData(tradeRes.data.data || []);
    } catch (error: any) {
      console.log(error,'===========error=========');
      toast.error(error?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateToken = async () => {
    try {
      const res = await api.generateToken();

      if (res?.brokerName == "upstox" && role == 'user') {
        window.open(res.authUrl, "_blank");
        return;
      }

      if(res.brokerName == 'finvasia' && role == 'user') {
        localStorage.setItem("angel_token", res.token);
      }

      if (res?.status) {
        toast.success("Token generated successfully!");
        loadDashboard();
      } else {
        toast.error(res?.message || "Failed to generate token");
      }
    } catch (err: any) {
      toast.error(err?.message || "Token generation failed");
    }
  };

  const sendLoginTokenToBackend = async (token: any, userId: any) => {
    try {
      const res = await axios.post(
        `${apiUrl}/fyers/updatefyerstoken`,
        {
          angelToken: token,
          userId: userId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );
      console.log("Token saved response:", res.data);
    } catch (err) {
      console.error("Error sending token:", err);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("access_token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user?.id;

    if (token) {
      localStorage.setItem("angel_token", token);

      if (user.brokerName == "fyers") {
        sendLoginTokenToBackend(token, userId);
      }

      navigate("/dashboard", { replace: true });
    }
    loadDashboard();
  }, []);

  const pnlIcon =
    profitAndLossData >= 0 ? (
      <FiTrendingUp className="text-emerald-600" size={24} />
    ) : (
      <FiTrendingDown className="text-red-600" size={24} />
    );

  const isFundPositive = fundData >= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 md:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Trading Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Real-time market insights and portfolio overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 bg-gradient-to-r from-[#FB3800] to-orange-500 hover:from-orange-500 hover:to-[#FB3800] px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg text-white transition-all duration-200"
            onClick={handleGenerateToken}
          >
            <FiRefreshCw
              className={`${loading ? "animate-spin" : ""} text-white`}
              size={16}
            />
            <span className="text-sm">Generate Token</span>
          </button>

          <div className="bg-white rounded-xl p-2 shadow-md border border-gray-100">
            <img
              src={image}
              className="w-24 h-8 object-contain"
              alt="Broker Logo"
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Traded */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-blue-50 rounded-xl">
              <RiExchangeDollarLine size={20} className="text-blue-500" />
            </div>
            <span className="text-xs text-gray-400">Today</span>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Total Traded</p>
            <p className="text-2xl font-bold text-gray-800">
              {totalTradedData}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-gray-50">
            <FiShoppingCart size={12} className="text-gray-400" />
            <span className="text-xs text-gray-400">Trading volume</span>
          </div>
        </div>

        {/* Total Open */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-amber-50 rounded-xl">
              <RiArrowUpDownLine size={20} className="text-amber-500" />
            </div>
            <span className="text-xs text-gray-400">Active</span>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Total Open</p>
            <p className="text-2xl font-bold text-gray-800">
              {totalOpenOrderData}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-gray-50">
            <FiList size={12} className="text-gray-400" />
            <span className="text-xs text-gray-400">Active orders</span>
          </div>
        </div>

        {/* Available Funds */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2.5 rounded-xl ${isFundPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <RiWallet3Line size={20} className={isFundPositive ? 'text-emerald-500' : 'text-red-500'} />
            </div>
            <span className="text-xs text-gray-400">Balance</span>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Available Funds</p>
            <p className={`text-2xl font-bold truncate ${isFundPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {rupee(fundData)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-gray-50">
            <IndianRupee size={12} className="text-gray-400" />
            <span className="text-xs text-gray-400">Liquid balance</span>
          </div>
        </div>

        {/* PnL */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2.5 rounded-xl ${profitAndLossData >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              {pnlIcon}
            </div>
            <span className="text-xs text-gray-400">Today</span>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Profit & Loss</p>
            <p className={`text-2xl font-bold ${profitAndLossData >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {rupee(profitAndLossData)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-gray-50">
            {profitAndLossData >= 0 ? (
              <FiTrendingUp size={12} className="text-emerald-500" />
            ) : (
              <FiTrendingDown size={12} className="text-red-500" />
            )}
            <span className="text-xs text-gray-400">Today's P&L</span>
          </div>
        </div>
      </section>

      {/* Charts and Orders Summary */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Orders Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 h-full">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-gradient-to-r from-[#FB3800] to-orange-500 rounded-xl">
                <FiPieChart className="text-white" size={18} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                Orders Summary
              </h3>
            </div>

            <div className="flex justify-center mb-4">
              <div className="w-44 h-44 relative">
                <Doughnut
                  data={{
                    labels: rows.map((r) => r.label),
                    datasets: [
                      {
                        data: rows.map((r) => r.value),
                        backgroundColor: [
                          "#10b981",
                          "#ef4444",
                          "#3b82f6",
                          "#f59e0b"
                        ],
                        borderWidth: 2,
                        borderColor: "white",
                        hoverOffset: 10,
                      },
                    ],
                  }}
                  options={{
                    cutout: "70%",
                    plugins: {
                      legend: { display: false },
                    },
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-gray-800">
                    {Number(summary.totalOrder)}
                  </span>
                  <span className="text-xs text-gray-400">Total</span>
                </div>
              </div>
            </div>

            <div className="text-center py-2">
              <div className="inline-flex flex-col items-center">
                <div className="text-sm font-medium text-gray-500">
                  Total Orders Today
                </div>
              </div>
            </div>

            {/* Order Type Legend */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100">
              {rows.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${row.dot}`}></div>
                  <span className="text-xs text-gray-600">{row.label}</span>
                  <span className="text-xs font-semibold text-gray-800 ml-auto">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 h-full">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                <FiBarChart2 className="text-white" size={18} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                Trading Performance
              </h3>
            </div>
            <TradeReportChart data={chartData} />
          </div>
        </div>
      </section>

      {/* Recent Orders */}
      <section className="bg-white rounded-xl shadow-md border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
            <FiList className="text-white" size={18} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">
            Recent Orders
          </h3>
        </div>

        <div className="space-y-2">
          {summary?.orderData?.slice(0, 5).map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  item.transactiontype === "BUY"
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                {item.transactiontype === "BUY" ? "B" : "S"}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {item.tradingsymbol}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  Order ID: {item.orderid}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {timeAgo(item.ordertime)}
                </p>
              </div>
              
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {item.transactiontype}
                </p>
              </div>
            </div>
          ))}

          {(!summary?.orderData || summary?.orderData?.length === 0) && (
            <div className="py-8 text-center text-gray-400">
              <div className="flex flex-col items-center justify-center gap-2">
                <FiList size={32} className="text-gray-300" />
                <p className="text-sm">No recent orders found</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}