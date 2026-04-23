const baseConfig = {
  widget: {
    position: "bottom-right",
    buttonText: "Analyze Skin",
    bgColor: "#0084ff",
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
      bgColor: "#0084ff",
    },
    bubble: {
      boat: {
        bgColor: "#f4f4f4",
        radius: 12,
        heading: {
          fontSize: 14,
          fontWeight: "bold",
          color: "#111111",
          marginTop: 0,
          marginRight: 0,
          marginBottom: 4,
          marginLeft: 0,
        },
        text: {
          fontSize: 14,
          fontWeight: "normal",
          color: "#333333",
          marginTop: 0,
          marginRight: 0,
          marginBottom: 0,
          marginLeft: 0,
        },
      },
      user: {
        bgColor: "#0084ff",
        radius: 12,
        heading: {
          fontSize: 14,
          fontWeight: "bold",
          color: "#ffffff",
          marginTop: 0,
          marginRight: 0,
          marginBottom: 4,
          marginLeft: 0,
        },
        text: {
          fontSize: 14,
          fontWeight: "normal",
          color: "#ffffff",
          marginTop: 0,
          marginRight: 0,
          marginBottom: 0,
          marginLeft: 0,
        },
      },
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
};

