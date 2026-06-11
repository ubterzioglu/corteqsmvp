import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const fallbackSupabaseUrl = "https://azrxqgzfryzpaqchhrkk.supabase.co";
  const fallbackSupabasePublishableKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cnhxZ3pmcnl6cGFxY2hocmtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1OTg0NzgsImV4cCI6MjA5MzE3NDQ3OH0.lKV9NbaeBOyV3u75KBfhw0xKFHtVeIm4xYGL2wvbnhI";

  return {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(env.VITE_SUPABASE_URL || fallbackSupabaseUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        env.VITE_SUPABASE_PUBLISHABLE_KEY || fallbackSupabasePublishableKey,
      ),
    },
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
