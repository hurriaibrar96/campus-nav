import { useState, useRef, useEffect } from "react";
import CameraHandler from "./CameraHandler";

const LABEL = { up: "⬆ Go Forward", down: "⬇ Go Back", left: "⬅ Turn Left", right: "➡ Turn Right" };

const dirMap = {
  "STRAIGHT": "up", "FRONT": "up", "BACK": "down", "BEHIND": "down",
  "LEFT": "left", "RIGHT": "right",
  "ACUTE RIGHT": "right", "OBTUSE RIGHT": "right", "FAR RIGHT": "right",
  "VERY RIGHT": "right", "RIGHT FRONT": "right", "RIGHT STRAIGHT": "right",
  "SLIGHT RIGHT": "right", "ACUTE LEFT": "left", "OBTUSE LEFT": "left",
  "FAR LEFT": "left", "VERY LEFT": "left", "LEFT STRAIGHT": "left",
  "LEFT FRONT": "left", "FAR RIGHT STRAIGHT": "right",
  "CROSS": "up", "CROSS LEFT": "left", "CROSS RIGHT": "right", "STRAIGHT BACK": "down",
};

export default function ARNavigator({ path, locations, onExit }) {
  const [step, setStep]       = useState(0);
  const [arrived, setArrived] = useState(false);
  const [deviceHeading, setDeviceHeading] = useState(null);
  const [orientationPermission, setOrientationPermission] = useState('prompt');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const getNode = (id) => locations.find((l) => l.id === id);

  const startLabel = getNode(path[0])?.label ?? path[0];
  const endLabel   = getNode(path[path.length - 1])?.label ?? path[path.length - 1];

  const allSteps = path.slice(0, -1).map((id, i) => {
    const toId      = path[i + 1];
    const from      = getNode(id);
    const to        = getNode(toId);
    const jsonDir   = from?.neighbors?.[toId]?.direction ?? "";
    const mappedDir = dirMap[jsonDir] ?? null;
    const dir       = mappedDir ?? "up";
    const isFinal   = i === path.length - 2;
    return { fromId: id, toId, direction: dir, isFinal };
  });

  const collapsed = allSteps.reduce((acc, s) => {
    const prev = acc[acc.length - 1];
    if (prev && prev.direction === s.direction) {
      acc[acc.length - 1].toId    = s.toId;
      acc[acc.length - 1].isFinal = s.isFinal;
    } else {
      acc.push({ ...s });
    }
    return acc;
  }, []);

  const steps = collapsed.map((s) => ({
    ...s,
    instruction: s.isFinal
      ? `${LABEL[s.direction]} → ${endLabel}`
      : LABEL[s.direction],
  }));

  const current  = path[step];
  const currentNode = getNode(path[step]);
  const nextNode    = getNode(path[step + 1]);
  const jsonDir     = currentNode?.neighbors?.[path[step + 1]]?.direction ?? "";
  const mappedDir   = dirMap[jsonDir] ?? "up";
  const instruction = step === path.length - 1
    ? `📍 You have arrived at ${endLabel}`
    : `${LABEL[mappedDir]} → ${nextNode?.label ?? path[step + 1]}`;

  const progress = ((step + 1) / path.length) * 100;

  const handleNext = () => {
    if (step < path.length - 1) setStep((s) => s + 1);
    else setArrived(true);
  };

  const handlePrev = () => {
    setArrived(false);
    setStep((s) => Math.max(0, s - 1));
  };

  const requestOrientationPermission = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        setOrientationPermission(response);
        if (response === 'granted') startOrientationTracking();
      } catch (error) {
        setOrientationPermission('denied');
      }
    } else {
      setOrientationPermission('granted');
      startOrientationTracking();
    }
  };

  const startOrientationTracking = () => {
    const handleOrientation = (event) => {
      if (event.alpha !== null) {
        let heading = event.webkitCompassHeading ?? event.alpha;
        setDeviceHeading(heading);
      }
    };
    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    window.addEventListener('deviceorientation', handleOrientation, true);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !current || arrived) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx   = canvas.getContext("2d");
    const W     = canvas.width;
    const H     = canvas.height;
    const dir   = mappedDir;
    const TOTAL = 8;
    let offset  = 0;
    let rafId;

    function drawChevron(x, y, size, alpha, angleRad) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.translate(x, y);
      ctx.rotate(angleRad);
      ctx.beginPath();
      ctx.moveTo(0,            -size * 0.55);
      ctx.lineTo( size * 0.9,   size * 0.35);
      ctx.lineTo( size * 0.45,  size * 0.05);
      ctx.lineTo(0,             size * 0.45);
      ctx.lineTo(-size * 0.45,  size * 0.05);
      ctx.lineTo(-size * 0.9,   size * 0.35);
      ctx.closePath();
      ctx.fillStyle   = "#00E5FF";
      ctx.shadowColor = "#00E5FF";
      ctx.shadowBlur  = 16;
      ctx.fill();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha * 0.4));
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(0,            -size * 0.3);
      ctx.lineTo( size * 0.45,  size * 0.15);
      ctx.lineTo(0,             size * 0.25);
      ctx.lineTo(-size * 0.45,  size * 0.15);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function getProps(t) {
      const perspective = 1 - t * 0.72;
      const size  = 46 * perspective;
      const alpha = t < 0.1 ? t / 0.1 : t > 0.78 ? (1 - t) / 0.22 : 1;
      let x, y, angle;

      if (dir === "up") {
        x = W / 2; y = H * 0.88 - t * H * 0.68; angle = 0;
      } else if (dir === "right") {
        if (t < 0.35) { x = W / 2; y = H * 0.88 - t * H * 0.55; angle = 0; }
        else {
          const p = (t - 0.35) / 0.65, curve = p * p;
          x = W / 2 + curve * W * 0.42; y = H * 0.88 - t * H * 0.55;
          angle = curve * (Math.PI / 2) * 0.85;
        }
      } else if (dir === "left") {
        if (t < 0.35) { x = W / 2; y = H * 0.88 - t * H * 0.55; angle = 0; }
        else {
          const p = (t - 0.35) / 0.65, curve = p * p;
          x = W / 2 - curve * W * 0.42; y = H * 0.88 - t * H * 0.55;
          angle = -curve * (Math.PI / 2) * 0.85;
        }
      } else {
        x = W / 2; y = H * 0.12 + t * H * 0.68; angle = Math.PI;
      }
      return { x, y, size, alpha, angle };
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < TOTAL; i++) {
        const t = ((i / TOTAL) + offset) % 1;
        const { x, y, size, alpha, angle } = getProps(t);
        drawChevron(x, y, size, alpha, angle);
      }
      offset = (offset + 0.007) % 1;
      rafId  = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [current, arrived]);

  useEffect(() => {
    if (typeof DeviceOrientationEvent === 'undefined' || typeof DeviceOrientationEvent.requestPermission !== 'function') {
      setOrientationPermission('granted');
      startOrientationTracking();
    } else {
      setOrientationPermission('prompt');
    }
    return () => {
      window.removeEventListener('deviceorientationabsolute', startOrientationTracking, true);
      window.removeEventListener('deviceorientation', startOrientationTracking, true);
    };
  }, []);

  if (path.length === 0) return <p style={{ color: "var(--cream)" }}>No route to display.</p>;

  return (
    <div style={{ position: "relative", width: "100%", minHeight: "100vh", overflowY: "auto", background: "#000", display: "flex", flexDirection: "column" }}>

      {/* Camera - 78% height */}
      <div style={{ position: "relative", width: "100%", height: "78vh", flexShrink: 0 }}>
        <CameraHandler onStream={(ref) => { videoRef.current = ref?.current; }} />
        <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
      </div>

      {/* iOS permission prompt */}
      {orientationPermission === 'prompt' && (
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          background: "rgba(15,8,40,0.95)", backdropFilter: "blur(20px)",
          borderRadius: 20, padding: "24px", textAlign: "center",
          border: "1px solid rgba(124,92,191,0.4)", zIndex: 100, maxWidth: 320
        }}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>🧭</div>
          <h3 style={{ color: "#fdf6ec", fontSize: "1.1rem", fontWeight: 700, marginBottom: 8 }}>Enable Compass</h3>
          <p style={{ color: "rgba(253,246,236,0.7)", fontSize: "0.85rem", marginBottom: 20 }}>Allow access to device orientation for accurate AR navigation</p>
          <button onClick={requestOrientationPermission} style={{
            width: "100%", padding: "12px",
            background: "linear-gradient(135deg, #7B2D8B, #5a1068)",
            border: "none", borderRadius: 12,
            color: "white", fontSize: "0.95rem", fontWeight: "bold", cursor: "pointer",
          }}>Allow Compass Access</button>
        </div>
      )}

      {/* Top bar — shows FROM → TO */}
      <div style={{
        position: "absolute", top: 16, left: 16, right: 16,
        background: "rgba(15,8,40,0.75)", backdropFilter: "blur(16px)",
        borderRadius: 16, padding: "12px 16px",
        border: "1px solid rgba(124,92,191,0.3)",
        color: "white", fontFamily: "Inter, sans-serif",
        zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(124,92,191,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid rgba(124,92,191,0.5)",
          }}>
            <div style={{ fontSize: "1.2rem", transform: `rotate(${deviceHeading ?? 0}deg)`, transition: "transform 0.3s ease" }}>🧭</div>
          </div>
          <div>
            {/* FROM → TO shown at top */}
            <div style={{ fontSize: "0.65rem", color: "#9b7fd4", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 2 }}>Route</div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fdf6ec" }}>🚩 {startLabel} → 📍 {endLabel}</div>
            <div style={{ fontSize: "0.65rem", color: deviceHeading === null ? "#ff6b6b" : "#6ee7b7", marginTop: 4 }}>
              Compass: {deviceHeading === null ? "Not Active" : `${Math.round(deviceHeading)}°`}
            </div>
          </div>
        </div>
        <button onClick={onExit} style={{
          background: "rgba(224,85,85,0.2)", border: "1px solid rgba(224,85,85,0.4)",
          color: "#ff8a8a", borderRadius: 20, padding: "6px 14px",
          cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, fontFamily: "Inter, sans-serif"
        }}>✕ Exit</button>
      </div>

      {/* Bottom navigation card */}
      <div style={{
        width: "100%", height: "22vh",
        background: "rgba(10,10,10,0.97)",
        borderTop: "1px solid rgba(124,92,191,0.3)",
        padding: "10px 16px",
        color: "white", fontFamily: "Inter, sans-serif",
        zIndex: 10, overflowY: "auto", boxSizing: "border-box",
      }}>
        {!arrived ? (
          <>
            {/* Progress bar */}
            <div style={{ height: 3, background: "#444", borderRadius: 2, marginBottom: 8, overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #7B2D8B, #5a1068)", transition: "width 0.3s" }} />
            </div>

            <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 6 }}>
              {instruction}
            </div>

            <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 8 }}>
              Step {step + 1} of {path.length}
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handlePrev} disabled={step === 0} style={{
                flex: 1, padding: "7px",
                background: step === 0 ? "#444" : "#555",
                border: "none", borderRadius: 10,
                color: "white", fontSize: 13,
                cursor: step === 0 ? "not-allowed" : "pointer",
              }}>◀ Back</button>

              <button onClick={handleNext} style={{
                flex: 2, padding: "7px",
                background: "linear-gradient(135deg, #7B2D8B, #5a1068)",
                border: "none", borderRadius: 10,
                color: "white", fontSize: 13, fontWeight: "bold", cursor: "pointer",
              }}>
                {step === path.length - 1 ? "✅ Arrive" : "Next ▶"}
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>🎉</div>
            <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 4 }}>You have arrived!</div>
            <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 10 }}>{endLabel} reached successfully</div>
            <button onClick={onExit} style={{
              padding: "8px 24px",
              background: "linear-gradient(135deg, #7B2D8B, #5a1068)",
              border: "none", borderRadius: 10,
              color: "white", fontSize: 13, fontWeight: "bold", cursor: "pointer",
            }}>Done</button>
          </div>
        )}
      </div>

      {/* Full route list — visible when scrolling down */}
      <div style={{
        width: "100%", background: "linear-gradient(135deg, #5a1068, #7B2D8B)",
        padding: "16px", boxSizing: "border-box",
        fontFamily: "Inter, sans-serif", color: "white",
        borderTop: "1px solid rgba(124,92,191,0.3)",
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#fdf6ec", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Full Route</div>
        {path.map((nodeId, i) => {
          const isFirst = i === 0;
          const isLast  = i === path.length - 1;
          const label   = getNode(nodeId)?.label ?? nodeId;
          return (
            <div key={nodeId} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 12px", marginBottom: 6,
              borderRadius: 10,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid transparent",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: isFirst ? "#7B2D8B" : isLast ? "#16A34A" : "rgba(124,92,191,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: "white",
              }}>{isFirst ? "S" : isLast ? "E" : i}</div>
              <div style={{ fontSize: 14, fontWeight: isFirst || isLast ? 700 : 400 }}>
                {label}
                {isFirst && <span style={{ marginLeft: 6, fontSize: 10, background: "rgba(123,45,139,0.4)", padding: "1px 6px", borderRadius: 4 }}>START</span>}
                {isLast  && <span style={{ marginLeft: 6, fontSize: 10, background: "rgba(22,163,74,0.4)",  padding: "1px 6px", borderRadius: 4 }}>END</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
