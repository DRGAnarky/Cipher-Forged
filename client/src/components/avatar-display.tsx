import { AVATARS, FRAMES } from "@/lib/sigils";

interface AvatarDisplayProps {
  avatarId: number;
  frameId: number;
  size?: number;
  className?: string;
  profileImageUrl?: string | null;
}

export function AvatarDisplay({
  avatarId,
  frameId,
  size = 64,
  className = "",
  profileImageUrl,
}: AvatarDisplayProps) {
  const frameSrc = FRAMES[frameId] || FRAMES[1];
  const avatarSrc = AVATARS[avatarId] || AVATARS[1];
  const innerSize = size * 0.7;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      data-testid="avatar-display"
    >
      <img
        src={frameSrc}
        alt="Frame"
        className="absolute inset-0 object-contain pointer-events-none"
        style={{ width: size, height: size }}
      />
      {profileImageUrl ? (
        <img
          src={profileImageUrl}
          alt="Profile"
          className="rounded-full object-cover"
          style={{ width: innerSize, height: innerSize }}
        />
      ) : (
        <img
          src={avatarSrc}
          alt="Avatar"
          className="rounded-full object-cover"
          style={{ width: innerSize, height: innerSize }}
        />
      )}
    </div>
  );
}
