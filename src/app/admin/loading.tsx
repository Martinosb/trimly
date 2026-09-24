import React from "react";

export default function AdminLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#f7f7f7] p-4 sm:p-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center pb-6 border-b border-[#ebebeb]">
          <div className="space-y-2">
            <div className="h-7 w-56 bg-[#f0f0f0] rounded animate-pulse" />
            <div className="h-4 w-72 bg-[#f0f0f0] rounded animate-pulse" />
          </div>
          <div className="h-9 w-32 bg-[#f0f0f0] rounded-xl animate-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white border border-[#ebebeb] rounded-2xl animate-pulse" />
          ))}
        </div>

        <div className="h-96 bg-white border border-[#ebebeb] rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}
