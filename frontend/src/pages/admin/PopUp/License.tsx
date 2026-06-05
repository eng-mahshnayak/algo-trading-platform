import React, { useState } from "react";
import { X, ChevronDown } from "lucide-react";

type AssignLicenseModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

const AssignLicenseModal: React.FC<AssignLicenseModalProps> = ({
    isOpen,
    onClose,
}) => {
    const [license, setLicense] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [numberOfLicense, setNumberOfLicense] = useState(0);

    const licenses = ["Trial", "Silver", "Gold", "Standard", "Pro"];
    const licensePrice = license === "Pro" ? 200 : license === "Standard" ? 100 : 0;
    const totalAmount = licensePrice * numberOfLicense * 1.18;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md shadow-lg relative p-6">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-semibold text-center text-gray-800 mb-6">
                    Asssign License
                </h2>
                <div className="mb-4 relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        License
                    </label>
                    <div
                        className="w-full border rounded px-3 py-2 text-gray-700 flex items-center justify-between cursor-pointer"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                        <span>{license || "Choose License"}</span>
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    </div>
                    {dropdownOpen && (
                        <ul className="absolute left-0 right-0 mt-1 bg-white border rounded shadow z-10">
                            {licenses.map((item) => (
                                <li
                                    key={item}
                                    onClick={() => {
                                        setLicense(item);
                                        setDropdownOpen(false);
                                    }}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                >
                                    {item}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number Of License
                    </label>
                    <div className="flex border rounded overflow-hidden w-full">
                        <button
                            onClick={() => setNumberOfLicense((prev) => Math.max(prev - 1, 0))}
                            className="px-3 bg-gray-200 hover:bg-gray-300 text-lg"
                        >
                            -
                        </button>
                        <div className="flex-1 text-center flex items-center justify-center text-lg font-medium text-gray-800 bg-white">
                            {numberOfLicense}
                        </div>
                        <button
                            onClick={() => setNumberOfLicense((prev) => prev + 1)}
                            className="px-3 bg-gray-200 hover:bg-gray-300 text-lg"
                        >
                            +
                        </button>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount (with GST)
                    </label>
                    <div className="text-gray-900 font-medium">
                        ₹{totalAmount.toFixed(2)}
                    </div>
                </div>
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                        Close
                    </button>
                    <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                        Save changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignLicenseModal;
