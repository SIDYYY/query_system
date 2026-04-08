"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ReplyModal from "@/component/replyModal";
import SurveySummaryModal from "@/component/surveyReportModal";
import ConcernChartModal from "@/component/ConcernChartModal";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const router = useRouter();

  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showReleased, setShowReleased] = useState(false);
  const [showPending, setUnShowReleased] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [surveyModal, setSurveyModal] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [allSurveys, setAllSurveys] = useState([]);
  const [surveySummaryModal, setSurveySummaryModal] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [reportSummary, setReportSummary] = useState("");
  const [ratingBreakdown, setRatingBreakdown] = useState({});
  const [replyModal, setReplyModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // PWEDE RANI MA CHANGE SA PREFER PAGES SHOWN
  const [pieModal, setPieModal] = useState(false);

  // Count Pending and Released
const totalPending = requests.filter(r => r.status === "Pending").length;
const totalReleased = requests.filter(r => r.status === "Released").length;

// Prepare concern distribution
const concernCounts = {};
requests.forEach(req => {
  const concern = req.concern || "Unspecified";
  concernCounts[concern] = (concernCounts[concern] || 0) + 1;
});

// Example: getPieData function
const getPieData = (requests) => {
  // Count how many requests fall into each concern type
  const counts = requests.reduce((acc, req) => {
    const concern = req.concern || "Others"; // fallback if no concern
    acc[concern] = (acc[concern] || 0) + 1;
    return acc;
  }, {});

  return {
    labels: Object.keys(counts),
    datasets: [
      {
        data: Object.values(counts),
        backgroundColor: [
          "#3B82F6", // blue
          "#EF4444", // red
          "#F59E0B", // amber
          "#10B981", // green
          "#8B5CF6", // purple
          "#F43F5E", // pink
        ],
      },
    ],
  };
};

// Example functions for Pending/Released counts
const countPending = (requests) =>
  requests.filter((r) => r.status === "Pending").length;

const countReleased = (requests) =>
  requests.filter((r) => r.status === "Released").length;

  useEffect(() => {
    fetchRequests();
  }, []);

  function openReply(req) {
  setSelectedEmail(req.email);

  const nameOrId =
    req.student_or_faculty_id || req.guest_name || "User";

  setSelectedName(nameOrId);

  setReplyModal(true);
}

function closeReply() {
  setReplyModal(false);
  setReplyMessage("");
}

async function sendReply() {
  if (!selectedEmail || !replyMessage) {
    alert("Missing email or message");
    return;
  }

  setSending(true);

  try {
    const res = await fetch("/api/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: selectedEmail,
        message: replyMessage,
        name: selectedName,
      }),
    });

    const data = await res.json();

    if (data.success) {
      alert("Reply sent!");
      closeReply();
    } else {
      alert("Failed to send.");
    }
  } catch (err) {
    console.error(err);
    alert("Error sending email");
  }

  setSending(false);
}

  function generateSurveyReport() {
  if (!allSurveys.length) return;

  // Rating breakdown
  const breakdown = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  let positive = 0;
  let negative = 0;

  allSurveys.forEach((s) => {
    breakdown[s.rating]++;

    if (s.rating >= 4) positive++;
    if (s.rating <= 2) negative++;
  });

  setRatingBreakdown(breakdown);

  // Smart summary
  const total = allSurveys.length;
  const avg = avgRating;

  let summary = `Survey Report Summary:\n\n`;
  summary += `Total Responses: ${total}\n`;
  summary += `Average Rating: ${avg}\n\n`;

  if (avg >= 4) {
    summary += `Overall, users are highly satisfied with the service.\n`;
  } else if (avg >= 3) {
    summary += `Users are moderately satisfied but improvements are needed.\n`;
  } else {
    summary += `User satisfaction is low and requires immediate attention.\n`;
  }

  summary += `\nPositive Feedback: ${positive}\n`;
  summary += `Negative Feedback: ${negative}\n`;

  // detect common issue words
  const combinedNotes = allSurveys.map(s => s.note || "").join(" ").toLowerCase();

  if (combinedNotes.includes("slow") || combinedNotes.includes("delay")) {
    summary += `\n⚠ Common Issue: Delay/Slow processing mentioned.\n`;
  }

  if (combinedNotes.includes("good") || combinedNotes.includes("fast")) {
    summary += `\n✅ Strength: Fast or good service mentioned.\n`;
  }

  setReportSummary(summary);
}

