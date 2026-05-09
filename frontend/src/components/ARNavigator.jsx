import { useState, useRef, useEffect } from "react";
import CameraHandler from "./CameraHandler";

function getDirection(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  
  // Real campus layout: Main corridor goes forward (X-axis)
  // Side rooms are left/right (Y-axis)
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "up" : "down";  // X+ = forward, X- = backward
  }
  return dy > 0 ? "left" : "right";  // Y+ = left, Y- = right
}

const ARROW = { up: "⬆️", down: "⬇️", left: "⬅️", right: "➡️" };
const LABEL = { up: "⬆ Go Forward", down: "⬇ Go Back", left: "⬅ Turn Left", right: "➡ Turn Right" };

export default function ARNavigator({ path, locations, onExit }) {
  const [step, setStep]       = useState(0);
  const [arrived, setArrived] = useState(false);
  const [deviceHeading, setDeviceHeading] = useState(null);
  const [orientationPermission, setOrientationPermission] = useState('prompt');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const getNode = (id) => locations.find((l) => l.id === id);

  const steps = path.slice(0, -1).map((id, i) => {
    const toId   = path[i + 1];
    const from   = getNode(id);
    const to     = getNode(toId);
    // Use direction from JSON neighbors if available, else fallback to coordinate calculation
    const jsonDir   = from?.neighbors?.[toId]?.direction ?? "";
    const dirMap    = { "STRAIGHT": "up", "FRONT": "up", "BACK": "down", "BEHIND": "down", "LEFT": "left", "RIGHT": "right" };
    const mappedDir = dirMap[jsonDir] ?? null;
    const dir       = mappedDir ?? (from && to ? getDirection(from, to) : "up");
    return {
      fromId:    id,
      fromLabel: from?.label ?? id,
      toId,
      toLabel:   to?.label ?? toId,
      direction: dir,
      instruction: `${LABEL[dir]} → ${to?.label ?? toId}`,
    };
  });

  const current     = steps[step];
  const progress    = steps.length > 0 ? ((step + 1) / steps.length) * 100 : 100;
  const startLabel  = getNode(path[0])?.label ?? path[0];
  const endLabel    = getNode(path[path.length - 1])?.label ?? path[path.length - 1];

  const handleNext = () => {
    if (step < steps.length - 1) setStep((s) => s + 1);
    else setArrived(true);
  };

  const handlePrev = () => {
    setArrived(false);
    setStep((s) => Math.max(0, s - 1));
  };

  // Request orientation permission
  const requestOrientationPermission = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        setOrientationPermission(response);
        if (response === 'granted') {
          startOrientationTracking();
        }
      } catch (error) {
        console.error('Orientation permission error:', error);
        setOrientationPermission('denied');
      }
    } else {
      setOrientationPermission('granted');
      startOrientationTracking();
    }
  };

  // Start tracking device orientation
  const startOrientationTracking = () => {
    const handleOrientation = (event) => {
      if (event.alpha !== null) {
        let heading = event.alpha;
        if (event.webkitCompassHeading) {
          heading = event.webkitCompassHeading; // iOS
        }
        setDeviceHeading(heading);
      }
    };

    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    window.addEventListener('deviceorientation', handleOrientation, true);
  };

  // Cascading floor arrows animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !current || arrived) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx   = canvas.getContext("2d");
    const W     = canvas.width;
    const H     = canvas.height;
    const dir   = current.direction;
    const TOTAL = 8;
    let   offset = 0;
    let   rafId;

    // Draw a single chevron pointing UP at (x,y), rotated by angleRad
    function drawChevron(x, y, size, alpha, angleRad) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.translate(x, y);
      ctx.rotate(angleRad);
      ctx.beginPath();
      // Chevron pointing UP
      ctx.moveTo(0,            -size * 0.55); // tip
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
      // Inner highlight
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

    // Returns {x, y, size, alpha, angle} for chevron at progress t (0=bottom,1=top)
    function getProps(t) {
      // Perspective: arrows shrink as they go further (higher t = farther)
      const perspective = 1 - t * 0.72;
      const size  = 46 * perspective;
      // Fade in at bottom, fade out at top
      const alpha = t < 0.1 ? t / 0.1 : t > 0.78 ? (1 - t) / 0.22 : 1;

      let x, y, angle;

      if (dir === "up") {
        // Straight forward — all arrows go straight up, centered
        x     = W / 2;
        y     = H * 0.88 - t * H * 0.68;
        angle = 0; // pointing up

      } else if (dir === "right") {
        // First 35% straight, then curve right
        if (t < 0.35) {
          x     = W / 2;
          y     = H * 0.88 - t * H * 0.55;
          angle = 0;
        } else {
          const p = (t - 0.35) / 0.65;
          const curve = p * p;
          x     = W / 2 + curve * W * 0.42;
          y     = H * 0.88 - t * H * 0.55;
          // Rotate arrow to face the curve direction
          angle = curve * (Math.PI / 2) * 0.85;
        }

      } else if (dir === "left") {
        // First 35% straight, then curve left
        if (t < 0.35) {
          x     = W / 2;
          y     = H * 0.88 - t * H * 0.55;
          angle = 0;
        } else {
          const p = (t - 0.35) / 0.65;
          const curve = p * p;
          x     = W / 2 - curve * W * 0.42;
          y     = H * 0.88 - t * H * 0.55;
          angle = -curve * (Math.PI / 2) * 0.85;
        }

      } else {
        // down — arrows go downward
        x     = W / 2;
        y     = H * 0.12 + t * H * 0.68;
        angle = Math.PI; // pointing down
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

  // Track device orientation
  useEffect(() => {
    // Auto-start for non-iOS or check permission
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
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", background: "#000", display: "flex", flexDirection: "column" }}>

      {/* Camera - 78% height */}
      <div style={{ position: "relative", width: "100%", height: "78vh", flexShrink: 0 }}>
        <CameraHandler onStream={(ref) => { videoRef.current = ref?.current; }} />
        {/* Canvas overlay on camera */}
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        />
      </div>

      {/* Permission prompt for iOS */}
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
            background: "linear-gradient(135deg, #7c5cbf, #4a2c9e)",
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
        zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(124,92,191,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid rgba(124,92,191,0.5)",
            position: "relative"
          }}>
            <div style={{
              fontSize: "1.2rem",
              transform: `rotate(${deviceHeading ?? 0}deg)`,
              transition: "transform 0.3s ease"
            }}>🧭</div>
          </div>
          <div>
            <div style={{ fontSize: "0.65rem", color: "#9b7fd4", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 2 }}>Navigating to</div>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fdf6ec" }}>{endLabel}</div>
            <div style={{ fontSize: "0.65rem", color: deviceHeading === null ? "#ff6b6b" : "#6ee7b7", marginTop: 4 }}>Compass: {deviceHeading === null ? "Not Active" : `${Math.round(deviceHeading)}°`}</div>
          </div>
        </div>
        <button onClick={onExit} style={{
          background: "rgba(224,85,85,0.2)", border: "1px solid rgba(224,85,85,0.4)",
          color: "#ff8a8a", borderRadius: 20, padding: "6px 14px",
          cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, fontFamily: "Inter, sans-serif"
        }}>✕ Exit</button>
      </div>

      {/* Bottom navigation card - compact 22% */}
      <div style={{
        width: "100%", height: "22vh",
        background: "rgba(10,10,10,0.97)",
        borderTop: "1px solid rgba(124,92,191,0.3)",
        padding: "10px 16px",
        color: "white", fontFamily: "Inter, sans-serif",
        zIndex: 10, overflowY: "auto",
        boxSizing: "border-box",
      }}>
        {!arrived ? (
          <>
            {/* Progress bar */}
            <div style={{ height: 3, background: "#444", borderRadius: 2, marginBottom: 8, overflow: "hidden" }}>
              <div style={{
                width: `${progress}%`, height: "100%",
                background: "linear-gradient(90deg, #7c5cbf, #9b59b6)",
                transition: "width 0.3s",
              }} />
            </div>

            {/* Instruction */}
            <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 4 }}>
              {current?.instruction}
            </div>

            {/* From → To */}
            <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 2 }}>
              🚩 {current?.fromLabel} → 📍 {current?.toLabel}
            </div>

            {/* Step counter */}
            <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 8 }}>
              Step {step + 1} of {steps.length}
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
                background: "linear-gradient(135deg, #7c5cbf, #4a2c9e)",
                border: "none", borderRadius: 10,
                color: "white", fontSize: 13, fontWeight: "bold",
                cursor: "pointer",
              }}>
                {step === steps.length - 1 ? "✅ Arrive" : "Next ▶"}
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
              background: "linear-gradient(135deg, #7c5cbf, #4a2c9e)",
              border: "none", borderRadius: 10,
              color: "white", fontSize: 13, fontWeight: "bold", cursor: "pointer",
            }}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
