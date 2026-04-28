import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import api from "./services/api";

// Wake up Render backend on app load
api.get("/").catch(() => {});

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
