import type { MenuItem } from './getAllRestaurantsCurrentDayMenus';
import { WeekDayEnum } from './regexUtils';

// Match date format "Ma 1.1.", "Ti 2.2.", etc.
const regexSingleWeekDay = [
  /Ma\s([1-9]|[12][0-9]|3[01])\.([1-9]|1[0-2])\./,
  /Ti\s([1-9]|[12][0-9]|3[01])\.([1-9]|1[0-2])\./,
  /Ke\s([1-9]|[12][0-9]|3[01])\.([1-9]|1[0-2])\./,
  /To\s([1-9]|[12][0-9]|3[01])\.([1-9]|1[0-2])\./,
  /Pe\s([1-9]|[12][0-9]|3[01])\.([1-9]|1[0-2])\./,
];

export const getVesilinnaCurrentDayMenu = async (
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
  const currentDayIndex =
    menuItemsRaw.findIndex((item) => currentDayRegex && item.match(currentDayRegex)) + 1;

  const nextDayIndex = menuItemsRaw.findIndex((item) => nextDayRegex && item.match(nextDayRegex));

  const currentDayMenuItems = menuItemsRaw.slice(currentDayIndex, nextDayIndex);

  if (currentDay === WeekDayEnum.Friday) {
    const firstMetadataItemIndex = currentDayMenuItems.findIndex(
      (item) => /Pidämme oikeudet muutoksiin/i.exec(item) !== null,
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
