import { useEffect, useMemo, useRef, useState } from "react";
import CategoryNav from "./Components/CategoryNav/CategoryNav";
import MenuSection from "./Components/MenuSection/MenuSection";
import { menuData } from "./data/menuData";
import SplashScreen from "./Components/SplashScreen/SplashScreen";
import Footer from "./Components/Footer/Footer";
import Header from "./Components/Header/Header";
import Chatbot from "./Components/Chatbot/Chatbot";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  const categories = useMemo(
    () =>
      menuData.map((category) => ({
        key: category.key,
        titleKey: category.titleKey,
      })),
    []
  );

  const [activeCategory, setActiveCategory] = useState(categories[0]?.key || "");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const handleCategoryClick = (categoryKey: string) => {
    setActiveCategory(categoryKey);

    const section = sectionRefs.current[categoryKey];

    if (section) {
      const navOffset = 110;

      window.scrollTo({
        top: section.offsetTop - navOffset,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const navOffset = 140;
      const currentScroll = window.scrollY + navOffset;

      let currentCategory = categories[0]?.key || "";

      for (const category of menuData) {
        const section = sectionRefs.current[category.key];
        if (!section) continue;

        if (section.offsetTop <= currentScroll) {
          currentCategory = category.key;
        }
      }

      setActiveCategory((prev) =>
        prev === currentCategory ? prev : currentCategory
      );
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [categories]);

  return (
    <>
      <Header />

      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      <div className="min-h-screen bg-[#f6f6f2] text-stone-900">
        <CategoryNav
          categories={categories}
          activeCategory={activeCategory}
          onCategoryClick={handleCategoryClick}
        />

        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="space-y-20">
            {menuData.map((category) => (
              <MenuSection
                key={category.key}
                category={category}
                sectionRef={(element) => {
                  sectionRefs.current[category.key] = element;
                }}
              />
            ))}
          </div>
        </main>
      </div>

      <Footer />
      <Chatbot />
    </>
  );
}