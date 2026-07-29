import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import AppErrorBoundary from "./components/AppErrorBoundary.tsx";
import { installChunkErrorRecovery } from "./lib/recoveryReload";
import "./index.css";

installChunkErrorRecovery();

/**
 * Tarayıcının kendi scroll geri yüklemesini kapatır.
 *
 * Varsayılan `auto` davranışında F5'te tarayıcı ESKİ scroll offset'ini geri yükler; bunu
 * lazy chunk + async veri gelmeden, sayfa henüz kısayken yapar. İçerik sonradan büyüyünce
 * kullanıcı sayfanın dibinde (footer'da) kalır — <ScrollToTop /> mount'ta 0'a kaydırsa bile
 * tarayıcının geri yüklemesi sonradan çalıştığı için yarışı kaybeder.
 *
 * Uygulama zaten her rota değişiminde en üste kaydırıyor (<ScrollToTop />), dolayısıyla
 * `manual` moda geçmek mevcut bir davranışı kaybettirmez; yalnız F5 yarışını ortadan kaldırır.
 * URL hash'i (#bolum) bu ayardan bağımsızdır — tarayıcı fragment'a kaydırmayı sürdürür.
 */
if (typeof history !== "undefined" && "scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const rootElement = document.getElementById("root")!;

const tree = (
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, tree);
} else {
  createRoot(rootElement).render(tree);
}
