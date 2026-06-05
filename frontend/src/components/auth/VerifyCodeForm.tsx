import { useState, useRef, FormEvent, ChangeEvent, KeyboardEvent } from "react";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";

export default function VerifyCodeForm() {
  const [code, setCode] = useState<string[]>(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef<HTMLInputElement[]>([]);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  // Email ko location.state se receive kar rahe hain
  const location = useLocation();
  const email = location.state?.email || "";

  const handleChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;
    const updatedCode = [...code];
    updatedCode[index] = value;
    setCode(updatedCode);

    if (value && index < code.length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    const enteredCode = code.join("");

    if (enteredCode.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: enteredCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Invalid or expired code");
      } else {
        toast.success(data.message || "Code verified successfully", {
          style: {
            background: "#10B981",
            color: "white",
          },
        });
        navigate("/new-password", { state: { email } });
      }
    } catch (error) {
      console.error("Verify code error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      const res = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to resend code");
      } else {
        toast.success(data.message || "Code resent successfully", {
          style: {
            background: "#10B981",
            color: "white",
          },
        });
      }
    } catch (error) {
      console.error("Resend code error:", error);
      toast.error("Something went wrong while resending code");
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
                    <span className="text-xs font-mono text-[#FB3800] tracking-wider font-semibold">VERIFY YOUR IDENTITY</span>
                  </div>
                  
                  <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                    Enter
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FB3800] to-orange-500"> Verification Code</span>
                  </h1>
                  
                  <p className="text-gray-600 text-base leading-relaxed">
                    We've sent a 6-digit verification code to your email address. Enter the code below to verify your identity.
                  </p>
                </div>

                {/* Benefits Section */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-3 text-gray-700 group hover:text-gray-900 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FB3800]/10 to-orange-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-[#FB3800]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">Check Your Inbox</p>
                      <p className="text-sm text-gray-500">We've sent the code to {email || "your email"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-700 group hover:text-gray-900 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">Code Valid For 10 Minutes</p>
                      <p className="text-sm text-gray-500">For security, the code expires shortly</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-700 group hover:text-gray-900 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">Secure Verification</p>
                      <p className="text-sm text-gray-500">Two-factor authentication for safety</p>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-[#FB3800]">Note:</span> Didn't receive the code? 
                    Check your spam folder or click "Resend Code" below.
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT SECTION - VERIFY CODE FORM */}
            <div className="w-full lg:w-1/2 p-8 lg:p-12 bg-white">
              <div className="max-w-md mx-auto w-full">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Verification Code</h2>
                  <p className="text-gray-500">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                      Enter 6-Digit Code
                    </label>
                    <div className="flex justify-center gap-3">
                      {code.map((digit, idx) => (
                        <input
                          key={idx}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(e.target.value, idx)}
                          onKeyDown={(e) => handleKeyDown(e, idx)}
                          ref={(el) => {
                            if (el) inputsRef.current[idx] = el;
                          }}
                          className="w-12 h-14 text-center border rounded-xl text-2xl font-semibold 
                                   focus:outline-none focus:ring-2 focus:ring-[#FB3800]/20 
                                   focus:border-[#FB3800] border-gray-200 bg-gray-50
                                   text-gray-900 transition-all duration-200"
                          autoFocus={idx === 0}
                        />
                      ))}
                    </div>
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
                        <svg
                          className="animate-spin h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 
                              0 5.373 0 12h4zm2 5.291A7.962 7.962 
                              0 014 12H0c0 3.042 1.135 5.824 
                              3 7.938l3-2.647z"
                          />
                        </svg>
                        Verifying...
                      </div>
                    ) : (
                      "Verify Code"
                    )}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendCode}
                      className="text-[#FB3800] hover:text-orange-600 font-medium transition text-sm"
                    >
                      Didn't receive the code? Resend
                    </button>
                  </div>
                </form>

                {/* Back to Sign In Link */}
                <div className="mt-6 text-center">
                  <p className="text-gray-600">
                    Remember your password?{" "}
                    <Link
                      to="/"
                      className="text-[#FB3800] font-semibold hover:text-orange-600 transition"
                    >
                      Back to Sign In
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