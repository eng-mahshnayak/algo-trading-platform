import React, { useRef, useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";

type LicenseRecord = {
    name: string;
    username: string;
    module: string;
    numberOfLicense: number;
    dateCreated: string;
};

const mockData: LicenseRecord[] = [
    { name: "Rishabh", username: "RISHABH225", module: "Trial", numberOfLicense: 1, dateCreated: "2025-08-02" },
    { name: "Shabeena", username: "Shabeena", module: "Trial", numberOfLicense: 1, dateCreated: "2025-07-29" },
    { name: "Dr. Bhumi Manoj Aravind", username: "M92915", module: "Gold", numberOfLicense: 1, dateCreated: "2025-07-27" },
    { name: "Dr. Bhumi Manoj Aravind", username: "M92915", module: "Trial", numberOfLicense: 1, dateCreated: "2025-07-23" },
    { name: "Rahul Chourasia", username: "@Rsnm", module: "Trial", numberOfLicense: 1, dateCreated: "2025-07-15" },
    { name: "Admin", username: "test_admin", module: "Trial", numberOfLicense: 1, dateCreated: "2025-06-27" },
    { name: "Raj Kumar Ghosh", username: "Rajghosh", module: "Trial", numberOfLicense: 1, dateCreated: "2025-06-18" },
    { name: "Neelesh Jaiswal", username: "N98261", module: "Trial", numberOfLicense: 1, dateCreated: "2025-06-12" },
    { name: "Sarvesh Yadav", username: "S7926", module: "Gold", numberOfLicense: 1, dateCreated: "2025-06-02" },
    { name: "Sarvesh Yadav", username: "S7926", module: "Trial", numberOfLicense: 1, dateCreated: "2025-05-30" },
];

const LicenseReport: React.FC = () => {
    const [selectedUser, setSelectedUser] = useState("All Users");
    const [selectedModule, setSelectedModule] = useState("All Modules");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [filteredData, setFilteredData] = useState(mockData);

    const startDateRef = useRef<HTMLInputElement>(null);
    const endDateRef = useRef<HTMLInputElement>(null);

    const handleSearch = () => {
        const filtered = mockData.filter((item) => {
            const matchUser = selectedUser === "All Users" || item.name === selectedUser;
            const matchModule = selectedModule === "All Modules" || item.module === selectedModule;
            const matchDate =
                (!startDate || new Date(item.dateCreated) >= new Date(startDate)) &&
                (!endDate || new Date(item.dateCreated) <= new Date(endDate));

            return matchUser && matchModule && matchDate;
        });
        setFilteredData(filtered);
    };

    return (
        <div className="max-w-full space-y-4 bg-gray-50 min-h-screen">
            <div className="bg-white p-6 rounded-md shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="relative">
                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="border rounded-md px-4 py-2 pr-10 appearance-none w-full"
                        >
                            <option>All Users</option>
                            {[...new Set(mockData.map((d) => d.name))].map((user) => (
                                <option key={user}>{user}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                    </div>


                    <div className="relative">
                        <select
                            value={selectedModule}
                            onChange={(e) => setSelectedModule(e.target.value)}
                            className="border rounded-md px-4 py-2 appearance-none w-full"
                        >
                            <option>All Modules</option>
                            {[...new Set(mockData.map((d) => d.module))].map((mod) => (
                                <option key={mod}>{mod}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                    </div>
                    <div className="relative">
                        <input
                            ref={startDateRef}
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="border rounded-md px-4 py-2 w-full pr-10"
                        />
                        <Calendar
                            className="w-5 h-5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                            onClick={() => startDateRef.current?.showPicker?.()}
                        />
                    </div>

                    {/* End Date Input */}
                    <div className="relative">
                        <input
                            ref={endDateRef}
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="border rounded-md px-4 py-2 w-full pr-10"
                        />
                        <Calendar
                            className="w-5 h-5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                            onClick={() => endDateRef.current?.showPicker?.()}
                        />
                    </div>

                    <button
                        onClick={handleSearch}
                        className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600"
                    >
                        Search
                    </button>
                </div>

                <div className="text-gray-700 text-right pr-2 font-medium">
                    Total Records: {filteredData.length}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse bg-white rounded-md shadow-sm">
                    <thead className="bg-gray-100 text-left">
                        <tr>
                            <th className="p-3 border">Name</th>
                            <th className="p-3 border">Username</th>
                            <th className="p-3 border">Module</th>
                            <th className="p-3 border">NumberOfLicense</th>
                            <th className="p-3 border">Date Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((entry, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                <td className="p-3 border">{entry.name}</td>
                                <td className="p-3 border">{entry.username}</td>
                                <td className="p-3 border">{entry.module}</td>
                                <td className="p-3 border">{entry.numberOfLicense}</td>
                                <td className="p-3 border">{entry.dateCreated}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LicenseReport;
