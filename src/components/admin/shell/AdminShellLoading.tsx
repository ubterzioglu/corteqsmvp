// Admin Panel V2 — shell yükleme durumu.

type AdminShellLoadingProps = {
  message?: string;
};

const AdminShellLoading = ({ message = "Yetki kontrol ediliyor..." }: AdminShellLoadingProps) => (
  <div
    role="status"
    aria-live="polite"
    className="flex min-h-screen items-center justify-center bg-background text-muted-foreground"
  >
    {message}
  </div>
);

export default AdminShellLoading;
