import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Banknote, Check, CreditCard, X } from "lucide-react";
import { useOrder } from "../../context/OrderContext";

type Screen = "landing" | "menu" | "aiwaiter" | "checkout";

type CheckoutProps = {
  onBack: () => void;
  onNavigate: (screen: Screen) => void;
};

type PaymentMethod = "card" | "cash";

export default function Checkout({ onBack, onNavigate }: CheckoutProps) {
  const { t } = useTranslation();
  const {
    orderItems,
    subtotal,
    serviceFee,
    total,
    totalKcal,
    hasPending,
    confirmOrder,
    clearOrder,
  } = useOrder();

  const [justConfirmed, setJustConfirmed] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);

  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paymentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      if (paymentTimeoutRef.current) clearTimeout(paymentTimeoutRef.current);
    };
  }, []);

  const handleConfirm = () => {
    confirmOrder();
    setJustConfirmed(true);
    confirmTimeoutRef.current = setTimeout(() => {
      setJustConfirmed(false);
      onNavigate("aiwaiter");
    }, 1500);
  };

  const closePaymentModal = () => {
    setIsPaymentOpen(false);
    setSelectedPayment(null);
  };

  const handleSelectPayment = (method: PaymentMethod) => {
    setSelectedPayment(method);
    paymentTimeoutRef.current = setTimeout(() => {
      closePaymentModal();
      clearOrder();
      onNavigate("landing");
    }, 2000);
  };

  const isEmpty = orderItems.length === 0;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col gap-6 px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-serif text-2xl text-stone-900">{t("order.title")}</h1>

      {isEmpty ? (
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

      {justConfirmed && (
        <div className="flex items-center gap-2 rounded-2xl bg-[#f3d46b]/20 px-4 py-3 text-sm font-medium text-stone-900">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#9f7d1c] text-white">
            <Check size={14} />
          </span>
          {t("checkout.confirmSuccess")}
        </div>
      )}

      {!isEmpty && (
        <div className="flex flex-col gap-3 sm:flex-row">
          {hasPending && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={justConfirmed}
              className="flex-1 rounded-2xl bg-[#9f7d1c] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#8a6c17] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("checkout.confirm")}
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsPaymentOpen(true)}
            className="flex-1 rounded-2xl bg-[#9f7d1c] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#8a6c17]"
          >
            {t("checkout.pay")}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onBack}
        className="self-start rounded-2xl border border-stone-200 bg-white px-6 py-3 text-sm font-medium text-stone-900 transition hover:bg-stone-100"
      >
        {t("common.back")}
      </button>

      {isPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            {selectedPayment ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#9f7d1c] text-white">
                  <Check size={26} />
                </span>
                <p className="text-sm font-medium text-stone-900">
                  {t("checkout.paySuccess")}
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-medium text-stone-900">
                    {t("checkout.payTitle")}
                  </h2>
                  <button
                    type="button"
                    onClick={closePaymentModal}
                    aria-label={t("common.back")}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handleSelectPayment("card")}
                    className="flex flex-1 flex-col items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-5 text-sm font-medium text-stone-900 transition hover:border-[#9f7d1c] hover:text-[#9f7d1c]"
                  >
                    <CreditCard size={24} />
                    {t("checkout.card")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPayment("cash")}
                    className="flex flex-1 flex-col items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-5 text-sm font-medium text-stone-900 transition hover:border-[#9f7d1c] hover:text-[#9f7d1c]"
                  >
                    <Banknote size={24} />
                    {t("checkout.cash")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
