import { ContainerArticle } from '../../atom/ContainerArticle/ContainerArticle';
import { MenuItemParagraph } from '../../atom/MenuItemParagraph/MenuItemParagraph';
import { PageTitleWithDate } from '../../molecule/PageTitleWithDate/PageTitleWithDate';

interface RestaurantSingleDayMenuProps {
  menuItems: string[];
  weekday: string;
  title: string;
}

export const RestaurantSingleDayMenu = ({
  menuItems,
  weekday,
  title,
}: RestaurantSingleDayMenuProps) => {
  return (
    <ContainerArticle>
      <PageTitleWithDate date={`${weekday} · 3.1.2022`} title={title} />
      {menuItems.map((item, index) => (
        <MenuItemParagraph key={`single-day-item-${index}`}>{item}</MenuItemParagraph>
      ))}
    </ContainerArticle>
  );
};
