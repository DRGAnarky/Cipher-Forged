import { SIGILS } from "@/lib/sigils";

interface SigilIconProps {
  sigilId: string;
  className?: string;
  size?: number;
}

export function SigilIcon({ sigilId, className = "", size = 32 }: SigilIconProps) {
  const src = SIGILS[sigilId];
  if (!src) return null;

  return (
    <img
      src={src}
      alt={sigilId}
      className={`inline-flex object-contain ${className}`}
      style={{ width: size, height: size }}
      data-testid={`sigil-${sigilId}`}
    />
  );
}
