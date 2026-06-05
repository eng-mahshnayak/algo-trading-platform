import { useEffect, useState } from "react";
import axios from "axios";
import { 
  FiPhone, 
  FiMail, 
  FiGlobe, 
  FiHeadphones,
  FiClock,
  FiCheckCircle
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

const SupportPage = () => {
  const API_URL = import.meta.env.VITE_API_URL;

  const [support, setSupport] = useState({
    phone: "9770435842",
    whatsapp: "9770435842",
    email: "info@softwaresetu.com",
    website: "www.softwaresetu.com",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSupport = async () => {
      try {
        const { data } = await axios.get(
          `${API_URL}/admin/active/platform-settings`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          }
        );

        if (data.status && data.data) {
          setSupport({
            phone: data.data.phone_support || "-",
            whatsapp: data.data.whatsapp_support || "-",
            email: data.data.email || "-",
            website: data.data.website || "-",
          });
        } else {
          setError("Failed to fetch support details.");
        }
      } catch (err) {
        console.error("Error fetching platform settings:", err);
        setError("Something went wrong while fetching support details.");
      } finally {
        setLoading(false);
      }
    };

    fetchSupport();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#FB3800] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">Loading support details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <div className="text-red-500 text-5xl mb-3">⚠️</div>
          <p className="text-red-600 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const supportChannels = [
    {
      id: 1,
      title: "Phone Support",
      value: support.phone,
      icon: <FiPhone size={24} />,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-500",
      borderColor: "border-blue-100",
      action: `tel:${support.phone}`,
      actionText: "Call Now"
    },
    {
      id: 2,
      title: "WhatsApp Support",
      value: support.whatsapp,
      icon: <FaWhatsapp size={24} />,
      bgColor: "bg-green-50",
      iconColor: "text-green-500",
      borderColor: "border-green-100",
      action: `https://wa.me/${support.whatsapp}`,
      actionText: "Chat Now"
    },
    {
      id: 3,
      title: "Email Support",
      value: support.email,
      icon: <FiMail size={24} />,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-500",
      borderColor: "border-purple-100",
      action: `mailto:${support.email}`,
      actionText: "Send Email"
    },
    {
      id: 4,
      title: "Website",
      value: support.website,
      icon: <FiGlobe size={24} />,
      bgColor: "bg-orange-50",
      iconColor: "text-orange-500",
      borderColor: "border-orange-100",
      action: `https://${support.website}`,
      actionText: "Visit Website"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 md:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-r from-[#FB3800] to-orange-500 rounded-xl">
            <FiHeadphones className="text-white" size={24} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Support Center</h1>
        </div>
        <p className="text-gray-500 text-sm ml-12">
          Get help and support from our team
        </p>
      </div>

      {/* Support Hours Banner */}
      <div className="bg-gradient-to-r from-[#FB3800]/5 to-orange-500/5 rounded-xl border border-[#FB3800]/10 p-4 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FB3800]/10 rounded-lg">
              <FiClock className="text-[#FB3800]" size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Support Hours</p>
              <p className="text-xs text-gray-500">Monday - Friday: 9:00 AM - 6:00 PM IST</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FiCheckCircle className="text-green-500" size={16} />
            <span className="text-xs text-gray-600">Average response time: &lt; 2 hours</span>
          </div>
        </div>
      </div>

      {/* Support Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {supportChannels.map((channel) => (
          <div
            key={channel.id}
            className={`bg-white rounded-xl shadow-md border ${channel.borderColor} overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${channel.bgColor}`}>
                  <div className={channel.iconColor}>{channel.icon}</div>
                </div>
                <span className="text-xs text-gray-400">24/7 Available</span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {channel.title}
              </h3>
              
              <p className="text-gray-600 text-sm mb-4 break-all">
                {channel.value}
              </p>
              
              <a
                href={channel.action}
                target={channel.id === 4 ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
                  ${channel.id === 1 ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}
                  ${channel.id === 2 ? 'bg-green-500 hover:bg-green-600 text-white' : ''}
                  ${channel.id === 3 ? 'bg-purple-500 hover:bg-purple-600 text-white' : ''}
                  ${channel.id === 4 ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}
                `}
              >
                {channel.actionText}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mt-8">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl">
              <FiHeadphones className="text-white" size={18} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Frequently Asked Questions</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="font-medium text-gray-700">🔹 How do I generate a token?</p>
              <p className="text-sm text-gray-500 ml-4">Click on "Generate Token" button in the dashboard to create a new trading token.</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-gray-700">🔹 What are the trading hours?</p>
              <p className="text-sm text-gray-500 ml-4">Market hours are 9:15 AM to 3:30 PM, Monday to Friday.</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-gray-700">🔹 How to check my order status?</p>
              <p className="text-sm text-gray-500 ml-4">You can view all your orders in the "Orders History" section.</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-gray-700">🔹 How to contact support?</p>
              <p className="text-sm text-gray-500 ml-4">Use any of the support channels above to reach us.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-400">
          For urgent issues, please call our support team directly at <span className="font-medium text-[#FB3800]">{support.phone}</span>
        </p>
      </div>
    </div>
  );
};

export default SupportPage;