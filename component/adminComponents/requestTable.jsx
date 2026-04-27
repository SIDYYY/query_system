"use client";


export default function RequestTable({
  paginatedRequests,
  getDuration,
  getCleanFileName,
  toggleRelease,
  openReply,
  setPreviewFile,
  previewFile,
  sortOrder,
  setSortOrder}) {
  return (
    <div className="overflow-x-auto overflow-y-auto max-h-142 rounded-xl shadow bg-white">

      <table className="w-full text-sm text-left border">

        {/* HEADER (UNCHANGED) */}
        <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
          <tr>
            <th className="px-4 py-3 ">Request ID</th>
            <th className="px-4 py-3">User Type</th>
            <th className="px-4 py-3">ID / Guest Name</th>
            <th className="px-4 py-3">Section</th>
            <th className="px-4 py-3">Gender</th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Gmail</th>
            <th className="px-4 py-3">Concern</th>
            <th className="px-4 py-3">Description</th>
            <th className="px-4 py-3">Consultation Date (for Consultation Concerns)</th>
            <th
              className="px-4 py-3 cursor-pointer"
              onClick={() =>
                setSortOrder(prev => (prev === "desc" ? "asc" : "desc"))
              }
            >
              Submitted {sortOrder === "desc" ? "🔽" : "🔼"}
            </th>
        {/* <th className="px-4 py-3">Resolved</th>
            <th className="px-4 py-3">Duration</th> */}
            <th className="px-4 py-3">Attachments</th>
            <th className="px-4 py-3">Resolve?</th>
            <th className="px-4 py-3">Reply</th>
          </tr>
        </thead>

        {/* BODY (UNCHANGED DATA) */}
        <tbody>
          {paginatedRequests.map((req) => (
            <tr key={req.id} className="border-t hover:bg-gray-50 text-gray-800">

              <td className="px-4 py-3 ">{req.request_id}</td>

              <td className="px-4 py-3 capitalize">{req.user_type}</td>

              <td className="px-4 py-3">
                {req.student_or_faculty_id || req.guest_name}
              </td>

              <td className="px-4 py-3">{req.section || "N/A"}</td>

              <td className="px-4 py-3">{req.gender || "N/A"}</td>

              <td className="px-4 py-3">{req.contact_no || "N/A"}</td>

              <td className="px-4 py-3">{req.email || "N/A"}</td>

              <td className="px-4 py-3 max-w-xs truncate">
                {req.concern}
              </td>

              <td className="px-4 py-3 max-w-xs truncate text-wrap">
                {req.description || "Not specified"}
              </td>

              <td className="px-4 py-3 max-w-xs truncate text-wrap">
                {req.consultation_date || "Not a consultation"}
              </td>

              <td className="px-4 py-3">
                {new Date(req.created_at).toLocaleDateString()}
              </td>

              {/* <td className="px-4 py-3">
                {req.release_date
                  ? new Date(req.release_date).toLocaleDateString()
                  : "Not yet"}
              </td>

              <td className="px-4 py-3">{getDuration(req)}</td> */}

              {/* ATTACHMENTS (UNCHANGED LOGIC) */}
              <td className="px-4 py-2">
                {req.attachment_url.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {req.attachment_url.map((file, idx) => {
                      if (!file) return null;

                      const ext = file
                        .split("?")[0]
                        .split(".")
                        .pop()
                        ?.toLowerCase();

                      const fileName = getCleanFileName(file);

                      return (
                        <div
                          key={idx}
                          onClick={() => setPreviewFile(file)}
                          className="w-20 h-20 flex flex-col items-center justify-center bg-gray-100 rounded-lg border cursor-pointer hover:scale-105 transition text-xs p-1"
                          title={fileName}
                        >
                          {!ext ? "📁" : "📎"}

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

              {/* RESOLVE */}
              <td className="px-4 py-3">
                <span>
                  {getDuration(req)}
                </span>
                <input
                  type="checkbox"
                  checked={req.status === "Released"}
                  disabled={req.status === "Released"}
                  onChange={() => toggleRelease(req)}
                  className="w-5 h-5"
                />
              </td>

              {/* REPLY */}
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

      {/* PREVIEW MODAL (UNCHANGED FUNCTIONALITY) */}
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

            <iframe
              src={previewFile}
              className="w-full h-[70vh]"
            />
          </div>
        </div>
      )}

    </div>
  );
}