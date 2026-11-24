import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n";
import App from "./App";
import { supabaseConfigured } from "./lib/supabase";

const root = createRoot(document.getElementById("root")!);

if (!supabaseConfigured) {
  root.render(
    <div style={{ padding: 32, fontFamily: "system-ui, sans-serif" }}>
      <h1>Configuração incompleta</h1>
      <p>Configure VITE_SUPABASE_URL e VITE_SUPABASE_KEY nas variáveis de ambiente da Vercel e publique de novo.</p>
    </div>,
  );
} else {
  root.render(<App />);
}
