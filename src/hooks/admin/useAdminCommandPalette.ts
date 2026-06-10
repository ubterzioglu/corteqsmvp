// Admin Panel V2 — command palette aç/kapa durumu ve Ctrl/Cmd+K kısayolu.

import { useCallback, useEffect, useState } from "react";

export type AdminCommandPaletteState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export function useAdminCommandPalette(): AdminCommandPaletteState {
  const [open, setOpen] = useState(false);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      setOpen((previous) => !previous);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { open, setOpen };
}
