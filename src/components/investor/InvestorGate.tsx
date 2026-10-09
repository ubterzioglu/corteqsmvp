import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { LockKeyhole } from "lucide-react";

import {
  INVESTOR_LOCKOUT_MS,
  INVESTOR_MAX_ATTEMPTS,
  rememberInvestorSession,
  verifyInvestorPassword,
  type InvestorVerifier,
} from "@/lib/investor/investor-access";

interface InvestorGateProps {
  verifier: InvestorVerifier | null;
  onUnlock: () => void;
}

// Parola ekranı. ⚠️ İstemci taraflıdır — gerçek kilit değil (bkz. investor-access.ts).
// Doğrulayıcı yapılandırılmamışsa form hiç gösterilmez: sessizce açılmak YOK.
const InvestorGate = ({ verifier, onUnlock }: InvestorGateProps) => {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const controls = useAnimationControls();
  const inputRef = useRef<HTMLInputElement>(null);

  const locked = lockedUntil > now;
  const secondsLeft = Math.ceil((lockedUntil - now) / 1000);

  useEffect(() => {
    if (!locked) return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [locked]);

  // Kilit bitince mesajı temizle ve odağı alana geri ver (disabled iken odak kaybolur).
  useEffect(() => {
    if (locked || lockedUntil === 0) return;
    setMessage("");
    inputRef.current?.focus();
  }, [locked, lockedUntil]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || locked || !verifier) return;
    setBusy(true);
    let ok = false;
    try {
      ok = await verifyInvestorPassword(password, verifier);
    } catch {
      // Web Crypto yalnız güvenli bağlamda (https/localhost) vardır; yoksa düğme
      // "Doğrulanıyor…"da donmasın, kullanıcı nedenini görsün.
      setMessage("Bu tarayıcıda doğrulama yapılamadı. Lütfen güvenli bağlantı (https) kullanın.");
      return;
    } finally {
      setBusy(false);
    }

    if (ok) {
      rememberInvestorSession(verifier);
      onUnlock();
      return;
    }

    const nextAttempts = attempts + 1;
    setPassword("");
    void controls.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } });
    if (nextAttempts >= INVESTOR_MAX_ATTEMPTS) {
      const until = Date.now() + INVESTOR_LOCKOUT_MS;
      setAttempts(0);
      setLockedUntil(until);
      setNow(Date.now());
      setMessage("Çok fazla deneme. Lütfen biraz bekleyin.");
    } else {
      setAttempts(nextAttempts);
      setMessage("Parola doğrulanamadı.");
    }
    inputRef.current?.focus();
  };

  return (
    <div className="inv-gate-screen">
      <motion.div
        className="inv-gate-card"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="inv-gate-mark" aria-hidden="true">
          <LockKeyhole size={26} strokeWidth={1.75} />
        </div>
        <h1>Yatırımcı Alanı</h1>
        {verifier ? (
          <>
            <p>Bu sayfa davetlilere özeldir. Size iletilen parolayı girin.</p>
            <motion.form animate={controls} onSubmit={handleSubmit}>
              <label htmlFor="investor-password" className="sr-only">
                Parola
              </label>
              <input
                ref={inputRef}
                id="investor-password"
                className="inv-gate-input"
                type="password"
                autoComplete="current-password"
                autoFocus
                placeholder="Parola"
                value={password}
                disabled={locked}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (message && !locked) setMessage("");
                }}
              />
              <button type="submit" className="inv-gate-btn" disabled={busy || locked || !password}>
                {locked ? `${secondsLeft} sn bekleyin` : busy ? "Doğrulanıyor…" : "Giriş"}
              </button>
            </motion.form>
            <div className="inv-gate-msg" role="alert">
              {message}
            </div>
          </>
        ) : (
          <p role="alert">Bu alan şu anda yapılandırılmamış. Lütfen CorteQS ekibiyle iletişime geçin.</p>
        )}
        <div className="inv-gate-foot">CorteQS · Gizli</div>
      </motion.div>
    </div>
  );
};

export default InvestorGate;