function downloadReport() {
  if (!reportSummary) return;

  const blob = new Blob([reportSummary], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "survey_report.txt";
  a.click();

  URL.revokeObjectURL(url);
}

  // Fetch requests
  async function fetchRequests() {
    const { data, error } = await supabase
      .from("requests")
      .select(`
        *
      `);

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

  async function fetchAllSurveys() {

    const { data: requests } = await supabase
    .from("requests")
    .select("*");

  const { data: surveys } = await supabase
    .from("satisfaction_surveys")
    .select("*");

      const { data, error } = await supabase
        .from("satisfaction_surveys")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setAllSurveys(data);

      // compute average
      if (data.length > 0) {
        const total = data.reduce((sum, s) => sum + s.rating, 0);
        setAvgRating((total / data.length).toFixed(1));
      }
    }

  function openSurvey(req) {
  setSelectedSurvey(req);
  setSurveyModal(true);
  }

  function closeSurvey() {
    setSurveyModal(false);
    setSelectedSurvey(null);
  }

  function openSurveySummary() {
  fetchAllSurveys();
  setSurveySummaryModal(true);
  }

  function closeSurveySummary() {
    setSurveySummaryModal(false);
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
    setUnShowReleased(false);
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
    .filter((req) => {
      if (showReleased && showPending) return req.status === "Released" || req.status === "Pending";
      if (showReleased) return req.status === "Released";
      if (showPending) return req.status === "Pending";
      return true; // if neither is checked, show all
    });

    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

    const paginatedRequests = filteredRequests.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );

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

  const getCleanFileName = (url) => {
  const raw = url.split("/").pop() || "";
  const parts = raw.split("-");
  return parts.length > 1 ? parts.slice(1).join("-") : raw;
};

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10 font-sans">

      {/* HEADER */}
      <div className="flex justify-between">
      <div className="gap-3 mb-8">

      <div className="flex items-center justify-center">

          <h1 className="text-4xl font-bold text-gray-900">
            Dean's Query System v1
          </h1>
          <img 
            src="/assets/onlyLogo.png" 
            alt="Logo" 
            className="w-15 h-13 mr-2"
          />
        </div>
      <small>by - Carl Patrick Daguinotas</small>

      </div>
      <div>
        <button
        onClick={logout}
        className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-medium"
      >
        Logout
      </button>
      </div>
      </div>

  <div className="flex flex-col lg:flex-row gap-6 justify-center items-start">


    <div className="bg-white shadow rounded-xl px-6 py-4 mb-6 text-gray-800">
  <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-6">

    {/* LEFT: SEARCH + DATE */}
    <div className="flex flex-wrap items-end gap-4">

      <div className="flex flex-col">
        <label className="text-xs font-medium mb-1">Search</label>
        <input
          type="text"
          placeholder="ID or Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm w-40 focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs font-medium mb-1">Start</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs font-medium mb-1">End</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
        />
      </div>

      <button
        onClick={resetFilters}
        className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-sm font-medium"
      >
        Reset
      </button>
    </div>

  </div>
</div>

    {/* CENTER: CHECKBOX FILTERS */}
    <div className="flex flex-col text-center mb-6 bg-white shadow rounded-xl px-6 py-4  text-gray-800 ">
      <h4>Concern Status</h4>
    <div className="flex items-center gap-6">

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={showReleased}
          onChange={(e) => setShowReleased(e.target.checked)}
          className="accent-blue-500"
        />
        Released
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={showPending}
          onChange={(e) => setUnShowReleased(e.target.checked)}
          className="accent-blue-500"
        />
        Pending
      </label>

    </div>
      </div>

          {/* RIGHT: ACTION BUTTONS */}
    <div className="flex items-center gap-3 bg-white shadow rounded-xl px-6 py-4  text-gray-800 ">
      <div className="flex flex-col gap-1 ">
      <button
        onClick={openSurveySummary}
        className="bg-blue-600 hover:bg-blue-700 text-white ml-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
      >
        Show Surveys
      </button>

      <button
        onClick={() => setPieModal(true)}
        className="bg-indigo-600 hover:bg-indigo-700 ml-2 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
      >
        Show Concern Distribution
      </button>
      </div>
    </div>


  </div>
  

      {/* TABLE */}
        <div className="overflow-x-auto overflow-y-auto max-h-142 rounded-xl shadow bg-white">       
          <table className="w-full text-sm text-left border">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 hidden">Request ID</th>
              <th className="px-4 py-3">User Type</th>
              <th className="px-4 py-3">ID / Guest Name</th>
              <th className="px-4 py-3">Section</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Gmail</th>
              <th className="px-4 py-3">Concern</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Consultation Date (for Consultation Concerns)</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Resolved</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Attachments</th>
              <th className="px-4 py-3">Resolve</th>
              <th className="px-4 py-3">Reply</th>
              {/* <th className="px-4 py-3">Satisfaction</th> */}
            </tr>
          </thead>

          <tbody>
                {paginatedRequests.map((req) => (
                <tr key={req.id} className="border-t hover:bg-gray-50 text-gray-800">
                <td className="px-4 py-3 capitalize hidden">{req.request_id}</td>
                <td className="px-4 py-3 capitalize">{req.user_type}</td>
                <td className="px-4 py-3">
                  {req.student_or_faculty_id || req.guest_name}
                </td>
                <td className="px-4 py-3">{req.section || "N/A"}</td>
                <td className="px-4 py-3">{req.gender || "N/A"}</td>
                <td className="px-4 py-3">{req.contact_no || "N/A"}</td>
                <td className="px-4 py-3">{req.email || "N/A"}</td>
                <td className="px-4 py-3 max-w-xs truncate">{req.concern}</td>
                <td className="px-4 py-3 max-w-xs truncate text-wrap">
                  {req.description || "Not specified"}
                </td>
                <td className="px-4 py-3 max-w-xs truncate text-wrap">
                  {req.consultation_date || "Not a consultation"}
                </td>

                <td className="px-4 py-3">
                  {new Date(req.created_at).toLocaleDateString()}
                </td>

                <td className="px-4 py-3">
                  {req.release_date
                    ? new Date(req.release_date).toLocaleDateString()
                    : "Not yet"}
                </td>

                <td className="px-4 py-3">{getDuration(req)}</td>

                    {/* ATTACHMENT */}
                       <td className="px-4 py-2 ">
                        {req.attachment_url.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {req.attachment_url.map((file, idx) => {
                              if (!file) return null;

                              const ext = file.split("?")[0].split(".").pop()?.toLowerCase();
                              const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
                              const isPdf = ext === "pdf";
                              const fileName = getCleanFileName(file);

                              return (
                                <div
                                  key={idx}
                                  onClick={() => setPreviewFile(file)}
                                  className="w-20 h-20 flex flex-col items-center justify-center bg-gray-100 rounded-lg border border-slate-200 cursor-pointer hover:scale-105 transition text-xs p-1"
                                  title={fileName}
                                >
                                  {isImage && <span>🖼️</span>}
                                  {isPdf && <span>📄</span>}
                                  {!isImage && !isPdf && <span>📁</span>}

                                  <span className="truncate w-full text-center">
                                    {fileName}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-400">No Attachment</span>
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
                  {req.email ? (
                    <button
                      onClick={() => openReply(req)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                    >
                      Reply
                    </button>
                  ) : (
                    "-"
                  )}
                </td>

              </tr>
            ))}
          </tbody>

        </table>
        
        

        {previewFile && (
  <div
    className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    onClick={() => setPreviewFile(null)}
  >
    <div
      className="bg-white p-4 rounded-xl max-w-3xl w-full"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="mb-2 text-red-500 font-bold"
        onClick={() => setPreviewFile(null)}
      >
        Close
      </button>

      {/* Detect file type */}
      {(() => {
        const ext = previewFile.split("?")[0].split(".").pop()?.toLowerCase();

        if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
          return (
            <img
              src={previewFile}
              className="w-full max-h-[70vh] object-contain"
            />
          );
        }

        if (ext === "pdf") {
          return (
            <iframe
              src={previewFile}
              className="w-full h-[70vh]"
            />
          );
        }

        return (
          <div className="text-center">
            <p>Preview not available</p>
            <a
              href={previewFile}
              target="_blank"
              className="text-blue-600 underline"
            >
              Download File
            </a>
          </div>
        );
      })()}
    </div>
  </div>
)}


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
{pieModal && (
  <ConcernChartModal
    onClose={() => setPieModal(false)}
    data={getPieData(filteredRequests)}
  />
)}

{replyModal && (
  <ReplyModal
  email={selectedEmail}
  message={replyMessage}
  setMessage={setReplyMessage}
  onClose={closeReply}
  onSend={sendReply}
  sending={sending}
/>
)}

{surveySummaryModal && (
  <SurveySummaryModal
    allSurveys={allSurveys}
    avgRating={avgRating}
    reportSummary={reportSummary}
    ratingBreakdown={ratingBreakdown}
    onClose={closeSurveySummary}
    onGenerateReport={generateSurveyReport}
    onDownloadReport={downloadReport}
  />
)}

<div className="flex justify-center items-center gap-2 mt-8 text-gray-800">

            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Prev
            </button>

            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>

          </div>
    </div>
  );
}