import { useTranslation } from "react-i18next";

import { SkeletonBlock } from "./Skeletons";

export function WidgetPageLoader() {
  const { t } = useTranslation();

  return (
    <s-page heading={t("cmn.loading")}>
      <s-grid gridTemplateColumns="1fr 2fr" gap="base">
        <s-section>
          <SkeletonBlock lines={10} />
        </s-section>
        <s-section>
          <SkeletonBlock lines={15} minHeight="600px" />
        </s-section>
      </s-grid>
    </s-page>
  );
}
