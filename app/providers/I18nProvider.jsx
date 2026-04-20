import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import i18next from "i18next";
import { initI18n } from "../utils/i18nUtils";

// Initialises i18next lazily on the client and waits for translations to
// load before rendering children. During the first tick (or SSR) we return
// null so nothing flickers with untranslated keys.
export function I18nProvider({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    initI18n().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;

  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
}
