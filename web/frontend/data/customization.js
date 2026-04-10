const baseConfig = {
  widget: {
    buttonText: "Analyze Skin",
    bgColor: "#000000",
    textColor: "#ffffff",
    fontSize: 16,
    fontWeight: "normal",
    paddingX: 24,
    paddingY: 12,
    radius: 30,
  },
  drawer: {
    bgColor: "#ffffff",
    header: {
      label: "Header Text",
      fontFamily: "sans-serif",
      fontSize: 18,
      fontWeight: "normal",
      textColor: "#ffffff",
      bgColor: "#333333",
    },
    bubble: {
      boat: {
        height: 60,
        width: "80%",
        radius: 12,
        bgColor: "#f4f4f4",
        textColor: "#333333",
        fontSize: 14,
        fontWeight: "normal",
      },
      user: {
        height: 60,
        width: "80%",
        radius: 12,
        bgColor: "#f4f4f4",
        textColor: "#333333",
        fontSize: 14,
        fontWeight: "normal",
      }
    },
  },
};

export const defaultSettings = {
  ...baseConfig,
  modules: {
    skinCare: {
      enabled: true,
      text: {
        label: "Skin Analysis",
        textColor: "#333333",
        fontSize: 14,
        fontWeight: "normal",
      },
      image: {
        url: "",
        height: 50,
        width: 50,
        radius: 15,
      },
    },
    hairCare: {
      enabled: true,
      text: {
        label: "Hair Analysis",
        textColor: "#333333",
        fontSize: 14,
        fontWeight: "normal",
      },
      image: {
        url: "",
        height: 50,
        width: 50,
        radius: 15,
      },
    },
  },
  flags: {
    skinEnabled: true,
    hairEnabled: true,
  },
};

