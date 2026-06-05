import React from "react";
import { X } from "lucide-react";

type UnassignStrategyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  strategies: string[];
  onRemove: (strategy: string) => void;
};

const UnAssign: React.FC<UnassignStrategyModalProps> = ({
  isOpen,
  onClose,
  strategies,
  onRemove,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-opacity-30">
      <div className="bg-white w-[400px] max-h-[90vh] rounded shadow-lg p-4 relative overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold mb-4 text-center">
          Unassign Strategy
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-4 py-2 border-b font-medium">Strategy</th>
                <th className="px-4 py-2 border-b font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {strategies.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="text-center py-4 text-gray-500 border-t"
                  >
                    No strategies assigned.
                  </td>
                </tr>
              ) : (
                strategies.map((strategy, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2">{strategy}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => onRemove(strategy)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="text-sm px-4 py-1 border rounded hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnAssign;
