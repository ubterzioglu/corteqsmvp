import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { recoverFromWhiteScreen } from "@/lib/recoveryReload";

interface AppErrorBoundaryProps {
  children: ReactNode;
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Application render error:", error, errorInfo);
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

export default AppErrorBoundary;