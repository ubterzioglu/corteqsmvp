import { Component, type ErrorInfo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { reportClientError } from "@/lib/client-error-reports";
import { recoverFromWhiteScreen } from "@/lib/recoveryReload";

interface AppErrorBoundaryProps {
  children: ReactNode;
  /**
   * Değiştiğinde hata kartı kalkar ve çocuklar yeniden çizilir. Router içinde
   * `location.key` verilir (bkz. `RouterAppErrorBoundary`) — geri/ileri navigasyon
   * kullanıcıyı "Bir hata oluştu" ekranından kurtarır. `main.tsx`'teki dış sınır
   * router dışındadır ve resetKey almaz: son çare olarak kalır.
   */
  resetKey?: unknown;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: AppErrorBoundaryProps, prevState: AppErrorBoundaryState) {
    // prevState.hasError şartı: hata resetKey'i değiştiren navigasyonun kendisinde
    // oluştuysa ilk commit'te sıfırlayıp aynı hatayı ikinci kez fırlatmasın.
    if (this.state.hasError && prevState.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Application render error:", error, errorInfo);
    // "Bir hata oluştu" kartı m134'ün muhtemel yüzü — componentStack'i hiçbir
    // mutation onError'ı görmez, kalıcı kayıt yalnız buradan üretilebilir.
    reportClientError({
      source: "render",
      context: "AppErrorBoundary",
      error,
      componentStack: errorInfo.componentStack ?? null,
    });
  }

  handleReload = () => {
    recoverFromWhiteScreen({ forceReloadOnCooldown: true });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
          <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center shadow-card">
            <h1 className="text-2xl font-extrabold mb-3">Bir hata oluştu</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Sayfa yüklenirken bir sorun oluştu. Tekrar denemek için sayfayı yenileyebilirsiniz.
            </p>
            <Button onClick={this.handleReload} variant="hero" className="w-full">
              Sayfayı Yenile
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Router içindeki genel sınır: `location.key` değişince sıfırlanır. Router dışındaki
 * `main.tsx` sınırı son çare olarak durur.
 */
export function RouterAppErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  return <AppErrorBoundary resetKey={location.key}>{children}</AppErrorBoundary>;
}

export default AppErrorBoundary;