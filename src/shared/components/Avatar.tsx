// src/shared/components/Avatar.tsx
interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}

export default function Avatar({
  src,
  name,
  size = 48,
  className = '',
}: AvatarProps) {
  const initial = (name?.trim()?.[0] ?? '?').toUpperCase();

  return (
    <div
      className={`rounded-full overflow-hidden border border-[#e8e0d0] bg-[#f2ede3] flex items-center justify-center flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name ?? ''}
          className="w-full h-full object-cover"
        />
      ) : (
        <span
          className="font-light text-[#b07d6c]"
          style={{ fontSize: size * 0.42 }}
        >
          {initial}
        </span>
      )}
    </div>
  );
}