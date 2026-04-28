import { useEffect, useRef, useState } from "react";
import CameraHandler from "./CameraHandler";
import { drawOverlay } from "../utils/navigationOverlay";

export default function ARView({ path, locations }) {
  const canvasRef = useRef(null);
  const videoRef  = useRef(null);
  const [step, setStep] = useState(0);

  const getNode = (id) => locations.find((l) => l.id === id);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || path.length === 0) return;

    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");

    const draw = () => {
      const video = videoRef.current;
      canvas.width  = video.videoWidth  || canvas.offsetWidth;
      canvas.height = video.videoHeight || canvas.offsetHeight;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const current = getNode(path[step]);
      const next    = path[step + 1] ? getNode(path[step + 1]) : null;

      if (current) {
        drawOverlay(
          ctx, canvas.width, canvas.height,
          current.label,
          next?.label ?? null,
          { x: current.x, y: current.y },
          next ? { x: next.x, y: next.y } : null
        );
      }
    };

    const id = setInterval(draw, 100);
    return () => clearInterval(id);
  }, [step, path, locations]);

  if (path.length === 0) return <p>No route to display.</p>;

  return (
    <div style={{ position: "relative" }}>
      <CameraHandler onStream={(ref) => { videoRef.current = ref.current; }} />
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
      />
      <div style={{ position: "absolute", bottom: 70, width: "100%", textAlign: "center" }}>
        {step < path.length - 1 && (
          <button onClick={() => setStep((s) => s + 1)}>Next Step →</button>
        )}
        {step > 0 && (
          <button onClick={() => setStep((s) => s - 1)}>← Back</button>
        )}
      </div>
    </div>
  );
}
