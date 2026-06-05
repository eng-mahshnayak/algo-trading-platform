import React from "react";
import { brokersData } from "../data/brokersData";

const Broker: React.FC = () => {
  return (
    <div className="p-6">
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full table-auto border-collapse">
          <thead className="bg-gray-100 text-left text-sm font-semibold text-gray-600">
            <tr>
              <th className="border border-gray-200 px-4 py-2">Name</th>
              <th className="border border-gray-200 px-4 py-2">Desc</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-800">
            {brokersData.map((broker, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-4 py-2">{broker.name}</td>
                <td className="border border-gray-200 px-4 py-2">{broker.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Broker;
