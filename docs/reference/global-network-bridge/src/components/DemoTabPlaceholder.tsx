import { ImageOff } from "lucide-react";

interface DemoTabPlaceholderProps {
  label?: string;
}

const DemoTabPlaceholder = ({ label = "Demo içerik" }: DemoTabPlaceholderProps) => {
  return (
    <div className="bg-card rounded-2xl border border-dashed border-border p-10 shadow-card text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <ImageOff className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground font-body mt-1">
        Bu alan demo amaçlıdır — gerçek içerikler yakında yayınlanacak.
      </p>
    </div>
  );
};

export default DemoTabPlaceholder;
