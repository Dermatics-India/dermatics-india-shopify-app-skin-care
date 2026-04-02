// import { Frame, Page, Layout } from "@shopify/polaris";
// import SidebarNav from "./SidebarNav.jsx";
// import { Outlet } from "react-router-dom";

// export default function AppShell() {
//   return (
//     <Frame navigation={<SidebarNav />}>
//       <Page fullWidth>
//         <Layout>
//           <Layout.Section>
//             <Outlet />
//           </Layout.Section>
//         </Layout>
//       </Page>
//     </Frame>
//   );
// }

// import { Frame, Page } from "@shopify/polaris";
// import SidebarNav from "./SidebarNav.jsx";
// import { Outlet } from "react-router-dom";


// export default function AppShell() {
//   return (
//     <Frame navigation={<SidebarNav />}>
//       <Page fullWidth>
//         <Outlet />
//       </Page>
//     </Frame>
//   );
// }

import { useState } from "react";
import { Frame, Page, Layout } from "@shopify/polaris";
import SidebarNav from "./SidebarNav.jsx";
import { Outlet } from "react-router-dom";

import FloatingChatButton from "./chat/FloatingChatButton";
import ChatWidgetPanel from "./chat/ChatWidgetPanel";

export default function AppShell() {

  // ✅ Chat state must be inside the component
  const [openChat, setOpenChat] = useState(false);

  return (
    <Frame navigation={<SidebarNav />}>

      {/* Main Page */}
      <Page fullWidth>
        <Layout>
          <Layout.Section>
            <Outlet />
          </Layout.Section>
        </Layout>
      </Page>

      {/* Chat Widget Panel */}
      <ChatWidgetPanel 
        open={openChat}
        onClose={() => setOpenChat(false)}
      />

      {/* Floating Chat Button */}
      <FloatingChatButton 
        onClick={() => setOpenChat(true)}
      />

    </Frame>
  );
}


