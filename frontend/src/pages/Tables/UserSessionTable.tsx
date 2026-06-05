



import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

/* ================= TYPES ================= */

export type UserSession = {
  id: number;
  userId: number;
  login_at: string;
  logout_at: string | null;
  display_name: string | null;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
};

/* ================= CONFIG ================= */

const API_URL = import.meta.env.VITE_API_URL;

/* ================= COMPONENT ================= */

export default function UserSessionPageTable() {
  const gridRef = useRef<AgGridReact>(null);

  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [searchUserId, setSearchUserId] = useState("");

  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  const totalPages = Math.ceil(totalRecords / pageSize);

  /* ================= COLUMNS ================= */

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: "",
        checkboxSelection: true,
        headerCheckboxSelection: true,
        width: 50,
      },
      {
        headerName: "Sr No",
        width: 90,
        valueGetter: (p: any) =>
          (page - 1) * pageSize + (p.node.rowIndex + 1),
      },
       {
        field: "user_name",
        headerName: "User Name",
        width: 150,
        // flex: 1,
        valueFormatter: (p: any) => p.value || "-",
          cellStyle: {
    textAlign: "left",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
  },
      },
      {
        field: "display_name",
        headerName: "Address Details",
        width: 400,
        // flex: 1,
        valueFormatter: (p: any) => p.value || "-",
      },
      {
        field: "login_at",
        headerName: "Login At",
        width: 200,
        valueFormatter: (p: any) =>
          new Date(p.value).toLocaleString(),
      },
      {
        field: "logout_at",
        headerName: "Logout At",
        width: 200,
        valueFormatter: (p: any) =>
          p.value ? new Date(p.value).toLocaleString() : "-",
      },
      {
        field: "userId",
        headerName: "User ID",
        width: 90,
      },
      {
        field: "is_active",
        headerName: "Active",
        width: 120,
        cellRenderer: (p: any) =>
          p.value ? "🟢 Yes" : "🔴 No",
      },
       
   
    ],
    [page, pageSize]
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      wrapText: true,
      autoHeight: true,
       // 🔥 CENTER ALIGN
    cellStyle: {
      display: "flex",
      alignItems: "center",      // vertical center
      justifyContent: "center",  // horizontal center
    },
    }),
    []
  );

  /* ================= API ================= */

const fetchSessions = async (pageNo = page, size = pageSize) => {
  try {
    setLoading(true);

    const res = await axios.get(
      `${API_URL}/admin/getusersectionsession/data`,
      {
        params: {
          page: pageNo,
          size,
          userId: searchUserId || undefined, // 🔥
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      }
    );

    setSessions(res.data.data || []);
    setTotalRecords(res.data.pagination?.totalRecords || 0);
    setPage(pageNo);
    setPageSize(size);
  } catch (err: any) {
    toast.error(
      err?.response?.data?.message || "Failed to fetch sessions"
    );
  } finally {
    setSearchUserId("")
    setLoading(false);
  }
};


;



  /* ================= EFFECT ================= */

  useEffect(() => {
    fetchSessions(1, pageSize);
  }, []);

  /* ================= RENDER ================= */

  return (
    <div className="min-h-screen bg-gray-50 p-6">
     
<br></br>
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow border p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">User Session Logs</h1>

        
        </div>

        <div
          className="ag-theme-alpine custom-grid"
          style={{ height: 550, width: "100%" }}
        >
          <AgGridReact
            ref={gridRef}
            rowData={sessions}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowSelection="multiple"
            rowHeight={52}                  // ✅ ROW GAP FEEL
            enableCellTextSelection={true} // ✅ COPY ENABLE
            ensureDomOrder={true}          // ✅ COPY SUPPORT
            suppressRowClickSelection={true}
            suppressPaginationPanel={true}
            loading={loading}
          />
        </div>

        {/* ================= PAGINATION ================= */}

        <div className="flex justify-between items-center mt-4">
          <div className="text-sm">
            Page <b>{page}</b> of <b>{totalPages}</b> | Total Records:{" "}
            <b>{totalRecords}</b>
          </div>

          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => fetchSessions(page - 1, pageSize)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              ◀ Prev
            </button>

            <button
              disabled={page === totalPages}
              onClick={() => fetchSessions(page + 1, pageSize)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next ▶
            </button>

            <select
              value={pageSize}
              onChange={(e) =>
                fetchSessions(1, Number(e.target.value))
              }
              className="border px-2 py-1 rounded"
            >
              {[10, 25, 50, 100,500,1000].map((s) => (
                <option key={s} value={s}>
                  {s} / page
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
