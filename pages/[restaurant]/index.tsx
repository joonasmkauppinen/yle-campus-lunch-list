import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { RestaurantCurrentWeekMenu } from '../../components/template/RestaurantCurrentWeekMenu/RestaurantCurrentWeekMenu';
import { RestaurantName } from '../../test-data/restaurant-menus-current-week';

const Restaurant: NextPage = () => {
  const router = useRouter();
  const { restaurant } = router.query;

  return <RestaurantCurrentWeekMenu currentRestaurant={restaurant as RestaurantName} />;
};

export default Restaurant;
