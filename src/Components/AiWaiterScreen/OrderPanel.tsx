import { useTranslation } from "react-i18next";
import { ClipboardList, Minus, Plus, Trash2 } from "lucide-react";
import { useOrder } from "../../context/OrderContext";

type Screen = "landing" | "menu" | "aiwaiter" | "checkout";

type OrderPanelProps = {
  onNavigate: (screen: Screen) => void;
};

export default function OrderPanel({ onNavigate }: OrderPanelProps) {
  const { t } = useTranslation();
  const { orderItems, removeItem, setQuantity, subtotal, serviceFee, total, totalKcal } =
    useOrder();

  const isEmpty = orderItems.length === 0;

  return (
    <div className="flex h-full flex-col rounded-2xl bg-white">
      {/* Header */}
      <div className="shrink-0 border-b border-stone-100 px-5 py-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#9f7d1c]">
          {t("order.title")}
        </h2>
      </div>

      {/* Items */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <ClipboardList size={28} className="text-stone-300" />
            <p className="text-sm text-stone-500">{t("order.empty")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orderItems.map((entry) => (
              <div
                key={entry.item.id}
                className="flex items-center gap-2 rounded-xl bg-stone-50 p-2"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-200">
                  {entry.item.image ? (
                    <img
                      src={entry.item.image}
                      alt={t(entry.item.nameKey)}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm text-stone-900">
                    {t(entry.item.nameKey)}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="text-xs text-[#9f7d1c]">
                      ₼{entry.item.price.toFixed(2)}
                    </span>
                    {entry.item.kcal != null && (
                      <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-500">
                        {entry.item.kcal} kcal
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(entry.item.id, entry.quantity - 1)}
                    aria-label="Decrease quantity"
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-stone-200 text-stone-600 transition hover:bg-stone-100"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-4 text-center text-sm text-stone-900">
                    {entry.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(entry.item.id, entry.quantity + 1)}
                    aria-label="Increase quantity"
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-stone-200 text-stone-600 transition hover:bg-stone-100"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(entry.item.id)}
                  aria-label="Remove item"
                  className="shrink-0 p-1 text-stone-400 transition hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary + checkout */}
      <div className="shrink-0 border-t border-stone-100 px-5 py-4">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-stone-600">
            <span>{t("order.subtotal")}</span>
            <span>₼{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>{t("order.serviceFee")}</span>
            <span>₼{serviceFee.toFixed(2)}</span>
          </div>

          <div className="my-2 border-t border-stone-100" />

          <div className="flex justify-between text-base font-medium text-stone-900">
            <span>{t("order.total")}</span>
            <span className="text-[#9f7d1c]">₼{total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-stone-500">
            <span>{t("order.totalKcal")}</span>
            <span>{totalKcal} kcal</span>
          </div>
        </div>

        <button
          type="button"
          disabled={isEmpty}
          onClick={() => onNavigate("checkout")}
          className="mt-4 w-full rounded-xl bg-[#9f7d1c] py-3 text-sm font-medium text-white transition hover:bg-[#8a6c17] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("order.checkout")}
        </button>
      </div>
    </div>
  );
}
