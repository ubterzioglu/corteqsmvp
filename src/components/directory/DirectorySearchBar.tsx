import { Search, X } from "lucide-react";

interface DirectorySearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const DirectorySearchBar = ({
  value,
  onChange,
  placeholder = "İsim, bio veya role özel alan ara...",
}: DirectorySearchBarProps) => {
  return (
    <div className="relative flex items-center gap-3 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-[0_22px_45px_-28px_rgba(15,23,42,0.26)] backdrop-blur-xl">
      <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Aramayı temizle"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
};

export default DirectorySearchBar;
