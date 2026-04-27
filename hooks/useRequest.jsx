import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function useRequests() {
  const [requests, setRequests] = useState([]);

  async function fetchRequests() {
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    const normalized = data.map((req) => {
      let attachments = req.attachment_url;

      if (!attachments) attachments = [];
      if (typeof attachments === "string") {
        try {
          attachments = JSON.parse(attachments);
        } catch {
          attachments = [attachments];
        }
      }
      if (!Array.isArray(attachments)) attachments = [attachments];

      return {
        ...req,
        attachment_url: attachments.filter(Boolean),
      };
    });

    setRequests(normalized);
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  return { requests, setRequests, fetchRequests };
}