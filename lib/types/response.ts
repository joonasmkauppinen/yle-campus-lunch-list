type MenuItems = string[];

interface Response {
  error?: string;
  timestamp: string;
}

export interface SingleDayMenu extends Response {
  menuItems?: MenuItems;
}

export interface WeekMenu extends Response {
  day?: {
    monday: MenuItems;
    tuesday: MenuItems;
    wednesday: MenuItems;
    thursday: MenuItems;
    friday: MenuItems;
    saturday: MenuItems;
    sunday: MenuItems;
  };
}

export interface CurrentDayMenus extends Response {
  restaurant?: {
    box: MenuItems;
    dylan: MenuItems;
    gvc: MenuItems;
    huoltamo: MenuItems;
    isopaja: MenuItems;
    studio10: MenuItems;
  };
}
