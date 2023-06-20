import type { GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import { getDay } from 'date-fns';
import { utcToZonedTime, format } from 'date-fns-tz';

import { PageTitleWithDate } from '../components/PageTitleWithDate/PageTitleWithDate';
import { RestaurantOneDayMenu } from '../components/RestaurantOneDayMenu/RestaurantOneDayMenu';
import { RestaurantMenus } from '../lib/types/restaurantMenus';
import { WEEKDAYS_ARRAY } from '../lib/constants/weekdaysArray';
import { TIME_ZONE } from '../lib/constants/timeZone';
import {
  BOX_URL,
  DYLAN_BOLE_URL,
  DYLAN_LUFT_URL,
  INTRA_SITE_URL,
  ISO_PAJA_URL,
  VISIO_PASILA_URL,
  STUDIO_10_URL,
} from '../lib/constants/restaurantUrls';
import { getAllRestaurantsCurrentDayMenus } from '../lib/utils/getAllRestaurantsCurrentDayMenus';
import { GoogleAnalyticsScript } from '../components/GoogleAnalyticsScript/GoogleAnalyticsScript';

interface HomeProps {
  restaurant: RestaurantMenus;
  isoDate: string;
}

const Home: NextPage<HomeProps> = ({ restaurant, isoDate }) => {
  const zonedIsoDate = utcToZonedTime(isoDate, TIME_ZONE);
  const pattern = 'd.M.yyyy';
  const date = format(zonedIsoDate, pattern, { timeZone: TIME_ZONE });
  const weekdayIndex = getDay(zonedIsoDate);
  const weekday = WEEKDAYS_ARRAY[weekdayIndex];

  return (
    <>
      <Head>
        <title>{`Lounaslistat - ${weekday}`}</title>
        <meta data-updated={zonedIsoDate} />
      </Head>

      <GoogleAnalyticsScript />

      <PageTitleWithDate date={date} title="Lounaslistat" weekday={weekday} />
      <RestaurantOneDayMenu
        restaurantName="Huoltamo"
        menuItems={restaurant.huoltamo}
        restaurantUrl={INTRA_SITE_URL}
      />
      <RestaurantOneDayMenu
        restaurantName="Piccolo"
        menuItems={restaurant.piccolo}
        restaurantUrl={INTRA_SITE_URL}
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
        restaurantName="Visio"
        menuItems={restaurant.visioPasila}
        restaurantUrl={VISIO_PASILA_URL}
      />
      <RestaurantOneDayMenu
        restaurantName="Båx"
        menuItems={restaurant.box}
        restaurantUrl={BOX_URL}
      />
      <RestaurantOneDayMenu
        restaurantName="Dylan Luft"
        menuItems={restaurant.dylanLuft}
        restaurantUrl={DYLAN_LUFT_URL}
      />
      <RestaurantOneDayMenu
        restaurantName="Dylan Böle"
        menuItems={restaurant.dylanBole}
        restaurantUrl={DYLAN_BOLE_URL}
      />
    </>
  );
};

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const { restaurant, isoDate } = await getAllRestaurantsCurrentDayMenus();

  return {
    props: {
      restaurant,
      isoDate,
    },
  };
};

export default Home;
