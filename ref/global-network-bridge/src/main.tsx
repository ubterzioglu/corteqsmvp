import { createRoot } from "react-dom/client";
import "./index.css";
import { recoverFromWhiteScreen, setupWhiteScreenRecovery } from "@/lib/recoveryReload";

const BOOTSTRAP_TIMEOUT_MS = 12000;

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element bulunamadı.");
}

const root = createRoot(rootElement);

const renderBootstrapShell = () => {
  root.render(
    <div data-bootstrap-shell="true" className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center shadow-card">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary" aria-hidden="true" />
        <h1 className="text-2xl font-extrabold mb-3">Uygulama yükleniyor</h1>
        <p className="text-sm text-muted-foreground">
          İçerik hazırlanıyor. Bu ekran birkaç saniyeden uzun sürerse sayfa otomatik olarak kurtarılacaktır.
        </p>
      </div>
    </div>,
  );
};

const renderBootstrapFallback = () => {
  root.render(
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center shadow-card">
        <h1 className="text-2xl font-extrabold mb-3">Sayfa yüklenemedi</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Uygulama başlatılırken bir hata oluştu. Tekrar denemek için sayfayı yenileyin.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Sayfayı Yenile
        </button>
      </div>
    </div>,
  );
};

const bootstrapApp = async () => {
  setupWhiteScreenRecovery();
  renderBootstrapShell();

  try {
    const { default: App } = await Promise.race([
      import("./App.tsx"),
      new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error("Application bootstrap timed out.")), BOOTSTRAP_TIMEOUT_MS);
      }),
    ]);
    root.render(<App />);
  } catch (error) {
    console.error("Application bootstrap error:", error);
    const recovered = recoverFromWhiteScreen();
    if (!recovered) {
      renderBootstrapFallback();
    }
  }
};

void bootstrapApp();

