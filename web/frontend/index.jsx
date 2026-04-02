import React from "react";
import { createRoot } from "react-dom/client";

// IMPORT providers
import PolarisProvider from "./components/providers/PolarisProvider.jsx";
import QueryProvider from "./components/providers/QueryProvider.jsx";

import App from "./App.jsx";
import { initI18n } from "./utils/i18nUtils";

// (Optional) if you want to re-export them for other files
export { default as PolarisProviderExport } from "./components/providers/PolarisProvider.jsx";
export { default as QueryProviderExport } from "./components/providers/QueryProvider.jsx";

initI18n().then(() => {
  const rootElement = document.getElementById("app") || document.getElementById("root");
  const root = createRoot(rootElement);

  root.render(
    <PolarisProvider>
      <QueryProvider>
        <App />
      </QueryProvider>
    </PolarisProvider>
  );
});
