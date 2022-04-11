import { scrapeHuoltamo } from '../scrapers/scrapeHuoltamo';
import { WeekDayEnum } from './regexUtils';

export const getHuoltamoCurrentDayMenu = async (
  currentDay: WeekDayEnum,
  scraperFunction: typeof scrapeHuoltamo,
) => {
  if (currentDay === WeekDayEnum.Saturday || currentDay === WeekDayEnum.Sunday) {
    return [];
  }

  const menuItemsRaw = await scraperFunction(currentDay);

  return menuItemsRaw;
};
