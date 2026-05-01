import { useEffect } from "react";

/**
 * Registra o Service Worker apenas em produção e fora de iframes/preview.
 * Mantém o app funcional offline depois da primeira visita.
 */
export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const isInIframe = (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();

    const host = window.location.hostname;
    const isPreviewHost =
      host.includes("id-preview--") ||
      host.includes("lovableproject.com") ||
      host === "localhost" ||
      host === "127.0.0.1";

    if (isInIframe || isPreviewHost) {
      // Limpa SWs antigos em ambientes de preview
      navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
      return;
    }

    // Registra SW gerado pelo vite-plugin-pwa
    const url = "/sw.js";
    navigator.serviceWorker
      .register(url, { scope: "/" })
      .catch((err) => console.warn("[PWA] register failed", err));
  }, []);

  return null;
}
