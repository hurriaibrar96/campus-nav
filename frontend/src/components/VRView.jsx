import { useEffect, useRef } from "react";
import { drawFloorMap } from "../utils/vrScene";

export default function VRView({ locations, path, currentLocation }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || locations.length === 0) return;
    drawFloorMap(canvasRef.current, locations, path, currentLocation);
  }, [locations, path, currentLocation]);

  const startLabel = locations.find((l) => l.id === path[0])?.label;
  const endLabel   = locations.find((l) => l.id === path[path.length - 1])?.label;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "linear-gradient(135deg, #7c5cbf, #4a2c9e)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem"
          }}>🏛️</div>
          <div>
            <div style={{ fontWeight: 700, color: "#1a0f3d", fontSize: "0.95rem" }}>Floor Map</div>
            <div style={{ fontSize: "0.7rem", color: "#6b5b95" }}>Ground Floor — {locations.length} locations</div>
          </div>
        </div>
        {path.length > 0 && (
          <div style={{
            background: "linear-gradient(135deg, rgba(74,44,158,0.1), rgba(124,92,191,0.1))",
            border: "1px solid rgba(74,44,158,0.2)",
            borderRadius: 20, padding: "0.3rem 0.75rem",
            fontSize: "0.72rem", color: "#4a2c9e", fontWeight: 700
          }}>{path.length} steps</div>
        )}
      </div>

      {/* Route summary strip */}
      {path.length > 0 && (
        <div style={{
          background: "linear-gradient(135deg, #4a2c9e, #2d1b69)",
          borderRadius: 12, padding: "0.75rem 1rem",
          display: "flex", alignItems: "center", gap: "0.5rem",
          fontSize: "0.8rem", color: "#fdf6ec"
        }}>
          <span style={{ background: "rgba(255,255,255,0.15)", borderRadius: 6, padding: "0.2rem 0.5rem", fontWeight: 600 }}>{startLabel}</span>
          <span style={{ opacity: 0.6, flex: 1, textAlign: "center" }}>───►</span>
          <span style={{ background: "rgba(61,186,126,0.25)", borderRadius: 6, padding: "0.2rem 0.5rem", fontWeight: 600, color: "#7eefc0" }}>{endLabel}</span>
        </div>
      )}

      {/* Canvas */}
      <div style={{
        background: "linear-gradient(160deg, #0f0a1e, #1a1035, #0d1a2e)",
        borderRadius: 16, overflow: "hidden",
        boxShadow: "inset 0 2px 12px rgba(0,0,0,0.4), 0 4px 20px rgba(45,27,105,0.3)",
        border: "1px solid rgba(124,92,191,0.2)"
      }}>
        <canvas
          ref={canvasRef}
          width={1400}
          height={900}
          style={{ display: "block", width: "100%", height: "auto" }}
        />
      </div>

      {/* Legend */}
      <div style={{
        display: "flex", gap: "0.75rem", flexWrap: "wrap",
        padding: "0.75rem 1rem",
        background: "rgba(253,246,236,0.5)",
        borderRadius: 10, border: "1px solid rgba(74,44,158,0.1)"
      }}>
        {[
          { color: "#00ff88", label: "Your Location" },
          { color: "#ff6b6b", label: "Destination" },
          { color: "#00cfff", label: "Route" },
          { color: "#3a3a5c", label: "Other" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
            <span style={{ fontSize: "0.72rem", color: "#6b5b95", fontWeight: 500 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
