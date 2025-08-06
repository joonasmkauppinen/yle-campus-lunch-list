import type { MenuItems } from "./getAllRestaurantsCurrentDayMenus";
import { regexSingleWeekDay, WeekDayEnum } from "./regexUtils";

export const getIsoPajaCurrentDayMenu = async (
  currentDay: WeekDayEnum,
  scraperFunction: () => Promise<MenuItems>,
) => {
  if (
    currentDay === WeekDayEnum.Saturday ||
    currentDay === WeekDayEnum.Sunday
  ) {
    return [];
  }

  const menuItemsRaw = await scraperFunction();

  const currentDayRegex = regexSingleWeekDay[currentDay] ?? /.^/; // fallback to a regex that matches nothing
  const nextDayRegex = regexSingleWeekDay[currentDay + 1] ?? /.^/;

  // Add 1 to the index to exclude the weekday title item.
  const currentDayIndex =
    menuItemsRaw.findIndex((item) => item.text.match(currentDayRegex)) + 1;
  const nextDayIndex = menuItemsRaw.findIndex((item) =>
    item.text.match(nextDayRegex),
  );

  if (currentDay === WeekDayEnum.Friday) {
    return menuItemsRaw.slice(currentDayIndex);
  }

  return menuItemsRaw.slice(currentDayIndex, nextDayIndex);
};
