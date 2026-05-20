import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isMobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);

function getDefaultHelpText(): string {
  if (!window.isSecureContext) {
    return 'Abriste la app por HTTP (ej. 192.168.x.x:5173). Chrome en Android no permite instalar PWAs sin HTTPS. Despliega el cliente en Railway/Netlify/Vercel y abre la URL https://…';
  }
  return 'Chrome: menú ⋮ (arriba a la derecha) → "Instalar aplicación" o "Añadir a pantalla de inicio". iPhone: Compartir → Añadir a pantalla de inicio.';
}

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showHelp, setShowHelp] = useState(!isStandalone && isMobile);
  const [helpText, setHelpText] = useState(getDefaultHelpText);

  useEffect(() => {
    if (isStandalone) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
      setHelpText('Pulsa "Instalar app" abajo o usa el menú ⋮ → Instalar aplicación.');
    };

    const onInstalled = () => {
      setInstallPrompt(null);
      setShowInstallButton(false);
      setShowHelp(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    setShowInstallButton(false);
  }, [installPrompt]);

  return { showHelp, helpText, showInstallButton, install };
}
