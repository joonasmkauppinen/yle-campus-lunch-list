import styled from '@emotion/styled';
import { DividerLineSpan } from '../DividerLineSpan/DividerLineSpan';
import { Heading2 } from '../Heading2/Heading2';
import { MenuItemParagraph, StyledParagraph } from '../MenuItemParagraph/MenuItemParagraph';
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

interface RestaurantOneDayMenuProps {
  menuItems: string[];
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
      {menuItems.length === 0 ? (
        <StyledParagraph>Listaa ei saatu haettua.</StyledParagraph>
      ) : (
        menuItems.map((item, index) => (
          <MenuItemParagraph markdown={item} key={`${restaurantName}-${index}`} />
        ))
      )}
    </ContainerSection>
  );
};
