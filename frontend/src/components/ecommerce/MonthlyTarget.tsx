import { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { FiUsers, FiX } from "react-icons/fi";

export default function MonthlyTarget() {
  const apiUrl = import.meta.env.VITE_API_URL as string;
  const navigate = useNavigate();

  const [series, setSeries] = useState<number[]>([0, 0]);
  const [generatedUsers, setGeneratedUsers] = useState<any[]>([]);
  const [notGeneratedUsers, setNotGeneratedUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [activeUsersList, setActiveUsersList] = useState<any[]>([]);
  const [activeLabel, setActiveLabel] = useState("");

  useEffect(() => {
    fetchTokenStatus();
  }, []);

  async function fetchTokenStatus() {
    try {
      const { data } = await axios.get(`${apiUrl}/admin/tokenstatussummary`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });

      if (data.status == true) {
        setSeries([data.generatedCount || 0, data.notGeneratedCount || 0]);
        setGeneratedUsers(data.generatedUsers || []);
        setNotGeneratedUsers(data.notGeneratedUsers || []);
      } else if (data.status == false && data.message == 'Unauthorized') {
        localStorage.clear();
        navigate("/");
      } else {
        toast.error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  const options: ApexOptions = {
    colors: ["#FB3800", "#E74694"],
    chart: {
      height: 320,
      width: "100%",
      type: "donut",
      events: {
        dataPointSelection: (_event, _chartContext, config) => {
          const index = config.dataPointIndex;
          if (index === 0) {
            setActiveUsersList(generatedUsers);
            setActiveLabel("Token Generated Users");
          } else if (index === 1) {
            setActiveUsersList(notGeneratedUsers);
            setActiveLabel("Token Not Generated Users");
          } else {
            return;
          }
          setShowModal(true);
        },
      },
      fontFamily: "Inter, sans-serif",
    },
    stroke: { colors: ["transparent"] },
    plotOptions: {
      pie: {
        donut: {
          size: "80%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total Tokens",
              formatter: (w) => w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0),
            },
          },
        },
      },
    },
    labels: ["Token Generated", "Token Not Generated"],
    dataLabels: { enabled: false },
    legend: {
      position: "bottom",
      fontFamily: "Inter, sans-serif",
    },
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-[#FB3800] to-orange-500 rounded-lg">
              <FiUsers className="text-white" size={18} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Token Status</h3>
              <p className="text-xs text-gray-500 mt-0.5">Overview of token generation</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <Chart options={options} series={series} type="donut" height={320} />
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">{activeLabel}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <FiX size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {activeUsersList.length === 0 && (
                <p className="text-center text-gray-400 py-8">No users found.</p>
              )}
              <div className="space-y-2">
                {activeUsersList.map((u) => (
                  <div key={u._id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                    <span className="font-medium text-gray-700">{`${u.firstName || ""} ${u.lastName || ""}`}</span>
                    <span className="text-xs text-gray-400 font-mono">{u._id}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <button
                className="w-full bg-gradient-to-r from-[#FB3800] to-orange-500 text-white py-2.5 rounded-lg font-medium hover:shadow-md transition-all"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}