"use client";

import { useEffect } from "react";

export function HomeBackground({ theme }: { theme: string }) {
  useEffect(() => {
    if (theme && theme !== "ember") {
      document.documentElement.dataset.bgTheme = theme;
    } else {
      delete document.documentElement.dataset.bgTheme;
    }
    return () => {
      delete document.documentElement.dataset.bgTheme;
    };
  }, [theme]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <div className="home-blob home-blob-1" />
      <div className="home-blob home-blob-2" />
      <div className="home-blob home-blob-3" />
    </div>
  );
}
