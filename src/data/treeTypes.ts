export interface TreeType {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  operatingFee: number;
  freeDuration: Record<number, number>;
  image: string;
}

export const treeTypes: TreeType[] = [
  {
    id: 'olive-oil',
    name: 'زيتون',
    subtitle: '(زيتي)',
    price: 299,
    operatingFee: 19,
    freeDuration: {
      1: 0,
      2: 1,
      3: 2,
      5: 3,
      10: 5
    },
    image: '🫒'
  },
  {
    id: 'olive-pickle',
    name: 'زيتون',
    subtitle: '(مخلل)',
    price: 299,
    operatingFee: 19,
    freeDuration: {
      1: 0,
      2: 1,
      3: 2,
      5: 3,
      10: 5
    },
    image: '🫒'
  },
  {
    id: 'palm-sukkari',
    name: 'نخيل سكري',
    subtitle: 'نخلة الفخامة',
    price: 349,
    operatingFee: 29,
    freeDuration: {
      1: 0,
      2: 0,
      3: 0,
      5: 1,
      10: 2
    },
    image: '🌴'
  },
  {
    id: 'palm-khalas',
    name: 'نخيل خلاص',
    subtitle: 'نخلة الجود',
    price: 419,
    operatingFee: 29,
    freeDuration: {
      1: 0,
      2: 0,
      3: 0,
      5: 1,
      10: 2
    },
    image: '🌴'
  }
];

export const durationOptions = [1, 2, 3, 5, 10];
