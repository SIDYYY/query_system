"use client";

export default function ReplyModal({ email, message, setMessage, onClose, onSend,sending }) {
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

        <button
        onClick={onSend}
        disabled={sending}
        className="bg-blue-600 text-white px-4 py-2 rounded"
        >
        {sending ? " Sending..." : "Send Reply"}
        </button>

      </div>
    </div>
  );
}