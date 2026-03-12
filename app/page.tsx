import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#13136b]">
      {/* Background Image */}
      {/* <Image
        src="/BG.png"
        alt="Background"
        fill
        className="object-cover"
        priority
      /> */}

      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Main content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white/70 backdrop-blur-md rounded-3xl p-10 max-w-md w-full text-center shadow-xl">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            Dean's Office Query System
          </h1>

          <div className="flex flex-col gap-6">
            <Link
              href="/admin/dashboard"
              className="rounded-xl bg-blue-800 px-8 py-6 text-white font-semibold shadow-lg transition hover:scale-105"
            >
              Admin Dashboard
            </Link>

            <span className="font-medium text-gray-800">OR</span>

            <Link
              href="/student/dashboard"
              className="rounded-xl bg-yellow-500 px-8 py-6 text-white font-semibold shadow-lg transition hover:scale-105"
            >
              Requestants Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}