export type MenuItem = {
  id: number;
  nameKey: string;
  image: string;
  descriptionKey?: string;
  price: number;
  weight?: string;
  badgeKey?: string;
};

export type MenuCategory = {
  key: string;
  titleKey: string;
  items: MenuItem[];
};