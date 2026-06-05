import { FormEvent, useState, useEffect } from "react";
import { Link } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Input from "../form/input/InputField";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [broker, setBroker] = useState("");
  const [email, setEmail] = useState("");
  const [mob, setMob] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const [isChecked, setIsChecked] = useState(() => {
    return JSON.parse(localStorage.getItem("termsAccepted") || "false");
  });

  const [brokers, setBrokers] = useState([]);

  useEffect(() => {
    const fetchBrokers = async () => {
      try {
        const res = await axios.get(`${apiUrl}/admin/brokersignup`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });

        if (res.data.status) {
          setBrokers(res.data.data);
        }
      } catch (err) {
        toast.error("Failed to load brokers");
      }
    };
    fetchBrokers();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isChecked) {
      toast.error("Please accept the Terms and Conditions before signing up.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${apiUrl}/auth/register`, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        mob: mob,
        password: password,
        isChecked: isChecked,
        broker: broker,
      });

      if (response.data.status === true) {
        toast.success("User registered successfully!", {
          style: {
            background: "#10B981",
            color: "white",
          },
        });

        setFirstName("");
        setLastName("");
        setEmail("");
        setMob("");
        setPassword("");
        setBroker("");
        setIsChecked(false);

        localStorage.setItem("token", response?.data?.token);
        localStorage.setItem("user", JSON.stringify(response?.data?.saveUser));

        navigate("/dashboard");
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#FB3800]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-6xl">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="flex flex-col lg:flex-row">
            
            {/* LEFT SECTION - AI TRADING INFO */}
            <div className="w-full lg:w-1/2 p-8 lg:p-12 bg-gradient-to-br from-orange-50 to-white">
              <div className="space-y-8">
                {/* AI Trading Tagline */}
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FB3800]/10 rounded-full border border-[#FB3800]/20">
                    <div className="w-2 h-2 bg-[#FB3800] rounded-full animate-pulse"></div>
                    <span className="text-xs font-mono text-[#FB3800] tracking-wider font-semibold">JOIN THE FUTURE</span>
                  </div>
                  
                  <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                    Start Your
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FB3800] to-orange-500"> AI Trading Journey</span>
                  </h1>
                  
                  <p className="text-gray-600 text-base leading-relaxed">
                    Create your account and unlock powerful AI-driven trading algorithms, real-time market analysis, and automated strategies.
                  </p>
                </div>

                {/* Benefits Section */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-3 text-gray-700 group hover:text-gray-900 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FB3800]/10 to-orange-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-[#FB3800]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">Free Account Setup</p>
                      <p className="text-sm text-gray-500">No hidden fees, start trading today</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-700 group hover:text-gray-900 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">Secure & Compliant</p>
                      <p className="text-sm text-gray-500">Bank-level security protocols</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-700 group hover:text-gray-900 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">AI-Powered Insights</p>
                      <p className="text-sm text-gray-500">Real-time market predictions</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">10K+</p>
                    <p className="text-xs text-gray-500">New Users/Month</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">4.9★</p>
                    <p className="text-xs text-gray-500">User Rating</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">24/7</p>
                    <p className="text-xs text-gray-500">Support</p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SECTION - SIGNUP FORM */}
            <div className="w-full lg:w-1/2 p-8 lg:p-12 bg-white overflow-y-auto max-h-[90vh]">
              <div className="max-w-md mx-auto w-full">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
                  <p className="text-gray-500">
                    Join the AI trading revolution
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Names Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <Input
                        type="text"
                        placeholder="First name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <Input
                        type="text"
                        placeholder="Last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                    />
                  </div>

                  {/* Mobile */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile Number
                    </label>
                    <Input
                      type="tel"
                      placeholder="Enter mobile number"
                      value={mob}
                      onChange={(e) => setMob(e.target.value)}
                      required
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                    />
                  </div>

                  {/* Broker Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Broker
                    </label>
                    <select
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 
                               focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all outline-none"
                      value={broker}
                      onChange={(e) => setBroker(e.target.value)}
                      required
                    >
                      <option value="" className="bg-white">Choose a broker</option>
                      {brokers.map((b: any) => (
                        <option key={b.id} value={b.brokerName}>
                          {b.brokerName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all pr-10"
                      />
                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeIcon className="size-5 fill-gray-400 hover:fill-gray-600 transition-colors" />
                        ) : (
                          <EyeCloseIcon className="size-5 fill-gray-400 hover:fill-gray-600 transition-colors" />
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Use 8+ characters with letters & numbers
                    </p>
                  </div>

             

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#FB3800] to-orange-500 
                             text-white py-3 rounded-lg font-semibold
                             hover:shadow-lg hover:shadow-[#FB3800]/20 hover:scale-[1.02] 
                             transform transition-all duration-200
                             disabled:opacity-60 disabled:cursor-not-allowed
                             disabled:hover:scale-100 relative overflow-hidden group"
                  >
                    <span className="relative z-10">
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating Account...
                        </div>
                      ) : (
                        "Create Account"
                      )}
                    </span>
                  </button>
                </form>

                {/* Sign In Link */}
                <div className="mt-6 text-center">
                  <p className="text-gray-600">
                    Already have an account?{" "}
                    <Link to="/" className="text-[#FB3800] font-semibold hover:text-orange-600 transition">
                      Sign In
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}