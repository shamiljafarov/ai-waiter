import { useTranslation } from "react-i18next";

const languages = ["az", "en", "ru"] as const;
type Language = (typeof languages)[number];

export default function Header() {
  const { t, i18n } = useTranslation();

  const currentLanguage = (i18n.language?.split("-")[0] || "az") as Language;

  const handleLanguageChange = (lang: Language) => {
    i18n.changeLanguage(lang);
  };

  return (
    <header className="border-b border-stone-200 bg-[#f6f6f2]/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <img
            src="/images/logo.png"
            alt="Green Cafe logo"
            className="h-10 w-10 object-contain opacity-80"
          />

          <div>
            <p className="font-serif text-lg leading-none text-stone-900">
              {t("brand.name")}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-stone-500">
              {t("brand.tagline")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-stone-200 bg-white/60 p-1">
          {languages.map((lang) => {
            const isActive = currentLanguage === lang;

            return (
              <button
                key={lang}
                type="button"
                onClick={() => handleLanguageChange(lang)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium uppercase transition ${
                  isActive
                    ? "bg-stone-900 text-white"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                }`}
              >
                {lang}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}