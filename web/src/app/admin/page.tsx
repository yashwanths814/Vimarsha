// src/app/admin/page.tsx

"use client";

export default function AdminPage() {
  return (
    <div className="min-h-screen w-full bg-[#F7E8FF] flex flex-col items-center justify-center px-4 py-10">

      {/* PAGE TITLE */}
      <h1 className="
        text-2xl sm:text-3xl md:text-4xl 
        font-bold 
        text-[#A259FF] 
        text-center
      ">
        Admin / Officer Dashboard
      </h1>

      {/* SUB TEXT */}
      <p className="
        mt-3 sm:mt-4 
        text-xs sm:text-sm md:text-base 
        text-[#6B4FA3] 
        text-center 
        max-w-md
      ">
        Analytics, live maps, and lifecycle reports will be available here.
      </p>

      {/* PLACEHOLDER SECTION BOXES (look clean even if empty) */}
      <div className="mt-10 w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-2xl h-32 sm:h-40 flex items-center justify-center text-[#A259FF] font-semibold">
          Live Map
        </div>

        <div className="bg-white shadow-md rounded-2xl h-32 sm:h-40 flex items-center justify-center text-[#A259FF] font-semibold">
          Analytics
        </div>

        <div className="bg-white shadow-md rounded-2xl h-32 sm:h-40 flex items-center justify-center text-[#A259FF] font-semibold">
          Reports
        </div>

        <div className="bg-white shadow-md rounded-2xl h-32 sm:h-40 flex items-center justify-center text-[#A259FF] font-semibold">
          System Insights
        </div>
      </div>

    </div>
  );
}
