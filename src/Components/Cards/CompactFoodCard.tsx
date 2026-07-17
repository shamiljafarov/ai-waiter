import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import type { MenuItem } from "../../types/menu";
import { useOrder } from "../../context/OrderContext";

type CompactFoodCardProps = {
  item: MenuItem;
  onAdd?: () => void;
};

export default function CompactFoodCard({ item, onAdd }: CompactFoodCardProps) {
  const { t } = useTranslation();
  const { addItem } = useOrder();

  const handleAdd = () => {
    addItem(item);
    onAdd?.();
  };

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-2 transition hover:bg-stone-50">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-200">
        {item.image ? (
          <img
            src={item.image}
            alt={t(item.nameKey)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[9px] text-stone-500">
            {t("common.noImage")}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm text-stone-900">{t(item.nameKey)}</p>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="text-sm font-medium text-[#9f7d1c]">
            ₼{item.price.toFixed(2)}
          </span>
          {item.kcal != null && (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-500">
              {item.kcal} kcal
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        aria-label="Add to order"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#9f7d1c] text-white transition hover:bg-[#8a6c17] active:scale-95"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
