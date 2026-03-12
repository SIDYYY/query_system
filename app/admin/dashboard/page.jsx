"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [requests, setRequests] = useState([]);
  const [sortField, setSortField] = useState("created_at");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    const { data, error } = await supabase.from("requests").select("*");
    if (error) console.error(error);
    else setRequests(data || []);
  }

  async function updateStatus(id, newStatus) {
  const { error } = await supabase
    .from("requests")
    .update({ status: newStatus })
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Failed to update status");
  } else {
    fetchRequests(); 
  }
}

  const sortedRequests = [...requests].sort((a, b) => {
    const A = a[sortField];
    const B = b[sortField];
    if (A < B) return sortAsc ? -1 : 1;
    if (A > B) return sortAsc ? 1 : -1;
    return 0;
  });

  function changeSort(field) {
    if (field === sortField) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(true);
    }
  }

const statusColor = (status) => {
  if (status === "Approved") return "bg-green-100 text-green-700";
  if (status === "Processing") return "bg-yellow-100 text-yellow-700";
  if (status === "Rejected") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
};

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-10 font-sans">

      {/* HEADER */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Dean's Office Requests v1
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and review submitted student & faculty requests
          </p>
        </div>
        <div className="text-sm bg-white px-4 py-2 rounded-lg shadow font-medium text-gray-900">
          Total Requests: <span className="font-bold">{requests.length}</span>
        </div>
      </div>

      {/* TABLE WRAPPER */}
      <div className="overflow-x-auto rounded-xl shadow bg-white">
        <table className="w-full  text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 cursor-pointer" onClick={() => changeSort("id")}>
                ID
              </th>
              <th className="px-4 py-3 cursor-pointer" onClick={() => changeSort("user_type")}>
                Requestant
              </th>
              <th className="px-4 py-3">ID Number</th>
              <th className="px-4 py-3">Section</th>
                            <th className="px-4 py-3">Contact No.</th>
              <th className="px-4 py-3">Concern</th>
                            <th className="px-4 py-3">Desc.</th>
              <th className="px-4 py-3 cursor-pointer" onClick={() => changeSort("created_at")}>
                Date
              </th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {sortedRequests.map((req) => (
              <tr key={req.id} className="border-t hover:bg-gray-50 transition font-medium text-gray-900">
                <td className="px-4 py-3 ">{req.id}</td>
                <td className="px-4 py-3 capitalize">{req.user_type}</td>
                <td className="px-4 py-3 ">{req.student_or_faculty_id}</td>
                <td className="px-4 py-3 font-medium  ">{req.section}</td>
                <td className="px-4 py-3">{req.contact_no}</td>
                <td className="px-4 py-3 max-w-xs truncate">{req.concern}</td>
                <td className="px-4 py-3 max-w-xs truncate">{req.description}</td>
                <td className="px-4 py-3 text-gray-900">
                  {new Date(req.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={req.status || "Pending"}
                    onChange={(e) => updateStatus(req.id, e.target.value)}
                    className={`px-2 py-1 text-xs rounded-full font-medium ${statusColor(req.status)}`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE SCROLL TIP */}
      <p className="mt-2 text-sm text-gray-500 sm:hidden text-center">
        Swipe horizontally to see all columns
      </p>
    </div>
  );
}