import type { ReactNode } from "react";

interface AdminPageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function AdminPageLayout({ children, className = "" }: AdminPageLayoutProps) {
  return (
    <div className={`relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 ${className}`}>
      {children}
    </div>
  );
}
