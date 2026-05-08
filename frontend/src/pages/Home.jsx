import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

const FACULTIES = [
  "Faculty of Business and Management Sciences",
  "Faculty of Economics and Commerce",
  "Faculty of Computer Science and Information Technology",
  "Faculty of Social Sciences",
  "Faculty of Allied Health Sciences",
  "Faculty of Art and Design",
  "Faculty of Pharmacy",
  "Faculty of Medical Sciences",
  "Faculty of Engineering and Technology",
  "Faculty of Sciences",
  "Faculty of Arts and Humanities",
  "Faculty of Law",
  "Faculty of Agriculture and Veterinary Sciences",
];

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = searchParams.get("location") || "";

  const [tab, setTab]         = useState("login"); // "login" | "register"
  const [form, setForm]       = useState({ username: "", email: "", is_student: false, faculty: "" });
  const [loginEmail, setLoginEmail] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");

  useEffect(() => {
    document.body.classList.add("home-bg");
    return () => document.body.classList.remove("home-bg");
  }, []);

  useEffect(() => {
    const registered = localStorage.getItem("campus_registered");
    if (registered && location) {
      navigate(`/portal?location=${location}`, { replace: true });
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data } = await api.post("/user/login", { email: loginEmail });
      setWelcomeName(data.username);
      localStorage.setItem("campus_registered", "true");
      setShowPopup(true);
    } catch (err) {
      setError(err.response?.data?.detail ?? "No account found. Please register first.");
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    if (form.is_student && !form.faculty) {
      setError("Please select your faculty."); setLoading(false); return;
    }
    try {
      await api.post("/user/register", form);
      setWelcomeName(form.username);
      localStorage.setItem("campus_registered", "true");
      setShowPopup(true);
    } catch (err) {
      setError(err.response?.data?.detail ?? "Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  const cardStyle = {
    width: "100%", maxWidth: 440,
    background: "rgba(253,246,236,0.85)",
    backdropFilter: "blur(12px)",
    borderRadius: 14,
    boxShadow: "0 8px 32px rgba(123,45,139,0.18)",
    padding: "2.5rem",
  };

  return (
    <div className="page-center" style={{ backgroundImage: "url('/dee.jpeg')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", minHeight: "100vh", position: "relative" }}>

      {/* Popup */}
      {showPopup && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 999,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem"
        }}>
          <div style={{
            background: "#fdf6ec", borderRadius: 20, padding: "2.5rem 2rem",
            textAlign: "center", maxWidth: 360, width: "100%",
            boxShadow: "0 20px 60px rgba(123,45,139,0.3)"
          }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>✅</div>
            <h2 style={{ fontWeight: 700, color: "#2a0a30", fontSize: "1.3rem", marginBottom: "0.5rem" }}>Welcome!</h2>
            <p style={{ color: "#7B2D8B", fontSize: "0.9rem", marginBottom: "1.75rem" }}>
              Hello, <strong>{welcomeName}</strong>! Ready to navigate campus?
            </p>
            <button
              onClick={() => navigate(location ? `/portal?location=${location}` : "/portal")}
              style={{
                width: "100%", padding: "0.9rem",
                background: "linear-gradient(135deg, #7B2D8B, #5a1068)",
                border: "none", borderRadius: 10,
                color: "#fdf6ec", fontSize: "1rem", fontWeight: 700,
                cursor: "pointer", fontFamily: "Inter, sans-serif",
                boxShadow: "0 4px 14px rgba(123,45,139,0.4)"
              }}>
              Continue to Navigator →
            </button>
          </div>
        </div>
      )}

      <div style={cardStyle}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{
            width: 68, height: 68, borderRadius: "50%",
            background: "linear-gradient(135deg, #7B2D8B, #5a1068)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1rem", fontSize: "2rem",
            boxShadow: "0 8px 24px rgba(123,45,139,0.35)"
          }}>🧭</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2a0a30", marginBottom: "0.3rem" }}>Campus Navigator</h1>
          <p style={{ color: "#7B2D8B", fontSize: "0.85rem" }}>AI-powered AR campus navigation</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: "#f0e6f5", borderRadius: 10, padding: "0.3rem", marginBottom: "1.5rem" }}>
          {["login", "register"].map((t) => (
            <button key={t} type="button" onClick={() => { setTab(t); setError(""); }} style={{
              flex: 1, padding: "0.55rem",
              background: tab === t ? "linear-gradient(135deg, #7B2D8B, #5a1068)" : "transparent",
              border: "none", borderRadius: 8,
              color: tab === t ? "#fdf6ec" : "#7B2D8B",
              fontWeight: 600, fontSize: "0.88rem",
              cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.2s",
            }}>{t === "login" ? "Login" : "Register"}</button>
          ))}
        </div>

        {/* Login Form */}
        {tab === "login" && (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group">
              <label>Email</label>
              <input className="input" type="email" placeholder="you@university.edu"
                value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}
              style={{ padding: "0.9rem", fontSize: "0.95rem" }}>
              {loading ? "Checking..." : "Login →"}
            </button>
            <p style={{ textAlign: "center", fontSize: "0.82rem", color: "#7B2D8B", marginTop: "0.25rem" }}>
              New here?{" "}
              <span onClick={() => { setTab("register"); setError(""); }}
                style={{ fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
                Register
              </span>
            </p>
          </form>
        )}

        {/* Register Form */}
        {tab === "register" && (
          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group">
              <label>Username</label>
              <input className="input" name="username" type="text" placeholder="Your full name"
                value={form.username} onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input className="input" name="email" type="email" placeholder="you@university.edu"
                value={form.email} onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })} required />
            </div>

            <div style={{
              background: "#f5f0fa", borderRadius: 12, padding: "0.9rem 1rem",
              border: "1.5px solid #e8d5f0",
              display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1a0f3d" }}>Are you a student?</span>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                {["Yes", "No"].map((opt) => {
                  const active = opt === "Yes" ? form.is_student : !form.is_student;
                  return (
                    <button key={opt} type="button"
                      onClick={() => setForm({ ...form, is_student: opt === "Yes", faculty: "" })}
                      style={{
                        padding: "0.35rem 1.1rem", borderRadius: 20, border: "none",
                        fontWeight: 600, fontSize: "0.82rem", cursor: "pointer",
                        background: active ? "linear-gradient(135deg, #7B2D8B, #5a1068)" : "#e8d5f0",
                        color: active ? "#fdf6ec" : "#7B2D8B",
                        fontFamily: "Inter, sans-serif", transition: "all 0.2s"
                      }}>{opt}</button>
                  );
                })}
              </div>
            </div>

            {form.is_student && (
              <div className="form-group">
                <label>Select Faculty</label>
                <select className="select" name="faculty" value={form.faculty}
                  onChange={(e) => setForm({ ...form, faculty: e.target.value })} required>
                  <option value="">Choose your faculty...</option>
                  {FACULTIES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            )}

            {error && <div className="alert alert-error">{error}</div>}

            <button className="btn btn-primary btn-full" type="submit" disabled={loading}
              style={{ padding: "0.9rem", fontSize: "0.95rem" }}>
              {loading ? "Saving..." : "Register"}
            </button>
            <p style={{ textAlign: "center", fontSize: "0.82rem", color: "#7B2D8B", marginTop: "0.25rem" }}>
              Already registered?{" "}
              <span onClick={() => { setTab("login"); setError(""); }}
                style={{ fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
                Login
              </span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
