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
      className="font-display leading-none font-bold whitespace-pre-wrap"
      style={{
        ...style,
        fontSize: `${settings.watermarkSize}vw`,
        color: "currentColor",
      }}
    >
      {settings.watermarkText}
    </span>
  );
}
