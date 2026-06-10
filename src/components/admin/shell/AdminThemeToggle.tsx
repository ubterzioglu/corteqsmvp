// Admin Panel V2 — admin'e özel dark/light toggle.
// Projede global ThemeProvider mount edilmediği için tema yalnızca admin
// shell yaşam döngüsünde yönetilir: documentElement'a "dark" class'ı
// eklenir/kaldırılır (tailwind darkMode: ["class"]), tercih localStorage'da
// tutulur ve shell unmount olduğunda class temizlenir — public site
// etkilenmez.

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ADMIN_STORAGE_KEYS, readAdminStorage, writeAdminStorage } from "@/lib/admin-shell/admin-storage";

type AdminTheme = "light" | "dark";

const AdminThemeToggle = () => {
  const [theme, setTheme] = useState<AdminTheme>(() =>
    readAdminStorage<AdminTheme>(ADMIN_STORAGE_KEYS.theme, "light") === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, [theme]);

  const toggle = () => {
    setTheme((previous) => {
      const next: AdminTheme = previous === "dark" ? "light" : "dark";
      writeAdminStorage(ADMIN_STORAGE_KEYS.theme, next);
      return next;
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
};

export default AdminThemeToggle;
