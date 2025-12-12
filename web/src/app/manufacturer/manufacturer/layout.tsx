"use client";

import Image from "next/image";
import type { ReactNode } from "react";

function ManufacturerSidebar() {
    return (
        <nav className="p-4">
            <ul className="flex md:block gap-2 md:gap-0 md:space-y-2">
                <li>
                    <a
                        href="#"
                        className="block px-3 py-2 rounded-xl hover:bg-gray-100 text-sm text-gray-700"
                    >
                        Dashboard
                    </a>
                </li>
                <li>
                    <a
                        href="#"
                        className="block px-3 py-2 rounded-xl hover:bg-gray-100 text-sm text-gray-700"
                    >
                        Products
                    </a>
                </li>
                <li>
                    <a
                        href="#"
                        className="block px-3 py-2 rounded-xl hover:bg-gray-100 text-sm text-gray-700"
                    >
                        Orders
                    </a>
                </li>
                <li>
                    <a
                        href="#"
                        className="block px-3 py-2 rounded-xl hover:bg-gray-100 text-sm text-gray-700"
                    >
                        Settings
                    </a>
                </li>
            </ul>
        </nav>
    );
}

export default function ManufacturerLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#F7E8FF] flex flex-col">
            {/* HEADER ALWAYS ON TOP */}
            <header className="bg-white shadow-md py-3 sm:py-4 w-full flex justify-center">
                <div className="flex flex-wrap items-center justify-center sm:justify-evenly gap-3 w-full max-w-[1500px] px-4 sm:px-8 lg:px-12">
                    <Image src="/g20.png" width={180} height={180} alt="G20" />
                    <Image src="/railway.png" width={110} height={110} alt="Railway" />
                    <Image src="/tourism.png" width={140} height={140} alt="Tourism" />
                    <Image src="/vimarsha.png" width={130} height={130} alt="Vimarsha" />
                </div>
            </header>

            {/* SIDEBAR + MAIN */}
            <div className="flex flex-col md:flex-row flex-1">
                {/* LEFT SIDEBAR */}
                <aside className="w-full md:w-64 bg-white shadow-xl md:min-h-full">
                    <ManufacturerSidebar />
                </aside>

                {/* MAIN PAGE CONTENT */}
                <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-x-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
