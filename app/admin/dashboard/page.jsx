"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const CONCERN_CATEGORIES = [
  "Clearance",
  "Certificate",
  "OJT Related Concerns",
  "Application",
  "Graduation Matters",
  "Consultation",
  "Complaints",
  "Others",
];

// ── Shared design tokens ────────────────────────────────────────────────────
const card        = "bg-white rounded-xl border border-slate-200 shadow-sm mb-6";
const cardHd      = "flex items-center justify-between px-5 py-3 bg-slate-800 rounded-t-xl";
const cardHdTitle = "text-xs font-bold uppercase tracking-widest text-white";
const cardHdSub   = "text-xs text-slate-400";
const cardBody    = "p-5";

const btnPrimary   = "px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white";
const btnDanger    = "px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-red-500 hover:bg-red-600 text-white";
const btnSecondary = "px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300";

const inputCls = "border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const labelCls = "text-xs font-medium text-slate-500 mb-1";

const tHead     = "bg-slate-800 text-white text-xs font-bold uppercase tracking-wide sticky top-0 z-10";
const tHeadCell = "px-4 py-3 whitespace-nowrap";
const tRowEven  = "bg-white";
const tRowOdd   = "bg-slate-50";
const tRowHover = "hover:bg-blue-50 transition-colors";
const tCell     = "px-4 py-3 text-sm text-slate-700";
// ────────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();

  const [requests, setRequests]                     = useState([]);
  const [search, setSearch]                         = useState("");
  const [startDate, setStartDate]                   = useState("");
  const [endDate, setEndDate]                       = useState("");
  const [showReleased, setShowReleased]             = useState(false);
  const [selectedConcern, setSelectedConcern]       = useState("");
  const [previewImages, setPreviewImages]           = useState([]);
  const [currentIndex, setCurrentIndex]             = useState(null);
  const [allSurveys, setAllSurveys]                 = useState([]);
  const [surveySummaryModal, setSurveySummaryModal] = useState(false);
  const [avgRating, setAvgRating]                   = useState(0);

  useEffect(() => { fetchRequests(); }, []);

  async function fetchRequests() {
    const { data, error } = await supabase.from("requests").select("*");
    if (error) { console.error(error); return; }
    const normalized = data.map((req) => {
      let attachments = req.attachment_url;
      if (!attachments) attachments = [];
      if (typeof attachments === "string") {
        try { attachments = JSON.parse(attachments); }
        catch { attachments = [attachments]; }
      }
      if (!Array.isArray(attachments)) attachments = [attachments];
      attachments = attachments.filter(Boolean);
      return { ...req, attachment_url: attachments };
    });
    setRequests(normalized);
  }

  async function fetchAllSurveys() {
    const { data, error } = await supabase
      .from("satisfaction_surveys")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { console.error(error); return; }
    setAllSurveys(data);
    if (data.length > 0) {
      const total = data.reduce((sum, s) => sum + s.rating, 0);
      setAvgRating((total / data.length).toFixed(1));
    }
  }

  function openSurveySummary()  { fetchAllSurveys(); setSurveySummaryModal(true); }
  function closeSurveySummary() { setSurveySummaryModal(false); }

  async function toggleRelease(req) {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("requests")
      .update({ status: "Released", release_date: now })
      .eq("id", req.id);
    if (error) { console.error(error); alert("Failed to release request"); }
    else fetchRequests();
  }

  function resetFilters() {
    setSearch(""); setStartDate(""); setEndDate("");
    setShowReleased(false); setSelectedConcern("");
  }

  function logout() {
    document.cookie = "admin=; path=/; max-age=0";
    router.push("/");
  }

  // ── Filters ───────────────────────────────────────────────────────────────
  const baseFilteredRequests = requests
    .filter((req) => {
      const kw = search.trim().toLowerCase();
      return kw === ""
        || req.student_or_faculty_id?.toLowerCase().includes(kw)
        || req.guest_name?.toLowerCase().includes(kw);
    })
    .filter((req) => {
      if (!startDate && !endDate) return true;
      const created = new Date(req.created_at).setHours(0, 0, 0, 0);
      const start   = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
      const end     = endDate   ? new Date(endDate).setHours(0, 0, 0, 0)   : null;
      if (start && end) return created >= start && created <= end;
      if (start) return created >= start;
      if (end)   return created <= end;
      return true;
    })
    .filter((req) => (showReleased ? req.status === "Released" : true));

  const filteredRequests = baseFilteredRequests.filter((req) =>
    !selectedConcern || req.concern?.toLowerCase() === selectedConcern.toLowerCase()
  );

  // ── Distribution data ─────────────────────────────────────────────────────
  const distributionData = CONCERN_CATEGORIES.map((cat) => {
    const count    = baseFilteredRequests.filter(
      (req) => req.concern?.toLowerCase() === cat.toLowerCase()
    ).length;
    const released = baseFilteredRequests.filter(
      (req) => req.concern?.toLowerCase() === cat.toLowerCase() && req.status === "Released"
    ).length;
    const pending  = count - released;
    const pct      = baseFilteredRequests.length > 0
      ? ((count / baseFilteredRequests.length) * 100).toFixed(1)
      : "0.0";
    return { cat, count, released, pending, pct };
  });

  const maxCount = Math.max(1, ...distributionData.map((d) => d.count));

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getDuration = (req) => {
    if (!req.release_date) return "-";
    const diffDays = Math.ceil(
      (new Date(req.release_date) - new Date(req.created_at)) / (1000 * 60 * 60 * 24)
    );
    return `${diffDays} day(s)`;
  };

  function nextImage() { setCurrentIndex((p) => (p === previewImages.length - 1 ? 0 : p + 1)); }
  function prevImage() { setCurrentIndex((p) => (p === 0 ? previewImages.length - 1 : p - 1)); }
  function closePreview() { setCurrentIndex(null); setPreviewImages([]); }

  return (
    <div className="min-h-screen bg-slate-100 p-6 sm:p-10 font-sans">

      {/* ── HEADER ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-1">Dean's System Query</h1>
          <p className="text-sm text-slate-500 mb-4">Admin Dashboard · v1</p>
          <button onClick={openSurveySummary} className={btnPrimary}>
            View Satisfaction Surveys
          </button>
        </div>
        <button onClick={logout} className={btnDanger}>Logout</button>
      </div>

      {/* ── FILTERS ── */}
      <div className={card}>
        <div className={cardHd}>
          <span className={cardHdTitle}>Filters</span>
          <span className={cardHdSub}>
            {filteredRequests.length} record{filteredRequests.length !== 1 ? "s" : ""} shown
          </span>
        </div>
        <div className={cardBody}>
          <div className="flex flex-col lg:flex-row gap-4 lg:items-end justify-between">
            <div className="flex flex-wrap gap-4 items-end">

              <div className="flex flex-col">
                <label className={labelCls}>Search ID / Name</label>
                <input
                  type="text" placeholder="Enter keyword" value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`${inputCls} w-48`}
                />
              </div>

              <div className="flex flex-col">
                <label className={labelCls}>Start Date</label>
                <input type="date" value={startDate}
                  onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
              </div>

              <div className="flex flex-col">
                <label className={labelCls}>End Date</label>
                <input type="date" value={endDate}
                  onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
              </div>

              <div className="flex flex-col">
                <label className={labelCls}>Filter by Concern</label>
                <select value={selectedConcern}
                  onChange={(e) => setSelectedConcern(e.target.value)}
                  className={`${inputCls} w-52`}>
                  <option value="">All Concerns</option>
                  {CONCERN_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <button onClick={resetFilters} className={`${btnSecondary} self-end`}>
                Reset Filters
              </button>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600 font-medium self-end">
              <input type="checkbox" checked={showReleased}
                onChange={(e) => setShowReleased(e.target.checked)}
                className="w-4 h-4 accent-blue-600" />
              Show Released Only
            </label>
          </div>
        </div>
      </div>

      {/* ── CONCERN DISTRIBUTION CHART ── */}
      <div className={card}>
        <div className={cardHd}>
          <span className={cardHdTitle}>Concern Distribution</span>
          <span className={cardHdSub}>Click a bar to filter · reflects current filters</span>
        </div>

        <div className={cardBody}>

          {/* Legend */}
          <div className="flex items-center gap-5 mb-5">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
              <span className="text-xs text-slate-500 font-medium">Released</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" />
              <span className="text-xs text-slate-500 font-medium">Pending</span>
            </div>
          </div>

          {/* Chart rows */}
          <div className="space-y-2">
            {distributionData.map(({ cat, count, released, pending, pct }) => {
              const isActive        = selectedConcern === cat;
              const releasedWidth   = count > 0 ? (released / maxCount) * 100 : 0;
              const pendingWidth    = count > 0 ? (pending  / maxCount) * 100 : 0;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedConcern(isActive ? "" : cat)}
                  className={`w-full text-left group rounded-lg px-3 py-2.5 transition-all border ${
                    isActive
                      ? "bg-blue-50 border-blue-400 ring-1 ring-blue-300"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">

                    {/* Category label */}
                    <span className={`text-xs font-semibold w-40 shrink-0 truncate ${
                      isActive ? "text-blue-700" : "text-slate-700"
                    }`}>
                      {cat}
                    </span>

                    {/* Stacked bar track */}
                    <div className="flex-1 h-5 bg-slate-100 rounded-md overflow-hidden flex">
                      {count === 0 ? (
                        <div className="w-full h-full" />
                      ) : (
                        <>
                          {released > 0 && (
                            <div
                              className="h-full bg-emerald-500 transition-all duration-500"
                              style={{ width: `${releasedWidth}%` }}
                            />
                          )}
                          {pending > 0 && (
                            <div
                              className="h-full bg-amber-400 transition-all duration-500"
                              style={{ width: `${pendingWidth}%` }}
                            />
                          )}
                        </>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 shrink-0 text-xs font-medium">
                      <span className="text-slate-800 w-5 text-right" title="Total">{count}</span>
                      <span className="text-emerald-600 w-5 text-right" title="Released">{released}</span>
                      <span className="text-amber-600 w-5 text-right" title="Pending">{pending}</span>
                      <span className="text-slate-400 w-10 text-right">{pct}%</span>
                    </div>

                    {/* Active pill */}
                    <span className={`text-xs font-medium shrink-0 w-12 text-right transition-colors ${
                      isActive
                        ? "text-blue-600"
                        : "text-slate-300 group-hover:text-slate-400"
                    }`}>
                      {isActive ? "✕ clear" : "filter"}
                    </span>

                  </div>
                </button>
              );
            })}
          </div>

          {/* Summary footer */}
          <div className="mt-5 pt-4 border-t border-slate-200 flex items-center gap-6 text-xs text-slate-500">
            <span>Total: <strong className="text-slate-800">{baseFilteredRequests.length}</strong></span>
            <span>Released: <strong className="text-emerald-600">{distributionData.reduce((s, d) => s + d.released, 0)}</strong></span>
            <span>Pending: <strong className="text-amber-600">{distributionData.reduce((s, d) => s + d.pending, 0)}</strong></span>
          </div>

        </div>
      </div>

      {/* ── REQUESTS TABLE ── */}
      <div className={card}>
        <div className={cardHd}>
          <span className={cardHdTitle}>
            Requests
            {selectedConcern && (
              <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-normal normal-case tracking-normal">
                {selectedConcern}
              </span>
            )}
          </span>
          <span className={cardHdSub}>
            {filteredRequests.length} record{filteredRequests.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[65vh]">
          <table className="w-full text-sm text-left">
            <thead className={tHead}>
              <tr>
                <th className={tHeadCell}>Request ID</th>
                <th className={tHeadCell}>User Type</th>
                <th className={tHeadCell}>ID / Guest Name</th>
                <th className={tHeadCell}>Section</th>
                <th className={tHeadCell}>Gender</th>
                <th className={tHeadCell}>Contact</th>
                <th className={tHeadCell}>Concern</th>
                <th className={tHeadCell}>Description</th>
                <th className={tHeadCell}>Submitted</th>
                <th className={tHeadCell}>Released</th>
                <th className={tHeadCell}>Duration</th>
                <th className={tHeadCell}>Attachments</th>
                <th className={tHeadCell}>Release</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req, i) => (
                <tr key={req.id}
                  className={`border-t border-slate-100 ${tRowHover} ${
                    i % 2 === 0 ? tRowEven : tRowOdd
                  }`}
                >
                  <td className={`${tCell} capitalize`}>{req.request_id}</td>
                  <td className={`${tCell} capitalize`}>{req.user_type}</td>
                  <td className={tCell}>{req.student_or_faculty_id || req.guest_name}</td>
                  <td className={tCell}>{req.section || "N/A"}</td>
                  <td className={tCell}>{req.gender || "N/A"}</td>
                  <td className={tCell}>{req.contact_no || "N/A"}</td>
                  <td className={`${tCell} max-w-[160px] truncate`}>{req.concern}</td>
                  <td className={`${tCell} max-w-[200px] truncate`}>
                    {req.description || "Not specified"}
                  </td>
                  <td className={`${tCell} whitespace-nowrap`}>
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td className={`${tCell} whitespace-nowrap`}>
                    {req.release_date
                      ? new Date(req.release_date).toLocaleDateString()
                      : <span className="text-slate-400">Not yet</span>}
                  </td>
                  <td className={`${tCell} whitespace-nowrap`}>{getDuration(req)}</td>

                  {/* ATTACHMENTS */}
                  <td className={tCell}>
                    {req.attachment_url.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {req.attachment_url.map((file, idx) => {
                          if (!file) return null;
                          const ext = file.split(".").pop()?.toLowerCase();

                          if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
                            return (
                              <img key={idx} src={file}
                                className="w-16 h-16 object-cover rounded-lg border border-slate-200 cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => { setPreviewImages(req.attachment_url); setCurrentIndex(idx); }}
                              />
                            );
                          }
                          if (ext === "pdf") {
                            return (
                              <embed key={idx} src={file} type="application/pdf"
                                width="64" height="64"
                                className="border border-slate-200 rounded-lg cursor-pointer"
                                onClick={() => window.open(file, "_blank")}
                              />
                            );
                          }
                          return (
                            <a key={idx} href={file} target="_blank"
                              className="text-blue-600 hover:text-blue-700 underline text-sm">
                              {file.split("/").pop()}
                            </a>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </td>

                  {/* RELEASE */}
                  <td className={tCell}>
                    <input type="checkbox"
                      checked={req.status === "Released"}
                      disabled={req.status === "Released"}
                      onChange={() => toggleRelease(req)}
                      className="w-4 h-4 accent-blue-600"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400 text-center sm:hidden">
        Swipe horizontally to see all columns
      </p>

      {/* ── IMAGE PREVIEW MODAL ── */}
      {currentIndex !== null && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
          <button onClick={closePreview}
            className="absolute top-5 right-6 text-white text-2xl font-bold hover:text-slate-300 transition-colors">
            ✕
          </button>
          {previewImages.length > 1 && (
            <button onClick={prevImage}
              className="absolute left-5 text-white text-4xl font-bold hover:text-slate-300 transition-colors">
              ‹
            </button>
          )}
          <img src={previewImages[currentIndex]}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl border border-slate-700" />
          {previewImages.length > 1 && (
            <button onClick={nextImage}
              className="absolute right-5 text-white text-4xl font-bold hover:text-slate-300 transition-colors">
              ›
            </button>
          )}
        </div>
      )}

      {/* ── SATISFACTION SURVEY MODAL ── */}
      {surveySummaryModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-[720px] max-w-[95vw] max-h-[85vh] overflow-hidden flex flex-col">

            <div className={`${cardHd} rounded-t-xl flex-shrink-0`}>
              <span className={cardHdTitle}>Satisfaction Survey Summary</span>
              <button onClick={closeSurveySummary}
                className="text-slate-400 hover:text-white text-lg font-bold transition-colors">
                ✕
              </button>
            </div>

            <div className="px-5 pt-5 pb-4 flex-shrink-0">
              <div className="flex gap-4">
                <div className="flex-1 bg-slate-800 text-white rounded-lg px-4 py-3 text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Total Surveys</p>
                  <p className="text-2xl font-bold">{allSurveys.length}</p>
                </div>
                <div className="flex-1 bg-slate-800 text-white rounded-lg px-4 py-3 text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Average Rating</p>
                  <p className="text-2xl font-bold">{avgRating} <span className="text-base font-normal">/ 5</span></p>
                  <p className="text-sm">{"⭐".repeat(Math.round(avgRating))}</p>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 border-t border-slate-200">
              <table className="w-full text-sm text-left">
                <thead className={tHead}>
                  <tr>
                    <th className={`${tHeadCell} text-center`}>Rating</th>
                    <th className={tHeadCell}>Note</th>
                    <th className={`${tHeadCell} whitespace-nowrap`}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {allSurveys.map((survey, i) => (
                    <tr key={survey.id}
                      className={`border-t border-slate-100 ${tRowHover} ${
                        i % 2 === 0 ? tRowEven : tRowOdd
                      }`}
                    >
                      <td className={`${tCell} text-center`}>{"⭐".repeat(survey.rating)}</td>
                      <td className={tCell}>{survey.note || <span className="text-slate-400">—</span>}</td>
                      <td className={`${tCell} whitespace-nowrap`}>
                        {new Date(survey.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}