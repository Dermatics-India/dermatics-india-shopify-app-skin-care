 import { useTranslation } from "react-i18next";
 
 
export const useCustomizeData = () => {
    const { t } = useTranslation();
    const tabs = [
        { id: "widget-settings", content: t("Customization.settings.tabs.widget"), panelID: "widget" },
        { id: "drawer-settings", content: t("Customization.settings.tabs.drawer"), panelID: "drawer" },
    ];
    
    const fontWeightOptions = [
        { label: t("cmn.normal"), value: "normal" },
        { label: t("cmn.bold"), value: "bold" },
        { label: t("cmn.bolder"), value: "bolder" },
    ];
    
    const fontOptions = [
        { label: t("cmn.sansSerif"), value: "sans-serif" },
        { label: t("cmn.serif"), value: "serif" },
        { label: t("cmn.monospace"), value: "monospace" },
    ];
    
    const displayTypeOptions = [
        { label: t("Customization.settings.widget.iconOnly"), value: "icon" },
        { label: t("Customization.settings.widget.textLabel"), value: "text" },
    ];

    return { tabs, fontWeightOptions, fontOptions, displayTypeOptions }
    
}