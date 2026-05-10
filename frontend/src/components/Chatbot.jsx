import { useState, useRef, useEffect } from "react";
import { sendMessage } from "../services/chatbotService";

const SESSION_ID = crypto.randomUUID();

const DIR_ICON = {
  "STRAIGHT":    "⬆️",
  "LEFT":        "⬅️",
  "RIGHT":       "➡️",
  "BACK":        "⬇️",
  "ACUTE RIGHT": "↗️",
  "ACUTE LEFT":  "↖️",
};

const C = {
  purple:      "#7B2D8B",
  purpleLight: "#f5eef8",
  purpleBorder:"#e8d5f0",
  dark:        "#1a0f3d",
  muted:       "#6b5b95",
};

export default function Chatbot({ currentLocation = "", onStartAR, chatPath, setChatPath }) {
  const [messages, setMessages] = useState([
    { type: "text", from: "bot", reply: "Hi! I'm your SuperiorXR campus guide 🧭\nWhere would you like to go?" },
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { type: "text", from: "user", reply: text }]);
    setLoading(true);
    try {
      const { data } = await sendMessage(text, SESSION_ID, currentLocation);
      if (data.type === "route") {
        setChatPath && setChatPath(data.steps.map((s) => s.id));
      }
      setMessages((prev) => [...prev, { ...data, from: "bot" }]);
    } catch {
      setMessages((prev) => [...prev, { type: "text", from: "bot", reply: "Something went wrong. Please try again." }]);
    } finally { setLoading(false); }
  };

  const handleKey = (e) => e.key === "Enter" && send();

  return (
    <div style={{ background: "rgba(253,246,236,0.97)", borderRadius: 20, padding: "1.5rem", boxShadow: "0 8px 32px rgba(45,27,105,0.25)", display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.purple, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>🤖</div>
        <div>
          <div style={{ fontWeight: 700, color: C.dark, fontSize: "0.95rem" }}>Campus Guide</div>
          <div style={{ fontSize: "0.7rem", color: C.muted }}>Ask me anything about navigation</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ height: 380, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem", padding: "0.75rem", background: "#f5f0fa", borderRadius: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: "0.4rem" }}>
            {m.from === "bot" && (
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.purple, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", flexShrink: 0 }}>🤖</div>
            )}

            {m.type === "route" ? (
              <RouteCard steps={m.steps} onStartAR={onStartAR} />
            ) : (
              <div style={{
                maxWidth: "78%", padding: "0.65rem 0.9rem",
                borderRadius: m.from === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: m.from === "user" ? `linear-gradient(135deg, ${C.purple}, #5a1068)` : "#ffffff",
                color: m.from === "user" ? "#fdf6ec" : C.dark,
                fontSize: "0.875rem", lineHeight: 1.55,
                boxShadow: "0 2px 8px rgba(45,27,105,0.1)",
                whiteSpace: "pre-line",
              }}>{m.reply}</div>
            )}

            {m.from === "user" && (
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #3dba7e, #2a9060)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", flexShrink: 0 }}>👤</div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "0.4rem" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.purple, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem" }}>🤖</div>
            <div style={{ padding: "0.65rem 0.9rem", borderRadius: "16px 16px 16px 4px", background: "white", fontSize: "0.875rem", color: C.muted }}>
              <span style={{ letterSpacing: 2 }}>•••</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          style={{ flex: 1, padding: "0.75rem 1rem", border: `2px solid ${C.purpleBorder}`, borderRadius: 10, fontSize: "0.9rem", fontFamily: "Inter, sans-serif", outline: "none", color: C.dark, background: "white" }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask me where to go..."
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            padding: "0.75rem 1.1rem",
            background: input.trim() ? C.purple : "#e0d6f0",
            border: "none", borderRadius: 10,
            color: input.trim() ? "#fdf6ec" : "#a090c0",
            fontWeight: 700, fontSize: "0.9rem",
            cursor: input.trim() ? "pointer" : "not-allowed",
            fontFamily: "Inter, sans-serif",
            boxShadow: input.trim() ? "0 4px 12px rgba(123,45,139,0.3)" : "none",
          }}>Send</button>
      </div>
    </div>
  );
}

function RouteCard({ steps, onStartAR }) {
  return (
    <div style={{ maxWidth: "90%", background: "#fff", borderRadius: 16, padding: "0.9rem 1rem", boxShadow: "0 2px 12px rgba(123,45,139,0.12)", border: "1px solid #e8d5f0" }}>
      <div style={{ fontWeight: 700, color: "#1a0f3d", fontSize: "0.9rem", marginBottom: "0.75rem" }}>🛤️ Here's your route:</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {steps.map((step, i) => {
          const isFirst = i === 0;
          const isLast  = i === steps.length - 1;
          const icon    = DIR_ICON[step.direction] || "📍";
          return (
            <div key={step.id} style={{ display: "flex", alignItems: "stretch", gap: 10 }}>
              {/* Timeline */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 28, flexShrink: 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: isFirst ? "#7B2D8B" : isLast ? "#16A34A" : "#f5eef8",
                  border: isFirst || isLast ? "none" : "1.5px solid #e8d5f0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: isFirst || isLast ? 11 : 13,
                  fontWeight: 700,
                  color: isFirst || isLast ? "#fff" : "#7B2D8B",
                }}>
                  {isFirst ? "S" : isLast ? "E" : icon}
                </div>
                {!isLast && <div style={{ width: 2, flex: 1, minHeight: 16, background: "#e8d5f0", margin: "2px 0" }} />}
              </div>

              {/* Label + direction */}
              <div style={{ paddingBottom: isLast ? 0 : 10, paddingTop: 4 }}>
                <div style={{ fontSize: 13, fontWeight: isFirst || isLast ? 700 : 500, color: isFirst ? "#7B2D8B" : isLast ? "#16A34A" : "#1a0f3d" }}>
                  {step.label}
                  {isFirst && <span style={{ marginLeft: 6, fontSize: 10, background: "#f5eef8", color: "#7B2D8B", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>YOU ARE HERE</span>}
                  {isLast  && <span style={{ marginLeft: 6, fontSize: 10, background: "#f0fdf4", color: "#16A34A", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>DESTINATION</span>}
                </div>
                {step.direction && !isLast && (
                  <div style={{ fontSize: 11, color: "#6b5b95", marginTop: 1 }}>
                    {icon} {step.direction.charAt(0) + step.direction.slice(1).toLowerCase()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {onStartAR && (
        <button
          onClick={onStartAR}
          style={{
            marginTop: "0.9rem", width: "100%", padding: "0.7rem",
            background: "#7B2D8B", border: "none", borderRadius: 12,
            color: "#fff", fontWeight: 700, fontSize: "0.88rem",
            cursor: "pointer", fontFamily: "Inter, sans-serif",
            boxShadow: "0 4px 14px rgba(123,45,139,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
          📷 Start AR View
        </button>
      )}
    </div>
  );
}
