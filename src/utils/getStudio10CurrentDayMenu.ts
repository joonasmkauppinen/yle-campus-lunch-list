import type { MenuItems } from "./getAllRestaurantsCurrentDayMenus";
import { regexSingleWeekDay, WeekDayEnum } from "./regexUtils";

export const getStudio10CurrentDayMenu = async (
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

  const currentDayMenuItems = menuItemsRaw.slice(currentDayIndex, nextDayIndex);

  // Friday is the last day on the weekly menu. At the end of the list there
  // are 2 general info elements (hopefully this is always true). We want to
  // exclude those.
  if (currentDay === WeekDayEnum.Friday) {
    return currentDayMenuItems.slice(0, -2);
  }

  return currentDayMenuItems;
};
