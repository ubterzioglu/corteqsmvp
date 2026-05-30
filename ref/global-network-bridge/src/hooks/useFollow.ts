import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = "corteqs:followed";
const ACCEPTED_KEY = "corteqs:follow-accepted";

type FollowMap = Record<string, true>;

const read = (key: string): FollowMap => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const write = (key: string, map: FollowMap) => {
  try {
    localStorage.setItem(key, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent("corteqs:follow-change"));
  } catch {}
};

const makeKey = (kind: string, id: string) => `${kind}:${id}`;

export function useFollow() {
  const [map, setMap] = useState<FollowMap>(() => (typeof window !== "undefined" ? read(STORAGE_KEY) : {}));
  const [accepted, setAccepted] = useState<FollowMap>(() => (typeof window !== "undefined" ? read(ACCEPTED_KEY) : {}));
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const sync = () => {
      setMap(read(STORAGE_KEY));
      setAccepted(read(ACCEPTED_KEY));
    };
    window.addEventListener("storage", sync);
    window.addEventListener("corteqs:follow-change", sync as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("corteqs:follow-change", sync as EventListener);
    };
  }, []);

  const isFollowed = useCallback(
    (kind: string, id: string) => !!map[makeKey(kind, id)],
    [map]
  );

  /** Whether the recipient has accepted our follow request — required to message. */
  const isFollowAccepted = useCallback(
    (kind: string, id: string) => !!accepted[makeKey(kind, id)],
    [accepted]
  );

  const toggle = useCallback(
    (kind: string, id: string, name: string) => {
      if (!user) {
        toast({
          title: "Giriş gerekli",
          description: "Takip etmek için lütfen giriş yapın veya kayıt olun.",
          variant: "destructive",
        });
        navigate("/auth");
        return false;
      }
      const key = makeKey(kind, id);
      const current = read(STORAGE_KEY);
      const acc = read(ACCEPTED_KEY);
      if (current[key]) {
        delete current[key];
        delete acc[key];
        write(STORAGE_KEY, current);
        write(ACCEPTED_KEY, acc);
        setMap({ ...current });
        setAccepted({ ...acc });
        toast({ title: "Takipten çıkıldı", description: `${name} artık takip edilmiyor.` });
        return false;
      }
      current[key] = true;
      write(STORAGE_KEY, current);
      setMap({ ...current });
      toast({
        title: "Takip isteği gönderildi 🔔",
        description: `${name} isteğini onayladığında mesaj gönderebileceksin.`,
      });
      // Mock: auto-accept after a short delay so the user can continue
      setTimeout(() => {
        const a = read(ACCEPTED_KEY);
        a[key] = true;
        write(ACCEPTED_KEY, a);
        setAccepted({ ...a });
      }, 2500);
      return true;
    },
    [toast, user, navigate]
  );

  const list = useCallback(
    (kind?: string) => {
      const entries = Object.keys(map);
      if (!kind) return entries;
      const prefix = `${kind}:`;
      return entries.filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length));
    },
    [map]
  );

  return { isFollowed, isFollowAccepted, toggle, list };
}
