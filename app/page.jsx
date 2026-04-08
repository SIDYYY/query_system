"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState("");
  const router = useRouter();

async function verifyAdmin() {
  const { data } = await supabase.rpc("verify_admin_password", {
    input_password: password,
  });

  if (data) {
    document.cookie = "admin=true; path=/; max-age=3600"; 
    router.push("/admin/dashboard");
  } else {
    alert("Incorrect password");
  }
}

  return (
    <div
        className="relative flex min-h-screen items-center justify-center p-4 bg-cover bg-center"
        style={{ backgroundImage: "url(/assets/BG-CITC.jpg)" }}
      >
        <div className="absolute inset-0 bg-black/70"></div>

        <div className="relative bg-white/70 backdrop-blur-md rounded-3xl p-10 max-w-md w-full text-center shadow-2xl border-2 border-[#fab414]">

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Dean's Office Query System
        </h1>

        <div className="flex flex-col gap-6">

          {/* ADMIN BUTTON */}
          <button
            onClick={() => setShowModal(true)}
            className="rounded-xl bg-blue-800 px-8 py-6 text-white font-semibold shadow-lg hover:scale-105 transition cursor-pointer"
          >
            Admin Dashboard
          </button>

          <span className="font-medium text-gray-800">OR</span>

          <Link
            href="/student/dashboard"
            className="rounded-xl bg-yellow-500 px-8 py-6 text-white font-semibold shadow-lg hover:scale-105 transition cursor-pointer"
          >
            Requestants Dashboard
          </Link>

        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

          <div className="bg-white p-8 rounded-xl shadow-xl w-80 text-gray-800 text-center">

            <h2 className="text-xl font-bold mb-4">
              Enter Admin Password
            </h2>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border p-2 rounded mb-4"
            />

            <div className="flex gap-3 justify-center">

              <button
                onClick={verifyAdmin}
                className="bg-blue-700 text-white px-4 py-2 rounded cursor-pointer"
              >
                Enter
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-300 px-4 py-2 rounded cursor-pointer"
              >
                Cancel
              </button>

            </div>

          </div>

        </div>
      )}
    </div>
  );
}