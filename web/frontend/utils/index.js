export const getClampedNumber = (value, min, max) => {
    // Handle empty string or null (allows user to clear input temporarily)
    if (value === "" || value === null) return min;
  
    const parsed = parseInt(value, 10);
  
    // Fallback if parsing fails
    if (isNaN(parsed)) return min;
  
    // Clamp the value within range
    return Math.max(min, Math.min(max, parsed));
  };