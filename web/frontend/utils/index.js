export const getClampedNumber = (value, min, max) => {
    // Handle empty string or null (allows user to clear input temporarily)
    if (value === "" || value === null) return min;
  
    const parsed = parseInt(value, 10);
  
    // Fallback if parsing fails
    if (isNaN(parsed)) return min;
  
    // Clamp the value within range
    return Math.max(min, Math.min(max, parsed));
};

export const getWidgetPositionStyles = (positionValue, offset = 30) => {
  const styles = {
    position: "absolute",
    top: "auto",
    bottom: "auto",
    left: "auto",
    right: "auto",
    transform: "none",
  };

  const gap = `${offset}px`;

  switch (positionValue) {
    // Bottoms
    case "bottom-right":
      styles.bottom = gap;
      styles.right = gap;
      break;
    case "bottom-left":
      styles.bottom = gap;
      styles.left = gap;
      break;
    case "bottom-center":
      styles.bottom = gap;
      styles.left = "50%";
      styles.transform = "translateX(-50%)";
      break;

    // Tops
    case "top-right":
      styles.top = gap;
      styles.right = gap;
      break;
    case "top-left":
      styles.top = gap;
      styles.left = gap;
      break;
    case "top-center":
      styles.top = gap;
      styles.left = "50%";
      styles.transform = "translateX(-50%)";
      break;

    // Middles
    case "middle-right":
      styles.top = "50%";
      styles.right = "0";
      styles.transform = "translateY(-50%)";
      break;
    case "middle-left":
      styles.top = "50%";
      styles.left = "0";
      styles.transform = "translateY(-50%)";
      break;

    default:
      styles.bottom = gap;
      styles.right = gap;
  }

  return styles;
};

export const getDynamicStyles = (data, key) => {
  const config = data?.[key];
  if (!config) return {};

  return {
    backgroundColor: config.bgColor,
    color: config.textColor,
    fontSize: config.fontSize ? `${config.fontSize}px` : undefined,
    fontWeight: config.fontWeight,
    // Safely handle padding and radius if they exist in that specific config
    padding: config.paddingY !== undefined 
      ? `${config.paddingY}px ${config.paddingX}px` 
      : undefined,
    borderRadius: config.radius !== undefined 
      ? `${config.radius}px` 
      : undefined,
  };
};