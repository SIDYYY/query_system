"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Swal from "sweetalert2";

export default function SatisfactionSurvey({ onClose }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const submitSurvey = async () => {
    if (!rating) {
      Swal.fire({
        icon: "warning",
        title: "Please select a rating",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await 
      supabase.from("satisfaction_surveys")
      .insert([
        {
          rating: rating,
          note: note,
        },
      ]);
      if (error) throw error;

      Swal.fire({
        icon: "success",
        title: "Thank you!",
        text: "Your feedback has been recorded.",
      });

      onClose();
    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Unable to submit survey.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md space-y-4 text-gray-800">

        <h2 className="text-xl font-bold text-center">
          Satisfaction Survey
        </h2>

        <p className="text-center text-gray-600">
          How satisfied are you with the service?
        </p>

        {/* STAR RATING */}
        <div className="flex justify-center gap-2 text-3xl">
          {[1,2,3,4,5].map((star)=>(
            <button
              key={star}
              type="button"
              onClick={()=>setRating(star)}
              onMouseEnter={()=>setHovered(star)}
              onMouseLeave={()=>setHovered(0)}
              style={{
                color: star <= (hovered || rating)
                  ? "#FBBF24"
                  : "#D1D5DB",
              }}
            >
              ★
            </button>
          ))}
        </div>

        {/* NOTE */}
        <textarea
          placeholder="Leave a comment (optional)"
          value={note}
          onChange={(e)=>setNote(e.target.value)}
          rows={3}
          className="w-full border rounded-lg p-2"
        />

        <button
          onClick={submitSurvey}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          {loading ? "Submitting..." : "Submit Feedback"}
        </button>

      </div>

    </div>
  );
}