import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

type BackButtonProps = {
  onClick: () => void;
  className?: string;
  size?: number;
  iconSize?: number;
};

export default function BackButton({
  onClick,
  className = "",
  size = 40,
  iconSize = 20,
}: BackButtonProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t("common.back")}
      style={{ height: size, width: size }}
      className={`flex shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 transition hover:border-[#9f7d1c] hover:text-[#9f7d1c] ${className}`}
    >
      <ArrowLeft size={iconSize} />
    </button>
  );
}
