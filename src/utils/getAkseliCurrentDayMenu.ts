import type { MenuItem, MenuItems } from "./getAllRestaurantsCurrentDayMenus";
import { regexSingleWeekDay, WeekDayEnum } from "./regexUtils";

export const getAkseliCurrentDayMenu = async (
  currentDay: WeekDayEnum,
  scraperFunction: () => Promise<string[]>,
): Promise<MenuItems> => {
  if (
    currentDay === WeekDayEnum.Saturday ||
    currentDay === WeekDayEnum.Sunday
  ) {
    return [];
  }

  const menuItemsRaw = await scraperFunction();

  const currentDayRegex = regexSingleWeekDay[currentDay];
  const nextDayRegex = regexSingleWeekDay[currentDay + 1];

  // Add 1 to the index to exclude the weekday title item.
  const currentDayIndex =
    menuItemsRaw.findIndex(
      (item) => currentDayRegex && item.match(currentDayRegex),
    ) + 1;

  const nextDayIndex = menuItemsRaw.findIndex(
    (item) => nextDayRegex && item.match(nextDayRegex),
  );

  const currentDayMenuItems = menuItemsRaw.slice(currentDayIndex, nextDayIndex);

  if (currentDay === WeekDayEnum.Friday) {
    const firstMetadataItemIndex = currentDayMenuItems.findIndex(
      (item) => /Allergeenit/i.exec(item) !== null,
    );

    if (firstMetadataItemIndex !== -1) {
      // Remove metadata items from the menu.
      currentDayMenuItems.splice(firstMetadataItemIndex);
    }
  }

  const menuItems: MenuItem[] = currentDayMenuItems.map((item: string) => ({
    text: item,
  }));

  return menuItems;
};
