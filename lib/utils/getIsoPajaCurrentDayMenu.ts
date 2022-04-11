import { regexSingleWeekDay, WeekDayEnum } from './regexUtils';

export const getIsoPajaCurrentDayMenu = async (
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

  // Some menu items are separated by `\n` so we need to split those items into
  // 2 items.
  const currentDayMenuItems = menuItemsRaw
    .slice(currentDayIndex, nextDayIndex)
    .flatMap((item) => item.split('\n'));

  return currentDayMenuItems;
};
