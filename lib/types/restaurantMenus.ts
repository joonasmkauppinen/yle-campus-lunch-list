export interface MenuItem {
  text: string;
  markdown?: string;
}

export type MenuItems = MenuItem[];

export interface RestaurantMenus {
  box: MenuItems;
  dylan: MenuItems;
  huoltamo: MenuItems;
  isoPaja: MenuItems;
  piccolo: MenuItems;
  studio10: MenuItems;
}
