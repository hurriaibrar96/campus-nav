import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import Chatbot from "../components/Chatbot";
import ARNavigator from "../components/ARNavigator";
import VRView from "../components/VRView";

const MODES = [
  { key: "map",  icon: "🗺️", label: "Navigate" },
  { key: "chat", icon: "🤖", label: "Chatbot" },
  { key: "vr",   icon: "🏛️", label: "Floor Map" },
  { key: "ar",   icon: "📷", label: "AR View" },
];

export default function Portal() {
  const [searchParams]   = useSearchParams();
  const scannedLocation  = searchParams.get("location") || "";

  const [locations, setLocations] = useState([]);
  const [destination, setDestination] = useState("");
  const [path, setPath]     = useState([]);
  const [error, setError]   = useState("");
  const [mode, setMode]     = useState("map");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/navigation/locations").then(({ data }) => setLocations(data)).catch(() => {});
  }, []);

  const handleNavigate = async () => {
    setError(""); setPath([]); setLoading(true);
    if (!scannedLocation || !destination) { setError("Please select a destination."); setLoading(false); return; }
    if (scannedLocation === destination)  { setError("You are already there!"); setLoading(false); return; }
    try {
      const { data } = await api.get("/navigation/route", { params: { start: scannedLocation, end: destination } });
      setPath(data.path);
    } catch {
      setError("No path found. Try a different destination.");
    } finally { setLoading(false); }
  };

  const getLabel = (id) => locations.find((l) => l.id === id)?.label ?? id;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #1a0a3d 0%, #2d1b69 40%, #4a2c9e 100%)", fontFamily: "Inter, sans-serif" }}>

      {/* ── Top Navigation Bar ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(26,10,61,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(253,246,236,0.08)",
        padding: "0 1.5rem", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #7c5cbf, #4a2c9e)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem"
          }}>🧭</div>
          <div>
            <div style={{ fontWeight: 700, color: "#fdf6ec", fontSize: "0.95rem", lineHeight: 1.2 }}>Campus Navigator</div>
            <div style={{ fontSize: "0.7rem", color: "#9b7fd4" }}>AI-Powered Navigation</div>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "1.5rem 1rem 6rem" }}>

        {/* ── Location Banner ── */}
        <div style={{
          background: "linear-gradient(135deg, rgba(124,92,191,0.25), rgba(74,44,158,0.15))",
          border: "1px solid rgba(124,92,191,0.3)",
          borderRadius: 16, padding: "1rem 1.25rem",
          display: "flex", alignItems: "center", gap: "1rem",
          marginBottom: "1.5rem",
          backdropFilter: "blur(10px)",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "linear-gradient(135deg, #7c5cbf, #4a2c9e)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.2rem", flexShrink: 0,
            boxShadow: "0 4px 12px rgba(124,92,191,0.4)"
          }}>📍</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.68rem", color: "#9b7fd4", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 3 }}>Current Location</div>
            <div style={{ color: "#fdf6ec", fontWeight: 600, fontSize: "1rem" }}>
              {scannedLocation ? getLabel(scannedLocation) : "Not detected — scan a QR code"}
            </div>
          </div>
          {scannedLocation && (
            <div style={{
              background: "rgba(61,186,126,0.15)", border: "1px solid rgba(61,186,126,0.3)",
              borderRadius: 20, padding: "0.2rem 0.65rem",
              fontSize: "0.7rem", color: "#3dba7e", fontWeight: 600
            }}>● LIVE</div>
          )}
        </div>

        {/* ── Mode Tabs ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          gap: "0.5rem", marginBottom: "1.5rem"
        }}>
          {MODES.map(({ key, icon, label }) => {
            const isActive   = mode === key;
            const isDisabled = key === "ar" && path.length === 0;
            return (
              <button key={key} onClick={() => !isDisabled && setMode(key)} style={{
                background: isActive
                  ? "linear-gradient(135deg, #7c5cbf, #4a2c9e)"
                  : "rgba(253,246,236,0.05)",
                border: isActive ? "none" : "1px solid rgba(253,246,236,0.1)",
                borderRadius: 12, padding: "0.65rem 0.25rem",
                color: isActive ? "#fdf6ec" : isDisabled ? "rgba(253,246,236,0.25)" : "rgba(253,246,236,0.7)",
                cursor: isDisabled ? "not-allowed" : "pointer",
                fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.75rem",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem",
                transition: "all 0.2s",
                boxShadow: isActive ? "0 4px 14px rgba(124,92,191,0.4)" : "none",
              }}>
                <span style={{ fontSize: "1.2rem" }}>{icon}</span>
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Navigate Mode ── */}
        {mode === "map" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Destination card */}
            <div style={{
              background: "rgba(253,246,236,0.97)",
              borderRadius: 20, padding: "1.5rem",
              boxShadow: "0 8px 32px rgba(45,27,105,0.25)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                <span style={{ fontSize: "1.2rem" }}>🎯</span>
                <h3 style={{ fontWeight: 700, color: "#1a0f3d", fontSize: "1.05rem" }}>Where do you want to go?</h3>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6b5b95", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "0.5rem" }}>Select Destination</label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  style={{
                    width: "100%", padding: "0.85rem 1rem",
                    border: "2px solid #e8dff5", borderRadius: 10,
                    fontSize: "0.95rem", fontFamily: "Inter, sans-serif",
                    background: "white", color: "#1a0f3d",
                    cursor: "pointer", outline: "none",
                    appearance: "none",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b5b95' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat", backgroundPosition: "right 1rem center",
                  }}>
                  <option value="">Choose a location...</option>
                  {locations.filter((l) => l.id !== scannedLocation).map((l) => (
                    <option key={l.id} value={l.id}>{l.label}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleNavigate}
                disabled={!destination || loading}
                style={{
                  width: "100%", padding: "0.9rem",
                  background: destination ? "linear-gradient(135deg, #4a2c9e, #2d1b69)" : "#e0d6f0",
                  border: "none", borderRadius: 10,
                  color: destination ? "#fdf6ec" : "#a090c0",
                  fontSize: "0.95rem", fontWeight: 700,
                  cursor: destination ? "pointer" : "not-allowed",
                  fontFamily: "Inter, sans-serif",
                  transition: "all 0.2s",
                  boxShadow: destination ? "0 4px 14px rgba(74,44,158,0.4)" : "none",
                }}>
                {loading ? "Finding route..." : "🔍 Get Route"}
              </button>

              {error && (
                <div style={{
                  marginTop: "0.75rem", padding: "0.75rem 1rem",
                  background: "#fde8e8", border: "1px solid #f5c6c6",
                  borderRadius: 8, color: "#e05555", fontSize: "0.85rem", fontWeight: 500
                }}>{error}</div>
              )}
            </div>

            {/* Route result */}
            {path.length > 0 && (
              <div style={{
                background: "rgba(253,246,236,0.97)",
                borderRadius: 20, padding: "1.5rem",
                boxShadow: "0 8px 32px rgba(45,27,105,0.25)"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.1rem" }}>🛤️</span>
                    <h3 style={{ fontWeight: 700, color: "#1a0f3d", fontSize: "1rem" }}>Your Route</h3>
                  </div>
                  <div style={{
                    background: "rgba(74,44,158,0.1)", borderRadius: 20,
                    padding: "0.2rem 0.65rem", fontSize: "0.75rem",
                    color: "#4a2c9e", fontWeight: 600
                  }}>{path.length} steps</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                  {path.map((node, i) => (
                    <div key={node} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                          background: i === 0 ? "linear-gradient(135deg, #7c5cbf, #4a2c9e)"
                            : i === path.length - 1 ? "linear-gradient(135deg, #3dba7e, #2a9060)"
                            : "#e8dff5",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.75rem", fontWeight: 700,
                          color: i === 0 || i === path.length - 1 ? "white" : "#6b5b95",
                          boxShadow: i === 0 || i === path.length - 1 ? "0 2px 8px rgba(74,44,158,0.3)" : "none"
                        }}>{i === 0 ? "S" : i === path.length - 1 ? "E" : i}</div>
                        {i < path.length - 1 && (
                          <div style={{ width: 2, height: 20, background: "#e8dff5", margin: "2px 0" }} />
                        )}
                      </div>
                      <div style={{
                        flex: 1, padding: "0.5rem 0",
                        fontSize: "0.9rem",
                        fontWeight: i === 0 || i === path.length - 1 ? 600 : 400,
                        color: i === 0 ? "#4a2c9e" : i === path.length - 1 ? "#2a9060" : "#3a2a5e"
                      }}>
                        {getLabel(node)}
                        {i === 0 && <span style={{ marginLeft: "0.4rem", fontSize: "0.7rem", background: "rgba(74,44,158,0.1)", color: "#4a2c9e", padding: "0.1rem 0.4rem", borderRadius: 4, fontWeight: 600 }}>START</span>}
                        {i === path.length - 1 && <span style={{ marginLeft: "0.4rem", fontSize: "0.7rem", background: "rgba(61,186,126,0.1)", color: "#2a9060", padding: "0.1rem 0.4rem", borderRadius: 4, fontWeight: 600 }}>END</span>}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setMode("ar")}
                  style={{
                    marginTop: "1.25rem", width: "100%", padding: "0.9rem",
                    background: "linear-gradient(135deg, #4a2c9e, #2d1b69)",
                    border: "none", borderRadius: 10,
                    color: "#fdf6ec", fontSize: "0.95rem", fontWeight: 700,
                    cursor: "pointer", fontFamily: "Inter, sans-serif",
                    boxShadow: "0 4px 14px rgba(74,44,158,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"
                  }}>
                  <span>📷</span> Start AR Navigation
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Chatbot Mode ── */}
        {mode === "chat" && <Chatbot currentLocation={scannedLocation} />}

        {/* ── AR Mode ── */}
        {mode === "ar" && (
          <ARNavigator path={path} locations={locations} onExit={() => setMode("map")} />
        )}

        {/* ── Floor Map Mode ── */}
        {mode === "vr" && (
          <div style={{
            background: "rgba(253,246,236,0.97)",
            borderRadius: 20, padding: "1.5rem",
            boxShadow: "0 8px 32px rgba(45,27,105,0.25)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <span style={{ fontSize: "1.2rem" }}>🏛️</span>
              <h3 style={{ fontWeight: 700, color: "#1a0f3d", fontSize: "1.05rem" }}>Floor Map</h3>
            </div>
            <VRView locations={locations} path={path} currentLocation={scannedLocation} />
          </div>
        )}
      </div>
    </div>
  );
}
