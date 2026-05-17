import Image from "next/image";

type BrandLogoSize = "mark" | "lockup";

const sizeClasses: Record<BrandLogoSize, string> = {
  mark: "h-8 w-8",
  lockup: "h-9 w-auto",
};

const imageDimensions: Record<BrandLogoSize, { width: number; height: number; sizes: string }> = {
  mark: { width: 32, height: 32, sizes: "32px" },
  lockup: { width: 54, height: 36, sizes: "54px" },
};

export function BrandLogo({
  className = "",
  size = "lockup",
}: {
  className?: string;
  size?: BrandLogoSize;
}) {
  const dimensions = imageDimensions[size];

  return (
    <Image
      src="/logo.png"
      alt="StudyBuddy"
      width={dimensions.width}
      height={dimensions.height}
      priority
      className={`${sizeClasses[size]} shrink-0 object-contain ${className}`}
      sizes={dimensions.sizes}
    />
  );
}
