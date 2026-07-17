import { useTranslation } from "react-i18next";
import { useOrder } from "../../context/OrderContext";

type CheckoutProps = {
  onBack: () => void;
};

export default function Checkout({ onBack }: CheckoutProps) {
  const { t } = useTranslation();
  const { orderItems, subtotal, serviceFee, total, totalKcal } = useOrder();

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col gap-6 px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-serif text-2xl text-stone-900">{t("order.title")}</h1>

      {orderItems.length === 0 ? (
        <p className="text-sm text-stone-600">{t("order.empty")}</p>
      ) : (
        <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex justify-between text-sm text-stone-600">
            <span>{t("order.subtotal")}</span>
            <span>{subtotal.toFixed(2)} ₼</span>
          </div>
          <div className="flex justify-between text-sm text-stone-600">
            <span>{t("order.serviceFee")}</span>
            <span>{serviceFee.toFixed(2)} ₼</span>
          </div>
          <div className="flex justify-between text-sm font-medium text-stone-900">
            <span>{t("order.total")}</span>
            <span className="text-[#9f7d1c]">{total.toFixed(2)} ₼</span>
          </div>
          <div className="flex justify-between text-sm text-stone-600">
            <span>{t("order.totalKcal")}</span>
            <span>{totalKcal} kcal</span>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onBack}
        className="self-start rounded-2xl border border-stone-200 bg-white px-6 py-3 text-sm font-medium text-stone-900 transition hover:bg-stone-100"
      >
        Geri
      </button>
    </div>
  );
}
