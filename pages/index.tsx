import type { GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import { getDay } from 'date-fns';
import { utcToZonedTime, format } from 'date-fns-tz';

import { PageTitleWithDate } from '../components/PageTitleWithDate/PageTitleWithDate';
import { RestaurantOneDayMenu } from '../components/RestaurantOneDayMenu/RestaurantOneDayMenu';
import { WeekDayEnum } from '../lib/utils/regexUtils';
import { WeekDay } from '../lib/types/weekdays';
import { getHuoltamoCurrentDayMenu } from '../lib/utils/getHuoltamoCurrentDayMenu';
import { getIsoPajaCurrentDayMenu } from '../lib/utils/getIsoPajaCurrentDayMenu';
import { getStudio10CurrentDayMenu } from '../lib/utils/getStudio10CurrentDayMenu';
import { RestaurantMenus } from '../lib/types/restaurantMenus';
import { WEEKDAYS_ARRAY } from '../lib/constants/weekdaysArray';
import { scrapeHuoltamo } from '../lib/scrapers/scrapeHuoltamo';
import { scrapeIsoPaja } from '../lib/scrapers/scrapeIsoPaja';
import { scrapeStudio10CurrentWeekMenu } from '../lib/scrapers/scrapeStudio10';

interface HomeProps {
  restaurant: RestaurantMenus;
  isoDate: string;
}

const Home: NextPage<HomeProps> = ({ restaurant, isoDate }) => {
  const timeZone = 'Europe/Helsinki';
  const zonedIsoDate = utcToZonedTime(isoDate, timeZone);
  const pattern = 'd.MM.yyyy';
  const date = format(zonedIsoDate, pattern, { timeZone });
  const weekdayIndex = getDay(zonedIsoDate);
  const weekday = WEEKDAYS_ARRAY[weekdayIndex];

  return (
    <>
      <Head>
        <title>{`Lounaslistat - ${weekday}`}</title>
        <meta data-updated={zonedIsoDate} />
      </Head>
      <PageTitleWithDate date={date} title="Lounaslistat" weekday={weekday} />
      <RestaurantOneDayMenu restaurantName="Huoltamo" menuItems={restaurant.huoltamo} />
      <RestaurantOneDayMenu restaurantName="Studio 10" menuItems={restaurant.studio10} />
      <RestaurantOneDayMenu restaurantName="Iso Paja" menuItems={restaurant.isoPaja} />
    </>
  );
};

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const currentDay = new Date().toLocaleDateString('default', {
    weekday: 'long',
  }) as WeekDay;
  const isoDate = new Date().toISOString();
  const weekDayIndex = WeekDayEnum[currentDay];

  const restaurant: RestaurantMenus = {
    huoltamo: await getHuoltamoCurrentDayMenu(weekDayIndex, scrapeHuoltamo),
    isoPaja: await getIsoPajaCurrentDayMenu(weekDayIndex, scrapeIsoPaja),
    studio10: await getStudio10CurrentDayMenu(weekDayIndex, scrapeStudio10CurrentWeekMenu),
  };

  return {
    props: {
      restaurant,
      isoDate,
    },
  };
};

export default Home;
