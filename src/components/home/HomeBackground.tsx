"use client";

import { useEffect } from "react";

const SPEED_MAP: Record<number, number> = {
  1: 3.0,
  2: 2.0,
  3: 1.0,
  4: 0.55,
  5: 0.3,
};

interface Props {
  theme: string;
  animation: string;
  speed: number;
}

export function HomeBackground({ theme, animation, speed }: Props) {
  useEffect(() => {
    const html = document.documentElement;

    // Theme
    if (theme && theme !== "ember") {
      html.dataset.bgTheme = theme;
    } else {
      delete html.dataset.bgTheme;
    }

    // Animation
    if (animation && animation !== "drift") {
      html.dataset.bgAnim = animation;
    } else {
      delete html.dataset.bgAnim;
    }

    // Speed
    const multiplier = SPEED_MAP[speed] ?? 1;
    html.style.setProperty("--blob-speed", String(multiplier));

    return () => {
      delete html.dataset.bgTheme;
      delete html.dataset.bgAnim;
      html.style.removeProperty("--blob-speed");
    };
  }, [theme, animation, speed]);

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
