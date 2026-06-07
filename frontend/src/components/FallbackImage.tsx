"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";

interface FallbackImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackIconSize?: number;
}

export default function FallbackImage({ className, fallbackIconSize = 24, alt, ...props }: FallbackImageProps) {
  const [error, setError] = useState(false);

  if (error || !props.src) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 dark:bg-[#1F1F2E] text-gray-400 ${className}`}>
        <ImageOff size={fallbackIconSize} className="opacity-50" />
      </div>
    );
  }

  return (
    <FallbackImage
      {...props}
      alt={alt || "Image"}
      className={className}
      onError={() => setError(true)}
    />
  );
}
