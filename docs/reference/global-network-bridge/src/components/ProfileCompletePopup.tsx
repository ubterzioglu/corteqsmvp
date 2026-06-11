import { useEffect, useState } from "react";
import { Sparkles, Clock, ShieldCheck, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = "corteqs.profileCompletePopupShown";

const ProfileCompletePopup = ({ onGoToSettings }: { onGoToSettings: () => void }) => {
  const { user, profileComplete, onboardingCompleted } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || !onboardingCompleted) return;
    if (profileComplete) return;
    const key = `${STORAGE_KEY}:${user.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    setOpen(true);
  }, [user, onboardingCompleted, profileComplete]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <DialogTitle className="mt-3">1 dakikada profilini tamamla, Caddeye çık 🎉</DialogTitle>
          <DialogDescription>
            Diaspora ağında diğer kullanıcılarla buluşman için profil ayarlarını tamamlamamız gerekiyor.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Yaklaşık 1 dakika sürer</li>
          <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Telefon ve konum doğrulaması güvenli ortam yaratır</li>
        </ul>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
            <X className="h-4 w-4 mr-1" /> Sonra
          </Button>
          <Button onClick={() => { setOpen(false); onGoToSettings(); }} className="flex-1">
            Tamamla & Caddeye çık
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileCompletePopup;
