"use client";

import React, { useEffect, useState } from "react";
import { Heart } from "lucide-react";

export const SplashScreen = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/sereno-admin")) {
      setShouldRender(false);
      return;
    }

    const showSplash = () => {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);

      const removeTimer = setTimeout(() => {
        setShouldRender(false);
      }, 4000); // 1s extra for the fade-out duration (500ms) + buffer

      return () => {
        clearTimeout(timer);
        clearTimeout(removeTimer);
      };
    };

    return showSplash();
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      } bg-[radial-gradient(circle_at_top,#dbeafe_0%,transparent_30%),radial-gradient(circle_at_bottom,#ccfbf1_0%,transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_50%,#f8fafc_100%)]`}
    >
      <div className="relative flex flex-col items-center px-6 text-center">
        <div className="absolute -top-24 h-56 w-56 rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="absolute -bottom-20 h-52 w-52 rounded-full bg-indigo-200/30 blur-3xl" />

        <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] border backdrop-blur-xl sereno-card-primary">
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-sky-400/10 via-indigo-400/10 to-teal-400/10" />
          <div className="relative animate-breathe">
            <Heart className="h-11 w-11 fill-indigo-100 text-indigo-500" strokeWidth={1.8} />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="sereno-title animate-fade-in !text-violet-500">
            SERENO
          </h1>
          <p
            className="sereno-subtitle animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            Respire fundo. Seu espaço está abrindo.
          </p>
        </div>

        <div
          className="mt-6 h-1.5 w-24 overflow-hidden rounded-full bg-slate-200"
          aria-hidden="true"
        >
          <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-sky-400 via-indigo-500 to-teal-400 animate-shimmer" />
        </div>
      </div>
    </div>
  );
};
