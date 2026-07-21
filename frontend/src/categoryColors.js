export const CATEGORY_COLORS = {
  Groceries: { bg: "#CFE3C0", text: "#33512A" },
  Dining: { bg: "#F6CBD9", text: "#7A2F45" },
  Transport: { bg: "#C6DCEE", text: "#2A4C63" },
  Shopping: { bg: "#F7E3A1", text: "#6B551A" },
  Health: { bg: "#E3D2F4", text: "#54317A" },
  Entertainment: { bg: "#F9D6B8", text: "#7A431B" },
  Utilities: { bg: "#D2E9E2", text: "#2C5E51" },
  Other: { bg: "#E7E2D6", text: "#5B5647" },
};

export function categoryColor(category) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
}
