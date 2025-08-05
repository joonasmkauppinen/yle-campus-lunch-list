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
  return (
    <div className="mt-8 flex flex-col">
      <h2 className="mb-0 pb-0 text-2xl font-bold">{restaurantName}</h2>
      <hr className="mt-1 mb-3 h-px w-full border-0 bg-gray-300 dark:bg-gray-500" />
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
            <li key={index} className="mb-5 text-lg font-medium">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-5 text-lg font-medium text-gray-500 dark:text-gray-400">
          Listaa ei saatu haettua.
        </p>
      )}
    </div>
  );
};
