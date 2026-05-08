import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import Chatbot from "../components/Chatbot";
import ARNavigator from "../components/ARNavigator";
import VRView from "../components/VRView";

const MODES = [
  { key: "map",  icon: "🗺️", label: "Navigate" },
  { key: "chat", icon: "🤖", label: "Chatbot"  },
  { key: "vr",   icon: "🏛️", label: "Floor Map" },
  { key: "ar",   icon: "📷", label: "AR View"  },
];

const P  = "#7B2D8B";
const PD = "#5a1068";
const PL = "#9b4aab";

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
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg, #0f0520 0%, #1a0535 40%, #2d0a4e 100%)", fontFamily: "Inter, sans-serif" }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(15,5,32,0.85)", backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(155,74,171,0.2)",
        padding: "0 1.5rem", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "linear-gradient(135deg, #9b4aab, #5a1068)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem",
            boxShadow: "0 4px 16px rgba(155,74,171,0.5)",
          }}>🧭</div>
          <div>
            <div style={{ fontWeight: 800, color: "#fff", fontSize: "0.95rem", letterSpacing: "-0.01em" }}>Campus Navigator</div>
            <div style={{ fontSize: "0.65rem", color: "rgba(212,168,224,0.7)", letterSpacing: "0.06em", textTransform: "uppercase" }}>AI · AR · Powered</div>
          </div>
        </div>
        {scannedLocation && (
          <div style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            background: "rgba(61,186,126,0.12)", border: "1px solid rgba(61,186,126,0.25)",
            borderRadius: 20, padding: "0.3rem 0.75rem",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3dba7e", boxShadow: "0 0 6px #3dba7e" }} />
            <span style={{ fontSize: "0.72rem", color: "#3dba7e", fontWeight: 600 }}>LIVE</span>
          </div>
        )}
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "1.25rem 1rem 6rem" }}>

        {/* ── Location Banner ── */}
        <div style={{
          background: "linear-gradient(135deg, rgba(155,74,171,0.15), rgba(90,16,104,0.25))",
          border: "1px solid rgba(155,74,171,0.25)",
          borderRadius: 18, padding: "1rem 1.25rem",
          display: "flex", alignItems: "center", gap: "1rem",
          marginBottom: "1.25rem", backdropFilter: "blur(12px)",
          boxShadow: "0 4px 24px rgba(90,16,104,0.2)",
        }}>
          <div style={{
            width: 46, height: 46, borderRadius: 14,
            background: "linear-gradient(135deg, #9b4aab, #5a1068)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.3rem", flexShrink: 0,
            boxShadow: "0 4px 16px rgba(155,74,171,0.45)",
          }}>📍</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.62rem", color: "rgba(212,168,224,0.7)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 4 }}>Current Location</div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>
              {scannedLocation ? getLabel(scannedLocation) : "Scan a QR code to detect location"}
            </div>
          </div>
        </div>

        {/* ── Mode Tabs ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem",
          marginBottom: "1.25rem",
          background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: "0.4rem",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          {MODES.map(({ key, icon, label }) => {
            const isActive   = mode === key;
            const isDisabled = key === "ar" && path.length === 0;
            return (
              <button key={key} onClick={() => !isDisabled && setMode(key)} style={{
                background: isActive ? "linear-gradient(135deg, #9b4aab, #5a1068)" : "transparent",
                border: "none", borderRadius: 12, padding: "0.6rem 0.25rem",
                color: isActive ? "#fff" : isDisabled ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)",
                cursor: isDisabled ? "not-allowed" : "pointer",
                fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.72rem",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem",
                transition: "all 0.2s",
                boxShadow: isActive ? "0 4px 16px rgba(90,16,104,0.5)" : "none",
              }}>
                <span style={{ fontSize: "1.15rem" }}>{icon}</span>
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Navigate Mode ── */}
        {mode === "map" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Destination Card */}
            <div style={{
              background: "rgba(255,255,255,0.05)", backdropFilter: "blur(16px)",
              borderRadius: 20, padding: "1.5rem",
              border: "1px solid rgba(155,74,171,0.2)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "linear-gradient(135deg, rgba(155,74,171,0.3), rgba(90,16,104,0.4))",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem",
                  border: "1px solid rgba(155,74,171,0.3)",
                }}>🎯</div>
                <h3 style={{ fontWeight: 700, color: "#fff", fontSize: "1rem", margin: 0 }}>Where do you want to go?</h3>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(212,168,224,0.8)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.5rem" }}>Select Destination</label>
                <select value={destination} onChange={(e) => setDestination(e.target.value)} style={{
                  width: "100%", padding: "0.85rem 1rem",
                  border: "1.5px solid rgba(155,74,171,0.35)", borderRadius: 12,
                  fontSize: "0.92rem", fontFamily: "Inter, sans-serif",
                  background: "rgba(255,255,255,0.07)", color: destination ? "#fff" : "rgba(255,255,255,0.4)",
                  cursor: "pointer", outline: "none", appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239b4aab' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat", backgroundPosition: "right 1rem center",
                  transition: "border-color 0.2s",
                }}>
                  <option value="" style={{ background: "#1a0535" }}>Choose a location...</option>
                  {locations.filter((l) => l.id !== scannedLocation).map((l) => (
                    <option key={l.id} value={l.id} style={{ background: "#1a0535" }}>{l.label}</option>
                  ))}
                </select>
              </div>

              <button onClick={handleNavigate} disabled={!destination || loading} style={{
                width: "100%", padding: "0.9rem",
                background: destination ? "linear-gradient(135deg, #9b4aab, #5a1068)" : "rgba(255,255,255,0.06)",
                border: destination ? "none" : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                color: destination ? "#fff" : "rgba(255,255,255,0.3)",
                fontSize: "0.95rem", fontWeight: 700,
                cursor: destination ? "pointer" : "not-allowed",
                fontFamily: "Inter, sans-serif", transition: "all 0.2s",
                boxShadow: destination ? "0 4px 20px rgba(90,16,104,0.5)" : "none",
                letterSpacing: "0.02em",
              }}>
                {loading ? "Finding route..." : "🔍 Get Route"}
              </button>

              {error && (
                <div style={{ marginTop: "0.75rem", padding: "0.75rem 1rem", background: "rgba(224,85,85,0.12)", border: "1px solid rgba(224,85,85,0.3)", borderRadius: 10, color: "#ff8a8a", fontSize: "0.85rem", fontWeight: 500 }}>
                  {error}
                </div>
              )}
            </div>

            {/* Route Card */}
            {path.length > 0 && (
              <div style={{
                background: "rgba(255,255,255,0.05)", backdropFilter: "blur(16px)",
                borderRadius: 20, padding: "1.5rem",
                border: "1px solid rgba(155,74,171,0.2)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: "linear-gradient(135deg, rgba(61,186,126,0.2), rgba(42,144,96,0.3))",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem",
                      border: "1px solid rgba(61,186,126,0.3)",
                    }}>🛤️</div>
                    <h3 style={{ fontWeight: 700, color: "#fff", fontSize: "1rem", margin: 0 }}>Your Route</h3>
                  </div>
                  <div style={{
                    background: "rgba(155,74,171,0.2)", border: "1px solid rgba(155,74,171,0.3)",
                    borderRadius: 20, padding: "0.2rem 0.75rem",
                    fontSize: "0.72rem", color: "#d4a8e0", fontWeight: 700,
                  }}>{path.length} stops</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  {path.map((node, i) => (
                    <div key={node} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                          background: i === 0
                            ? "linear-gradient(135deg, #9b4aab, #5a1068)"
                            : i === path.length - 1
                            ? "linear-gradient(135deg, #3dba7e, #2a9060)"
                            : "rgba(255,255,255,0.08)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.72rem", fontWeight: 700,
                          color: i === 0 || i === path.length - 1 ? "#fff" : "rgba(255,255,255,0.5)",
                          border: i === 0 || i === path.length - 1 ? "none" : "1px solid rgba(255,255,255,0.12)",
                          boxShadow: i === 0 ? "0 2px 12px rgba(155,74,171,0.5)" : i === path.length - 1 ? "0 2px 12px rgba(61,186,126,0.4)" : "none",
                        }}>{i === 0 ? "S" : i === path.length - 1 ? "E" : i}</div>
                        {i < path.length - 1 && (
                          <div style={{ width: 1, height: 22, background: "linear-gradient(180deg, rgba(155,74,171,0.5), rgba(155,74,171,0.1))", margin: "2px 0" }} />
                        )}
                      </div>
                      <div style={{
                        flex: 1, padding: "0.45rem 0",
                        fontSize: "0.88rem",
                        fontWeight: i === 0 || i === path.length - 1 ? 600 : 400,
                        color: i === 0 ? "#d4a8e0" : i === path.length - 1 ? "#6ee7b7" : "rgba(255,255,255,0.65)",
                      }}>
                        {getLabel(node)}
                        {i === 0 && <span style={{ marginLeft: "0.4rem", fontSize: "0.65rem", background: "rgba(155,74,171,0.2)", color: "#d4a8e0", padding: "0.1rem 0.45rem", borderRadius: 4, fontWeight: 700, border: "1px solid rgba(155,74,171,0.3)" }}>START</span>}
                        {i === path.length - 1 && <span style={{ marginLeft: "0.4rem", fontSize: "0.65rem", background: "rgba(61,186,126,0.15)", color: "#6ee7b7", padding: "0.1rem 0.45rem", borderRadius: 4, fontWeight: 700, border: "1px solid rgba(61,186,126,0.3)" }}>END</span>}
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={() => setMode("ar")} style={{
                  marginTop: "1.25rem", width: "100%", padding: "0.9rem",
                  background: "linear-gradient(135deg, #9b4aab, #5a1068)",
                  border: "none", borderRadius: 12,
                  color: "#fff", fontSize: "0.95rem", fontWeight: 700,
                  cursor: "pointer", fontFamily: "Inter, sans-serif",
                  boxShadow: "0 4px 20px rgba(90,16,104,0.5)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  letterSpacing: "0.02em",
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
            background: "rgba(255,255,255,0.05)", backdropFilter: "blur(16px)",
            borderRadius: 20, padding: "1.5rem",
            border: "1px solid rgba(155,74,171,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "linear-gradient(135deg, rgba(155,74,171,0.3), rgba(90,16,104,0.4))",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem",
                border: "1px solid rgba(155,74,171,0.3)",
              }}>🏛️</div>
              <h3 style={{ fontWeight: 700, color: "#fff", fontSize: "1.05rem", margin: 0 }}>Floor Map</h3>
            </div>
            <VRView locations={locations} path={path} currentLocation={scannedLocation} />
          </div>
        )}
      </div>
    </div>
  );
}
