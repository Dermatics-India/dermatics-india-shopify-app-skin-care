// import { Page, Layout, Card, TextStyle, Button, Stack } from "@shopify/polaris";

// export default function AIWidgetsPage() {
//   const widgets = [
//     {
//       id: "skin-widget",
//       title: "Skin Analyze Widget",
//       desc: "Add an AI-powered skin analysis widget to your store.",
//     },
//     {
//       id: "hair-widget",
//       title: "Hair Analyze Widget",
//       desc: "Help customers analyze their hair health with AI.",
//     },
//     {
//       id: "skin-hair-widget",
//       title: "Skin & Hair Analyze Widget",
//       desc: "Provide combined AI-powered skin + hair analysis.",
//     },
//   ];

//   return (
//     <Page title="AI Analyze Widgets">
//       <Layout>

//         {widgets.map((w) => (
//           <Layout.Section oneThird key={w.id}>
//             <Card sectioned>

//               <Stack vertical spacing="tight">
//                 <TextStyle variation="strong">{w.title}</TextStyle>

//                 <p>{w.desc}</p>

//                 <Button primary onClick={() => alert("Install coming soon")}>
//                   Install
//                 </Button>
//               </Stack>

//             </Card>
//           </Layout.Section>
//         ))}

//       </Layout>
//     </Page>
//   );
// }

// import {
//   Page,
//   Layout,
//   Card,
//   DisplayText,
//   Subheading,
//   Button,
//   Stack
// } from "@shopify/polaris";

// export default function AIWidgetsPage() {
//   const widgets = [
//     {
//       id: "skin-widget",
//       title: "Skin Analyze Widget",
//       desc: "Add an AI-powered skin analysis widget to your store.",
//     },
//     {
//       id: "hair-widget",
//       title: "Hair Analyze Widget",
//       desc: "Help customers analyze their hair health with AI.",
//     },
//     {
//       id: "skin-hair-widget",
//       title: "Skin & Hair Analyze Widget",
//       desc: "Provide combined AI-powered skin + hair analysis.",
//     },
//   ];

//   return (
//     <Page>
//       <div style={{ textAlign: "center", marginBottom: "30px" }}>
//         <DisplayText size="medium">AI Analyze Widgets</DisplayText>
//       </div>

//       <Layout>
//         {widgets.map((w) => (
//           <Layout.Section oneThird key={w.id}>
//             <Card sectioned>
//               <Stack vertical spacing="loose">

//                 <Subheading>{w.title}</Subheading>

//                 <p style={{ fontSize: "16px", color: "#444" }}>{w.desc}</p>

//                 <Button primary fullWidth onClick={() => alert("Install Coming Soon")}>
//                   Install
//                 </Button>

//               </Stack>
//             </Card>
//           </Layout.Section>
//         ))}
//       </Layout>
//     </Page>
//   );
// }

import {
  Page,
  Layout,
  Card,
  Heading,
  Button,
  Stack
} from "@shopify/polaris";

export default function AIWidgetsPage() {
  const widgets = [
    {
      id: "skin-widget",
      title: "Skin Analyze Widget",
      desc: "Add an AI-powered skin analysis widget to your store.",
    },
    {
      id: "hair-widget",
      title: "Hair Analyze Widget",
      desc: "Help customers analyze their hair health with AI.",
    },
    {
      id: "skin-hair-widget",
      title: "Skin & Hair Analyze Widget",
      desc: "Provide combined AI-powered skin + hair analysis.",
    },
  ];

  return (
    <Page>
      <div style={{ textAlign: "left", marginBottom: "30px" }}>
        <Heading element="h1" style={{ fontSize: "32px" }}>AI Analyze Widgets</Heading>
      </div>

      <Layout>
        {widgets.map((w) => (
          <Layout.Section oneThird key={w.id}>
            <Card sectioned>

              <Stack vertical spacing="loose">

                {/* Larger + Proper capitalization */}
                <Heading element="h2" style={{ fontSize: "18px", fontWeight: 600 }}>
                  {w.title}
                </Heading>

                <p style={{ fontSize: "14px", color: "#444" }}>{w.desc}</p>

                <Button primary fullWidth>
                  Install
                </Button>

              </Stack>

            </Card>
          </Layout.Section>
        ))}
      </Layout>
    </Page>
  );
}
