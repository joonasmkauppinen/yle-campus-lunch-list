/** @jsxImportSource @emotion/react */

import type { NextPage } from 'next';
import styled from '@emotion/styled';

import { Datetime } from '../components/Datetime/Datetime';
import { TitleH1 } from '../components/TitleH1/TitleH1';
import { RestaurantName, SINGLE_DAY_MENUS } from '../test-data/single-day-menus';
import { RestaurantItemSection } from '../components/RestaurantItemSection/RestaurantItemSection';

const PageContainerDiv = styled.div({
  marginLeft: 10,
  marginRight: 10,
  marginTop: 50,
  marginBottom: 80,
});

const Home: NextPage = () => {
  const restaurantNamesArray = Object.keys(SINGLE_DAY_MENUS);

  return (
    <PageContainerDiv>
      <Datetime>maanantai · 3.1.2022</Datetime>
      <TitleH1>Lounaslistat</TitleH1>

      {restaurantNamesArray.map((key) => {
        const { items, name, ariaLabel } = SINGLE_DAY_MENUS[key as RestaurantName];
        return (
          <RestaurantItemSection
            key={`section-${key}`}
            items={items}
            name={name}
            ariaLabel={ariaLabel}
          />
        );
      })}
    </PageContainerDiv>
  );
};

export default Home;
