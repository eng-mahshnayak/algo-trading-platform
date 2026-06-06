import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

import { EyeCloseIcon, EyeIcon } from "../../icons";
import Input from "../form/input/InputField";

export default function SignInForm() {

    const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${apiUrl}/auth/login`, {
        email: emailOrUsername,
        password,
      });


      console.log(response.data,'================response.data=============');
      

      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      localStorage.setItem("angel_token", user?.authToken);
      localStorage.setItem("angel_feed_token", user?.refreshToken);
      localStorage.setItem("angel_refresh_token", user?.feedToken);

      toast.success("Login successful!", {
        style: {
          background: "#10B981",
          color: "white",
        },
      });
      
   navigate(
        user.role === "admin" ? "/admin/deshboard" : "/dashboard",
        { replace: true }
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // const handleAngelOneLogin = () => {
  //   window.location.href = `${apiUrl}/auth/angelone`;
  // };

  // const handleKiteLogin = () => {
  //   window.location.href = `${apiUrl}/auth/kite`;
  // };

  // const handleGrowwLogin = () => {
  //   window.location.href = `${apiUrl}/auth/groww`;
  // };

  // const handleFyersLogin = () => {
  //   window.location.href = `${apiUrl}/auth/fyers`;
  // };

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
                    <span className="text-xs font-mono text-[#FB3800] tracking-wider font-semibold">WELCOME BACK</span>
                  </div>
                  
                  <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                    Sign In to
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FB3800] to-orange-500"> AI Trading</span>
                  </h1>
                  
                  <p className="text-gray-600 text-base leading-relaxed">
                    Access your AI-powered trading dashboard, monitor real-time markets, and execute trades with advanced algorithms.
                  </p>
                </div>

                {/* Benefits Section */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-3 text-gray-700 group hover:text-gray-900 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FB3800]/10 to-orange-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-[#FB3800]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">Real-time AI Predictions</p>
                      <p className="text-sm text-gray-500">98.7% accuracy rate</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-700 group hover:text-gray-900 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">Advanced Analytics</p>
                      <p className="text-sm text-gray-500">Market insights & patterns</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-700 group hover:text-gray-900 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">24/7 Automated Trading</p>
                      <p className="text-sm text-gray-500">Never miss an opportunity</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">$50B+</p>
                    <p className="text-xs text-gray-500">Trading Volume</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">150K+</p>
                    <p className="text-xs text-gray-500">Active Traders</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">99.9%</p>
                    <p className="text-xs text-gray-500">Uptime</p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SECTION - SIGNIN FORM */}
            <div className="w-full lg:w-1/2 p-8 lg:p-12 bg-white overflow-y-auto max-h-[90vh]">
              <div className="max-w-md mx-auto w-full">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                  <p className="text-gray-500">
                    Sign in to your AI trading account
                  </p>
                </div>

             

                {/* Normal Login Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      required
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg 
                               text-gray-900 placeholder-gray-400
                               focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] 
                               transition-all duration-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg 
                                 text-gray-900 placeholder-gray-400
                                 focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] 
                                 transition-all duration-200 outline-none pr-10"
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
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => setIsChecked(e.target.checked)}
                        className="w-4 h-4 text-[#FB3800] rounded border-gray-300 focus:ring-[#FB3800]/20"
                      />
                      <span className="text-sm text-gray-600">
                        Keep me logged in
                      </span>
                    </div>
                      {/* Sign Up Link 
                    <Link
                      to="/forgot-password"
                      className="text-sm text-[#FB3800] hover:text-orange-600 font-medium transition"
                    >
                      Forgot password?
                    </Link>
                    */}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#FB3800] to-orange-500 
                             text-white py-3 rounded-lg font-semibold
                             hover:shadow-lg hover:shadow-[#FB3800]/20 hover:scale-[1.02] 
                             transform transition-all duration-200
                             disabled:opacity-60 disabled:cursor-not-allowed
                             disabled:hover:scale-100"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </div>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>

                {/* Sign Up Link */}
                 {/* Sign Up Link 
                <div className="mt-6 text-center">
                  <p className="text-gray-600">
                    Don't have an account?{" "}
                    <Link
                      to="/signup"
                      className="text-[#FB3800] font-semibold hover:text-orange-600 transition"
                    >
                      Create Account
                    </Link>
                  </p>
                </div>
                */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}