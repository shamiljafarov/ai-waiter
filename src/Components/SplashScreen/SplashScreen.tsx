import { useEffect, useState } from "react";

type SplashScreenProps = {
  onFinish: () => void;
};

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [showContent, setShowContent] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const enterTimer = setTimeout(() => {
      setShowContent(true);
    }, 150);

    const exitTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2600);

    const finishTimer = setTimeout(() => {
      onFinish();
    }, 3200);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-999 overflow-hidden bg-[#050706] transition-opacity duration-700 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(92,122,89,0.18),transparent_38%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_30%,transparent_70%,rgba(255,255,255,0.02))]" />

      <div className="relative flex h-full items-center justify-center px-6">
        <div className="text-center">
          <div
            className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-[#50634f]/40 bg-white/2 shadow-[0_0_60px_rgba(99,128,96,0.12)] backdrop-blur-sm transition-all duration-1000 ${
              showContent
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-4 scale-95 opacity-0"
            }`}
          >
            <img
              src="/images/logo.png"
              alt="Green Cafe logo"
              className="h-32 w-32 sm:h-40 sm:w-40 md:h-52 md:w-52 object-contain opacity-90 invert brightness-200"
            />
          </div>

          <div
            className={`transition-all duration-1000 delay-150 ${
              showContent
                ? "translate-y-0 opacity-100"
                : "translate-y-6 opacity-0"
            }`}
          >
            <p className="mb-3 text-[11px] uppercase tracking-[0.45em] text-[#7d9279]">
              All for your cafe
            </p>

            <h1 className="text-5xl tracking-[0.08em] text-[#dfe8d9] sm:text-7xl">
              <span className="font-serif">GREEN CAFE</span>
            </h1>

            <div className="mx-auto mt-5 h-px w-24 bg-linear-to-r from-transparent via-[#8aa084] to-transparent" />

            <p className="mt-5 text-sm tracking-[0.2em] text-[#8e9d8a]">
              Elegant Taste Experience
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}