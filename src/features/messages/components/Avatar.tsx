// src/features/messages/components/Avatar.tsx

type Props = {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
};

const sizes = {
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
  lg: 'h-20 w-20',
};

export default function Avatar({
  src,
  alt = 'Profile',
  size = 'md',
}: Props) {
  return (
    <div
      className={`overflow-hidden rounded-full bg-gray-200 ${sizes[size]}`}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-500">
          {alt.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}