/* cSpell: disable */

interface RestaurantItem {
  ariaLabel: string;
  name: string;
  path: string;
  day: {
    monday: string[];
    tuesday: string[];
    wednesday: string[];
    thursday: string[];
    friday: string[];
    saturday: string[];
    sunday: string[];
  };
}

interface Restaurants {
  isopaja: RestaurantItem;
  huoltamo: RestaurantItem;
  studio10: RestaurantItem;
  båx: RestaurantItem;
  dylan: RestaurantItem;
  gvc: RestaurantItem;
}

export type RestaurantName = 'isopaja' | 'huoltamo' | 'båx' | 'dylan' | 'gvc' | 'studio10';

export const CURRENT_WEEK_MENU: Restaurants = {
  isopaja: {
    ariaLabel: 'Iso Paja',
    path: '/isopaja',
    day: {
      monday: [
        '▪️ BUFFET MENU 10,90 €',
        'Paistettuja lihapullia (M, G) Chorizopullia (M, G) Lammaspullia (M, G) Mojo Rojo-kastiketta (M, G)',
        'Juures-perunapaistosta (M, G)',
        'Kirsikkajogurttia (L, G)',
        '▪️KASVIS BUFFET 10,90 €',
        'Kasvispihvejä (Ve) Metsäsienikastiketta (G, Ve) Juures-perunapaistosta (G, Ve)',
      ],
      tuesday: [
        '▪️ BUFFET MENU 10,90 €',
        'Crispy Chicken- rapeita kananpaloja (L) Savupaprikakastiketta (L, G) Kermaperunat (L, G)',
        'Omenapiirakkasmoothie (L, G)',
        '▪️KASVIS BUFFET 10,90 €',
        'Uuniperunaa (G, Ve) Sitruunainen tofu-skagenröra (G, Ve)',
        'Kaalilaatikkoa soijarouheella (G, Ve) ja Puolukkaa (G, Ve)',
      ],
      wednesday: [
        '▪️ BUFFET MENU 10,90 €',
        'Karamellipossua (M, G) Kookosriisiä (M, G)',
        ' Hedelmiä (M, G)',
        '▪️KASVIS BUFFET 10,90 €',
        'Nyhtö-soijaa satay-kastikkeessa (G, Ve) Kookosriisiä (G, Ve)',
        'Kasvispyöryköitä (Ve)',
      ],
      thursday: [
        '▪️ BUFFET MENU 10,90 €',
        'Paistettuja lihapullia (M, G) Chorizopullia (M, G) Lammaspullia (M, G) Mojo Rojo-kastiketta (M, G)',
        'Juures-perunapaistosta (M, G)',
        'Kirsikkajogurttia (L, G)',
        '▪️KASVIS BUFFET 10,90 €',
        'Kasvispihvejä (Ve) Metsäsienikastiketta (G, Ve) Juures-perunapaistosta (G, Ve)',
      ],
      friday: [
        '▪️ BUFFET MENU 10,90 €',
        'Katkarapu-caesarsalaattia (M, G) Tomaatti-mozzarella (L, G)',
        'Tex-mex lasagnea (L)',
        'Jäätelöä (L)',
        '▪️KASVIS BUFFET 10,90 €',
        'Vege burgeri mustapapupihvillä (Ve) Chilimajoneesia (G, Ve)',
        'Maalaisranskalaiset (G, Ve)',
      ],
      saturday: ['Listaa ei saatavilla.'],
      sunday: ['Listaa ei saatavilla.'],
    },
    name: 'Iso Paja',
  },
  huoltamo: {
    ariaLabel: 'Huoltamo Palmia',
    path: '/huoltamo',
    day: {
      monday: [
        'Pannupihvejä M',
        'Perinteistä ruskeakastiketta L',
        'Kasvikisia ja persiljaperunoita M G',
        'Mozzarella broileria tomaattikastikkeessa VL G',
        'Pastaa M',
        'Punajuuripyöryköitä M G VEG',
        'Rakuunajogurttia L G',
        'Paahdettuja rosmariiniperunoita M G VEG',
        'Kasvis-borchkeittoa smetanan kera L G',
        'Kahvi / tee & jälkiruoka',
      ],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    },
    name: 'Ravintola Huoltamo Palmia',
  },
  studio10: {
    name: 'Studio 10',
    ariaLabel: 'Studio 10',
    path: '/studio10',
    day: {
      monday: [
        'Sweet’n’sour kanaa (L, G)',
        'Gumboa salamista ja possusta (L, G)',
        'Maissiriisiä (VEG, G)',
        'Metsäsienipastaa (L, pyydä G keittiöstä)',
        'Marjarahkaa (L, G)',
      ],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    },
  },
  båx: {
    name: 'Båx',
    ariaLabel: 'Box',
    path: '/båx',
    day: {
      monday: [
        'Båxin lounas 11,90 €',
        '2 LÄMMINTÄ RUOKAA, PIZZAA, KEITTOA, RUNSAS SALAATTIPÖYTÄ, LEIPÄÄ JA LEVITETTÄ SEKÄ KAHVI/TEE',
        '',
        'KEITTO- JA SALAATTIPÖYTÄ 9,80 € (sis. leipä, kahvi/tee)',
        'PÄIVÄN KEITTO 7,30 € (sis. leipä, kahvi/tee)',
        'KOKONAINEN PIZZA 13,00 €',
      ],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    },
  },
  dylan: {
    name: 'Dylan',
    ariaLabel: 'Dylan',
    path: '/dylan',
    day: {
      monday: ['Pahoittelut, listaa ei saatu haettua.'],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    },
  },
  gvc: {
    ariaLabel: 'GVC - Garam & Vermiglio cafetering',
    name: 'GVC',
    path: '/gvc',
    day: {
      monday: ['Pahoittelut, listaa ei saatu haettua.'],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    },
  },
};
