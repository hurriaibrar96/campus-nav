import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import Chatbot from "../components/Chatbot";
import ARNavigator from "../components/ARNavigator";
import VRView from "../components/VRView";

const MODES = [
  { key: "map",  icon: "🗺️", label: "Navigate"  },
  { key: "chat", icon: "🤖", label: "Chatbot"   },
  { key: "vr",   icon: "🏛️", label: "Floor Map" },
  { key: "ar",   icon: "📷", label: "AR View"   },
];

const C = {
  purple:      "#7B2D8B",
  purpleLight: "#f5eef8",
  purpleBorder:"#e8d5f0",
  textDark:    "#1A1A2E",
  textMuted:   "#6B7280",
  white:       "#FFFFFF",
};

export default function Portal() {
  const [searchParams]  = useSearchParams();
  const scannedLocation = searchParams.get("location") || "";

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
    <div style={{ minHeight: "100vh", background: C.white, fontFamily: "Inter, sans-serif" }}>

      {/* ── Header ── */}
      <div style={{
        background: C.purple, padding: "0 16px",
        height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem",
          }}>🧭</div>
          <div>
            <div style={{ color: C.white, fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>SuperiorXR - Your Campus Navigator</div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>AI · AR · Powered</div>
          </div>
        </div>
        {scannedLocation && (
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.35)",
            borderRadius: 20, padding: "4px 12px",
          }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
            <span style={{ color: C.white, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em" }}>LIVE</span>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 16px 80px" }}>

        {/* ── Current Location Card ── */}
        <div style={{
          background: C.white, border: `1px solid ${C.purpleBorder}`,
          borderRadius: 16, padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 12,
          marginBottom: 12,
          boxShadow: "0 2px 12px rgba(108,71,217,0.08)",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: C.purpleLight,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem",
            border: `1px solid ${C.purpleBorder}`,
          }}>📍</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: C.purple, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 3 }}>Current Location</div>
            <div style={{ color: C.textDark, fontWeight: 700, fontSize: 20 }}>
              {scannedLocation ? getLabel(scannedLocation) : "Scan a QR code to start"}
            </div>
          </div>
          <div style={{ color: C.purple, fontSize: 20, fontWeight: 700 }}>›</div>
        </div>

        {/* ── Nav Tabs ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8,
          marginBottom: 16,
        }}>
          {MODES.map(({ key, icon, label }) => {
            const isActive   = mode === key;
            const isDisabled = key === "ar" && path.length === 0;
            return (
              <button key={key} onClick={() => !isDisabled && setMode(key)} style={{
                background: isActive ? C.purple : C.white,
                border: isActive ? "none" : `0.5px solid ${C.purpleBorder}`,
                borderRadius: 12, padding: "8px 4px",
                height: 80,
                color: isActive ? C.white : isDisabled ? "#D1D5DB" : C.textMuted,
                cursor: isDisabled ? "not-allowed" : "pointer",
                fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 11,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                transition: "all 0.18s",
                boxShadow: isActive ? "0 4px 14px rgba(108,71,217,0.35)" : "0 1px 4px rgba(0,0,0,0.06)",
              }}>
                <span style={{ fontSize: "1.05rem" }}>{icon}</span>
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Navigate Mode ── */}
        {mode === "map" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Destination Card */}
            <div style={{
              background: C.white, border: `1px solid ${C.purpleBorder}`,
              borderRadius: 16, padding: "20px 16px",
              boxShadow: "0 2px 12px rgba(108,71,217,0.08)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: C.purpleLight, border: `1px solid ${C.purpleBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem",
                }}>🎯</div>
                <span style={{ fontWeight: 700, color: C.textDark, fontSize: 17 }}>Where do you want to go?</span>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: C.purple, textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>Select Destination</label>
                <div style={{ position: "relative" }}>
                  <select value={destination} onChange={(e) => setDestination(e.target.value)} style={{
                    width: "100%", height: 48, padding: "0 40px 0 14px",
                    border: `1.5px solid ${destination ? C.purple : C.purpleBorder}`, borderRadius: 12,
                    fontSize: 14, fontFamily: "Inter, sans-serif",
                    background: C.white, color: destination ? C.textDark : C.textMuted,
                    cursor: "pointer", outline: "none", appearance: "none",
                    transition: "border-color 0.2s",
                  }}>
                    <option value="">Choose a location...</option>
                    {locations.filter((l) => l.id !== scannedLocation && l.id !== 'stairs_3' && l.id !== 'ahs_corridor' && l.id !== 'corridor_junction' && l.id !== 'medan' && l.id !== 'main_corridor_junction' && l.id !== 'back_stairs' && l.id !== 'emergency_exit' && l.id !== 'stage' && l.id !== 'main_building' && l.id !== 'g2_junction' && l.id !== 'library_junction').map((l) => (
                      <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                  </select>
                  <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: C.purple, pointerEvents: "none", fontSize: 12 }}>▼</div>
                </div>
              </div>

              <button onClick={handleNavigate} disabled={loading} style={{
                width: "100%", height: 52,
                background: C.purple,
                border: "none", borderRadius: 14,
                color: C.white,
                fontSize: 15, fontWeight: 700,
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
                boxShadow: "0 4px 18px rgba(108,71,217,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.2s",
                opacity: loading ? 0.7 : 1,
              }}>
                <span>🔍</span> {loading ? "Finding route..." : "Get Route"}
              </button>

              {error && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, color: "#DC2626", fontSize: 13, fontWeight: 500 }}>
                  {error}
                </div>
              )}
            </div>

            {/* Quick Access */}
            {path.length === 0 && (
              <div style={{
                background: C.white, border: `1px solid ${C.purpleBorder}`,
                borderRadius: 16, padding: "16px",
                boxShadow: "0 2px 12px rgba(108,71,217,0.08)",
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Quick Access</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {["Library Gate 1", "Aerolab", "AHS Faculty", "Computer Lab 1", "Stairs 2"].map((place) => (
                    <button key={place}
                      onClick={() => {
                        const loc = locations.find((l) => l.label === place);
                        if (loc) setDestination(loc.id);
                      }}
                      style={{
                        padding: "7px 14px", borderRadius: 20,
                        background: C.purpleLight, border: `1px solid ${C.purpleBorder}`,
                        color: C.purple, fontSize: 13, fontWeight: 600,
                        cursor: "pointer", fontFamily: "Inter, sans-serif",
                        transition: "all 0.15s",
                      }}>
                      {place}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Route Card */}
            {path.length > 0 && (
              <div style={{
                background: C.white, border: `1px solid ${C.purpleBorder}`,
                borderRadius: 16, padding: "20px 16px",
                boxShadow: "0 2px 12px rgba(108,71,217,0.08)",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "#F0FDF4", border: "1px solid #BBF7D0",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem",
                    }}>🛤️</div>
                    <span style={{ fontWeight: 700, color: C.textDark, fontSize: 17 }}>Your Route</span>
                  </div>
                  <div style={{
                    background: C.purpleLight, border: `1px solid ${C.purpleBorder}`,
                    borderRadius: 20, padding: "3px 12px",
                    fontSize: 11, color: C.purple, fontWeight: 700,
                  }}>{path.length} stops</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  {path.map((node, i) => (
                    <div key={node} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                          background: i === 0 ? C.purple : i === path.length - 1 ? "#16A34A" : C.purpleLight,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 700,
                          color: i === 0 || i === path.length - 1 ? C.white : C.purple,
                          border: i === 0 || i === path.length - 1 ? "none" : `1px solid ${C.purpleBorder}`,
                          boxShadow: i === 0 ? "0 2px 10px rgba(108,71,217,0.4)" : i === path.length - 1 ? "0 2px 10px rgba(22,163,74,0.3)" : "none",
                        }}>{i === 0 ? "S" : i === path.length - 1 ? "E" : i}</div>
                        {i < path.length - 1 && (
                          <div style={{ width: 1.5, height: 20, background: C.purpleBorder, margin: "2px 0" }} />
                        )}
                      </div>
                      <div style={{
                        flex: 1, padding: "6px 0",
                        fontSize: 14,
                        fontWeight: i === 0 || i === path.length - 1 ? 600 : 400,
                        color: i === 0 ? C.purple : i === path.length - 1 ? "#16A34A" : C.textMuted,
                      }}>
                        {getLabel(node)}
                        {i === 0 && <span style={{ marginLeft: 6, fontSize: 10, background: C.purpleLight, color: C.purple, padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>START</span>}
                        {i === path.length - 1 && <span style={{ marginLeft: 6, fontSize: 10, background: "#F0FDF4", color: "#16A34A", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>END</span>}
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={() => setMode("ar")} style={{
                  marginTop: 16, width: "100%", height: 52,
                  background: C.purple, border: "none", borderRadius: 14,
                  color: C.white, fontSize: 15, fontWeight: 700,
                  cursor: "pointer", fontFamily: "Inter, sans-serif",
                  boxShadow: "0 4px 18px rgba(108,71,217,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  <span>📷</span> Start AR Navigation
                </button>
              </div>
            )}
          </div>
        )}

        {mode === "chat" && <Chatbot currentLocation={scannedLocation} />}
        {mode === "ar"   && <ARNavigator path={path} locations={locations} onExit={() => setMode("map")} />}
        {mode === "vr"   && (
          <div style={{
            background: C.white, border: `1px solid ${C.purpleBorder}`,
            borderRadius: 16, padding: "20px 16px",
            boxShadow: "0 2px 12px rgba(108,71,217,0.08)",
          }}>
            <VRView locations={locations} path={path} currentLocation={scannedLocation} />
          </div>
        )}
      </div>
    </div>
  );
}
