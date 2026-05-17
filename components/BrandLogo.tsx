import Image from "next/image";

type BrandLogoSize = "mark" | "lockup";

const sizeClasses: Record<BrandLogoSize, string> = {
  mark: "h-16 w-16", // Size increased to 64px
  lockup: "h-16 w-16", // Size increased to 64px
};

const imageDimensions: Record<BrandLogoSize, { width: number; height: number; sizes: string }> = {
  mark: { width: 64, height: 64, sizes: "64px" },
  lockup: { width: 64, height: 64, sizes: "64px" },
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