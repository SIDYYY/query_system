// PURE FUNCTIONS ONLY

export const getDuration = (req) => {
  if (!req.release_date) return "-";
  const start = new Date(req.created_at);
  const end = new Date(req.release_date);
  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return `${diffDays} day(s)`;
};

export const getCleanFileName = (url) => {
  const raw = url.split("/").pop() || "";
  const parts = raw.split("-");
  return parts.length > 1 ? parts.slice(1).join("-") : raw;
};

export const countPending = (requests) =>
  requests.filter((r) => r.status === "Pending").length;

export const countReleased = (requests) =>
  requests.filter((r) => r.status === "Released").length;

export const getPieData = (requests) => {
  const counts = requests.reduce((acc, req) => {
    const concern = req.concern || "Others";
    acc[concern] = (acc[concern] || 0) + 1;
    return acc;
  }, {});

  return {
    labels: Object.keys(counts),
    datasets: [
      {
        data: Object.values(counts),
        backgroundColor: [
          "#3B82F6",
          "#EF4444",
          "#F59E0B",
          "#10B981",
          "#8B5CF6",
          "#F43F5E",
        ],
      },
    ],
  };
};