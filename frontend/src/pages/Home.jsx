import { useState } from "react";
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
  const [form, setForm]       = useState({ username: "", email: "", is_student: false, faculty: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    if (form.is_student && !form.faculty) {
      setError("Please select your faculty."); setLoading(false); return;
    }
    try {
      await api.post("/user/register", form);
      setShowPopup(true);
    } catch (err) {
      setError(err.response?.data?.detail ?? "Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="page-center">

      {/* ── Popup ── */}
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
            <h2 style={{ fontWeight: 700, color: "#2a0a30", fontSize: "1.3rem", marginBottom: "0.5rem" }}>
              Data Saved!
            </h2>
            <p style={{ color: "#7B2D8B", fontSize: "0.9rem", marginBottom: "1.75rem" }}>
              Welcome, <strong>{form.username}</strong>! Your details have been saved successfully.
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

      {/* ── Register Card ── */}
      <div className="card" style={{ width: "100%", maxWidth: 440 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: 68, height: 68, borderRadius: "50%",
            background: "linear-gradient(135deg, #7B2D8B, #5a1068)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1rem", fontSize: "2rem",
            boxShadow: "0 8px 24px rgba(123,45,139,0.35)"
          }}>🧭</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2a0a30", marginBottom: "0.3rem" }}>
            Campus Navigator
          </h1>
          <p style={{ color: "#7B2D8B", fontSize: "0.85rem" }}>
            AI-powered AR campus navigation
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          <div className="form-group">
            <label>Username</label>
            <input className="input" name="username" type="text"
              placeholder="Your full name"
              value={form.username} onChange={update} required />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input className="input" name="email" type="email"
              placeholder="you@university.edu"
              value={form.email} onChange={update} required />
          </div>

          {/* Student toggle */}
          <div style={{
            background: "#f5f0fa", borderRadius: 12, padding: "0.9rem 1rem",
            border: "1.5px solid #e8d5f0",
            display: "flex", alignItems: "center", justifyContent: "space-between"
          }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1a0f3d" }}>
              Are you a student?
            </span>
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

          {/* Faculty dropdown */}
          {form.is_student && (
            <div className="form-group">
              <label>Select Faculty</label>
              <select className="select" name="faculty" value={form.faculty} onChange={update} required>
                <option value="">Choose your faculty...</option>
                {FACULTIES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          )}

          {error && (
            <div className="alert alert-error">{error}</div>
          )}

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}
            style={{ padding: "0.9rem", fontSize: "0.95rem", marginTop: "0.25rem" }}>
            {loading ? "Saving..." : "Register"}
          </button>

        </form>
      </div>
    </div>
  );
}
