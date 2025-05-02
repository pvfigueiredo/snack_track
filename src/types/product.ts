
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  icon?: React.ElementType; // Optional icon component
  imageUrl?: string; // Optional image URL
};
