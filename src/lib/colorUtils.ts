const BRANDING_COLORS_KEY = "brandingColors";
interface BrandingColors {
  primary: string;
  secondary: string;
  [key: string]: string;
}

export const updateThemeColors = (brandingColors: any) => {
  if (!brandingColors) return;

  // Save to localStorage
  localStorage.setItem(BRANDING_COLORS_KEY, JSON.stringify(brandingColors));

  // Update CSS variables
  const root = document.documentElement;
  Object.entries(brandingColors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value as string);
  });
};

export const loadThemeColors = () => {
  try {
    const storedColors = localStorage.getItem(BRANDING_COLORS_KEY);
    if (!storedColors) return;

    const brandingColors = JSON.parse(storedColors);
    const root = document.documentElement;

    Object.entries(brandingColors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value as string);
    });
  } catch (error) {
    console.error("Error loading theme colors from storage:", error);
  }
};

export const resetThemeColors = () => {
  const root = document.documentElement;
  const defaultColors: BrandingColors = {
    primary: "#3e5b93",
    secondary: "#228ab9",
    accent: "#c0db70",
    info: "#6366f1",
    success: "#28a745",
    warning: "#f97316",
    danger: "#dc3545",
    neutral: "#8b5cf6",
    light: "#f8f9fa",
    dark: "#343a40",
  };
  Object.entries(defaultColors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
};
