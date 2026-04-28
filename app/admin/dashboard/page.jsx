"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ReplyModal from "@/component/replyModal";
import SurveySummaryModal from "@/component/surveyReportModal";
import ConcernChartModal from "@/component/ConcernChartModal";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import {
  getDuration,
  getCleanFileName,
  countPending,
  countReleased,
  getPieData
} from "@/lib/adminFunction";
import useImagePreview from "@/hooks/useImagePreview";
import useRequests from "@/hooks/useRequest";
import StatsCards from "@/component/adminComponents/statsCard";
import Pagination from "@/component/adminComponents/pagination";
import RequestTable from "@/component/adminComponents/requestTable";
import Header from "@/component/adminComponents/header";
import FilterBar from "@/component/adminComponents/filter";
import Swal from "sweetalert2";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const router = useRouter();
  const {
  previewImages,
  setPreviewImages,
  currentIndex,
  nextImage,
  prevImage,
  closePreview,
} = useImagePreview();

  const [files, setFiles] = useState([]);
  const { requests, fetchRequests } = useRequests();
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
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
  const [statusFilter, setStatusFilter] = useState(""); 


    // Count Pending and Released
  const totalPending = requests.filter(r => r.status === "Pending").length;
  const totalReleased = requests.filter(r => r.status === "Released").length;

  // Prepare concern distribution
  const concernCounts = {};
  requests.forEach(req => {
    const concern = req.concern || "Unspecified";
    concernCounts[concern] = (concernCounts[concern] || 0) + 1;
  });

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

async function sendReply(files) {
  if (!selectedEmail || !replyMessage) {
    alert("Missing email or message");
    return;
  }

  setSending(true);

  try {
  const formData = new FormData();
    formData.append("email", selectedEmail);
    formData.append("message", replyMessage);
    formData.append("name", selectedName);

    if (files) {
      files.forEach((file) => {
        formData.append("files", file);
      });
    }

    const res = await fetch("/api/reply", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.success) {
      Swal.fire({
        icon: "success",
        title: "Sent!",
        text: "Reply has been successfully sent.",
        timer: 1500,
        showConfirmButton: false,
      });
      closeReply();
    } else {
      Swal.fire({
        icon: "error",
        title: "Failed!",
        text: "Failed to send reply.",
        timer: 1500,
        showConfirmButton: false,
      });
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

  async function fetchAllSurveys() {

    const { data: requests } = await supabase
    .from("requests")
    .select("*");

  const { data: surveys } = await supabase
    .from("satisfaction_surveys")
    .select("*");

      const { data, error } = await supabase
        .from("satisfaction_surveys")
        .select("*");

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
      setStatusFilter(""); 
    }

  function logout() {
    document.cookie = "admin=; path=/; max-age=0";
    router.push("/");
  }

  const filteredRequests = requests
    .filter((req) => {
      const keyword = search.trim().toLowerCase();

      const idMatch = String(req.student_or_faculty_id || "").toLowerCase().includes(keyword);
      const nameMatch = String(req.guest_name || "").toLowerCase().includes(keyword);
      const contactMatch = String(req.contact_no || "").toLowerCase().includes(keyword);
      const rqstMatch = String(req.request_id || "").toLowerCase().includes(keyword);

      return keyword === "" || idMatch || nameMatch || contactMatch || rqstMatch;
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
      if (!statusFilter) return true; // show all
      return req.status === statusFilter;
    })
    .sort((a, b) => {
    return sortOrder === "desc"
      ? new Date(b.created_at) - new Date(a.created_at)
      : new Date(a.created_at) - new Date(b.created_at);
  });

    const totalPages =
      filteredRequests.length === 0
        ? 1
        : Math.ceil(filteredRequests.length / itemsPerPage);

        const paginatedRequests = filteredRequests.slice(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage
        );

    useEffect(() => {
      setCurrentPage(1);
    }, [search, startDate, endDate, statusFilter]);

    
  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10 font-sans">

 {/*HEADER*/}
  <Header logout={logout} />

  <div className="flex flex-col lg:flex-row gap-6 justify-center items-start">

      <FilterBar
        search={search}
        setSearch={setSearch}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        resetFilters={resetFilters}
        openSurveySummary={openSurveySummary}
        setPieModal={setPieModal}
        totalPending={totalPending}
        totalReleased={totalReleased}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

  </div>

    <RequestTable
    paginatedRequests={paginatedRequests}
    getDuration={getDuration}
    getCleanFileName={getCleanFileName}
    toggleRelease={toggleRelease}
    openReply={openReply}
    setPreviewFile={setPreviewFile}
    previewFile={previewFile}
    setSortOrder={setSortOrder}
    sortOrder={sortOrder}
  />
  

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
  files={files}
  setFiles={setFiles}
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
          <div className="fixed bottom-5 w-full">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
            />
          </div>
    </div>
  );
}