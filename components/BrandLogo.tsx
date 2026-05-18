import Image from "next/image";

type BrandLogoSize = "mark" | "lockup";

const sizeClasses: Record<BrandLogoSize, string> = {
  mark: "h-11 w-11",
  lockup: "h-12 w-12",
};

const imageDimensions: Record<BrandLogoSize, { width: number; height: number; sizes: string }> = {
  mark: { width: 44, height: 44, sizes: "44px" },
  lockup: { width: 48, height: 48, sizes: "48px" },
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
    <span className={`${sizeClasses[size]} inline-flex shrink-0 items-center justify-center ${className}`}>
      <Image
        src="/logo.png"
        alt="StudyBuddy"
        width={dimensions.width}
        height={dimensions.height}
        priority
        className="h-full w-full object-contain"
        sizes={dimensions.sizes}
      />
    </span>
  );
}
