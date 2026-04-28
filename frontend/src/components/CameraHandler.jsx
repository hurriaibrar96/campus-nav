import { useEffect, useRef } from "react";

export default function CameraHandler({ onStream }) {
  const videoRef = useRef(null);

  useEffect(() => {
    let stream;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        onStream?.(videoRef);
      })
      .catch(() => console.error("Camera access denied"));
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={{ width: "100%", display: "block" }}
    />
  );
}
