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
  const [activeView, setActiveView] = useState("pending");

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
      .update({ status: "Released", release_date: now })
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
    setActiveView("pending");
  }

  function logout() {
    document.cookie = "admin=; path=/; max-age=0";
    router.push("/");
  }

  // Safely parse attachment_url regardless of whether Supabase returns
  // a real JS array, a JSON string like '["https://..."]', or a plain string URL.
  function parseAttachments(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [raw];
      } catch {
        return [raw];
      }
    }
    return [];
  }

  const filteredRequests = requests
    .filter((req) => {
      const keyword = search.trim().toLowerCase();
      const idMatch = req.student_or_faculty_id?.toLowerCase().includes(keyword);
      const nameMatch = req.name?.toLowerCase().includes(keyword);
      return keyword === "" || idMatch || nameMatch;
    })
    .filter((req) => {
      if (!startDate && !endDate) return true;
      const created = new Date(req.created_at).setHours(0, 0, 0, 0);
      const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
      const end = endDate ? new Date(endDate).setHours(0, 0, 0, 0) : null;
      if (start && end) return created >= start && created <= end;
      if (start) return created >= start;
      if (end) return created <= end;
      return true;
    });

  const pendingRequests = filteredRequests.filter((req) => req.status !== "Released");
  const releasedRequests = filteredRequests.filter((req) => req.status === "Released");

  const getDuration = (req) => {
    if (!req.release_date) return "-";
    const diffDays = Math.ceil(
      (new Date(req.release_date) - new Date(req.created_at)) / (1000 * 60 * 60 * 24)
    );
    return `${diffDays} day(s)`;
  };

  const viewRequests =
    activeView === "pending"
      ? pendingRequests
      : activeView === "released"
      ? releasedRequests
      : filteredRequests;

  const viewTitle =
    activeView === "pending"
      ? "Pending Requests"
      : activeView === "released"
      ? "Released Requests"
      : "All Requests";

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10 font-sans">
      {/* HEADER */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dean's Office Requests</h1>
          <p className="text-gray-600 mt-1">Manage and release submitted requests</p>
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
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col">
              <label className="text-xs text-gray-800 mb-1">Search ID / Name</label>
              <input
                type="text"
                placeholder="Enter keyword"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm w-48 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={resetFilters}
              className="mt-5 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm"
            >
              Reset
            </button>
          </div>

          <div className="text-sm bg-gray-100 px-4 py-2 rounded-lg font-medium text-gray-900">
            Total Requests: <span className="font-bold">{filteredRequests.length}</span>
            <div className="mt-2">
              Pending: <span className="font-bold text-orange-600">{pendingRequests.length}</span>
            </div>
            <div>
              Released: <span className="font-bold text-green-600">{releasedRequests.length}</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              {["pending", "released", "all"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setActiveView(mode)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold ${
                    activeView === mode
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {mode === "pending" ? "Pending" : mode === "released" ? "Released" : "All"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            {viewTitle} ({viewRequests.length})
          </h2>
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
                  <th className="px-4 py-3">Attachments</th>
                  <th className="px-4 py-3">Release</th>
                </tr>
              </thead>
              <tbody>
                {viewRequests.map((req) => {
                  const attachments = parseAttachments(req.attachment_url);
                  return (
                    <tr key={req.id} className="border-t hover:bg-gray-50 text-gray-900">
                      <td className="px-4 py-3 capitalize">{req.user_type}</td>
                      <td className="px-4 py-3">{req.student_or_faculty_id || req.guest_name}</td>
                      <td className="px-4 py-3">{req.section || "N/A"}</td>
                      <td className="px-4 py-3">{req.gender || "N/A"}</td>
                      <td className="px-4 py-3">{req.contact_no || "N/A"}</td>
                      <td className="px-4 py-3 max-w-xs truncate">{req.concern}</td>
                      <td className="px-4 py-3 max-w-xs truncate text-wrap">{req.description || "Not specified"}</td>
                      <td className="px-4 py-3">{new Date(req.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {req.release_date ? new Date(req.release_date).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-4 py-3">{getDuration(req)}</td>

                      {/* ATTACHMENTS */}
                      <td className="px-4 py-3">
                        {attachments.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {attachments.map((file, idx) => {
                              const ext = file.split("?")[0].split(".").pop().toLowerCase();
                              const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
                              const isPDF = ext === "pdf";

                              if (isImage) {
                                return (
                                  <a key={idx} href={file} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={file}
                                      alt={`attachment-${idx + 1}`}
                                      className="w-20 h-20 object-cover rounded-md border hover:opacity-80 transition-opacity"
                                    />
                                  </a>
                                );
                              }

                              if (isPDF) {
                                return (
                                  <a
                                    key={idx}
                                    href={file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-3 py-2 bg-red-50 border border-red-200 rounded-md text-red-700 hover:bg-red-100 text-xs font-medium transition-colors"
                                  >
                                    📄 PDF {idx + 1}
                                  </a>
                                );
                              }

                              return (
                                <a
                                  key={idx}
                                  href={file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-sm break-all"
                                >
                                  {decodeURIComponent(file.split("?")[0].split("/").pop())}
                                </a>
                              );
                            })}
                          </div>
                        ) : (
                          "No attachments"
                        )}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <p className="mt-3 text-sm text-gray-500 text-center sm:hidden">
        Swipe horizontally to see all columns
      </p>
    </div>
  );
}