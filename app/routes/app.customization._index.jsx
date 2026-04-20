import { useNavigate } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { authenticate } from "../shopify.server";
import { useShop } from "../providers/ShopProvider";
import { CategoryCard } from "../components/customization/CategoryCard";

const SkinCareIcon = "/assets/skincare_cat.png";
const HairCareIcon = "/assets/haircare_cat.png";
const customizeIcon = "/assets/customize.png";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function CustomizationIndex() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { permissions } = useShop();

  return (
    <s-page>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingBottom: "16px" }}>
          <s-heading size="large">{t("Customization.title")}</s-heading>
          <s-paragraph tone="subdued">{t("Customization.subtitle")}</s-paragraph>
        </div>

        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(260px, 1fr))" gap="base">
          <CategoryCard
            title={t("Customization.categories.customize.title")}
            description={t("Customization.categories.customize.description")}
            buttonText={t("Customization.categories.customize.button")}
            image={customizeIcon}
            onAction={() => navigate("/app/customization/customize")}
          />
          <CategoryCard
            title={t("Customization.categories.skinCare.title")}
            description={t("Customization.categories.skinCare.description")}
            buttonText={t("Customization.categories.skinCare.button")}
            image={SkinCareIcon}
            onAction={() => navigate("/app/customization/skin")}
            disabled={!permissions?.skinEnabled}
          />
          <CategoryCard
            title={t("Customization.categories.hairCare.title")}
            description={t("Customization.categories.hairCare.description")}
            buttonText={t("Customization.categories.hairCare.button")}
            image={HairCareIcon}
            onAction={() => navigate("/app/customization/hair")}
            disabled={!permissions?.hairEnabled}
          />
        </s-grid>
      </div>
    </s-page>
  );
}
