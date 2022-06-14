import styled from '@emotion/styled';
import { MenuItems } from '../../lib/types/restaurantMenus';
import { DividerLineSpan } from '../DividerLineSpan/DividerLineSpan';
import { Heading2 } from '../Heading2/Heading2';
import { MenuItemText, StyledLi } from '../MenuItemParagraph/MenuItemParagraph';
import { RestaurantLink } from '../RestaurantLink/RestaurantLink';

const ContainerSection = styled.section({
  display: 'flex',
  flexDirection: 'column',
  marginBottom: 40,
});

const ContainerDiv = styled.div({
  paddingTop: 9,
  paddingBottom: 8,
  position: 'relative',
  marginBottom: 8,
});

const ElementsContainerDiv = styled.div({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const ListItemsContainerUl = styled.ul({
  listStyle: 'none',
  margin: 0,
  padding: 0,
});

interface RestaurantOneDayMenuProps {
  menuItems: MenuItems;
  restaurantName: string;
  restaurantUrl: string;
}

export const RestaurantOneDayMenu = ({
  menuItems,
  restaurantName,
  restaurantUrl,
}: RestaurantOneDayMenuProps) => {
  return (
    <ContainerSection>
      <ContainerDiv>
        <ElementsContainerDiv>
          <Heading2>{restaurantName}</Heading2>
        </ElementsContainerDiv>
        <DividerLineSpan />
      </ContainerDiv>
      <RestaurantLink href={restaurantUrl} target="_blank">
        Ravintolan omat sivut &#8599;
      </RestaurantLink>
      <ListItemsContainerUl>
        {menuItems.length === 0 ? (
          <StyledLi>Listaa ei saatu haettua.</StyledLi>
        ) : (
          menuItems.map((item, index) => (
            <MenuItemText
              markdown={item.markdown || item.text}
              key={`${restaurantName}-${index}`}
            />
          ))
        )}
      </ListItemsContainerUl>
    </ContainerSection>
  );
};
