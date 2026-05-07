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
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [orientationPermission, setOrientationPermission] = useState('prompt');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const getNode = (id) => locations.find((l) => l.id === id);

  const steps = path.slice(0, -1).map((id, i) => {
    const toId   = path[i + 1];
    const from   = getNode(id);
    const to     = getNode(toId);
    const dir    = from && to ? getDirection(from, to) : "right";
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

  // Draw arrow on canvas whenever heading or step changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !current || arrived) return;

    const ctx = canvas.getContext("2d");
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2 - 60;
    const dir = current.direction;

    // If compass is not working (deviceHeading = 0), just show static arrow
    const compassActive = deviceHeading !== 0;
    
    let relativeRad = 0;
    let isCorrectDirection = false;
    
    if (compassActive) {
      // Calculate target angle based on map direction
      const targetAngle = { up: 0, right: 90, down: 180, left: 270 }[dir] ?? 0;
      
      // Calculate relative angle: how far off from target
      let angleDiff = Math.abs(targetAngle - deviceHeading);
      if (angleDiff > 180) angleDiff = 360 - angleDiff; // Shortest angle
      
      const relativeAngle = ((targetAngle - deviceHeading + 360) % 360);
      relativeRad = relativeAngle * (Math.PI / 180);
      
      // Check if user is facing the correct direction (within 30 degrees)
      isCorrectDirection = angleDiff < 30;
    } else {
      // No compass - show static arrow pointing in direction
      const staticAngles = { up: -Math.PI/2, right: 0, down: Math.PI/2, left: Math.PI };
      relativeRad = staticAngles[dir] ?? 0;
    }
    
    const circleColor = compassActive ? (isCorrectDirection ? "rgba(61,186,126,0.35)" : "rgba(245,197,24,0.35)") : "rgba(124,92,191,0.35)";
    const borderColor = compassActive ? (isCorrectDirection ? "rgba(61,186,126,0.9)" : "rgba(245,197,24,0.9)") : "rgba(124,92,191,0.9)";
    const bgColor = compassActive ? (isCorrectDirection ? "rgba(26,61,40,0.75)" : "rgba(61,40,26,0.75)") : "rgba(26,10,61,0.75)";

    // Outer glow ring
    const grad = ctx.createRadialGradient(cx, cy, 40, cx, cy, 90);
    grad.addColorStop(0, circleColor);
    grad.addColorStop(1, "rgba(124,92,191,0)");
    ctx.beginPath();
    ctx.arc(cx, cy, 90, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Circle background
    ctx.beginPath();
    ctx.arc(cx, cy, 58, 0, Math.PI * 2);
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw geometric arrow
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(relativeRad);

    // Arrow shaft
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.lineTo(14, 0);
    ctx.strokeStyle = "#fdf6ec";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.stroke();

    // Arrowhead (filled triangle)
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.lineTo(10, -14);
    ctx.lineTo(10, 14);
    ctx.closePath();
    ctx.fillStyle = "#fdf6ec";
    ctx.fill();

    ctx.restore();

    // Direction label below circle
    ctx.font = "bold 13px Inter, sans-serif";
    ctx.fillStyle = compassActive && isCorrectDirection ? "rgba(61,186,126,0.95)" : "rgba(253,246,236,0.85)";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 8;
    
    const directionText = { up: "GO FORWARD", down: "GO BACK", left: "TURN LEFT", right: "TURN RIGHT" }[dir] ?? "";
    const statusText = compassActive ? (isCorrectDirection ? "✓ CORRECT DIRECTION" : directionText) : directionText;
    
    ctx.fillText(statusText, cx, cy + 68);
  }, [deviceHeading, current, arrived]);

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
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", background: "#000" }}>

      {/* Camera */}
      <CameraHandler onStream={(ref) => { videoRef.current = ref?.current; }} />

      {/* Canvas arrow overlay */}
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      />

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
              transform: `rotate(${deviceHeading}deg)`,
              transition: "transform 0.3s ease"
            }}>🧭</div>
          </div>
          <div>
            <div style={{ fontSize: "0.65rem", color: "#9b7fd4", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 2 }}>Navigating to</div>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fdf6ec" }}>{endLabel}</div>
            <div style={{ fontSize: "0.65rem", color: deviceHeading === 0 ? "#ff6b6b" : "#6ee7b7", marginTop: 4 }}>Compass: {deviceHeading === 0 ? "Not Active" : `${Math.round(deviceHeading)}°`}</div>
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
        position: "absolute", bottom: 20, left: 16, right: 16,
        background: "rgba(10,10,10,0.92)", backdropFilter: "blur(20px)",
        borderRadius: 24, padding: "20px",
        border: "1px solid rgba(245,197,24,0.25)",
        color: "white", fontFamily: "Inter, sans-serif",
        boxShadow: "0 -4px 32px rgba(0,0,0,0.5)", zIndex: 10,
      }}>
        {!arrived ? (
          <>
            {/* Progress bar */}
            <div style={{ height: 4, background: "#444", borderRadius: 2, marginBottom: 14, overflow: "hidden" }}>
              <div style={{
                width: `${progress}%`, height: "100%",
                background: "linear-gradient(90deg, #7c5cbf, #9b59b6)",
                transition: "width 0.3s",
              }} />
            </div>

            {/* Instruction */}
            <div style={{ fontSize: 17, fontWeight: "bold", marginBottom: 6 }}>
              {current?.instruction}
            </div>

            {/* From → To */}
            <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 4 }}>
              🚩 {current?.fromLabel} → 📍 {current?.toLabel}
            </div>

            {/* Step counter */}
            <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 16 }}>
              Step {step + 1} of {steps.length}
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={handlePrev} disabled={step === 0} style={{
                flex: 1, padding: 12,
                background: step === 0 ? "#444" : "#555",
                border: "none", borderRadius: 12,
                color: "white", fontSize: 15,
                cursor: step === 0 ? "not-allowed" : "pointer",
              }}>◀ Back</button>

              <button onClick={handleNext} style={{
                flex: 2, padding: 12,
                background: "linear-gradient(135deg, #7c5cbf, #4a2c9e)",
                border: "none", borderRadius: 12,
                color: "white", fontSize: 15, fontWeight: "bold",
                cursor: "pointer",
              }}>
                {step === steps.length - 1 ? "✅ Arrive" : "Next ▶"}
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>🎉</div>
            <div style={{ fontSize: 20, fontWeight: "bold", marginBottom: 6 }}>You have arrived!</div>
            <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 16 }}>{endLabel} reached successfully</div>
            <button onClick={onExit} style={{
              padding: "12px 32px",
              background: "linear-gradient(135deg, #7c5cbf, #4a2c9e)",
              border: "none", borderRadius: 12,
              color: "white", fontSize: 15, fontWeight: "bold", cursor: "pointer",
            }}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
