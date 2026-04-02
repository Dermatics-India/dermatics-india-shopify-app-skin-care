// import { HashRouter } from "react-router-dom";

// import PolarisProvider from "./components/providers/PolarisProvider.jsx";
// import QueryProvider from "./components/providers/QueryProvider.jsx";
// import AppRoutes from "./Routes.jsx";

// export default function App() {
//   return (
//     <PolarisProvider>
//       <QueryProvider>

//         {/* IMPORTANT: HashRouter works inside Shopify iframe */}
//         <HashRouter>
//           <AppRoutes />
//         </HashRouter>

//       </QueryProvider>
//     </PolarisProvider>
//   );
// }

import { HashRouter } from "react-router-dom";
import { useEffect, useState } from "react";

import PolarisProvider from "./components/providers/PolarisProvider.jsx";
import QueryProvider from "./components/providers/QueryProvider.jsx";
import AppRoutes from "./Routes.jsx";

// Shopify App Bridge
import createApp from "@shopify/app-bridge";
import { getSessionToken } from "@shopify/app-bridge-utils";

export default function App() {
  const [sessionToken, setSessionToken] = useState("");

  // ----------------------------------------------------
  // 1️⃣ Initialize App Bridge + Get Session JWT Token
  // ----------------------------------------------------
  useEffect(() => {
    const host = new URLSearchParams(window.location.search).get("host");

    if (!host) {
      console.warn("⚠️ No host= query parameter found in URL");
      return;
    }

    const appBridge = createApp({
      apiKey: import.meta.env.VITE_SHOPIFY_API_KEY,
      host,
      forceRedirect: true,
    });

    getSessionToken(appBridge).then((token) => {
      console.log("🔐 Shopify Session Token:", token);
      setSessionToken(token);
    });
  }, []);

  // ----------------------------------------------------
  // 2️⃣ App Wrapper — NO UI here!
  // ----------------------------------------------------
  return (
    <PolarisProvider>
      <QueryProvider>
        {/* Shopify requires HashRouter inside app bridge iframe */}
        <HashRouter>
          {/* Pass token to all pages */}
          <AppRoutes sessionToken={sessionToken} />
        </HashRouter>
      </QueryProvider>
    </PolarisProvider>
  );
}



