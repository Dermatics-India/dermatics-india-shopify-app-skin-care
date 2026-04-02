// import { Navigation } from "@shopify/polaris";
// import { useNavigate, useLocation } from "react-router-dom";

// export default function SidebarNav() {
//   const navigate = useNavigate();
//   const location = useLocation();

//   // Extract path without leading slash
//   const current = location.pathname.replace("/apps/new-derma/", "") || "";

//   return (
//     <Navigation location={location.pathname}>
//       <Navigation.Section
//         items={[
//           {
//             label: "Home",
//             selected: current === "",
//             onClick: () => navigate(""),
//           },
//           {
//             label: "Dashboard",
//             selected: current === "dashboard",
//             onClick: () => navigate("dashboard"),
//           },
//           {
//             label: "Pricing",
//             selected: current === "pricing",
//             onClick: () => navigate("pricing"),
//           },
//           {
//             label: "Settings",
//             selected: current === "settings",
//             onClick: () => navigate("settings"),
//           },
//         ]}
//       />
//     </Navigation>
//   );
// }

import { Navigation } from "@shopify/polaris";
import { useNavigate, useLocation } from "react-router-dom";

export default function SidebarNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract path without leading slash
  const current = location.pathname.replace("/apps/new-derma/", "") || "";

  return (
    <Navigation location={location.pathname}>
      <Navigation.Section
        items={[
          {
            label: "Home",
            selected: current === "",
            onClick: () => navigate(""),
          },
          {
            label: "Dashboard",
            selected: current === "dashboard",
            onClick: () => navigate("dashboard"),
          },
          {
            label: "Pricing",
            selected: current === "pricing",
            onClick: () => navigate("pricing"),
          },
          {
            label: "Settings",
            selected: current === "settings",
            onClick: () => navigate("settings"),
          },

          // ⭐⭐⭐ ADD YOUR NEW MENU HERE ⭐⭐⭐
          {
            label: "AI Analyze Widgets",
            selected: current === "ai-widgets",
            onClick: () => navigate("ai-widgets"),
          },
          // ⭐⭐⭐ END NEW MENU ⭐⭐⭐

          {
            label: "Support",
            selected: current === "support",
            onClick: () => navigate("support"),
          },

        ]}
      />
    </Navigation>
  );
}
