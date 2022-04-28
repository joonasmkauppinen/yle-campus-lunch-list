export interface MenuItem {
  text: string;
  markdown?: string;
}

export type MenuItems = MenuItem[];

export interface RestaurantMenus {
  studio10: MenuItems;
  isoPaja: MenuItems;
  huoltamo: MenuItems;
  box: MenuItems;
  dylan: MenuItems;
}
