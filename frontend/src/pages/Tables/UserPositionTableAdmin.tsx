import { useEffect, useMemo, useState } from "react";
import "antd/dist/reset.css";
import { Select } from "antd";
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import axios from "axios";
import { 
  FiSearch, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiRefreshCw,
  FiPieChart,
  FiUsers,
  FiArrowUp,
  FiArrowDown
} from "react-icons/fi";

type Position = {
  tradingsymbol: string;
  buy_quantity: string;
  sell_quantity: string;
  buy_price: string;
  sell_price: string;
  pnl: string;
  product: string;
};

function useDebounced<T>(value: T, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v as T;
}

const pnlPill = (val: number) => {
  const isPositive = val > 0;
  const isNegative = val < 0;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium ${
      isPositive ? "bg-green-100 text-green-700" : 
      isNegative ? "bg-red-100 text-red-700" : 
      "bg-gray-100 text-gray-600"
    }`}>
      {isPositive && <FiTrendingUp size={12} />}
      {isNegative && <FiTrendingDown size={12} />}
      {isPositive ? `+${val.toFixed(2)}` : val.toFixed(2)}
    </span>
  );
};

export default function AdminCheckUserPosition() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 50);
  const [isMobile, setIsMobile] = useState(false);
  const [paginationPageSize, setPaginationPageSize] = useState(10);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch Users for Dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${apiUrl}/admin/tokenstatussummary`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });
        if (res?.data?.status) {
          const allUsers = res?.data?.generatedUsers || [];
          setUsers(allUsers);
        }
      } catch (err) {
        setPaginationPageSize(10);
        console.error("Failed to fetch users:", err);
      }
    };
    fetchUsers();
  }, []);

  // Fetch Positions for Selected User
  useEffect(() => {
    if (!selectedUser) {
      setPositions([]);
      setLoading(false);
      return;
    }

    const fetchPositions = async () => {
      try {
        setLoading(true);
        let url = `${apiUrl}/admin/userpostionshow?userId=${selectedUser?._id}`;
        let res = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            "AngelOneToken": localStorage.getItem("angel_token") || "",
          },
        });

        if (res.data.status === true) {
          if (res.data.user.brokerName?.toLowerCase() === "kotak neo") {
            setPositions(res.data.positions.kotakneo || []);
          } else {
            const brokerPositions = res.data.positions[res.data.user.brokerName?.toLowerCase()] || [];
            setPositions(brokerPositions);
          }
        } else {
          setPositions([]);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch positions");
      } finally {
        setLoading(false);
      }
    };
    fetchPositions();
  }, [selectedUser]);

  // Calculate total PNL
  const totalPNL = useMemo(() => {
    return positions.reduce((sum, pos) => {
      return sum + (Number(pos.pnl) || 0);
    }, 0);
  }, [positions]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return positions;
    return positions.filter((p) => {
      const haystack = [
        p.tradingsymbol,
        p.product,
        p.buy_quantity,
        p.sell_quantity,
        p.buy_price,
        p.sell_price,
        p.pnl,
      ].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [positions, debouncedSearch]);

  const columnDefs: ColDef<any>[] = useMemo(() => [
    {
      headerName: "Symbol",
      field: "tradingsymbol",
      cellRenderer: (params: any) => {
        const position = params.data as Position;
        return (
          <div className="py-2">
            <div className="font-semibold text-gray-900">
              {position.tradingsymbol}
            </div>
          </div>
        );
      },
      width: 200,
      minWidth: 160,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    {
      headerName: "Product",
      field: "product",
      cellRenderer: (params: any) => {
        return <div className="py-2 text-sm">{params.value || "—"}</div>;
      },
      width: 120,
      minWidth: 100,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    {
      headerName: "Buy Qty",
      field: "buy_quantity",
      cellRenderer: (params: any) => {
        return <div className="py-2 text-center font-medium">{params.value || 0}</div>;
      },
      width: 90,
      minWidth: 80,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    {
      headerName: "Sell Qty",
      field: "sell_quantity",
      cellRenderer: (params: any) => {
        return <div className="py-2 text-center font-medium">{params.value || 0}</div>;
      },
      width: 90,
      minWidth: 80,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    {
      headerName: "Net Qty",
      field: "quantity",
      cellRenderer: (params: any) => {
        const buyQty = Number(params.data?.buy_quantity || 0);
        const sellQty = Number(params.data?.sell_quantity || 0);
        const netQty = buyQty - sellQty;
        return <div className="py-2 text-center font-medium">{netQty}</div>;
      },
      width: 90,
      minWidth: 80,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    {
      headerName: "Buy Price",
      field: "buy_price",
      cellRenderer: (params: any) => {
        const value = Number(params.value || 0).toFixed(2);
        return <div className="py-2 font-medium">₹{value}</div>;
      },
      width: 110,
      minWidth: 100,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    {
      headerName: "Sell Price",
      field: "sell_price",
      cellRenderer: (params: any) => {
        const value = Number(params.value || 0).toFixed(2);
        return <div className="py-2 font-medium">₹{value}</div>;
      },
      width: 110,
      minWidth: 100,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
    {
      headerName: "PnL",
      field: "pnl",
      cellRenderer: (params: any) => {
        const pnl = Number(params.value || 0);
        return <div className="py-2">{pnlPill(pnl)}</div>;
      },
      width: 120,
      minWidth: 100,
      cellStyle: { borderRight: '1px solid #e2e8f0' }
    },
  ], []);

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
    wrapHeaderText: true,
    autoHeaderHeight: true,
    suppressMovable: true,
    cellStyle: {
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center'
    },
  }), []);

  const getRowStyle = () => {
    return {
      height: '65px',
      display: 'flex',
      alignItems: 'center',
      borderBottom: '1px solid #e2e8f0'
    };
  };

  const MobilePositionCard = ({ position }: { position: Position }) => {
    const pnl = Number(position.pnl || 0);
    const buyQty = Number(position.buy_quantity || 0);
    const sellQty = Number(position.sell_quantity || 0);
    const netQty = buyQty - sellQty;

    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-3 shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{position.tradingsymbol}</h3>
            <p className="text-xs text-gray-500">{position.product}</p>
          </div>
          <div>{pnlPill(pnl)}</div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          <div>
            <span className="text-gray-400 text-xs">Buy Qty</span>
            <p className="font-medium">{buyQty}</p>
          </div>
          <div>
            <span className="text-gray-400 text-xs">Sell Qty</span>
            <p className="font-medium">{sellQty}</p>
          </div>
          <div>
            <span className="text-gray-400 text-xs">Net Qty</span>
            <p className="font-medium">{netQty}</p>
          </div>
          <div>
            <span className="text-gray-400 text-xs">Buy Price</span>
            <p className="font-medium">₹{Number(position.buy_price || 0).toFixed(2)}</p>
          </div>
          <div>
            <span className="text-gray-400 text-xs">Sell Price</span>
            <p className="font-medium">₹{Number(position.sell_price || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 md:px-6 lg:px-8 py-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-[#FB3800] to-orange-500 rounded-xl">
              <FiPieChart className="text-white" size={24} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">User Positions</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            Monitor user positions and P&L in real-time
          </p>
        </div>

        {/* Stats Cards */}
        {selectedUser && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Total Positions</p>
                  <p className="text-2xl font-bold text-gray-800">{filtered.length}</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FiPieChart className="text-blue-500" size={20} />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Total PnL</p>
                  <p className={`text-2xl font-bold ${totalPNL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalPNL >= 0 ? `+${totalPNL.toFixed(2)}` : totalPNL.toFixed(2)}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${totalPNL >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  {totalPNL >= 0 ? (
                    <FiTrendingUp className="text-green-500" size={20} />
                  ) : (
                    <FiTrendingDown className="text-red-500" size={20} />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search by symbol, product..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800] transition-all"
                />
              </div>
            </div>

            <div className="w-full sm:w-64">
              <div className="relative">
                <FiUsers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={16} />
                <Select
                  showSearch
                  placeholder="Select a user"
                  optionFilterProp="children"
                  onChange={(value) => setSelectedUser(users.find((u: any) => u._id === value))}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={users.map((user: any) => ({
                    value: user._id,
                    label: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user._id
                  }))}
                  className="w-full [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!border-gray-200 [&_.ant-select-selector]:!py-2 [&_.ant-select-selector]:!pl-9 [&_.ant-select-selection-placeholder]:!pl-9"
                  popupClassName="rounded-lg"
                />
              </div>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200"
            >
              <FiRefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Table/Mobile View */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {!selectedUser ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <FiUsers size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No User Selected</h3>
              <p className="text-gray-400 text-sm">Please select a user from the dropdown above to view their positions</p>
            </div>
          ) : isMobile ? (
            <div className="p-4">
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FB3800]" />
                </div>
              )}
              {error && !loading && (
                <div className="text-center py-8 text-red-500 bg-red-50 rounded-lg">
                  {error}
                </div>
              )}
              {!loading && !error && filtered.length === 0 && (
                <div className="text-center py-12">
                  <FiPieChart className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No positions found</h3>
                  <p className="mt-2 text-gray-500">Try adjusting your search criteria</p>
                </div>
              )}
              {!loading && !error && filtered.map((position) => (
                <MobilePositionCard key={position.tradingsymbol} position={position} />
              ))}
            </div>
          ) : (
            <div className="ag-theme-alpine" style={{ height: '550px', width: '100%' }}>
              <AgGridReact
                rowData={filtered}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                loading={loading}
                getRowStyle={getRowStyle}
                rowHeight={55}
                headerHeight={48}
                pagination={true}
                paginationPageSize={paginationPageSize}
                paginationPageSizeSelector={[10, 25, 50, 100]}
                enableCellTextSelection={true}
                ensureDomOrder={true}
                suppressCellFocus={true}
                animateRows={true}
                enableRangeSelection={true}
                rowClass="ag-row-custom"
                overlayLoadingTemplate={
                  '<div class="flex justify-center items-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FB3800]"></div><span class="ml-3 text-gray-500">Loading positions...</span></div>'
                }
                overlayNoRowsTemplate={
                  '<div class="flex flex-col items-center justify-center h-full text-gray-400"><svg class="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>No positions match your search criteria</div>'
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}