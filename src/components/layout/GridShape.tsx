// src\components\layout\GridShape.tsx
import Image from "next/image";

export default function GridShape() {
  return (
    <>
      {/* Top Right Grid */}
      <div
        aria-hidden
        className="
          pointer-events-none
          absolute right-0 top-0
          z-0
          w-full max-w-[240px] xl:max-w-[420px]
          opacity-20 dark:opacity-10
        "
      >
        <Image
          src="/images/shape/grid-01.svg"
          alt=""
          width={540}
          height={254}
          priority={false}
          className="
            select-none
            filter
            saturate-0
            contrast-125
            dark:brightness-75
          "
        />
      </div>

      {/* Bottom Left Grid */}
      <div
        aria-hidden
        className="
          pointer-events-none
          absolute bottom-0 left-0
          z-0
          w-full max-w-[240px] xl:max-w-[420px]
          rotate-180
          opacity-20 dark:opacity-10
        "
      >
        <Image
          src="/images/shape/grid-01.svg"
          alt=""
          width={540}
          height={254}
          priority={false}
          className="
            select-none
            filter
            saturate-0
            contrast-125
            dark:brightness-75
          "
        />
      </div>
    </>
  );
}
