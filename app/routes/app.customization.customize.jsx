import { authenticate } from "../shopify.server";
import { Customization } from "../components/customization/Customization";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function CustomizeWidget() {
  return <Customization type="customize" />;
}
