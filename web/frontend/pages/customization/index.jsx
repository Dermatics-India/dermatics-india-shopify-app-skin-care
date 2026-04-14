import { useEffect, useState } from 'react';
import { 
  Page, 
  Layout, 
  BlockStack, 
  Text, 
  Box
} from '@shopify/polaris';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppBridge } from '@shopify/app-bridge-react';

// Components 
import { CategoryCard } from '../../components/customization';

// Assets
import SkinCareIcon from "../../assets/skincare_cat.png";
import HairCareIcon from "../../assets/haircare_cat.png";
import customizeIcon from '../../assets/customize.png'

// Hooks 
import { useApi } from '../../hooks/useApi';
import { ENDPOINTS } from '../../utils/endpoints';

const Customization = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const api = useApi()
  const shopify = useAppBridge()

  const [shopData, setShopData] = useState(null)

  useEffect(() => {
    api.get(ENDPOINTS.GET_SHOP)
    .then((res) => {
      console.log("res:::", res)
      setShopData(res?.data)
    })
    .catch((err) => {
      console.log("err", err)
      shopify.toast.show("Failed to Fetch Shop")
    })
  }, [])

  return (
    <Page 
      // narrowWidth
    >
      <BlockStack gap="400">
        <Box paddingBlockEnd="400">
          <BlockStack gap="200">
            <Text variant="headingLg" as="h2">
              {t("Customization.title")}
            </Text>
            <Text as="p" tone="subdued">
              {t("Customization.subtitle")}
            </Text>
          </BlockStack>
        </Box>

        <Layout>
          <Layout.Section variant="oneThird">
            <CategoryCard 
              title={t("Customization.categories.customize.title")}
              description={t("Customization.categories.customize.description")}
              buttonText={t("Customization.categories.customize.button")}
              image={customizeIcon}
              onAction={() => navigate("/customization/customize")}
            />
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <CategoryCard 
              title={t("Customization.categories.skinCare.title")}
              description={t("Customization.categories.skinCare.description")}
              buttonText={t("Customization.categories.skinCare.button")}
              image={SkinCareIcon}
              onAction={() => navigate("/customization/skin")}
              disabled={!shopData?.permissions?.skinEnabled}
            />
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <CategoryCard 
              title={t("Customization.categories.hairCare.title")}
              description={t("Customization.categories.hairCare.description")}
              buttonText={t("Customization.categories.hairCare.button")}
              image={HairCareIcon}
              onAction={() => navigate("/customization/hair")}
              disabled={!shopData?.permissions?.hairEnabled}
            />
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>      
  );
};

export default Customization;