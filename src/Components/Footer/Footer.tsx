import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="pt-28 border-t border-stone-200 bg-[#f6f6f2] text-stone-800">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-14 md:grid-cols-4 md:items-start">
          <div className="text-center md:text-left">
            <img
              src="/images/logo.png"
              alt="Green Cafe logo"
              className="mx-auto mb-6 h-20 w-20 object-contain opacity-80 md:mx-0"
            />

            <h3 className="font-serif text-2xl text-stone-900">
              {t("brand.name")}
            </h3>

            <div className="mx-auto mt-3 h-px w-14 bg-[#9db39a] md:mx-0" />

            <p className="mt-4 max-w-xs text-sm leading-6 text-stone-600">
              {t("brand.description")}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-stone-500">
              {t("footer.hoursLabel")}
            </p>

            <p className="text-2xl font-serif text-stone-900">
              {t("footer.hoursValue")}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-stone-500">
              {t("footer.phoneLabel")}
            </p>

            <a
              href="tel:+994992062084"
              className="text-2xl font-serif text-stone-900 transition hover:text-stone-700"
            >
              +994 992 06 20 84
            </a>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-stone-500">
              {t("footer.addressLabel")}
            </p>

            <div className="space-y-1 text-base leading-7 text-stone-700">
              <p>{t("footer.addressLine1")}</p>
              <p className="text-stone-900">{t("footer.addressLine2")}</p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-stone-200 pt-5">
          <p className="text-center text-sm text-stone-500">
            {t("footer.serviceNote")}
          </p>
        </div>
      </div>
    </footer>
  );
}