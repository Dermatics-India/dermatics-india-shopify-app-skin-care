// import { Routes, Route } from "react-router-dom";
// import AppShell from "./components/AppShell";
// import HomePage from "./pages/HomePage";
// import Dashboard from "./pages/Dashboard";
// import Pricing from "./pages/Pricing";
// import Settings from "./pages/Settings";
// import NotFound from "./pages/NotFound";

// export default function AppRoutes() {
//   return (
//     <Routes>
//       <Route path="/" element={<AppShell />}>
//         <Route index element={<HomePage />} />
//         <Route path="dashboard" element={<Dashboard />} />
//         <Route path="pricing" element={<Pricing />} />
//         <Route path="settings" element={<Settings />} />
//       </Route>

//       <Route path="*" element={<NotFound />} />
//     </Routes>
//   );
// }

// import { Routes, Route } from "react-router-dom";
// import AppShell from "./components/AppShell";
// import HomePage from "./pages/HomePage";
// import Dashboard from "./pages/Dashboard";
// import Pricing from "./pages/Pricing";
// import Settings from "./pages/Settings";
// import NotFound from "./pages/NotFound";

// // ⭐ Add this import
// import AIWidgetsPage from "./pages/AIWidgetsPage";
// import SupportPage from "./pages/SupportPage";

// export default function AppRoutes() {
//   return (
//     <Routes>
//       <Route path="/" element={<AppShell />}>

//         <Route index element={<HomePage />} />
//         <Route path="dashboard" element={<Dashboard />} />
//         <Route path="pricing" element={<Pricing />} />
//         <Route path="settings" element={<Settings />} />

//         {/* ⭐ New Route for AI Analyze Widgets */}
//         <Route path="ai-widgets" element={<AIWidgetsPage />} />
//         <Route path="support" element={<SupportPage />} />

//       </Route>

//       <Route path="*" element={<NotFound />} />
//     </Routes>
//   );
// }

import { Routes, Route } from "react-router-dom";
import AppShell from "./components/AppShell";

// Correct page imports
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Your valid pages
import AIWidgetsPage from "./pages/AIWidgetsPage";
import SupportPage from "./pages/SupportPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>

        <Route index element={<HomePage />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="settings" element={<Settings />} />
        
        {/* AI Widgets */}
        <Route path="ai-widgets" element={<AIWidgetsPage />} />

        {/* Support */}
        <Route path="support" element={<SupportPage />} />

      </Route>

      {/* 404 fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
