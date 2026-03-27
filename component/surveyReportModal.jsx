"use client";

export default function SurveySummaryModal({
  allSurveys,
  avgRating,
  reportSummary,
  ratingBreakdown,
  onClose,
  onGenerateReport,
  onDownloadReport,
}) {
  if (!allSurveys) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 text-gray-800">
      <div className="bg-white rounded-xl shadow-xl w-200 max-h-[85vh] overflow-y-auto p-6 relative">

        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-500 text-xl"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold mb-4">Satisfaction Survey Summary</h2>

        <div className="mb-4 space-y-2 bg-blue-900 p-2 rounded-lg text-white pl-5">
          <p><span className="font-semibold">Total Surveys:</span> {allSurveys.length}</p>
          <p><span className="font-semibold">Average Rating:</span> {"⭐".repeat(Math.round(avgRating))} ({avgRating})</p>
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
                  <td className="p-2 border">{"⭐".repeat(survey.rating)}</td>
                  <td className="p-2 border">{survey.note || "-"}</td>
                  <td className="p-2 border">{new Date(survey.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onGenerateReport}
            className="shadow-xl p-2 border-2 rounded-2xl bg-green-600 text-white hover:bg-green-700"
          >
            Generate Survey Report
          </button>

          <button
            onClick={onDownloadReport}
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
                <li key={star}>{"⭐".repeat(star)} : {count}</li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}