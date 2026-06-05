// LogTable.tsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, Search } from "lucide-react";

type LogEntry = {
    id: number;
    log: string;
    time: string; // e.g., "04 Aug 2025 4:02:40 PM"
};

const logsData: LogEntry[] = [
    { id: 142713, log: "Logged In from : 183.182.85.155 Mumbai,Maharashtra,IN", time: "04 Aug 2025 4:02:40 PM" },
    { id: 142707, log: "Message Broadcasted", time: "04 Aug 2025 3:40:30 PM" },
    { id: 142706, log: "UpdateWatchList", time: "04 Aug 2025 3:26:17 PM" },
    { id: 142698, log: "Button Order Sent", time: "04 Aug 2025 2:55:39 PM" },
    { id: 142697, log: "UpdateWatchList", time: "04 Aug 2025 2:55:31 PM" },
    { id: 142696, log: "Logged In from : 183.182.85.155 Mumbai,Maharashtra,IN", time: "04 Aug 2025 2:51:35 PM" },
    { id: 142694, log: "Logged out.", time: "04 Aug 2025 2:50:58 PM" },
];

const ITEMS_PER_PAGE = 5;

const formatDateForInput = (date: Date): string => {
    return date.toISOString().split("T")[0];
};

const parseDateFromLog = (logTime: string): Date => {
    return new Date(logTime);
};

const ActivityLogs: React.FC = () => {
    const [search, setSearch] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const datePickerRef = useRef<any>(null);

    useEffect(() => {
        if (logsData.length > 0) {
            const latestLogDate = logsData
                .map((log) => parseDateFromLog(log.time))
                .sort((a, b) => b.getTime() - a.getTime())[0];
            setSelectedDate(latestLogDate);
        }
    }, []);

    const filteredLogs = useMemo(() => {
        return logsData.filter((log) => {
            const matchesSearch = log.log.toLowerCase().includes(search.toLowerCase());
            const logDate = parseDateFromLog(log.time);
            const logDateStr = formatDateForInput(logDate);
            const selectedDateStr = selectedDate ? formatDateForInput(selectedDate) : "";
            const matchesDate = selectedDateStr === "" || logDateStr === selectedDateStr;
            return matchesSearch && matchesDate;
        });
    }, [search, selectedDate]);

    const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
    const paginatedLogs = filteredLogs.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="p-4 bg-white rounded-md shadow-md text-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="relative w-1/3">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        <Search className="w-4 h-4" />
                    </span>
                    <input
                        type="text"
                        placeholder="Search Logs"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="pl-9 pr-3 py-2 border rounded-4xl w-full"
                    />
                </div>


                <div className="flex items-center gap-3 relative z-50">
                    <div className="relative w-35">
                        <Calendar
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 cursor-pointer z-10"
                            onClick={() => datePickerRef.current?.setOpen(true)}
                        />

                        <DatePicker
                            ref={datePickerRef}
                            selected={selectedDate}
                            onChange={(date: Date | null) => {
                                setSelectedDate(date);
                                setCurrentPage(1);
                            }}
                            dateFormat="dd MMM yyyy"
                            className="pl-10 pr-3 py-2 border rounded-md w-full cursor-pointer outline-none"
                            popperPlacement="bottom-start"
                            popperModifiers={
                                [
                                    {
                                        name: "offset",
                                        options: {
                                            offset: [0, 6],
                                        },
                                    },
                                ] as any
                            }
                            placeholderText="Select Date"
                        />
                    </div>

                    <div>Total Records: {filteredLogs.length}</div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200">
                    <thead className="bg-gray-100">
                        <tr className="text-left">
                            <th className="px-4 py-2 border">Action</th>
                            <th className="px-4 py-2 border">ID</th>
                            <th className="px-4 py-2 border">Log</th>
                            <th className="px-4 py-2 border">Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedLogs.map((log) => (
                            <tr key={log.id}>
                                <td className="px-4 py-2 border">
                                    <button className="border border-purple-500 text-purple-600 px-3 py-1 rounded-md">
                                        Detail
                                    </button>
                                </td>
                                <td className="px-4 py-2 border">{log.id}</td>
                                <td className="px-4 py-2 border">{log.log}</td>
                                <td className="px-4 py-2 border">{log.time}</td>
                            </tr>
                        ))}
                        {paginatedLogs.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-4">
                                    No logs found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex justify-end items-center gap-2">
                <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                >
                    Prev
                </button>
                <span>
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default ActivityLogs;
