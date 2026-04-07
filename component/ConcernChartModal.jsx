"use client";

import { Pie } from "react-chartjs-2";

export default function ConcernChartModal({ onClose, data }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg relative">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-500 hover:text-red-500 text-xl"
        >
          ✕
        </button>

        <h2 className="text-lg font-bold mb-4 text-gray-800 text-center">
          Concern Distribution
        </h2>

        <div className="h-80">
          <Pie
            data={data}
            options={{
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "right",
                },
              },
            }}
          />
        </div>

      </div>
    </div>
  );
}