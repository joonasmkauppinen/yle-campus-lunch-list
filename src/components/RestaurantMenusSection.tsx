'use client';

import { useEffect, useState } from 'react';
import { RestaurantMenuListItem, type RestaurantMenuListItemProps } from './RestaurantMenuListItem';

type RestaurantMenusSectionProps = {
  orderedRestaurants: RestaurantMenuListItemProps[];
};

export const RestaurantMenusSection = ({ orderedRestaurants }: RestaurantMenusSectionProps) => {
  const [menuListVisible, setMenuListVisible] = useState(false);

  useEffect(() => {
    // Set items visible after the component mounts
    setMenuListVisible(true);
  }, []);

  return (
    <section
      className={`transition-opacity duration-400 ${menuListVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      {orderedRestaurants.map((restaurant, index) => (
        <RestaurantMenuListItem
          key={index}
          restaurantName={restaurant.restaurantName}
          menuItems={restaurant.menuItems}
          restaurantUrl={restaurant.restaurantUrl}
        />
      ))}
    </section>
  );
};
