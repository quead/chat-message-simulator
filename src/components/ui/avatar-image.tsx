import { cn } from "@/utils/cn"

interface AvatarImageProps {
  src: string
  alt: string
  className?: string
  borderClassName?: string
  imageClassName?: string
}

export const AvatarImage = ({
  src,
  alt,
  className,
  borderClassName,
  imageClassName,
}: AvatarImageProps) => (
  <span
    className={cn(
      "relative inline-flex shrink-0 overflow-hidden rounded-full bg-center bg-cover",
      className,
      borderClassName,
    )}
    style={{ backgroundImage: `url("${src}")` }}
  >
    <img
      src={src}
      alt={alt}
      className={cn("block h-full w-full object-cover", imageClassName)}
      loading="eager"
      decoding="async"
    />
  </span>
)
