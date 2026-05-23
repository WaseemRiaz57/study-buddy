import Image from "next/image";

type BrandLogoSize = "mark" | "lockup";

const sizeClasses: Record<BrandLogoSize, string> = {
  mark: "h-9 w-9",
  lockup: "h-10 w-10",
};

const imageDimensions: Record<BrandLogoSize, { width: number; height: number; sizes: string }> = {
  mark: { width: 36, height: 36, sizes: "36px" },
  lockup: { width: 40, height: 40, sizes: "40px" },
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
