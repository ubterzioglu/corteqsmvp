import { Component, type ErrorInfo, type ReactNode } from "react";

interface SectionErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  sectionName?: string;
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`${this.props.sectionName ?? "Section"} render error:`, error, errorInfo);
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