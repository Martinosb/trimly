import React from "react";

export default function DashboardLoading() {
  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex justify-between items-center pb-6 border-b border-[#ebebeb]">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-[#f0f0f0] rounded animate-pulse" />
          <div className="h-4 w-64 bg-[#f0f0f0] rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-[#f0f0f0] rounded-xl animate-pulse" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-white border border-[#ebebeb] rounded-2xl animate-pulse" />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-96 bg-white border border-[#ebebeb] rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
