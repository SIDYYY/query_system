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
  const [previewImages, setPreviewImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  // Fetch requests
  async function fetchRequests() {
    const { data, error } = await supabase.from("requests").select("*");

    if (error) {
      console.error(error);
      return;
    }

    const normalized = data.map((req) => {
      let attachments = req.attachment_url;

      // handle null
      if (!attachments) attachments = [];

      // handle JSON string
      if (typeof attachments === "string") {
        try {
          attachments = JSON.parse(attachments);
        } catch {
          attachments = [attachments];
        }
      }

      // ensure array
      if (!Array.isArray(attachments)) {
        attachments = [attachments];
      }

      // remove null values
      attachments = attachments.filter(Boolean);

      return { ...req, attachment_url: attachments };
    });

    setRequests(normalized);
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
      const idMatch = req.student_or_faculty_id?.toLowerCase().includes(keyword);
      const nameMatch = req.guest_name?.toLowerCase().includes(keyword);
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
    })
    .filter((req) => (showReleased ? req.status === "Released" : true));

  const getDuration = (req) => {
    if (!req.release_date) return "-";
    const start = new Date(req.created_at);
    const end = new Date(req.release_date);
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return `${diffDays} day(s)`;
  };
  function nextImage() {
  setCurrentIndex((prev) =>
    prev === previewImages.length - 1 ? 0 : prev + 1
  );
  }

  function prevImage() {
    setCurrentIndex((prev) =>
      prev === 0 ? previewImages.length - 1 : prev - 1
    );
  }

  function closePreview() {
    setCurrentIndex(null);
    setPreviewImages([]);
  }

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

      {/* FILTERS */}
      <div className="bg-white shadow rounded-xl p-5 mb-6 text-gray-800">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-end justify-between">

          <div className="flex flex-wrap gap-4 items-end">

            <div className="flex flex-col">
              <label className="text-xs mb-1">Search ID / Name</label>
              <input
                type="text"
                placeholder="Enter keyword"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm w-48"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              />
            </div>

            <button
              onClick={resetFilters}
              className="mt-5 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-sm"
            >
              Reset
            </button>

          </div>

          <div className="text-sm bg-gray-100 px-4 py-2 rounded-lg font-medium text-center">
            Total Requests:{" "}
            <span className="font-bold">{filteredRequests.length}</span>

            <label className="flex items-center gap-2 text-sm mt-4">
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
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] rounded-xl shadow bg-white">       
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
              <th className="px-4 py-3">Satisfaction</th>
            </tr>
          </thead>

          <tbody>
            {filteredRequests.map((req) => (
              <tr key={req.id} className="border-t hover:bg-gray-50 text-gray-800">

                <td className="px-4 py-3 capitalize">{req.user_type}</td>
                <td className="px-4 py-3">
                  {req.student_or_faculty_id || req.guest_name}
                </td>
                <td className="px-4 py-3">{req.section || "N/A"}</td>
                <td className="px-4 py-3">{req.gender || "N/A"}</td>
                <td className="px-4 py-3">{req.contact_no || "N/A"}</td>
                <td className="px-4 py-3 max-w-xs truncate">{req.concern}</td>
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

                <td className="px-4 py-3">{getDuration(req)}</td>

                {/* ATTACHMENTS */}
                <td className="px-4 py-3">
                  {req.attachment_url.length > 0 ? (
                    <div className="flex flex-wrap gap-2">

                      {req.attachment_url.map((file, idx) => {
                        if (!file) return null;

                        const ext = file.split(".").pop()?.toLowerCase();

                        if (["jpg","jpeg","png","gif","webp"].includes(ext)) {
                          return (
                            <img
                              key={idx}
                              src={file}
                              className="w-20 h-20 object-cover rounded-md border cursor-pointer hover:scale-105 transition"
                              onClick={() => {
                                setPreviewImages(req.attachment_url);
                                setCurrentIndex(idx);
                              }}
                            />
                          );
                        }

                        if (ext === "pdf") {
                          return (
                            <embed
                              key={idx}
                              src={file}
                              type="application/pdf"
                              width="80"
                              height="80"
                              className="border rounded-md cursor-pointer"
                              onClick={() => window.open(file, "_blank")}
                            />
                          );
                        }

                        return (
                          <a
                            key={idx}
                            href={file}
                            target="_blank"
                            className="text-blue-600 underline"
                          >
                            {file.split("/").pop()}
                          </a>
                        );
                      })}

                    </div>
                  ) : (
                    "No attachments"
                  )}
                </td>

                <td className="px-4 py-3 check:bg-green-800">
                  <input
                    type="checkbox"
                    checked={ req.status === "Released"}
                    disabled={req.status === "Released"}
                    onChange={() => toggleRelease(req)}
                        className="w-5 h-5"
                  />
                </td>

                <td className="px-4 py-3">
                  {req.satisfaction_rating ?? "-"}
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>

      <p className="mt-3 text-sm text-gray-500 text-center sm:hidden">
        Swipe horizontally to see all columns
      </p>

      {currentIndex !== null && (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">

    {/* Close */}
    <button
      onClick={closePreview}
      className="absolute top-5 right-8 text-white text-3xl font-bold"
    >
      ✕
    </button>

    {/* Previous */}
    {previewImages.length > 1 && (
      <button
        onClick={prevImage}
        className="absolute left-5 text-white text-4xl font-bold"
      >
        ‹
      </button>
    )}

    {/* Image */}
    <img
      src={previewImages[currentIndex]}
      className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
    />

    {/* Next */}
    {previewImages.length > 1 && (
      <button
        onClick={nextImage}
        className="absolute right-5 text-white text-4xl font-bold"
      >
        ›
      </button>
    )}

  </div>
)}

    </div>
  );
}