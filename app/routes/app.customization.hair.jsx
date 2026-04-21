import { authenticate } from "../shopify.server";
import { loadShopRecord } from "../lib/shopAuth.server";
import { getSettings } from "../lib/settings.server";
import { Customization } from "../components/customization/Customization";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shopRecord = await loadShopRecord(session);
  const { body } = await getSettings({ shopRecord });
  return Response.json(body);
};

export default function CustomizeHairCare() {
  return <Customization type="hairCare" />;
}
