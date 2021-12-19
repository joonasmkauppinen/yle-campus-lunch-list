interface RestaurantItem {
  ariaLabel: string;
  items: string[];
  name: string;
}

export type RestaurantName = 'iso-paja' | 'huoltamo' | 'båx' | 'dylan' | 'gvc' | 'studio-10';

export const SINGLE_DAY_MENUS: Record<RestaurantName, RestaurantItem> = {
  'iso-paja': {
    ariaLabel: 'Iso Paja',
    items: [
      '▪️ BUFFET MENU 10,90 €',
      'Paistettuja lihapullia (M, G) Chorizopullia (M, G) Lammaspullia (M, G) Mojo Rojo-kastiketta (M, G)',
      'Juures-perunapaistosta (M, G)',
      'Kirsikkajogurttia (L, G)',
      '▪️KASVIS BUFFET 10,90 €',
      'Kasvispihvejä (Ve) Metsäsienikastiketta (G, Ve) Juures-perunapaistosta (G, Ve)',
    ],
    name: 'Iso Paja',
  },
  'huoltamo': {
    ariaLabel: 'Huoltamo Palmia',
    items: [
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
    name: 'Ravintola Huoltamo Palmia'
  },
  'studio-10': {
    items: [
      'Sweet’n’sour kanaa (L, G)',
      'Gumboa salamista ja possusta (L, G)',
      'Maissiriisiä (VEG, G)',
      'Metsäsienipastaa (L, pyydä G keittiöstä)',
      'Marjarahkaa (L, G)',
    ],
    name: 'Studio 10',
    ariaLabel: 'Studio 10',
  },
  'båx': {
    items: [
      'Båxin lounas 11,90 €',
      '2 LÄMMINTÄ RUOKAA, PIZZAA, KEITTOA, RUNSAS SALAATTIPÖYTÄ, LEIPÄÄ JA LEVITETTÄ SEKÄ KAHVI/TEE',
      '',
      'KEITTO- JA SALAATTIPÖYTÄ 9,80 € (sis. leipä, kahvi/tee)',
      'PÄIVÄN KEITTO 7,30 € (sis. leipä, kahvi/tee)',
      'KOKONAINEN PIZZA 13,00 €',
    ],
    name: 'Båx',
    ariaLabel: 'Box',
  },
  'dylan': {
    items: ['Pahoittelut, listaa ei saatu haettua.'],
    name: 'Dylan',
    ariaLabel: 'Dylan',
  },
  'gvc': {
    items: ['Pahoittelut, listaa ei saatu haettua.'],
    name: 'GVC',
    ariaLabel: 'GVC - Garam & Vermiglio cafetering',
  },
};
