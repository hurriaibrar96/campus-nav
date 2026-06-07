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

// Real distances in meters between node pairs (bidirectional)
const EDGE_DISTANCES = {
  "entrance|carbs_dept":              0.5,
  "carbs_dept|g4":                    0.5,
  "g4|boys_washroom":                 1.0,
  "g4|stairs_1":                      0.5,
  "stairs_1|computer_lab":            0.5,
  "computer_lab|library_gate1":       0.2,
  "library_gate1|g2":                 1.8,
  "library_gate1|stairs_2":           2.0,
  "library_gate1|g3":                 2.0,
  "library_gate1|g4":                 2.1,
  "stairs_2|meelan_exit":             1.0,
  "stairs_2|aerolab":                 0.5,
  "aerolab|girls_washroom":           2.5,
  "girls_washroom|aircraft_showroom": 0.5,
  "girls_washroom|aerolab2":          1.5,
  "aerolab2|ahs_faculty":             0.5,
};

function getEdgeDistance(fromId, toId) {
  return EDGE_DISTANCES[`${fromId}|${toId}`]
    ?? EDGE_DISTANCES[`${toId}|${fromId}`]
    ?? 1.0;
}

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

  const [wrongDir, setWrongDir] = useState(false);

  const canvasRef        = useRef(null);
  const headingRef       = useRef(null);
  const headingBuffer    = useRef([]);
  const stepRef          = useRef(0);
  const arrivedRef       = useRef(false);
  const distWalkedRef    = useRef(0);
  const lastAccelRef     = useRef(0);
  const stepCooldownRef  = useRef(false);
  const stepBaseHeading  = useRef(null); // compass heading when this step started
  const turnConfirmed    = useRef(true); // true when user is facing the right way

  useEffect(() => { stepRef.current = step; }, [step]);
  useEffect(() => { arrivedRef.current = arrived; }, [arrived]);

  // when step changes, reset distance and turn state
  useEffect(() => {
    const dir = dirMap[
      locations.find((l) => l.id === path[step])?.neighbors?.[path[step + 1]]?.direction ?? ""
    ] ?? "up";
    distWalkedRef.current = 0;
    setWrongDir(false);
    if (dir === "up" || dir === "down") {
      turnConfirmed.current = true;
      stepBaseHeading.current = null;
    } else {
      turnConfirmed.current = false;
      // delay snapshot by 300ms to ensure compass has a fresh reading
      setTimeout(() => {
        stepBaseHeading.current = headingRef.current;
      }, 300);
    }
  }, [step]);

  const getNode    = (id) => locations.find((l) => l.id === id);
  const startLabel = getNode(path[0])?.label ?? path[0];
  const endLabel   = getNode(path[path.length - 1])?.label ?? path[path.length - 1];

  const currentNode = getNode(path[step]);
  const nextNode    = getNode(path[step + 1]);
  const jsonDir     = currentNode?.neighbors?.[path[step + 1]]?.direction ?? "";
  const mappedDir   = dirMap[jsonDir] ?? "up";
  const edgeDist    = getEdgeDistance(path[step], path[step + 1]);

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

      if (mag > STEP_THRESHOLD && lastAccelRef.current <= STEP_THRESHOLD && !stepCooldownRef.current) {
        stepCooldownRef.current = true;
        setTimeout(() => { stepCooldownRef.current = false; }, 350);

        // only count steps if user has turned in the right direction
        if (!turnConfirmed.current) {
          setWrongDir(true);
          lastAccelRef.current = mag;
          return;
        }
        setWrongDir(false);

        distWalkedRef.current += STEP_LENGTH;
        const currentEdgeDist = getEdgeDistance(path[stepRef.current], path[stepRef.current + 1]);
        const p = Math.min(distWalkedRef.current / currentEdgeDist, 1);
        setDistanceProgress(p);

        if (distWalkedRef.current >= currentEdgeDist) {
          distWalkedRef.current = 0;
          setDistanceProgress(0);
          const next = stepRef.current + 1;
          if (next >= path.length - 1) setArrived(true);
          else setStep(next);
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
        const raw = e.webkitCompassHeading ?? e.alpha;
        const buf = headingBuffer.current;
        buf.push(raw);
        if (buf.length > 5) buf.shift();
        const sin = buf.reduce((s, h) => s + Math.sin(h * Math.PI / 180), 0);
        const cos = buf.reduce((s, h) => s + Math.cos(h * Math.PI / 180), 0);
        const avg = (Math.atan2(sin, cos) * 180 / Math.PI + 360) % 360;
        headingRef.current = avg;
        setDeviceHeading(avg);

        // check if user has turned enough — only when base is locked and not yet confirmed
        if (!turnConfirmed.current && stepBaseHeading.current !== null) {
          const base = stepBaseHeading.current;
          let diff = avg - base;
          diff = ((diff + 540) % 360) - 180; // -180..180, positive=right, negative=left
          const absDiff = Math.abs(diff);
          // if turned at least 30° in any direction, confirm the turn
          if (absDiff >= 30) { turnConfirmed.current = true; setWrongDir(false); }
        }
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

  // pitch from gyroscope (beta: -180..180, 90 = phone flat, 0 = phone upright)
  const pitchRef = useRef(90);

  // ── canvas: gyroscope + compass driven 3D floor AR arrow ───────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || arrived) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext("2d");
    const W   = canvas.width;
    const H   = canvas.height;
    let rafId;

    // capture pitch (beta) from orientation event already running
    const handlePitch = (e) => {
      if (e.beta !== null) pitchRef.current = e.beta;
    };
    window.addEventListener("deviceorientation", handlePitch, true);

    function getCurrentDir() {
      return dirMap[
        locations.find((l) => l.id === path[stepRef.current])
          ?.neighbors?.[path[stepRef.current + 1]]?.direction ?? ""
      ] ?? "up";
    }

    // curve factor driven directly by turn direction from map
    function getCurveFactor() {
      const dir = getCurrentDir();
      if (dir === "left")  return -1;
      if (dir === "right") return  1;
      if (dir === "down")  return  0;
      return 0; // straight / up
    }

    function draw(animOffset) {
      ctx.clearRect(0, 0, W, H);
      if (arrivedRef.current) return;

      const dir         = getCurrentDir();
      const curveFactor = getCurveFactor(); // -1=hard left, 0=straight, +1=hard right

      // pitch: 90°=phone flat/floor, 0°=upright. clamp 10..90
      const pitch     = Math.max(10, Math.min(90, pitchRef.current));
      // vanishing point rises as phone tilts up (more upright = horizon higher)
      const vpY       = H * (1 - (pitch / 90) * 0.72);  // range: H*0.28 .. H*1.0
      const baseY     = H * 0.99;
      const SEGMENTS  = 16;
      const aligned   = Math.abs(curveFactor) < 0.22;
      const color     = aligned ? "#00ff88" : "#00E5FF";
      const fillColor = aligned ? "rgba(0,255,136,0.12)" : "rgba(0,229,255,0.09)";

      // each point along the path — perspective + compass curve
      function getPoint(t) {
        // y: baseY → vpY as t goes 0→1
        const y  = baseY - (baseY - vpY) * t;
        // width of lane shrinks with perspective
        const hw = (W * 0.18) * (1 - t * 0.88);
        // curve: starts at centre, bends left/right in upper portion
        const bend = t > 0.3
          ? curveFactor * ((t - 0.3) / 0.7) ** 1.6 * W * 0.45
          : 0;
        return { x: W / 2 + bend, y, hw };
      }

      ctx.save();

      // ── filled lane ──
      ctx.beginPath();
      for (let i = 0; i <= SEGMENTS; i++) {
        const { x, y, hw } = getPoint(i / SEGMENTS);
        if (i === 0) ctx.moveTo(x - hw, y); else ctx.lineTo(x - hw, y);
      }
      for (let i = SEGMENTS; i >= 0; i--) {
        const { x, y, hw } = getPoint(i / SEGMENTS);
        ctx.lineTo(x + hw, y);
      }
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();

      // ── left & right glowing edge lines ──
      ["left", "right"].forEach((side) => {
        ctx.beginPath();
        for (let i = 0; i <= SEGMENTS; i++) {
          const { x, y, hw } = getPoint(i / SEGMENTS);
          const ex = side === "left" ? x - hw : x + hw;
          const alpha = 1 - i / SEGMENTS * 0.6;
          if (i === 0) { ctx.moveTo(ex, y); }
          else ctx.lineTo(ex, y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth   = 2.5;
        ctx.shadowColor = color;
        ctx.shadowBlur  = 10;
        ctx.globalAlpha = 0.7;
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur  = 0;

      // ── animated dashed centre line (flows forward) ──
      for (let i = 0; i < SEGMENTS; i++) {
        const t0 = ((i / SEGMENTS) + animOffset) % 1;
        const t1 = (((i + 0.45) / SEGMENTS) + animOffset) % 1;
        const p0 = getPoint(t0);
        const p1 = getPoint(Math.min(t1, 0.99));
        const alpha = t0 < 0.88 ? 0.9 : (1 - t0) / 0.12;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = color;
        ctx.lineWidth   = Math.max(1, 3.5 * (1 - t0 * 0.8));
        ctx.shadowColor = color;
        ctx.shadowBlur  = 8;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur  = 0;

      // ── arrowhead near vanishing point ──
      const tip  = getPoint(0.68);
      const base = getPoint(0.78);
      const aw   = tip.hw * 2.2;
      const ah   = Math.abs(base.y - tip.y) * 0.9;
      ctx.fillStyle   = color;
      ctx.shadowColor = color;
      ctx.shadowBlur  = 20;
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.moveTo(tip.x,        tip.y);
      ctx.lineTo(tip.x + aw,   tip.y + ah);
      ctx.lineTo(tip.x,        tip.y + ah * 0.45);
      ctx.lineTo(tip.x - aw,   tip.y + ah);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur  = 0;

      ctx.restore();
    }

    let animOffset = 0;
    function frame() {
      if (arrivedRef.current) { cancelAnimationFrame(rafId); return; }
      animOffset = (animOffset + 0.007) % 1;
      draw(animOffset);
      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("deviceorientation", handlePitch, true);
    };
  }, [step, arrived]);

  if (path.length === 0) return <p style={{ color: "var(--cream)" }}>No route to display.</p>;

  return (
    <div style={{ position: "relative", width: "100%", minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column" }}>

      {/* Camera + AR canvas */}
      <div style={{ position: "relative", width: "100%", height: "78vh", flexShrink: 0 }}>
        <CameraHandler onStream={(ref) => {}} />
        <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }} />


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

            {/* Wrong direction warning */}
            {wrongDir && (
              <div style={{
                background: "rgba(255,80,80,0.15)", border: "1px solid rgba(255,80,80,0.5)",
                borderRadius: 8, padding: "6px 12px", marginBottom: 8,
                color: "#ff6b6b", fontSize: 12, fontWeight: 600, textAlign: "center",
              }}>
                ⚠️ Please {mappedDir === "left" ? "turn LEFT ⬅" : "turn RIGHT ➡"} first!
              </div>
            )}

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
