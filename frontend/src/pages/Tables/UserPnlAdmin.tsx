import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { DatePicker, Button, Select } from "antd";
import dayjs, { Dayjs } from "dayjs";
import "antd/dist/reset.css";
import { toast } from "react-toastify";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { 
  FiCalendar, 
  FiDownload, 
  FiTrendingUp, 
  FiTrendingDown,
  FiRefreshCw,
  FiUsers,
  FiUser,

} from "react-icons/fi";

type UserPnl = {
  userId: number;
  firstname: string;
  lastname: string;
  date: string;
  totalPnl: number;
};

const { RangePicker } = DatePicker;

export default function UserPnlAdmin() {
  const apiUrl = import.meta.env.VITE_API_URL;

  const [userPnls, setUserPnls] = useState<UserPnl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Default Today Range (UI)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(() => [
    dayjs().startOf("day"),
    dayjs().endOf("day"),
  ]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [panelRange, setPanelRange] = useState<[Dayjs, Dayjs] | null>(() => [
    dayjs().startOf("day"),
    dayjs().endOf("day"),
  ]);

  // ✅ Selected User (unique by userId)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // ---------------- PnL cell renderer ----------------
  const pnlCellRenderer = (params: any) => {
    const pnl = params.value;
    const n = Number(pnl);
    const isPositive = n > 0;
    const isNegative = n < 0;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium ${
        isPositive ? "bg-green-100 text-green-700" : 
        isNegative ? "bg-red-100 text-red-700" : 
        "bg-gray-100 text-gray-600"
      }`}>
        {isPositive && <FiTrendingUp size={12} />}
        {isNegative && <FiTrendingDown size={12} />}
        {Number.isFinite(n) ? (n > 0 ? `+${n.toFixed(2)}` : n.toFixed(2)) : "0.00"}
      </span>
    );
  };

  // ---------------- Grid columns ----------------
  const columnDefs = useMemo<ColDef<UserPnl>[]>(
    () => [
      {
        headerName: "#",
        width: 70,
        minWidth: 60,
        sortable: false,
        filter: false,
        valueGetter: (params) => {
          return params.node?.rowIndex != null ? params.node.rowIndex + 1 : "";
        },
        cellStyle: { textAlign: "center", fontWeight: "500" },
      },
      { 
        headerName: "User ID", 
        field: "userId", 
        width: 100, 
        minWidth: 90,
        cellRenderer: (params: any) => (
          <code className="text-xs font-mono text-gray-600">{params.value}</code>
        )
      },
      { 
        headerName: "First Name", 
        field: "firstname", 
        width: 150, 
        minWidth: 130,
        cellRenderer: (params: any) => (
          <span className="font-medium text-gray-800">{params.value || "-"}</span>
        )
      },
      { 
        headerName: "Last Name", 
        field: "lastname", 
        width: 150, 
        minWidth: 130,
        cellRenderer: (params: any) => (
          <span className="font-medium text-gray-800">{params.value || "-"}</span>
        )
      },
      { 
        headerName: "Date", 
        field: "date", 
        width: 180, 
        minWidth: 160,
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-1">
            <FiCalendar size={12} className="text-gray-400" />
            <span>{params.value ? dayjs(params.value).format("DD-MMM-YYYY") : "-"}</span>
          </div>
        )
      },
      {
        headerName: "Total PnL",
        field: "totalPnl",
        width: 140,
        minWidth: 120,
        cellRenderer: pnlCellRenderer,
      },
    ],
    []
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      filter: true,
      sortable: true,
      flex: 1,
      minWidth: 80,
    }),
    []
  );

  // ---------------- Fetch (default today from API) ----------------
  const fetchUserPnls = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.post(
        `${apiUrl}/admin/getusers/pnldata`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      if (data?.status === true) {
        const rows = Array.isArray(data.data) ? data.data : [];
        setUserPnls(rows);
      } else if (data?.status === false && data?.message === "Unauthorized") {
        toast.error("Unauthorized User");
        localStorage.clear();
      } else {
        setUserPnls([]);
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Date filter Apply ----------------
  const handleGetDates = async (rangeParam?: [Dayjs, Dayjs] | null) => {
    const activeRange = rangeParam ?? dateRange;

    if (!activeRange || !activeRange[0] || !activeRange[1]) {
      toast.error("Please select a date range");
      return;
    }

    const [from, to] = activeRange;
    const payload = [from.toISOString(), to.toISOString()];

    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(`${apiUrl}/admin/getusers/pnldata`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });

      if (res.data?.status === true) {
        const rows = Array.isArray(res.data.data) ? res.data.data : [];
        setUserPnls(rows);

        // ✅ if selected user not present in new range, reset it
        const exists = selectedUserId != null && rows.some((r: UserPnl) => r.userId === selectedUserId);
        if (!exists) setSelectedUserId(null);
      } else if (res.data?.status === false && res.data?.message === "Unauthorized") {
        localStorage.clear();
        toast.error("Session expired. Please log in again.");
      } else {
        setUserPnls([]);
        setSelectedUserId(null);
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Cancel filter (back to default today) ----------------
  const handleCancelDate = async () => {
    setDateRange([dayjs().startOf("day"), dayjs().endOf("day")]);
    setPanelRange([dayjs().startOf("day"), dayjs().endOf("day")]);
    setPickerOpen(false);
    setSelectedUserId(null);
    await fetchUserPnls();
  };

  // ---------------- Excel ----------------
  const handleExcelDownload = () => {
    const ws = XLSX.utils.json_to_sheet(userPnls);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "User PnL");
    XLSX.writeFile(wb, `user_pnl_${dayjs().format("YYYY-MM-DD")}.xlsx`);
    toast.success("Excel downloaded successfully!");
  };

  // ✅ Unique users list (NO duplicates by userId)
  const userOptions = useMemo(() => {
    const map = new Map<number, { userId: number; firstname: string; lastname: string }>();
    for (const r of userPnls) {
      if (!map.has(r.userId)) {
        map.set(r.userId, {
          userId: r.userId,
          firstname: r.firstname || "",
          lastname: r.lastname || "",
        });
      }
    }
    return Array.from(map.values())
      .sort((a, b) => `${a.firstname} ${a.lastname}`.localeCompare(`${b.firstname} ${b.lastname}`))
      .map((u) => ({
        value: u.userId,
        label: `${u.firstname} ${u.lastname}`.trim() || `User ${u.userId}`,
      }));
  }, [userPnls]);

  // ✅ Filter rows by selected user
  const filteredRows = useMemo(() => {
    if (!selectedUserId) return userPnls;
    return userPnls.filter((r) => r.userId === selectedUserId);
  }, [userPnls, selectedUserId]);

  // ✅ SUM: selected user total pnl (in selected date range)
  const selectedUserTotalPnl = useMemo(() => {
    return filteredRows.reduce((sum, r) => sum + Number(r.totalPnl || 0), 0);
  }, [filteredRows]);

  // ✅ SUM: all users total pnl (in selected date range)
  const allUsersTotalPnl = useMemo(() => {
    return userPnls.reduce((sum, r) => sum + Number(r.totalPnl || 0), 0);
  }, [userPnls]);

  // Load default today
  useEffect(() => {
    fetchUserPnls();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 md:px-6 lg:px-8 py-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-[#FB3800] to-orange-500 rounded-xl">
              <FiTrendingUp className="text-white" size={24} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">User P&L Report</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            Monitor profit and loss across all users
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Total Users</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{userOptions.length}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <FiUsers className="text-blue-500" size={20} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Total Records</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{userPnls.length}</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <FiCalendar className="text-purple-500" size={20} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Total P&L (All)</p>
                <p className={`text-2xl font-bold mt-1 ${allUsersTotalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {allUsersTotalPnl >= 0 ? `+${allUsersTotalPnl.toFixed(2)}` : allUsersTotalPnl.toFixed(2)}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${allUsersTotalPnl >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                {allUsersTotalPnl >= 0 ? (
                  <FiTrendingUp className="text-green-500" size={20} />
                ) : (
                  <FiTrendingDown className="text-red-500" size={20} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <RangePicker
                format="DD-MMM-YYYY"
                className="h-11 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FB3800]/20 focus:border-[#FB3800]"
                open={pickerOpen}
                onOpenChange={(open) => {
                  if (open) {
                    setPickerOpen(true);
                    setPanelRange(dateRange);
                  }
                }}
                value={panelRange ?? dateRange ?? null}
                onCalendarChange={(val) => setPanelRange(val as [Dayjs, Dayjs] | null)}
                onChange={(val) => setPanelRange(val as [Dayjs, Dayjs] | null)}
                allowClear={false}
                ranges={{
                  Today: [dayjs().startOf("day"), dayjs().endOf("day")],
                  Yesterday: [dayjs().subtract(1, "day").startOf("day"), dayjs().subtract(1, "day").endOf("day")],
                  "Last 7 Days": [dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")],
                  "Last 30 Days": [dayjs().subtract(29, "day").startOf("day"), dayjs().endOf("day")],
                  "This Month": [dayjs().startOf("month"), dayjs().endOf("month")],
                  "Last Month": [dayjs().subtract(1, "month").startOf("month"), dayjs().subtract(1, "month").endOf("month")],
                }}
                renderExtraFooter={() => (
                  <div className="flex justify-end gap-3 p-2">
                    <Button size="small" onClick={handleCancelDate} className="rounded-lg">Cancel</Button>
                    <Button
                      size="small"
                      type="primary"
                      disabled={!panelRange || !panelRange[0] || !panelRange[1]}
                      onClick={() => {
                        if (!panelRange) return;
                        setDateRange(panelRange);
                        setPickerOpen(false);
                        handleGetDates(panelRange);
                      }}
                      className="rounded-lg bg-gradient-to-r from-[#FB3800] to-orange-500"
                    >
                      Apply
                    </Button>
                  </div>
                )}
              />
            </div>

            <div className="min-w-[220px]">
              <Select
                allowClear
                showSearch
                placeholder="Select user..."
                value={selectedUserId ?? undefined}
                onChange={(val) => setSelectedUserId(val ?? null)}
                options={userOptions}
                className="w-full h-11 [&_.ant-select-selector]:rounded-lg [&_.ant-select-selector]:border-gray-200"
                popupClassName="rounded-lg"
                filterOption={(input, option) =>
                  String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
                suffixIcon={<FiUser className="text-gray-400" />}
              />
            </div>

            {/* Totals */}
            <div className="flex items-center gap-4">
              <div className="px-3 py-2 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500">All Users</span>
                <p className={`text-sm font-bold ${allUsersTotalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {allUsersTotalPnl >= 0 ? `+${allUsersTotalPnl.toFixed(2)}` : allUsersTotalPnl.toFixed(2)}
                </p>
              </div>
              {selectedUserId && (
                <div className="px-3 py-2 bg-orange-50 rounded-lg border border-orange-100">
                  <span className="text-xs text-orange-600">Selected User</span>
                  <p className={`text-sm font-bold ${selectedUserTotalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedUserTotalPnl >= 0 ? `+${selectedUserTotalPnl.toFixed(2)}` : selectedUserTotalPnl.toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex-1"></div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExcelDownload}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-sm"
              >
                <FiDownload size={16} />
                Export Excel
              </button>
              <button
                onClick={fetchUserPnls}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all"
              >
                <FiRefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-[#FB3800]/20 rounded-full"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-[#FB3800] rounded-full animate-spin border-t-transparent"></div>
            </div>
            <p className="mt-4 text-gray-500">Loading P&L data...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-3">
              <FiTrendingDown className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium text-red-800">Error Loading Data</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* AG Grid Table */}
        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="ag-theme-alpine" style={{ height: "550px", width: "100%" }}>
              <AgGridReact<UserPnl>
                rowData={filteredRows}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                pagination={true}
                paginationPageSize={20}
                paginationPageSizeSelector={[10, 20, 50, 100]}
                suppressCellFocus={true}
                animateRows={true}
                rowSelection="single"
                enableCellTextSelection={true}
                ensureDomOrder={true}
                rowHeight={48}
                headerHeight={48}
                overlayLoadingTemplate={'<div class="flex justify-center items-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FB3800]"></div><span class="ml-3 text-gray-500">Loading data...</span></div>'}
                overlayNoRowsTemplate={'<div class="flex justify-center items-center h-full text-gray-400">No P&L data found</div>'}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}