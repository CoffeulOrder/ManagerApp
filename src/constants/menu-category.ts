export const MENU_CATEGORIES = ['ESPRESSO', 'NON_COFFEE', 'TEA', 'DESSERT'] as const;

export type MenuCategory = (typeof MENU_CATEGORIES)[number];

// Record<MenuCategory, ...> makes the compiler reject a new enum value that has no label.
export const MENU_CATEGORY_LABEL: Record<MenuCategory, string> = {
  ESPRESSO: '에스프레소',
  NON_COFFEE: '논커피',
  TEA: '티',
  DESSERT: '디저트',
};
