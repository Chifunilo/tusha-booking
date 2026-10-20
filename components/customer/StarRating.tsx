import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: number;
  className?: string;
}

export default function StarRating({ rating, size = 24, className = '' }: StarRatingProps) {
  const fillPercent = Math.max(0, Math.min(100, (rating / 5) * 100));

  return (
    <div className={`relative inline-block ${className}`}>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} style={{ width: size, height: size }} className="shrink-0 fill-gray-200 text-gray-200" />
        ))}
      </div>
      <div
        className="absolute inset-0 flex items-center gap-1 overflow-hidden"
        style={{ width: `${fillPercent}%` }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} style={{ width: size, height: size }} className="shrink-0 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
    </div>
  );
}
