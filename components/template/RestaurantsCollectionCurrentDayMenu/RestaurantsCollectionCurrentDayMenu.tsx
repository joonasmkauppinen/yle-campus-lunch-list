import {
  RestaurantName,
  CURRENT_WEEK_MENU,
} from '../../../test-data/restaurant-menus-current-week';
import { ContainerArticle } from '../../atom/ContainerArticle/ContainerArticle';
import { PageTitleWithDate } from '../../molecule/PageTitleWithDate/PageTitleWithDate';
import { RestaurantItemSection } from '../../organism/RestaurantItemSection/RestaurantItemSection';

export const RestaurantsCollectionCurrentDayMenu = () => {
  const restaurantNamesArray = Object.keys(CURRENT_WEEK_MENU);

  return (
    <ContainerArticle>
      <PageTitleWithDate date="maanantai · 3.1.2022" title="Lounaslistat" />
      {restaurantNamesArray.map((key) => {
        const { ariaLabel, day, name, path } = CURRENT_WEEK_MENU[key as RestaurantName];
        return (
          <RestaurantItemSection
            ariaLabel={ariaLabel}
            items={day['monday']}
            key={`section-${key}`}
            name={name}
            path={path}
          />
        );
      })}
    </ContainerArticle>
  );
};
