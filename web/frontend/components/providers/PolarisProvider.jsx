import { AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";

function PolarisProvider({ children }) {
  return <AppProvider i18n={en}>{children}</AppProvider>;
}

export default PolarisProvider;
