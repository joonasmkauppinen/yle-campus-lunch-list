import type { NextApiRequest, NextApiResponse } from 'next';

import { RestaurantMenus } from '../../lib/types/restaurantMenus';
import { getAllRestaurantsCurrentDayMenus } from '../../lib/utils/getAllRestaurantsCurrentDayMenus';

interface CurrentDayMenusApiResponse {
  restaurant?: RestaurantMenus;
  dataScrapedIsoDate?: Date;
  error?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CurrentDayMenusApiResponse>,
) {
  try {
    const { restaurant, zonedIsoDate } = await getAllRestaurantsCurrentDayMenus();
    // Set a 6 hour cache
    res.setHeader('Cache-Control', 's-maxage=21600');
    res.status(200).json({ restaurant, dataScrapedIsoDate: zonedIsoDate });
  } catch (err) {
    return res.status(500).json({ error: err });
  }
}
