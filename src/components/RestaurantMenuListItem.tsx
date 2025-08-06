'use client';

import { useEffect, useState } from 'react';

export type RestaurantMenuListItemProps = {
  menuItems?: string[];
  restaurantName: string;
  restaurantUrl: string;
};

export const RestaurantMenuListItem = ({
  menuItems,
  restaurantName,
  restaurantUrl,
}: RestaurantMenuListItemProps) => {
  const storageKey = `expanded-${restaurantName}`;

  const [expanded, setExpanded] = useState(true);

  const handleToggle = () => {
    const newValue = !expanded;
    setExpanded(newValue);
    localStorage.setItem(storageKey, JSON.stringify(newValue));
  };

  useEffect(() => {
    const storedValue = localStorage.getItem(storageKey);
    if (storedValue !== null) {
      const parsedValue = JSON.parse(storedValue) as boolean;
      setExpanded(parsedValue);
    }
  }, [storageKey]);

  return (
    <div className="mt-4 flex flex-col">
      <button
        className="w-full flex flex-row justify-between items-center cursor-pointer"
        onClick={handleToggle}
      >
        <h2 className="mb-0 pb-0 text-2xl font-bold">{restaurantName}</h2>

        <span
          className={`transition-transform duration-200 mr-2 ${expanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          {/* Chevron down icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </span>
      </button>
      <hr className="mt-2 mb-5 h-px w-full border-0 bg-gray-300 dark:bg-gray-500" />
      <div className={expanded ? 'flex flex-col' : 'hidden'}>
        <a
          href={restaurantUrl}
          target="_blank"
          className="mb-5 text-purple-500 hover:underline dark:text-purple-300"
        >
          Ravintolan omat sivut &#8599;
        </a>
        {menuItems && menuItems.length > 0 ? (
          <ul className="list-none">
            {menuItems.map((item, index) => (
              <li key={index} className="mb-5 text-base font-medium">
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-5 text-base font-medium text-gray-500 dark:text-gray-400">
            Listaa ei saatu haettua.
          </p>
        )}
      </div>
    </div>
  );
};
