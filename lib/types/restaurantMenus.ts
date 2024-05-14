export interface MenuItem {
  text: string;
  markdown?: string;
}

export type MenuItems = MenuItem[];

export interface RestaurantMenus {
  box?: MenuItems;
  dylanBole?: MenuItems;
  dylanLuft?: MenuItems;
  huoltamo?: MenuItems;
  isoPaja?: MenuItems;
  visioPasila?: MenuItems;
  piccolo?: MenuItems;
  studio10?: MenuItems;
}
