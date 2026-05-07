import type { ReactNode } from "react";

interface WatermarkSettings {
  watermarkEnabled: boolean;
  watermarkType: string;
  watermarkText: string;
  watermarkImagePath: string | null;
  watermarkOpacity: number;
  watermarkX: number;
  watermarkY: number;
  watermarkRotation: number;
  watermarkSize: number;
}

interface Props {
  settings: WatermarkSettings;
}

function renderMarkdown(text: string): ReactNode[] {
  const lines = text.split("\n");
  return lines.flatMap((line, lineIdx) => {
    const tokens = line.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g);
    const parts: ReactNode[] = tokens.map((token, i) => {
      if (token.startsWith("**") && token.endsWith("**"))
        return <strong key={`${lineIdx}-${i}`}>{token.slice(2, -2)}</strong>;
      if (token.startsWith("*") && token.endsWith("*"))
        return <em key={`${lineIdx}-${i}`}>{token.slice(1, -1)}</em>;
      return token;
    });
    if (lineIdx < lines.length - 1) parts.push(<br key={`br-${lineIdx}`} />);
    return parts;
  });
}

export function WatermarkOverlay({ settings }: Props) {
  if (!settings.watermarkEnabled) return null;

  const style: React.CSSProperties = {
    position: "absolute",
    left: `${settings.watermarkX}%`,
    top: `${settings.watermarkY}%`,
    transform: `translate(-50%, -50%) rotate(${settings.watermarkRotation}deg)`,
    opacity: settings.watermarkOpacity / 100,
    pointerEvents: "none",
    userSelect: "none",
  };

  if (settings.watermarkType === "image" && settings.watermarkImagePath) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        aria-hidden="true"
        alt=""
        src={`/api/uploads/${settings.watermarkImagePath}`}
        style={{ ...style, width: `${settings.watermarkSize}%`, objectFit: "contain" }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="font-display leading-none font-bold whitespace-nowrap"
      style={{
        ...style,
        fontSize: `${settings.watermarkSize}vw`,
        color: "currentColor",
      }}
    >
      {renderMarkdown(settings.watermarkText)}
    </span>
  );
}
