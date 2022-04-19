import { regexSingleWeekDay, WeekDayEnum } from './regexUtils';

export const getBoxCurrentDayMenu = async (
  currentDay: WeekDayEnum,
  scraperFunction: () => Promise<string[]>,
) => {
  if (currentDay === WeekDayEnum.Saturday || currentDay === WeekDayEnum.Sunday) {
    return [];
  }

  const menuItemsRaw = await scraperFunction();

  const currentDayRegex = regexSingleWeekDay[currentDay];
  const nextDayRegex = regexSingleWeekDay[currentDay + 1];

  // Add 1 to the index to exclude the weekday title item.
  const currentDayIndex = menuItemsRaw.findIndex((item) => item.match(currentDayRegex)) + 1;
  const nextDayIndex = menuItemsRaw.findIndex((item) => item.match(nextDayRegex));

  const currentDayMenuItems = menuItemsRaw.slice(currentDayIndex, nextDayIndex);

  return currentDayMenuItems;
};
