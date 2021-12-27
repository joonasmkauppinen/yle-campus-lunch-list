import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { RestaurantSingleDayMenu } from '../../../components/template/RestaurantSingleDayMenu/RestaurantSingleDayMenu';
import {
  CURRENT_WEEK_MENU,
  RestaurantName,
  WeekDay,
} from '../../../test-data/restaurant-menus-current-week';

const RestaurantDayMenu: NextPage = () => {
  const router = useRouter();
  const { weekday, restaurant } = router.query;
  const menuItems = CURRENT_WEEK_MENU[restaurant as RestaurantName].day[weekday as WeekDay];

  if (typeof weekday !== 'string' || typeof restaurant !== 'string') {
    return null;
  }

  return <RestaurantSingleDayMenu menuItems={menuItems} title={restaurant} weekday={weekday} />;
};

export default RestaurantDayMenu;
