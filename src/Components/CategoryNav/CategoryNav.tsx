import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";

type CategoryNavItem = {
  key: string;
  titleKey: string;
};

type CategoryNavProps = {
  categories: CategoryNavItem[];
  activeCategory: string;
  onCategoryClick: (categoryKey: string) => void;
};

export default function CategoryNav({
  categories,
  activeCategory,
  onCategoryClick,
}: CategoryNavProps) {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const activeButton = buttonRefs.current[activeCategory];

    if (activeButton) {
      activeButton.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeCategory]);

  const scrollByAmount = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollBy({
      left: direction === "left" ? -220 : 220,
      behavior: "smooth",
    });
  };

  return (
    <div className="sticky top-0 z-50 border-b border-stone-200 bg-[#f6f6f2]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => scrollByAmount("left")}
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 transition hover:bg-stone-100 md:flex"
          aria-label="Scroll left"
        >
          <ChevronLeft size={18} />
        </button>

        <div
          ref={scrollContainerRef}
          className="no-scrollbar overflow-x-auto scroll-smooth"
        >
          <div className="flex min-w-max gap-8 py-5">
            {categories.map((category) => {
              const isActive = activeCategory === category.key;

              return (
                <button
                  key={category.key}
                  ref={(el) => {
                    buttonRefs.current[category.key] = el;
                  }}
                  onClick={() => onCategoryClick(category.key)}
                  className={`whitespace-nowrap border-b-2 pb-2 text-sm transition ${
                    isActive
                      ? "border-[#a07c1b] text-stone-900"
                      : "border-transparent text-stone-500 hover:text-stone-800"
                  }`}
                >
                  {t(category.titleKey)}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => scrollByAmount("right")}
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 transition hover:bg-stone-100 md:flex"
          aria-label="Scroll right"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}