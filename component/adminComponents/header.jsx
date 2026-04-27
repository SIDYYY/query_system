"use client";

import Image from "next/image";

export default function Header({ logout }) {
  return (
    <div className="flex justify-between  items-start mb-8 ">

      {/* LEFT SIDE */}
      <div className="space-y-1">

        <div className="flex items-center gap-3">
          
          <h1 className="text-4xl font-bold text-gray-900">
            Dean&apos;s Query System v1
          </h1>

          <Image
            src="/assets/onlyLogo.png"
            alt="Logo"
            width={60}
            height={60}
          />

        </div>

        <small className="text-gray-500">
          by - Carl Patrick Daguinotas
        </small>

      </div>

      {/* RIGHT SIDE */}
      <div>
        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-medium"
        >
          Logout
        </button>
      </div>

    </div>
  );
}