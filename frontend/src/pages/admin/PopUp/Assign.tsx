import React from "react";
import { X, ChevronDown } from "lucide-react";

type AssignStrategyModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const Assign: React.FC<AssignStrategyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-md w-full max-w-md p-6 relative shadow-lg">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">
          Assign Strategy
        </h2>

        {/* Strategy Dropdown */}
        <div className="mb-4 relative">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Select Strategy
          </label>
          <div className="relative">
            <select className="appearance-none w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Select Strategy</option>
              <option>Strategy 1</option>
              <option>Strategy 2</option>
            </select>
            <ChevronDown
              size={18}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
            />
          </div>
        </div>

        {/* Amount Dropdown */}
        <div className="mb-6 relative">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Amount (excluding GST)
          </label>
          <div className="relative">
            <select className="appearance-none w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>0</option>
              <option>1000</option>
              <option>2000</option>
            </select>
            <ChevronDown
              size={18}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
          <button className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Assign;
