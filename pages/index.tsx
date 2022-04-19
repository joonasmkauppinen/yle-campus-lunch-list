import type { GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import { getDay } from 'date-fns';
import { utcToZonedTime, format } from 'date-fns-tz';

import { PageTitleWithDate } from '../components/PageTitleWithDate/PageTitleWithDate';
import { RestaurantOneDayMenu } from '../components/RestaurantOneDayMenu/RestaurantOneDayMenu';
import { WeekDayEnum } from '../lib/utils/regexUtils';
import { WeekDay } from '../lib/types/weekdays';
import { getIsoPajaCurrentDayMenu } from '../lib/utils/getIsoPajaCurrentDayMenu';
import { getStudio10CurrentDayMenu } from '../lib/utils/getStudio10CurrentDayMenu';
import { RestaurantMenus } from '../lib/types/restaurantMenus';
import { WEEKDAYS_ARRAY } from '../lib/constants/weekdaysArray';
import { scrapeIsoPaja } from '../lib/scrapers/cheerio/scrapeIsoPaja';
import { scrapeStudio10 } from '../lib/scrapers/cheerio/scrapeStudio10';
import { fetchHuoltamoCurrentDayMenuFromApi } from '../lib/utils/fetchHuoltamoCurrentDayMenuFromApi';
import { TIME_ZONE } from '../lib/constants/timeZone';
import {
  BOX_URL,
  DYLAN_URL,
  HUOLTAMO_URL,
  ISO_PAJA_URL,
  STUDIO_10_URL,
} from '../lib/constants/restaurantUrls';
import { scrapeBox } from '../lib/scrapers/cheerio/scrapeBox';
import { getBoxCurrentDayMenu } from '../lib/utils/getBoxCurrentDayMenu';
import { fetchDylanCurrentDayMenuFromApi } from '../lib/utils/fetchDylanCurrentDayMenuFromApi';

interface HomeProps {
  restaurant: RestaurantMenus;
  isoDate: string;
}

const Home: NextPage<HomeProps> = ({ restaurant, isoDate }) => {
  const zonedIsoDate = utcToZonedTime(isoDate, TIME_ZONE);
  const pattern = 'd.MM.yyyy';
  const date = format(zonedIsoDate, pattern, { timeZone: TIME_ZONE });
  const weekdayIndex = getDay(zonedIsoDate);
  const weekday = WEEKDAYS_ARRAY[weekdayIndex];

  return (
    <>
      <Head>
        <title>{`Lounaslistat - ${weekday}`}</title>
        <meta data-updated={zonedIsoDate} />
      </Head>
      <PageTitleWithDate date={date} title="Lounaslistat" weekday={weekday} />
      <RestaurantOneDayMenu
        restaurantName="Huoltamo"
        menuItems={restaurant.huoltamo}
        restaurantUrl={HUOLTAMO_URL}
      />
      <RestaurantOneDayMenu
        restaurantName="Studio 10"
        menuItems={restaurant.studio10}
        restaurantUrl={STUDIO_10_URL}
      />
      <RestaurantOneDayMenu
        restaurantName="Iso Paja"
        menuItems={restaurant.isoPaja}
        restaurantUrl={ISO_PAJA_URL}
      />
      <RestaurantOneDayMenu
        restaurantName="Båx"
        menuItems={restaurant.box}
        restaurantUrl={BOX_URL}
      />
      <RestaurantOneDayMenu
        restaurantName="Dylan"
        menuItems={restaurant.dylan}
        restaurantUrl={DYLAN_URL}
      />
    </>
  );
};

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const currentDay = new Date().toLocaleDateString('default', {
    weekday: 'long',
  }) as WeekDay;
  const isoDate = new Date().toISOString();
  const weekDayIndex = WeekDayEnum[currentDay];
  const zonedIsoDate = utcToZonedTime(isoDate, TIME_ZONE);

  const restaurant: RestaurantMenus = {
    huoltamo: await fetchHuoltamoCurrentDayMenuFromApi(zonedIsoDate),
    studio10: await getStudio10CurrentDayMenu(weekDayIndex, scrapeStudio10),
    isoPaja: await getIsoPajaCurrentDayMenu(weekDayIndex, scrapeIsoPaja),
    box: await getBoxCurrentDayMenu(weekDayIndex, scrapeBox),
    dylan: await fetchDylanCurrentDayMenuFromApi(weekDayIndex),
  };

  return {
    props: {
      restaurant,
      isoDate,
    },
  };
};

export default Home;
