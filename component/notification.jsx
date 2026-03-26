import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function Notification({ type = "success", message, duration = 3000, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className={`fixed bottom-5 right-5 px-6 py-4 rounded-xl shadow-lg text-white font-semibold flex items-center gap-3 ${colors[type]} z-50`}
      >
        <span className="text-2xl">{type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️"}</span>
        <span>{message}</span>
      </motion.div>
    </AnimatePresence>
  );
}