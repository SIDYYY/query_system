"use client";

export default function FilterBar({
  search,
  setSearch,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  resetFilters,
  openSurveySummary,
  setPieModal,
  totalReleased,
  totalPending,
  statusFilter,
  setStatusFilter
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 justify-center items-center">
        <div className="flex gap-10 bg-white shadow rounded-xl px-6 py-4 items-center justify-center">
      <div className="text-center">
        <h3 className="text-sm text-gray-900">Total Released</h3>
        <h2 className="text-2xl font-semibold text-gray-800">{totalReleased}</h2>
      </div>
      <div className="text-center">
        <h3 className="text-sm text-gray-900">Total Pending</h3>
        <h2 className="text-2xl font-semibold text-gray-800">{totalPending}</h2>
      </div>
    </div>

      {/* LEFT: SEARCH + DATE FILTERS */}
      <div className="bg-white shadow rounded-xl px-6 py-4 text-gray-800 ">
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-center gap-6">

          <div className="flex flex-wrap items-end gap-4">

            {/* SEARCH */}
            <div className="flex flex-col">
              <label className="text-xs font-medium mb-1">Search</label>
              <input
                type="text"
                placeholder="ID/Name/Contact/Request ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm w-55 focus:ring-2 focus:ring-blue-400 "
              />
            </div>

            {/* START DATE */}
            <div className="flex flex-col">
              <label className="text-xs font-medium mb-1">Start</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              />
            </div>

            {/* END DATE */}
            <div className="flex flex-col">
              <label className="text-xs font-medium mb-1">End</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              />
            </div>

            {/* RESET */}
            <button
              onClick={resetFilters}
              className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-sm font-medium"
            >
              Reset
            </button>

          </div>
        </div>
      </div>

      {/* CENTER: STATUS FILTERS */}
        <div className="flex flex-col text-center bg-white shadow rounded-xl px-6 py-4 text-gray-800">
        <h4 className="mb-2 font-medium">Concern Status</h4>

        <div className="flex items-center gap-6">

            {/* ALL */}
            <label className="flex items-center gap-2 text-sm">
            <input
                type="radio"
                name="status"
                value=""
                checked={statusFilter === ""}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="accent-blue-500"
            />
            All
            </label>

            {/* RELEASED */}
            <label className="flex items-center gap-2 text-sm">
            <input
                type="radio"
                name="status"
                value="Released"
                checked={statusFilter === "Released"}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="accent-blue-500"
            />
            Released
            </label>

            {/* PENDING */}
            <label className="flex items-center gap-2 text-sm">
            <input
                type="radio"
                name="status"
                value="Pending"
                checked={statusFilter === "Pending"}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="accent-blue-500"
            />
            Pending
            </label>

        </div>
        </div>

      {/* RIGHT: ACTION BUTTONS */}
      <div className="flex items-center gap-3 bg-white shadow rounded-xl px-6 py-4 text-gray-800 mb-4">

        <div className="flex flex-col gap-2">

          <button
            onClick={openSurveySummary}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
          >
            Show Surveys
          </button>

          <button
            onClick={() => setPieModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
          >
            Show Concern Distribution
          </button>

        </div>

      </div>

    </div>
  );
}