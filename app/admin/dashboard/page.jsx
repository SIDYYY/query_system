"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const router = useRouter();

  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showReleased, setShowReleased] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    const { data, error } = await supabase.from("requests").select("*");
    if (error) console.error(error);
    else setRequests(data || []);
  }

  async function toggleRelease(req) {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("requests")
      .update({
        status: "Released",
        release_date: now,
      })
      .eq("id", req.id);

    if (error) {
      console.error(error);
      alert("Failed to release request");
    } else {
      fetchRequests();
    }
  }

  function resetFilters() {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setShowReleased(false);
  }

  function logout() {
    document.cookie = "admin=; path=/; max-age=0";
    router.push("/");
  }

  const filteredRequests = requests
    .filter((req) => {
      const keyword = search.trim().toLowerCase();

      const idMatch = req.student_or_faculty_id
        ?.toLowerCase()
        .includes(keyword);

      const nameMatch = req.name?.toLowerCase().includes(keyword);

      return keyword === "" || idMatch || nameMatch;
    })
    .filter((req) => {
      if (!startDate && !endDate) return true;

      const created = new Date(req.created_at).setHours(0, 0, 0, 0);

      const start = startDate
        ? new Date(startDate).setHours(0, 0, 0, 0)
        : null;

      const end = endDate
        ? new Date(endDate).setHours(0, 0, 0, 0)
        : null;

      if (start && end) return created >= start && created <= end;
      if (start) return created >= start;
      if (end) return created <= end;

      return true;
    })
    .filter((req) => (showReleased ? req.status === "Released" : true));

  const getDuration = (req) => {
    if (!req.release_date) return "-";

    const start = new Date(req.created_at);
    const end = new Date(req.release_date);

    const diffDays = Math.ceil(
      (end - start) / (1000 * 60 * 60 * 24)
    );

    return `${diffDays} day(s)`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10 font-sans">

      {/* HEADER */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dean's Office Requests
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and release submitted requests
          </p>
        </div>

        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg shadow-sm text-sm font-medium"
        >
          Logout
        </button>
      </div>

      {/* FILTERS CARD */}
      <div className="bg-white shadow rounded-xl p-5 mb-6 text-gray-800">

        <div className="flex flex-col lg:flex-row gap-4 lg:items-end justify-between">

          {/* LEFT FILTERS */}
          <div className="flex flex-wrap gap-4 items-end">

            {/* SEARCH */}
            <div className="flex flex-col">
              <label className="text-xs text-gray-800 mb-1">
                Search ID / Name
              </label>
              <input
                type="text"
                placeholder="Enter keyword"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm w-48 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>

            {/* START DATE */}
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              />
            </div>

            {/* END DATE */}
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              />
            </div>

            {/* RESET */}
            <button
              onClick={resetFilters}
              className="mt-5 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm"
            >
              Reset
            </button>

          </div>

          {/* RIGHT SIDE */}
          <div className="text-sm bg-gray-100 px-4 py-2 rounded-lg font-medium justify-center text-center">
            Total Requests:{" "}
            <span className="font-bold text-gray-900">
              {filteredRequests.length}
            </span>

            {/* RELEASED */}
            <label className="flex items-center gap-2 text-sm mt-5">
              <input
                type="checkbox"
                checked={showReleased}
                onChange={(e) => setShowReleased(e.target.checked)}
              />
              Show Released Only
            </label>
          </div>

        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl shadow bg-white">
        <table className="w-full text-sm text-left">

          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">User Type</th>
              <th className="px-4 py-3">ID / Guest Name</th>
              <th className="px-4 py-3">Section</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Concern</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Released</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Release</th>
            </tr>
          </thead>

          <tbody>
            {filteredRequests.map((req) => (
              <tr
                key={req.id}
                className="border-t hover:bg-gray-50 text-gray-900"
              >

                <td className="px-4 py-3 capitalize">
                  {req.user_type}
                </td>

                <td className="px-4 py-3">
                  {req.student_or_faculty_id || req.guest_name}
                </td>

                <td className="px-4 py-3">
                  {req.section || "N/A"}
                </td>

                <td className="px-4 py-3">
                  {req.gender || "N/A"}
                </td>

                <td className="px-4 py-3">
                  {req.contact_no || "N/A"}
                </td>

                <td className="px-4 py-3 max-w-xs truncate">
                  {req.concern}
                </td>

                <td className="px-4 py-3 max-w-xs truncate text-wrap">
                  {req.description || "Not specified"}
                </td>

                <td className="px-4 py-3">
                  {new Date(req.created_at).toLocaleDateString()}
                </td>

                <td className="px-4 py-3">
                  {req.release_date
                    ? new Date(req.release_date).toLocaleDateString()
                    : "-"}
                </td>

                <td className="px-4 py-3">
                  {getDuration(req)}
                </td>

                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={req.status === "Released"}
                    disabled={req.status === "Released"}
                    onChange={() => toggleRelease(req)}
                  />
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>

      <p className="mt-3 text-sm text-gray-500 text-center sm:hidden">
        Swipe horizontally to see all columns
      </p>

    </div>
  );
}