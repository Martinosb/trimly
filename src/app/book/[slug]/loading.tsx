import React from "react";

export default function BookingLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center p-0 sm:p-4 font-sans">
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-0 sm:rounded-2xl shadow-xl flex flex-col justify-between overflow-hidden border border-[#ebebeb] relative">
        {/* Top Header Skeleton */}
        <header className="px-5 pt-4 pb-3 border-b border-[#f0f0f0] flex items-center justify-between">
          <div className="w-8 h-8 rounded-full bg-[#f0f0f0] animate-pulse" />
          <div className="space-y-1.5 text-center">
            <div className="h-4 w-32 bg-[#f0f0f0] rounded animate-pulse mx-auto" />
            <div className="h-3 w-20 bg-[#f0f0f0] rounded animate-pulse mx-auto" />
          </div>
          <div className="w-8 h-6 bg-[#f0f0f0] rounded-full animate-pulse" />
        </header>

        {/* Step Indicator Skeleton */}
        <div className="flex border-b border-[#f0f0f0] bg-[#fafafa]">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 py-3 px-2">
              <div className="h-3 bg-[#e8e8e8] rounded animate-pulse mx-auto w-12" />
            </div>
          ))}
        </div>

        {/* Main Content Area Skeletons */}
        <main className="p-5 flex-1 space-y-4">
          <div className="space-y-1.5">
            <div className="h-5 w-48 bg-[#f0f0f0] rounded animate-pulse" />
            <div className="h-3.5 w-64 bg-[#f0f0f0] rounded animate-pulse" />
          </div>

          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-4 rounded-2xl border border-[#ebebeb] bg-white space-y-2.5 animate-pulse"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="h-4 w-36 bg-[#f0f0f0] rounded" />
                    <div className="h-3 w-48 bg-[#f0f0f0] rounded" />
                  </div>
                  <div className="h-5 w-16 bg-[#f0f0f0] rounded" />
                </div>
                <div className="h-3 w-24 bg-[#f0f0f0] rounded mt-2" />
              </div>
            ))}
          </div>
        </main>

        {/* Sticky Bottom Bar Skeleton */}
        <footer className="p-4 border-t border-[#f0f0f0] bg-white">
          <div className="w-full h-12 bg-[#f0f0f0] rounded-xl animate-pulse" />
        </footer>
      </div>
    </div>
  );
}
