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
  const [surveyModal, setSurveyModal] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [allSurveys, setAllSurveys] = useState([]);
  const [surveySummaryModal, setSurveySummaryModal] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [reportSummary, setReportSummary] = useState("");
  const [ratingBreakdown, setRatingBreakdown] = useState({});

  useEffect(() => {
    fetchRequests();
  }, []);

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
      <div className="flex justify-between">
      <div className="gap-3 mb-8">

      <div className="">
      <h1 className="text-gray-800 text-4xl font-bold mb-5"> Dean's System Query v1</h1>
      <button
        onClick={openSurveySummary}
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium"
      >
        View Satisfaction Surveys
      </button>
      </div>
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
        <div className="overflow-x-auto overflow-y-auto max-h-150 rounded-xl shadow bg-white">       
          <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Request ID</th>
              <th className="px-4 py-3">User Type</th>
              <th className="px-4 py-3">ID / Guest Name</th>
              <th className="px-4 py-3">Section</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Gmail</th>
              <th className="px-4 py-3">Concern</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Released</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Attachments</th>
              <th className="px-4 py-3">Release</th>
              {/* <th className="px-4 py-3">Satisfaction</th> */}
            </tr>
          </thead>

          <tbody>
            {filteredRequests.map((req) => (
              <tr key={req.id} className="border-t hover:bg-gray-50 text-gray-800">
                <td className="px-4 py-3 capitalize">{req.request_id}</td>
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

                <td className="px-4 py-3">
                  {new Date(req.created_at).toLocaleDateString()}
                </td>

                <td className="px-4 py-3">
                  {req.release_date
                    ? new Date(req.release_date).toLocaleDateString()
                    : "Not yet"}
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

                {/* <td className="px-4 py-3">
                  {req.satisfaction_surveys?.length > 0 ? (
                    <button
                      onClick={() => openSurvey(req)}
                      className="text-blue-600 underline font-medium"
                    >
                      View Survey
                    </button>
                  ) : (
                    "-"
                  )}
                </td> */}

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
{/* SATISFACTION SURVEY MODAL */}
{/* {surveyModal && selectedSurvey && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 text-gray-800">

    <div className="bg-white rounded-xl shadow-xl w-105 p-6 relative"> */}

      {/* CLOSE */}
      {/* <button
        onClick={closeSurvey}
        className="absolute top-3 right-4 text-gray-500 text-xl"
      >
        ✕
      </button>

      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Satisfaction Survey
      </h2>

      <div className="space-y-3 text-gray-800">

        <p>
          <span className="font-semibold">Request ID:</span>{" "}
          {selectedSurvey.request_id}
        </p>

        <p>
          <span className="font-semibold">Rating:</span>{" "}
          {"⭐".repeat(selectedSurvey.satisfaction_surveys[0].rating || 0)}
        </p>

        <p>
          <span className="font-semibold">Notes:</span>{" "}
          {selectedSurvey.satisfaction_surveys[0].note || "No feedback provided"}
        </p>

      </div>

    </div>

  </div>
)

} */}
{surveySummaryModal && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 text-gray-800">

    <div className="bg-white rounded-xl shadow-xl w-200 max-h-[85vh] overflow-y-auto p-6 relative">

      <button
        onClick={closeSurveySummary}
        className="absolute top-3 right-4 text-gray-500 text-xl"
      >
        ✕
      </button>

      <h2 className="text-2xl font-bold mb-4">
        Satisfaction Survey Summary
      </h2>

      <div className="mb-4 space-y-2 bg-blue-900 p-2 rounded-lg text-white pl-5">
        <p>
          <span className="font-semibold">Total Surveys:</span>{" "}
          {allSurveys.length}
        </p>

        <p>
          <span className="font-semibold">Average Rating:</span>{" "}
          {"⭐".repeat(Math.round(avgRating))} ({avgRating})
        </p>
      </div>

    <div className="overflow-x-auto overflow-y-auto max-h-50">       
      <table className="w-full text-sm border">
        <thead className="bg-gray-100 text-gray-600">
          <tr>
            <th className="p-2 border">Rating</th>
            <th className="p-2 border">Note</th>
            <th className="p-2 border">Date</th>
          </tr>
        </thead>

        <tbody>
          {allSurveys.map((survey) => (
            <tr key={survey.id} className="border-t">

              <td className="p-2 border">
                {"⭐".repeat(survey.rating)}
              </td>

              <td className="p-2 border">
                {survey.note || "-"}
              </td>

              <td className="p-2 border">
                {new Date(survey.created_at).toLocaleDateString()}
              </td>

            </tr>
          ))}
        </tbody>

      </table>
    </div>
    <div className="flex gap-3 mt-5">

      <button
        onClick={generateSurveyReport}
        className="shadow-xl p-2 border-2 rounded-2xl bg-green-600 text-white hover:bg-green-700"
      >
        Generate Survey Report
      </button>

      <button
        onClick={downloadReport}
        className="shadow-xl p-2 border-2 rounded-2xl bg-blue-600 text-white hover:bg-blue-700"
      >
        Download Report
      </button>
    </div>
          {reportSummary && (
  <div className="mt-6 bg-gray-100 p-4 rounded-lg whitespace-pre-line">

    <h3 className="font-bold mb-2">Report Summary</h3>
    <p>{reportSummary}</p>

    <h3 className="font-bold mt-4 mb-2">Rating Breakdown</h3>
    <ul>
      {Object.entries(ratingBreakdown).map(([star, count]) => (
        <li key={star}>
          {"⭐".repeat(star)} : {count}
        </li>
      ))}
    </ul>

  </div>
)}
    </div>
  </div>

  
)}



    </div>
  );
}