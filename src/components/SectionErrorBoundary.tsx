import { Component, type ErrorInfo, type ReactNode } from "react";

import { reportClientError } from "@/lib/client-error-reports";

interface SectionErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  sectionName?: string;
  /**
   * Değiştiğinde hata durumu sıfırlanır (ör. `location.key`). Çocuklar hatasız
   * durumda YENİDEN MOUNT EDİLMEZ — yalnız hata kartı kalkar. `key={location.key}`
   * yerine bu kullanılır; aksi hâlde her `setSearchParams` sayfanın state'ini silerdi.
   */
  resetKey?: unknown;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
}

class SectionErrorBoundary extends Component<SectionErrorBoundaryProps, SectionErrorBoundaryState> {
  state: SectionErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): SectionErrorBoundaryState {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: SectionErrorBoundaryProps, prevState: SectionErrorBoundaryState) {
    // prevState.hasError şartı: hatanın yakalandığı ilk commit'te (hata, resetKey'i
    // değiştiren navigasyonun kendisinde oluştuysa) hemen sıfırlayıp döngüye girmesin.
    if (this.state.hasError && prevState.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`${this.props.sectionName ?? "Section"} render error:`, error, errorInfo);
    reportClientError({
      source: "render",
      context: `SectionErrorBoundary:${this.props.sectionName ?? "Section"}`,
      error,
      componentStack: errorInfo.componentStack ?? null,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-card">
              <p className="text-sm font-medium text-foreground">Bu bölüm şu anda yüklenemedi.</p>
              <p className="mt-2 text-sm text-muted-foreground">Sayfanın geri kalanı kullanılabilir durumda.</p>
            </div>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}

export default SectionErrorBoundary;