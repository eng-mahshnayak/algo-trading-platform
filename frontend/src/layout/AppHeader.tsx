import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useSidebar } from "../context/SidebarContext";
import UserDropdown from "../components/header/UserDropdown";
import { toast } from "react-toastify";
import axios from "axios";
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiActivity,
  FiMenu,
  FiX,
  FiCalendar,
  FiCheckCircle
} from "react-icons/fi";

type Tick = {
  mode: 1 | 2 | 3;
  exchangeType: number;
  token: string;
  sequenceNumber: number;
  exchangeTimestamp: string;
  ltpPaiseOrRaw: number;
  ltp: number;
};

import { getSocket } from ".././socket/Socket";

const AppHeader: React.FC = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const lastTickTime = useRef<number>(Date.now());
  const [userPackageName, setUserPackageName] = useState("");
  const [userPackageDate, setUserPackageDate] = useState("");
  const [userRole, setUserRole] = useState("");

  const [nifty, setNifty] = useState<number | null>(
    localStorage.getItem("NIFTY_PRICE") ? Number(localStorage.getItem("NIFTY_PRICE")) : null
  );

  const [bankNifty, setBankNifty] = useState<number | null>(
    localStorage.getItem("BANKNIFTY_PRICE") ? Number(localStorage.getItem("BANKNIFTY_PRICE")) : null
  );

  // Market Data Connection
  useEffect(() => {
    const socket = getSocket();
    
    const onTick = (tick: Tick) => {
      lastTickTime.current = Date.now();
      let nifty_50_token = '99926000';
      let bank_nifty_token = '99926009';
      
      if (tick.token === nifty_50_token) {
        setNifty(tick.ltp);
        localStorage.setItem("NIFTY_PRICE", tick.ltp.toString());
      } else if (tick.token === bank_nifty_token) {
        setBankNifty(tick.ltp);
        localStorage.setItem("BANKNIFTY_PRICE", tick.ltp.toString());
      }
    };
    
    socket.on("tick", onTick);

    return () => {
      socket.off("tick", onTick);
    };
  }, []);

  // Fetch User Data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${API_URL}/users/getuser/profile`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        let resData = response.data;
        if (resData.status == true) {
          setUserPackageName(resData.data.packageName);
          setUserPackageDate(resData.data.packageDate);
          setUserRole(resData.data.role);
        } else {
          toast.error("Something went wrong");
        }
      } catch (error) {
        toast.error("Something went wrong");
      }
    };
    fetchUserData();
  }, []);

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Format date for better display
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <header className="sticky top-0 z-50 flex w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="flex flex-col items-center justify-between w-full lg:flex-row lg:px-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between w-full gap-2 px-4 py-3 lg:py-3 lg:px-0">
          {/* Sidebar Toggle */}
          <button
            className="flex items-center justify-center w-10 h-10 text-gray-500 rounded-lg hover:bg-gray-100 transition-colors lg:h-11 lg:w-11"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? (
              <FiX size={20} />
            ) : (
              <FiMenu size={20} />
            )}
          </button>

          {/* Mobile Logo */}
          <Link to="/" className="lg:hidden">
            <span className="text-xl font-bold bg-gradient-to-r from-[#FB3800] to-orange-500 bg-clip-text text-transparent">
              AI Trading
            </span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleApplicationMenu}
            className="flex items-center justify-center w-10 h-10 text-gray-500 rounded-lg hover:bg-gray-100 lg:hidden"
          >
            <FiActivity size={20} />
          </button>

          {/* Market Indicators */}
          <div className="hidden lg:flex items-center gap-6 ml-4">
            {/* Nifty 50 */}
            <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-50 rounded-lg">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500">NIFTY 50</span>
                <span className="text-sm font-bold text-gray-900">
                  {nifty ? nifty.toFixed(2) : "--"}
                </span>
              </div>
              <div className={`${nifty && nifty > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {nifty && nifty > 0 ? <FiTrendingUp size={16} /> : <FiTrendingDown size={16} />}
              </div>
            </div>

            {/* Bank Nifty */}
            <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-50 rounded-lg">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500">BANK NIFTY</span>
                <span className="text-sm font-bold text-gray-900">
                  {bankNifty ? bankNifty.toFixed(2) : "--"}
                </span>
              </div>
              <div className={`${bankNifty && bankNifty > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {bankNifty && bankNifty > 0 ? <FiTrendingUp size={16} /> : <FiTrendingDown size={16} />}
              </div>
            </div>
          </div>

          {/* Package Info - Desktop */}
          {userRole === 'user' && userPackageName && userPackageDate && (
            <div className="hidden lg:block ml-auto mr-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="p-1.5 bg-green-100 rounded-full">
                  <FiCheckCircle className="text-green-600" size={14} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-green-800">{userPackageName}</span>
                    <span className="text-xs text-green-600 font-medium">ACTIVE</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <FiCalendar size={10} />
                    <span>Valid till: {formatDate(userPackageDate)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Area */}
          <UserDropdown />
        </div>

        {/* Mobile Menu Dropdown */}
        <div
          className={`${
            isApplicationMenuOpen ? "flex" : "hidden"
          } flex-col w-full gap-4 px-4 py-4 border-t border-gray-100 lg:hidden`}
        >
          {/* Mobile Market Indicators */}
          <div className="flex gap-4">
            <div className="flex-1 px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-500">NIFTY 50</span>
              <p className="text-sm font-bold">{nifty ? nifty.toFixed(2) : "--"}</p>
            </div>
            <div className="flex-1 px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-500">BANK NIFTY</span>
              <p className="text-sm font-bold">{bankNifty ? bankNifty.toFixed(2) : "--"}</p>
            </div>
          </div>

          {/* Mobile Package Info */}
          {userRole === 'user' && userPackageName && userPackageDate && (
            <div className="px-3 py-2 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-green-800">{userPackageName}</span>
                <span className="text-xs text-green-600 font-medium px-2 py-0.5 bg-green-100 rounded-full">ACTIVE</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                <FiCalendar size={10} />
                <span>Valid till: {formatDate(userPackageDate)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;