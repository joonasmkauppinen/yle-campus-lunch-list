import {
  CURRENT_WEEK_MENU,
  RestaurantName,
} from '../../../test-data/restaurant-menus-current-week';
import { ContainerArticle } from '../../atom/ContainerArticle/ContainerArticle';
import { PageTitleWithDate } from '../../molecule/PageTitleWithDate/PageTitleWithDate';
import { RestaurantItemSection } from '../../organism/RestaurantItemSection/RestaurantItemSection';

interface RestaurantCurrentWeekMenuProps {
  currentRestaurant: RestaurantName;
}

export const RestaurantCurrentWeekMenu = ({
  currentRestaurant,
}: RestaurantCurrentWeekMenuProps) => {
  const restaurantItem = CURRENT_WEEK_MENU[currentRestaurant as RestaurantName];

  const weekDays = Object.entries(restaurantItem.day);

  return (
    <ContainerArticle>
      <PageTitleWithDate title={restaurantItem.name} date="viikko 1 · 3.1. - 9.1.2022" />
      {weekDays.map(([day, items], index) => (
        <RestaurantItemSection
          key={`${currentRestaurant}-${day}-${index}`}
          name={day}
          items={items}
          ariaLabel={day}
          path={restaurantItem.path}
        />
      ))}
    </ContainerArticle>
  );
};
