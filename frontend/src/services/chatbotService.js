import api from "./api";

export const sendMessage = (message, session_id, current_location = "") =>
  api.post("/chatbot", { message, session_id, current_location });
