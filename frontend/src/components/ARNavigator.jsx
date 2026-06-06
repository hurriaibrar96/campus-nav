import { useState, useRef, useEffect } from "react";
import CameraHandler from "./CameraHandler";

const LABEL = { up: "⬆ Go Forward", down: "⬇ Go Back", left: "⬅ Turn Left", right: "➡ Turn Right" };

const dirMap = {
  "STRAIGHT": "up", "FRONT": "up", "BACK": "up", "BEHIND": "up",
  "LEFT": "left", "RIGHT": "right",
  "ACUTE RIGHT": "right", "OBTUSE RIGHT": "right", "FAR RIGHT": "right",
  "VERY RIGHT": "right", "RIGHT FRONT": "right", "RIGHT STRAIGHT": "right",
  "SLIGHT RIGHT": "right", "ACUTE LEFT": "left", "OBTUSE LEFT": "left",
  "FAR LEFT": "left", "VERY LEFT": "left", "LEFT STRAIGHT": "left",
  "LEFT FRONT": "left", "FAR RIGHT STRAIGHT": "right",
  "CROSS": "up", "CROSS LEFT": "left", "CROSS RIGHT": "right", "STRAIGHT BACK": "down",
};

const bearingMap = { up: 0, down: 180, left: -90, right: 90 };

// 1 distance unit in campus.json = how many real meters
const METERS_PER_UNIT = 10;
// accelerometer: minimum acceleration magnitude to count as a step
const STEP_THRESHOLD = 12;
// average step length in meters
const STEP_LENGTH = 0.75;

