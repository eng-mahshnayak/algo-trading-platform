import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { FaEdit, FaBars } from "react-icons/fa";
import Assign from "../admin/PopUp/Assign";
import UnAssign from "../admin/PopUp/UnAssign";
import License from "../admin/PopUp/License";
import { ChevronDown, Search } from "lucide-react";

type User = {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  broker: string;
  module: string;
  createdAt: string;
  expiry: string;
  lastLogin: string;
  status: string;
  strategy: string;
  referredBy: string;
  referralEnabled: boolean;
};

const ITEMS_PER_PAGE = 5;

const AllUser: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [dropdownIndex, setDropdownIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAssignPopup, setShowAssignPopup] = useState(false);
  const [showUnAssignPopup, setShowUnAssignPopup] = useState(false);
  const [showLicensePopup, setShowLicensePopup] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/users/get-users");
        if (res.data.success) {
          setUsers(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers();
  }, []);


  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        (!statusFilter || user.status === statusFilter) &&
        (user.firstName?.toLowerCase().includes(search.toLowerCase()) ||
          user.username?.toLowerCase().includes(search.toLowerCase()) ||
          user.broker?.toLowerCase().includes(search.toLowerCase()))
    );
  }, [users, search, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleDropdown = (index: number) => {
    setDropdownIndex(dropdownIndex === index ? null : index);
  };

  return (
    <div>
      <div className="flex justify-between gap-2 mb-2">
        <div>
          <h2>All Users</h2>
        </div>
        <div className="flex gap-3">
          <div className="relative w-fit">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              size={16}
            />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-4xl text-sm focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none border border-gray-300 px-10 py-2 rounded-4xl text-sm focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="Expired">Expired</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded shadow border border-gray-200">
        <table className="min-w-full text-sm text-left border border-gray-200 border-collapse">
          <thead className="bg-gray-100 border-b text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 border">Name</th>
              <th className="px-4 py-3 border">Username</th>
              <th className="px-4 py-3 border">Broker</th>
              <th className="px-4 py-3 border">Module</th>
              <th className="px-4 py-3 border">DateCreated</th>
              <th className="px-4 py-3 border">Expiry</th>
              <th className="px-4 py-3 border">Last Login</th>
              <th className="px-4 py-3 border">Status</th>
              <th className="px-4 py-3 border">Strategy</th>
              <th className="px-4 py-3 border">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedUsers.map((user, index) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{user.firstName} {user.lastName}</td>
                <td className="px-4 py-2 border">{user.username}</td>
                <td className="px-4 py-2 border">{user.broker}</td>
                <td className="px-4 py-2 border">{user.module}</td>
                <td className="px-4 py-2 border">{user.createdAt}</td>
                <td className="px-4 py-2 border">{user.expiry}</td>
                <td className="px-4 py-2 border">{user.lastLogin}</td>
                <td className="px-4 py-2 border">
                  <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-2 border">{user.strategy || "—"}</td>
                <td className="px-4 py-2 border relative">
                  <div className="flex gap-2">
                    <button className="bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded">
                      <FaEdit size={14} />
                    </button>
                    <button
                      onClick={() => toggleDropdown(index)}
                      className="bg-green-500 hover:bg-green-600 text-white p-2 rounded"
                    >
                      <FaBars size={14} />
                    </button>
                  </div>

                  {/* Dropdown */}
                  {dropdownIndex === index && (
                    <div className="absolute top-11 right-5 bg-white border border-gray-200 rounded shadow w-40 z-10">
                      <ul className="text-sm">
                        <li
                          onClick={() => {
                            setShowAssignPopup(true);
                            setDropdownIndex(null);
                          }}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          Assign Strategy
                        </li>
                        <li
                          onClick={() => {
                            setShowUnAssignPopup(true);
                            setDropdownIndex(null);
                          }}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          Unassign Strategy
                        </li>
                        <li
                          onClick={() => {
                            setShowLicensePopup(true);
                            setDropdownIndex(null);
                          }}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          Assign License
                        </li>
                      </ul>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-4 py-4 text-sm">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Popups */}
      <Assign isOpen={showAssignPopup} onClose={() => setShowAssignPopup(false)} />
      <UnAssign
        isOpen={showUnAssignPopup}
        onClose={() => setShowUnAssignPopup(false)}
        strategies={[
          "CB-BU-AM1",
          "CB-BU-AM2",
          "CB-BU-AM3",
          "CB-BU-LIC",
          "CB-BU-ISP",
          "CB-BU-GPS",
        ]}
        onRemove={(strategy) => {
          console.log("Removing strategy:", strategy);
        }}
      />
      <License
        isOpen={showLicensePopup}
        onClose={() => setShowLicensePopup(false)}
      />
    </div>
  );
};

export default AllUser;
