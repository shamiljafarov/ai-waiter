import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { MenuItem } from "../types/menu";
import type { OrderCommand } from "../types/order";
import { menuData } from "../data/menuData";

export type OrderItemStatus = "pending" | "confirmed";

export type OrderItem = {
  lineId: string;
  item: MenuItem;
  quantity: number;
  note?: string;
  status: OrderItemStatus;
};

type OrderContextValue = {
  orderItems: OrderItem[];
  addItem: (item: MenuItem) => void;
  removeItem: (id: number) => void;
  setQuantity: (id: number, qty: number) => void;
  setNote: (id: number, note: string) => void;
  clearOrder: () => void;
  confirmOrder: () => void;
  subtotal: number;
  serviceFee: number;
  total: number;
  totalKcal: number;
  flashIds: number[];
  applyOrderCommands: (commands: OrderCommand[]) => void;
  hasPending: boolean;
  hasConfirmed: boolean;
};

function findMenuItem(id: number): MenuItem | undefined {
  for (const category of menuData) {
    const found = category.items.find((item) => item.id === id);
    if (found) return found;
  }
  return undefined;
}

const OrderContext = createContext<OrderContextValue | undefined>(undefined);

const SERVICE_FEE_RATE = 0.1;

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const addItem = (item: MenuItem) => {
    setOrderItems((prev) => {
      const existingPending = prev.find(
        (entry) => entry.item.id === item.id && entry.status === "pending"
      );
      if (existingPending) {
        return prev.map((entry) =>
          entry.lineId === existingPending.lineId
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry
        );
      }
      return [
        ...prev,
        { lineId: crypto.randomUUID(), item, quantity: 1, status: "pending" },
      ];
    });
  };

  const removeItem = (id: number) => {
    setOrderItems((prev) =>
      prev.filter((entry) => !(entry.item.id === id && entry.status === "pending"))
    );
  };

  const setQuantity = (id: number, qty: number) => {
    setOrderItems((prev) => {
      if (qty <= 0) {
        return prev.filter(
          (entry) => !(entry.item.id === id && entry.status === "pending")
        );
      }
      return prev.map((entry) =>
        entry.item.id === id && entry.status === "pending"
          ? { ...entry, quantity: qty }
          : entry
      );
    });
  };

  const setNote = (id: number, note: string) => {
    setOrderItems((prev) =>
      prev.map((entry) =>
        entry.item.id === id && entry.status === "pending"
          ? { ...entry, note }
          : entry
      )
    );
  };

  const clearOrder = () => setOrderItems([]);

  const confirmOrder = () => {
    setOrderItems((prev) =>
      prev.map((entry) =>
        entry.status === "pending" ? { ...entry, status: "confirmed" } : entry
      )
    );
  };

  const decrementItem = (id: number, qty: number) => {
    setOrderItems((prev) => {
      const existing = prev.find(
        (entry) => entry.item.id === id && entry.status === "pending"
      );
      if (!existing) return prev;
      const newQty = existing.quantity - qty;
      if (newQty <= 0) {
        return prev.filter((entry) => entry.lineId !== existing.lineId);
      }
      return prev.map((entry) =>
        entry.lineId === existing.lineId ? { ...entry, quantity: newQty } : entry
      );
    });
  };

  const [flashIds, setFlashIds] = useState<number[]>([]);

  const triggerFlash = (id: number) => {
    setFlashIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setTimeout(() => {
      setFlashIds((prev) => prev.filter((flashId) => flashId !== id));
    }, 1000);
  };

  const applyOrderCommands = (commands: OrderCommand[]) => {
    commands.forEach((cmd) => {
      const menuItem = findMenuItem(cmd.id);
      if (!menuItem) return;

      if (cmd.type === "add") {
        for (let i = 0; i < cmd.quantity; i++) addItem(menuItem);
      } else {
        decrementItem(cmd.id, cmd.quantity);
      }

      triggerFlash(cmd.id);
    });
  };

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

  const hasPending = useMemo(
    () => orderItems.some((entry) => entry.status === "pending"),
    [orderItems]
  );

  const hasConfirmed = useMemo(
    () => orderItems.some((entry) => entry.status === "confirmed"),
    [orderItems]
  );

  const value: OrderContextValue = {
    orderItems,
    addItem,
    removeItem,
    setQuantity,
    setNote,
    clearOrder,
    confirmOrder,
    subtotal,
    serviceFee,
    total,
    totalKcal,
    flashIds,
    applyOrderCommands,
    hasPending,
    hasConfirmed,
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
