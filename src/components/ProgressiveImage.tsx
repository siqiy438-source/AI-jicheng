import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}

export const ProgressiveImage = ({
  src,
  alt,
  className,
  containerClassName,
}: ProgressiveImageProps) => {
  const [loaded, setLoaded] = useState(false);

  const onLoad = useCallback(() => setLoaded(true), []);

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {/* 占位背景 */}
      {!loaded && (
        <div className="absolute inset-0 bg-secondary/40 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={onLoad}
        className={cn(
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className,
        )}
      />
    </div>
  );
};
