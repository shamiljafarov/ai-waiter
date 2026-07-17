export type OrderCommand = {
  type: "add" | "remove";
  id: number;
  quantity: number;
};
