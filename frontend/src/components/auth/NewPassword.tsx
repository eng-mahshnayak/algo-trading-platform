import { useState, FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

export default function NewPasswordForm() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email || "";
    const apiUrl = import.meta.env.VITE_API_URL;

    const handleReset = async (e: FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters long");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/auth/new-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    newPassword: password,
                    confirmPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Failed to reset password");
            } else {
                toast.success(data.message || "Password reset successfully", {
                    style: {
                        background: "#10B981",
                        color: "white",
                    },
                });
                navigate("/");
            }
        } catch (error) {
            console.error("Password reset error:", error);
            toast.error("Something went wrong");
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
                                        <span className="text-xs font-mono text-[#FB3800] tracking-wider font-semibold">CREATE NEW PASSWORD</span>
                                    </div>
                                    
                                    <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                                        Set New
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FB3800] to-orange-500"> Password</span>
                                    </h1>
                                    
                                    <p className="text-gray-600 text-base leading-relaxed">
                                        Create a strong and secure password for your AI trading account. Make sure it's unique and easy to remember.
                                    </p>
                                </div>

                                {/* Password Tips Section */}
                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center gap-3 text-gray-700 group hover:text-gray-900 transition-colors">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FB3800]/10 to-orange-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <svg className="w-5 h-5 text-[#FB3800]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-semibold">Minimum 6 Characters</p>
                                            <p className="text-sm text-gray-500">Use a combination of letters and numbers</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 text-gray-700 group hover:text-gray-900 transition-colors">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-semibold">Strong Password Recommended</p>
                                            <p className="text-sm text-gray-500">Use uppercase, lowercase & special characters</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 text-gray-700 group hover:text-gray-900 transition-colors">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-semibold">Don't Reuse Old Passwords</p>
                                            <p className="text-sm text-gray-500">For better security, use a new password</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Security Note */}
                                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                                    <p className="text-sm text-gray-700">
                                        <span className="font-semibold text-[#FB3800]">Security Tip:</span> 
                                        Never share your password with anyone. Your account security is our priority.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT SECTION - NEW PASSWORD FORM */}
                        <div className="w-full lg:w-1/2 p-8 lg:p-12 bg-white">
                            <div className="max-w-md mx-auto w-full">
                                <div className="text-center mb-6">
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">New Password</h2>
                                    <p className="text-gray-500">
                                        Create a strong password for your account
                                    </p>
                                </div>

                                <form onSubmit={handleReset} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter new password"
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg 
                                                         text-gray-900 placeholder-gray-400
                                                         focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] 
                                                         transition-all duration-200 outline-none pr-10"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                            <div
                                                className="absolute inset-y-0 right-3 flex items-center cursor-pointer"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <EyeOff size={18} className="text-gray-400 hover:text-gray-600 transition-colors" />
                                                ) : (
                                                    <Eye size={18} className="text-gray-400 hover:text-gray-600 transition-colors" />
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Minimum 6 characters
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showConfirm ? "text" : "password"}
                                                placeholder="Confirm your password"
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg 
                                                         text-gray-900 placeholder-gray-400
                                                         focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] 
                                                         transition-all duration-200 outline-none pr-10"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                            />
                                            <div
                                                className="absolute inset-y-0 right-3 flex items-center cursor-pointer"
                                                onClick={() => setShowConfirm(!showConfirm)}
                                            >
                                                {showConfirm ? (
                                                    <EyeOff size={18} className="text-gray-400 hover:text-gray-600 transition-colors" />
                                                ) : (
                                                    <Eye size={18} className="text-gray-400 hover:text-gray-600 transition-colors" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-[#FB3800] to-orange-500 
                                                 text-white py-3 rounded-lg font-semibold
                                                 hover:shadow-lg hover:shadow-[#FB3800]/20 hover:scale-[1.02] 
                                                 transform transition-all duration-200
                                                 disabled:opacity-60 disabled:cursor-not-allowed
                                                 disabled:hover:scale-100 flex items-center justify-center"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <svg
                                                    className="animate-spin h-5 w-5 text-white mr-2"
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
                                                    ></circle>
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 
                                                        0 0 5.373 0 12h4zm2 5.291A7.962 
                                                        7.962 0 014 12H0c0 3.042 1.135 
                                                        5.824 3 7.938l3-2.647z"
                                                    ></path>
                                                </svg>
                                                Resetting Password...
                                            </>
                                        ) : (
                                            "Reset Password"
                                        )}
                                    </button>
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