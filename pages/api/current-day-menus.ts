import type { NextApiRequest, NextApiResponse } from 'next';

import { getAllRestaurantsCurrentDayMenus } from '../../lib/utils/getAllRestaurantsCurrentDayMenus';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { restaurant, zonedIsoDate } = await getAllRestaurantsCurrentDayMenus();
    res.setHeader('Cache-Control', 's-maxage=60');
    res.status(200).json({ restaurant, dataScrapedIsoDate: zonedIsoDate });
  } catch (err) {
    return res.status(500).json({ error: err });
  }
}
