import { useState, useRef, useEffect } from "react";
import { sendMessage } from "../services/chatbotService";

const SESSION_ID = crypto.randomUUID();

export default function Chatbot({ currentLocation = "" }) {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! I'm your campus guide. Where would you like to go?" },
  ]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { from: "user", text }]);
    setLoading(true);
    try {
      const { data } = await sendMessage(text, SESSION_ID, currentLocation);
      setMessages((prev) => [...prev, { from: "bot", text: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { from: "bot", text: "Something went wrong. Please try again." }]);
    } finally { setLoading(false); }
  };

  const handleKey = (e) => e.key === "Enter" && send();

  return (
    <div style={{
      background: "rgba(253,246,236,0.97)",
      borderRadius: 20, padding: "1.5rem",
      boxShadow: "0 8px 32px rgba(45,27,105,0.25)",
      display: "flex", flexDirection: "column", gap: "1rem"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "linear-gradient(135deg, #7c5cbf, #4a2c9e)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem"
        }}>🤖</div>
        <div>
          <div style={{ fontWeight: 700, color: "#1a0f3d", fontSize: "0.95rem" }}>Campus Guide</div>
          <div style={{ fontSize: "0.7rem", color: "#6b5b95" }}>Ask me anything about navigation</div>
        </div>
      </div>

      {/* Message list */}
      <div style={{
        height: 340, overflowY: "auto",
        display: "flex", flexDirection: "column", gap: "0.75rem",
        padding: "0.75rem", background: "#f5f0fa", borderRadius: 12
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: "0.4rem" }}>
            {m.from === "bot" && (
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #7c5cbf, #4a2c9e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", flexShrink: 0 }}>🤖</div>
            )}
            <div style={{
              maxWidth: "78%", padding: "0.65rem 0.9rem",
              borderRadius: m.from === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: m.from === "user"
                ? "linear-gradient(135deg, #4a2c9e, #2d1b69)"
                : "#ffffff",
              color: m.from === "user" ? "#fdf6ec" : "#1a0f3d",
              fontSize: "0.875rem", lineHeight: 1.55,
              boxShadow: "0 2px 8px rgba(45,27,105,0.1)",
              whiteSpace: "pre-line",
            }}>{m.text}</div>
            {m.from === "user" && (
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #3dba7e, #2a9060)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", flexShrink: 0 }}>👤</div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "0.4rem" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #7c5cbf, #4a2c9e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem" }}>🤖</div>
            <div style={{ padding: "0.65rem 0.9rem", borderRadius: "16px 16px 16px 4px", background: "white", fontSize: "0.875rem", color: "#6b5b95" }}>
              <span style={{ letterSpacing: 2 }}>•••</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          style={{
            flex: 1, padding: "0.75rem 1rem",
            border: "2px solid #e8dff5", borderRadius: 10,
            fontSize: "0.9rem", fontFamily: "Inter, sans-serif",
            outline: "none", color: "#1a0f3d", background: "white"
          }}
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
            background: input.trim() ? "linear-gradient(135deg, #4a2c9e, #2d1b69)" : "#e0d6f0",
            border: "none", borderRadius: 10,
            color: input.trim() ? "#fdf6ec" : "#a090c0",
            fontWeight: 700, fontSize: "0.9rem",
            cursor: input.trim() ? "pointer" : "not-allowed",
            fontFamily: "Inter, sans-serif",
            boxShadow: input.trim() ? "0 4px 12px rgba(74,44,158,0.3)" : "none",
          }}>Send</button>
      </div>
    </div>
  );
}