export default function ARNavigator({ path, locations, onExit }) {
  const [step, setStep]           = useState(0);
  const [arrived, setArrived]     = useState(false);
  const [deviceHeading, setDeviceHeading] = useState(null);
  const [orientationPermission, setOrientationPermission] = useState("prompt");
  const [distanceProgress, setDistanceProgress] = useState(0); // 0–1

  const canvasRef       = useRef(null);
  const headingRef      = useRef(null);
  const stepRef         = useRef(0);
  const arrivedRef      = useRef(false);
  const distWalkedRef   = useRef(0);  // meters walked on current edge
  const lastAccelRef    = useRef(0);  // for step peak detection
  const stepCooldownRef = useRef(false);

  useEffect(() => { stepRef.current   = step;   }, [step]);
  useEffect(() => { arrivedRef.current = arrived; }, [arrived]);

  const getNode    = (id) => locations.find((l) => l.id === id);
  const startLabel = getNode(path[0])?.label ?? path[0];
  const endLabel   = getNode(path[path.length - 1])?.label ?? path[path.length - 1];

  const currentNode = getNode(path[step]);
  const nextNode    = getNode(path[step + 1]);
  const jsonDir     = currentNode?.neighbors?.[path[step + 1]]?.direction ?? "";
  const mappedDir   = dirMap[jsonDir] ?? "up";
  const edgeDist    = (currentNode?.neighbors?.[path[step + 1]]?.distance ?? 1) * METERS_PER_UNIT;

  const instruction = step === path.length - 1
    ? `📍 You have arrived at ${endLabel}`
    : `${LABEL[mappedDir]} → ${nextNode?.label ?? path[step + 1]}`;

  const routeProgress = ((step + 1) / path.length) * 100;

  // ── step counter via accelerometer ─────────────────────────────────────────
  useEffect(() => {
    const handleMotion = (e) => {
      if (arrivedRef.current) return;
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.sqrt(a.x ** 2 + a.y ** 2 + a.z ** 2);

      // detect peak (step) — magnitude crosses threshold going up then down
      if (mag > STEP_THRESHOLD && lastAccelRef.current <= STEP_THRESHOLD && !stepCooldownRef.current) {
        stepCooldownRef.current = true;
        setTimeout(() => { stepCooldownRef.current = false; }, 350); // debounce

        distWalkedRef.current += STEP_LENGTH;

        const currentEdgeDist = (() => {
          const node = locations.find((l) => l.id === path[stepRef.current]);
          return (node?.neighbors?.[path[stepRef.current + 1]]?.distance ?? 1) * METERS_PER_UNIT;
        })();

        const p = Math.min(distWalkedRef.current / currentEdgeDist, 1);
        setDistanceProgress(p);

        if (distWalkedRef.current >= currentEdgeDist) {
          distWalkedRef.current = 0;
          setDistanceProgress(0);
          const next = stepRef.current + 1;
          if (next >= path.length - 1) {
            setArrived(true);
          } else {
            setStep(next);
          }
        }
      }
      lastAccelRef.current = mag;
    };

    window.addEventListener("devicemotion", handleMotion, true);
    return () => window.removeEventListener("devicemotion", handleMotion, true);
  }, []);

  // ── orientation / compass ───────────────────────────────────────────────────
  const startOrientationTracking = () => {
    const handle = (e) => {
      if (e.alpha !== null) {
        const h = e.webkitCompassHeading ?? e.alpha;
        headingRef.current = h;
        setDeviceHeading(h);
      }
    };
    window.addEventListener("deviceorientationabsolute", handle, true);
    window.addEventListener("deviceorientation", handle, true);
  };

  const requestOrientationPermission = async () => {
    if (typeof DeviceOrientationEvent?.requestPermission === "function") {
      try {
        const res = await DeviceOrientationEvent.requestPermission();
        setOrientationPermission(res);
        if (res === "granted") startOrientationTracking();
      } catch { setOrientationPermission("denied"); }
    } else {
      setOrientationPermission("granted");
      startOrientationTracking();
    }
  };

  useEffect(() => {
    if (typeof DeviceOrientationEvent?.requestPermission !== "function") {
      setOrientationPermission("granted");
      startOrientationTracking();
    }
    return () => {
      window.removeEventListener("deviceorientationabsolute", startOrientationTracking, true);
      window.removeEventListener("deviceorientation", startOrientationTracking, true);
    };
  }, []);

  // ── canvas: compass-driven arrow ────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || arrived) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext("2d");
    const W   = canvas.width;
    const H   = canvas.height;
    const cx  = W / 2;
    const cy  = H * 0.42;
    let rafId;

    function getArrowAngle() {
      const heading = headingRef.current;
      if (heading === null) return 0;
      const dir    = dirMap[
        locations.find((l) => l.id === path[stepRef.current])
          ?.neighbors?.[path[stepRef.current + 1]]?.direction ?? ""
      ] ?? "up";
      const target = bearingMap[dir] ?? 0;
      let diff     = target - heading;
      diff         = ((diff + 540) % 360) - 180;
      return (diff * Math.PI) / 180;
    }

    function drawArrow(angleRad) {
      const size  = 72;
      const aligned = Math.abs((angleRad * 180) / Math.PI) < 20;
      const color = aligned ? "#00ff88" : "#00E5FF";

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angleRad);
      ctx.shadowColor = color;
      ctx.shadowBlur  = 28;
      ctx.fillStyle   = color;

      // stem
      ctx.beginPath();
      ctx.roundRect(-9, 8, 18, size * 0.65, 4);
      ctx.fill();

      // arrowhead
      ctx.beginPath();
      ctx.moveTo(0,           -size * 0.52);
      ctx.lineTo( size * 0.52, size * 0.12);
      ctx.lineTo(-size * 0.52, size * 0.12);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);
      if (arrivedRef.current) { cancelAnimationFrame(rafId); return; }
      drawArrow(getArrowAngle());
      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [step, arrived]);

  if (path.length === 0) return <p style={{ color: "var(--cream)" }}>No route to display.</p>;

  return (
    <div style={{ position: "relative", width: "100%", minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column" }}>

      {/* Camera + AR canvas */}
      <div style={{ position: "relative", width: "100%", height: "78vh", flexShrink: 0 }}>
        <CameraHandler onStream={(ref) => {}} />
        <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }} />

        {/* Walking distance arc — shown on camera overlay */}
        <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          <circle
            cx="50%" cy="42%"
            r="52"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="5"
          />
          <circle
            cx="50%" cy="42%"
            r="52"
            fill="none"
            stroke="#00ff88"
            strokeWidth="5"
            strokeDasharray={`${2 * Math.PI * 52}`}
            strokeDashoffset={`${2 * Math.PI * 52 * (1 - distanceProgress)}`}
            strokeLinecap="round"
            transform={`rotate(-90, ${canvasRef.current?.width / 2 ?? 0}, ${(canvasRef.current?.height ?? 0) * 0.42})`}
            style={{ transition: "stroke-dashoffset 0.3s ease" }}
          />
        </svg>
      </div>

      {/* iOS permission prompt */}
      {orientationPermission === "prompt" && (
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          background: "rgba(15,8,40,0.95)", backdropFilter: "blur(20px)",
          borderRadius: 20, padding: 24, textAlign: "center",
          border: "1px solid rgba(124,92,191,0.4)", zIndex: 100, maxWidth: 320,
        }}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>🧭</div>
          <h3 style={{ color: "#fdf6ec", fontSize: "1.1rem", fontWeight: 700, marginBottom: 8 }}>Enable Compass</h3>
          <p style={{ color: "rgba(253,246,236,0.7)", fontSize: "0.85rem", marginBottom: 20 }}>Allow access to device orientation for AR navigation</p>
          <button onClick={requestOrientationPermission} style={{
            width: "100%", padding: 12,
            background: "linear-gradient(135deg, #7B2D8B, #5a1068)",
            border: "none", borderRadius: 12,
            color: "white", fontSize: "0.95rem", fontWeight: "bold", cursor: "pointer",
          }}>Allow Compass Access</button>
        </div>
      )}

      {/* Top bar */}
      <div style={{
        position: "absolute", top: 16, left: 16, right: 16,
        background: "rgba(15,8,40,0.75)", backdropFilter: "blur(16px)",
        borderRadius: 16, padding: "12px 16px",
        border: "1px solid rgba(124,92,191,0.3)",
        color: "white", fontFamily: "Inter, sans-serif",
        zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center",
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
          cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, fontFamily: "Inter, sans-serif",
        }}>✕ Exit</button>
      </div>

      {/* Bottom panel */}
      <div style={{
        width: "100%", height: "22vh",
        background: "rgba(10,10,10,0.97)",
        borderTop: "1px solid rgba(124,92,191,0.3)",
        padding: "10px 16px", color: "white",
        fontFamily: "Inter, sans-serif", zIndex: 10,
        boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center",
      }}>
        {!arrived ? (
          <>
            {/* Overall route progress */}
            <div style={{ height: 3, background: "#444", borderRadius: 2, marginBottom: 10, overflow: "hidden" }}>
              <div style={{ width: `${routeProgress}%`, height: "100%", background: "linear-gradient(90deg,#7B2D8B,#5a1068)", transition: "width 0.3s" }} />
            </div>

            <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 4 }}>{instruction}</div>
            <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 8 }}>Step {step + 1} of {path.length}</div>

            {/* Walking progress for current edge */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 6, background: "#333", borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  width: `${distanceProgress * 100}%`, height: "100%",
                  background: "linear-gradient(90deg,#00E5FF,#00ff88)",
                  transition: "width 0.3s", borderRadius: 3,
                }} />
              </div>
              <div style={{ fontSize: 11, color: "#00E5FF", whiteSpace: "nowrap" }}>
                {Math.round(distWalkedRef.current)}m / {edgeDist}m
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>🎉</div>
            <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 4 }}>You have arrived!</div>
            <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 10 }}>{endLabel} reached successfully</div>
            <button onClick={onExit} style={{
              padding: "8px 24px",
              background: "linear-gradient(135deg,#7B2D8B,#5a1068)",
              border: "none", borderRadius: 10,
              color: "white", fontSize: 13, fontWeight: "bold", cursor: "pointer",
            }}>Done</button>
          </div>
        )}
      </div>

      {/* Full route list */}
      <div style={{
        width: "100%", background: "#0a0a0a",
        padding: 16, boxSizing: "border-box",
        fontFamily: "Inter, sans-serif",
        borderTop: "1px solid rgba(124,92,191,0.3)",
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#9b7fd4", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Full Route</div>
        {path.map((nodeId, i) => {
          const isFirst   = i === 0;
          const isLast    = i === path.length - 1;
          const isCurrent = i === step;
          const label     = getNode(nodeId)?.label ?? nodeId;
          return (
            <div key={nodeId} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 12px", marginBottom: 6, borderRadius: 10,
              background: isCurrent ? "rgba(124,92,191,0.2)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${isCurrent ? "rgba(124,92,191,0.6)" : "transparent"}`,
              transition: "background 0.3s",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: isFirst ? "#7B2D8B" : isLast ? "#16A34A" : isCurrent ? "#7B2D8B" : "rgba(124,92,191,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: "white",
              }}>{isFirst ? "S" : isLast ? "E" : i}</div>
              <div style={{ fontSize: 14, fontWeight: isFirst || isLast || isCurrent ? 700 : 400, color: isCurrent ? "#fdf6ec" : "rgba(255,255,255,0.6)" }}>
                {label}
                {isFirst   && <span style={{ marginLeft: 6, fontSize: 10, background: "rgba(123,45,139,0.4)", padding: "1px 6px", borderRadius: 4 }}>START</span>}
                {isLast    && <span style={{ marginLeft: 6, fontSize: 10, background: "rgba(22,163,74,0.4)",  padding: "1px 6px", borderRadius: 4 }}>END</span>}
                {isCurrent && !isFirst && !isLast && <span style={{ marginLeft: 6, fontSize: 10, background: "rgba(0,229,255,0.2)", padding: "1px 6px", borderRadius: 4 }}>YOU ARE HERE</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
