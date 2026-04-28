import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";

export default function Admin() {
  const { user, logout } = useAuth();
  const [tab, setTab]     = useState("stats");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin/dashboard").then(({ data }) => setStats(data)).catch(() => setError("Failed to load stats"));
    api.get("/admin/users").then(({ data }) => setUsers(data)).catch(() => setError("Failed to load users"));
  }, []);

  const handleRoleChange = async (id, role) => {
    await api.patch(`/admin/users/${id}/role?role=${role}`);
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this user?")) return;
    await api.delete(`/admin/users/${id}`);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, var(--purple-dark), var(--purple-mid) 60%, var(--purple-light))" }}>

      {/* Top bar */}
      <div style={{
        background: "rgba(253,246,236,0.07)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(253,246,236,0.12)",
        padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.5rem" }}>🛡️</span>
          <div>
            <div style={{ fontWeight: 700, color: "var(--cream)", fontSize: "1rem" }}>Admin Dashboard</div>
            <div style={{ fontSize: "0.75rem", color: "var(--cream-muted)" }}>{user?.email}</div>
          </div>
        </div>
        <button className="btn" onClick={logout}
          style={{ background: "rgba(253,246,236,0.1)", color: "var(--cream)", border: "1px solid rgba(253,246,236,0.2)", padding: "0.4rem 1rem", fontSize: "0.8rem" }}>
          Sign Out
        </button>
      </div>

      <div style={{ padding: "1.5rem", maxWidth: 900, margin: "0 auto" }}>

        {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}

        {/* Tab bar */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {[{ key: "stats", label: "📊 Statistics" }, { key: "users", label: "👥 Users" }].map(({ key, label }) => (
            <button key={key}
              className="btn"
              style={{
                background: tab === key ? "var(--cream)" : "rgba(253,246,236,0.1)",
                color: tab === key ? "var(--purple-dark)" : "var(--cream)",
                border: tab === key ? "none" : "1px solid rgba(253,246,236,0.2)",
                fontWeight: 600,
              }}
              onClick={() => setTab(key)}
            >{label}</button>
          ))}
        </div>

        {/* Stats tab */}
        {tab === "stats" && stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
            {[
              { label: "Total Users",  value: stats.total_users,    icon: "👤" },
              { label: "Students",     value: stats.total_students, icon: "🎓" },
              { label: "Admins",       value: stats.total_admins,   icon: "🛡️" },
            ].map(({ label, value, icon }) => (
              <div key={label} className="stat-card">
                <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>{icon}</div>
                <div className="stat-number">{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Users tab */}
        {tab === "users" && (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--cream-dark)" }}>
              <h3 style={{ color: "var(--purple-dark)", fontWeight: 700 }}>All Users</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.2rem" }}>{users.length} registered users</p>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 500 }}>{u.username}</td>
                      <td style={{ color: "var(--text-muted)" }}>{u.email}</td>
                      <td>
                        <span className={`badge badge-${u.role}`}>{u.role}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button className="btn btn-ghost"
                            style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}
                            onClick={() => handleRoleChange(u.id, u.role === "admin" ? "student" : "admin")}>
                            Make {u.role === "admin" ? "Student" : "Admin"}
                          </button>
                          <button className="btn btn-danger"
                            style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}
                            onClick={() => handleDelete(u.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
