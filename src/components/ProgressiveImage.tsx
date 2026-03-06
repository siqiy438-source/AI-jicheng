import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  sizes?: string;
}

export const ProgressiveImage = ({
  src,
  alt,
  className,
  containerClassName,
  sizes,
}: ProgressiveImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const onLoad = useCallback(() => setLoaded(true), []);
  const onError = useCallback(() => {
    setLoaded(true);
    setFailed(true);
  }, []);

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {/* 占位背景 */}
      {!loaded && (
        <div className="absolute inset-0 bg-secondary/40 animate-pulse" />
      )}
      {failed ? (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary/30 text-xs text-muted-foreground">
          图片加载失败
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          sizes={sizes}
          onLoad={onLoad}
          onError={onError}
          className={cn(
            "transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
            className,
          )}
        />
      )}
    </div>
  );
};
