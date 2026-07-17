import { useTranslation } from "react-i18next";

type Screen = "landing" | "menu" | "aiwaiter" | "checkout";

type LandingProps = {
  onNavigate: (screen: Screen) => void;
};

export default function Landing({ onNavigate }: LandingProps) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center gap-6 px-4 py-16 text-center sm:px-6 lg:px-8">
      <h1 className="font-serif text-3xl text-stone-900 sm:text-4xl">
        {t("brand.name")}
      </h1>
      <p className="max-w-md text-sm text-stone-600">{t("brand.description")}</p>

      <div className="mt-4 flex w-full max-w-sm flex-col gap-3">
        <button
          type="button"
          onClick={() => onNavigate("aiwaiter")}
          className="rounded-2xl bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-700"
        >
          {t("landing.startChat")}
        </button>

        <button
          type="button"
          onClick={() => onNavigate("menu")}
          className="rounded-2xl border border-stone-200 bg-white px-6 py-3 text-sm font-medium text-stone-900 transition hover:bg-stone-100"
        >
          {t("landing.openMenu")}
        </button>

        <button
          type="button"
          className="rounded-2xl border border-[#9f7d1c]/40 bg-white px-6 py-3 text-sm font-medium text-[#9f7d1c] transition hover:bg-[#f3d46b]/20"
        >
          {t("landing.callWaiter")}
        </button>
      </div>
    </div>
  );
}
