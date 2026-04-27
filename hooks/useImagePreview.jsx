import { useState } from "react";

export default function useImagePreview() {
  const [previewImages, setPreviewImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);

  function nextImage() {
    setCurrentIndex((prev) =>
      prev === previewImages.length - 1 ? 0 : prev + 1
    );
  }

  function prevImage() {
    setCurrentIndex((prev) =>
      prev === 0 ? previewImages.length - 1 : prev - 1
    );
  }

  function closePreview() {
    setCurrentIndex(null);
    setPreviewImages([]);
  }

  return {
    previewImages,
    setPreviewImages,
    currentIndex,
    nextImage,
    prevImage,
    closePreview,
  };
}