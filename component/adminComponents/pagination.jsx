export default function Pagination({ currentPage, totalPages, setCurrentPage }) {
  return (

    <div className="flex justify-center gap-2 mt-8">
      <button
        className="text-gray-900 bg-gray-200 px-3 py-1 rounded"
        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
        disabled={currentPage === 1}
      >
        Prev
      </button>

      <span className="text-gray-800">Page {currentPage} of {totalPages}</span>

      <button
        className="text-gray-900 bg-gray-200 px-3 py-1 rounded"
        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  );
}