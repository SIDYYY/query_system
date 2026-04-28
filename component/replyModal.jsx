"use client";

import Swal from "sweetalert2";

export default function ReplyModal({ email, message, setMessage, onClose, onSend,sending, files, setFiles }) {
  if (!email) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white w-100 rounded-xl p-5 shadow-lg text-gray-800 relative">

        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-500 text-xl"
        >
          ✕
        </button>

        <h2 className="text-lg font-bold mb-3">Send Reply</h2>

        <p className="text-sm mb-2">
          <span className="font-semibold">To:</span> {email}
        </p>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your reply..."
          className="w-full border rounded-md p-2 text-sm h-32"
        />
        <div className="mb-3">
          {/* Hidden input */}
          <input
            type="file"
            multiple
            accept="*/*"
            id="fileUpload"
            onChange={(e) => {
              const selectedFiles = [...e.target.files];

              // Limit count
              if (selectedFiles.length > 5) {
                Swal.fire({
                  icon: "warning",
                  title: "Too many files",
                  text: "Maximum of 5 files only allowed.",
                });
                return;
              }

              // Limit size (5MB each)
              const validFiles = selectedFiles.filter(file => {
                if (file.size > 5 * 1024 * 1024) {
                  Swal.fire({
                    icon: "error",
                    title: "File too large",
                    text: `${file.name} exceeds 5MB limit.`,
                  });
                  return false;
                }
                return true;
              });

              setFiles(validFiles);
            }}
            className="hidden"
          />

          {/* Custom button */}
          <label
            htmlFor="fileUpload"
            className="cursor-pointer inline-block bg-gray-100 hover:bg-gray-200 text-sm px-4 py-2 rounded-md border"
          >
            Choose Files
          </label>
        </div>

        {files.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3 h-40 overflow-auto">
              {files.map((file, index) => {
                const isImage = file.type.startsWith("image/");

                return (
                  <div
                    key={index}
                    className="border rounded-md p-2 text-xs text-center bg-gray-50"
                  >
                    {isImage ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="h-20 w-full object-cover rounded mb-1"
                      />
                    ) : (
                      <div className="h-20 flex items-center justify-center text-2xl">
                        📄
                      </div>
                    )}

                    <p className="truncate">{file.name}</p>
                    <button
                      onClick={() => {
                        Swal.fire({
                          title: "Remove file?",
                          text: file.name,
                          icon: "question",
                          showCancelButton: true,
                          confirmButtonText: "Yes, remove",
                        }).then((result) => {
                          if (result.isConfirmed) {
                            setFiles(files.filter((_, i) => i !== index));
                          }
                        });
                      }}
                      className="text-red-500 text-xs mt-1">
                      Remove
                    </button>
                  </div>
                );
              })}
              
            </div>
          )}
        
        <button
        onClick={() => {
          Swal.fire({
            title: "Send reply?",
            text: "This email will be sent to the user.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Send",
          }).then((result) => {
            if (result.isConfirmed) {
              onSend(files);
            }
          });
        }}
        disabled={sending}
        className="bg-blue-600 text-white px-4 py-2 rounded"
        >
        {sending ? " Sending..." : "Send Reply"}
        </button>
        
        
      </div>
    </div>
  );
}