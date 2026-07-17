import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { MenuItem } from "../types/menu";

export type OrderItem = {
  item: MenuItem;
  quantity: number;
  note?: string;
};

type OrderContextValue = {
  orderItems: OrderItem[];
  addItem: (item: MenuItem) => void;
  removeItem: (id: number) => void;
  setQuantity: (id: number, qty: number) => void;
  setNote: (id: number, note: string) => void;
  clearOrder: () => void;
  subtotal: number;
  serviceFee: number;
  total: number;
  totalKcal: number;
};

const OrderContext = createContext<OrderContextValue | undefined>(undefined);

const SERVICE_FEE_RATE = 0.1;

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const addItem = (item: MenuItem) => {
    setOrderItems((prev) => {
      const existing = prev.find((entry) => entry.item.id === item.id);
      if (existing) {
        return prev.map((entry) =>
          entry.item.id === item.id
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeItem = (id: number) => {
    setOrderItems((prev) => prev.filter((entry) => entry.item.id !== id));
  };

  const setQuantity = (id: number, qty: number) => {
    setOrderItems((prev) => {
      if (qty <= 0) {
        return prev.filter((entry) => entry.item.id !== id);
      }
      return prev.map((entry) =>
        entry.item.id === id ? { ...entry, quantity: qty } : entry
      );
    });
  };

  const setNote = (id: number, note: string) => {
    setOrderItems((prev) =>
      prev.map((entry) =>
        entry.item.id === id ? { ...entry, note } : entry
      )
    );
  };

  const clearOrder = () => setOrderItems([]);

  const subtotal = useMemo(
    () =>
      orderItems.reduce(
        (sum, entry) => sum + entry.item.price * entry.quantity,
        0
      ),
    [orderItems]
  );

  const serviceFee = useMemo(() => subtotal * SERVICE_FEE_RATE, [subtotal]);

  const total = useMemo(() => subtotal + serviceFee, [subtotal, serviceFee]);

  const totalKcal = useMemo(
    () =>
      orderItems.reduce(
        (sum, entry) => sum + (entry.item.kcal ?? 0) * entry.quantity,
        0
      ),
    [orderItems]
  );

  const value: OrderContextValue = {
    orderItems,
    addItem,
    removeItem,
    setQuantity,
    setNote,
    clearOrder,
    subtotal,
    serviceFee,
    total,
    totalKcal,
  };

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrder must be used within an OrderProvider");
  }
  return context;
}
