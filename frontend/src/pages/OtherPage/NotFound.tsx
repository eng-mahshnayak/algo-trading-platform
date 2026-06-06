import GridShape from "../../components/common/GridShape";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { useState, useEffect } from "react";

export default function AITradingAsia() {
  const [marketData, setMarketData] = useState({
    nifty: 24500,
    sensex: 81000,
    bankNifty: 52000,
  });

  // Simulate live market data
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData({
        nifty: Math.floor(24500 + (Math.random() - 0.5) * 100),
        sensex: Math.floor(81000 + (Math.random() - 0.5) * 300),
        bankNifty: Math.floor(52000 + (Math.random() - 0.5) * 200),
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <PageMeta
        title="AI Trading Software Asia - Intelligent Trading Platform"
        description="Experience next-gen AI-powered trading with real-time market analysis, automated strategies, and smart decision support for Asian markets."
      />
      <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden z-1 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <GridShape />
        
        {/* Hero Section */}
        <div className="mx-auto w-full max-w-6xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200 dark:border-blue-800">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-green-500 opacity-75 animate-ping"></span>
              <span className="relative inline-flex w-2 h-2 rounded-full bg-green-500"></span>
            </span>
            <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
              LIVE • AI POWERED
            </span>
          </div>

          {/* Main Title */}
          <h1 className="mb-4 font-bold text-gray-900 dark:text-white text-4xl sm:text-5xl lg:text-6xl">
            AI Trading Software
            <span className="block mt-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Asia's Most Intelligent Platform
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto mb-8 text-base text-gray-600 dark:text-gray-300 sm:text-lg lg:text-xl">
            Harness the power of artificial intelligence for real-time market analysis,
            automated trading strategies, and smarter investment decisions across Asian markets.
          </p>

          {/* Live Market Ticker */}
          <div className="grid grid-cols-1 gap-4 mb-10 sm:grid-cols-3">
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
              <p className="text-sm opacity-90">🇮🇳 NIFTY 50</p>
              <p className="text-2xl font-bold">{marketData.nifty.toLocaleString()}</p>
              <p className="text-xs opacity-80">+{Math.random() * 2}%</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
              <p className="text-sm opacity-90">🇮🇳 SENSEX</p>
              <p className="text-2xl font-bold">{marketData.sensex.toLocaleString()}</p>
              <p className="text-xs opacity-80">+{Math.random() * 1.5}%</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
              <p className="text-sm opacity-90">🏦 BANK NIFTY</p>
              <p className="text-2xl font-bold">{marketData.bankNifty.toLocaleString()}</p>
              <p className="text-xs opacity-80">+{Math.random() * 1.8}%</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white transition-all rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg hover:shadow-xl hover:scale-105 sm:px-8 sm:py-3.5"
            >
              🚀 Start Trading Now
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-gray-700 transition-all bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700 sm:px-8 sm:py-3.5"
            >
              📊 Try Demo Account
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 gap-6 mb-12 text-left sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard 
              icon="🤖"
              title="AI Market Analysis"
              description="Real-time pattern recognition with 95% accuracy"
              color="blue"
            />
            <FeatureCard 
              icon="⚡"
              title="Auto Trading"
              description="Execute trades automatically based on AI signals"
              color="purple"
            />
            <FeatureCard 
              icon="📈"
              title="Multi-Exchange Support"
              description="NSE, BSE, MCX, and global markets"
              color="emerald"
            />
            <FeatureCard 
              icon="🔒"
              title="Bank-Grade Security"
              description="256-bit encryption with biometric auth"
              color="orange"
            />
          </div>

          {/* Stats Section */}
          <div className="py-8 border-t border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatNumber value="50,000+" label="Active Traders" />
              <StatNumber value="₹1000Cr+" label="Daily Volume" />
              <StatNumber value="99.9%" label="Uptime" />
              <StatNumber value="24/7" label="Support" />
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-10">
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Trusted by leading financial institutions across Asia
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
              <span className="text-xl font-semibold text-gray-400">SEBI Registered</span>
              <span className="text-xl font-semibold text-gray-400">ISO Certified</span>
              <span className="text-xl font-semibold text-gray-400">MSME Approved</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="absolute text-sm text-center text-gray-500 -translate-x-1/2 bottom-6 left-1/2 dark:text-gray-400">
          &copy; {new Date().getFullYear()} AI Trading Software Asia | 
          <span className="mx-1">•</span>
          <a href="#" className="hover:text-blue-600">Terms</a>
          <span className="mx-1">•</span>
          <a href="#" className="hover:text-blue-600">Privacy</a>
          <span className="mx-1">•</span>
          <a href="#" className="hover:text-blue-600">Support</a>
        </p>
      </div>
    </>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description, color }) {
  const colors = {
    blue: "from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800",
    purple: "from-purple-500/10 to-purple-600/5 border-purple-200 dark:border-purple-800",
    emerald: "from-emerald-500/10 to-emerald-600/5 border-emerald-200 dark:border-emerald-800",
    orange: "from-orange-500/10 to-orange-600/5 border-orange-200 dark:border-orange-800",
  };

  return (
    <div className={`p-5 rounded-xl border bg-gradient-to-br ${colors[color]} backdrop-blur-sm`}>
      <div className="mb-3 text-3xl">{icon}</div>
      <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

// Stat Number Component
function StatNumber({ value, label }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const target = parseInt(value.replace(/[^0-9]/g, ''));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
        {count.toLocaleString()}+
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}