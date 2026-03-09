// src/components/custom/feature/RealEstateCard.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Phone } from "lucide-react";
import Image from "next/image";
import { CustomCarousel } from "@/components/custom/ui/CustomCarousel";
import { BookingModal } from "@/components/features/booking/booking-modal";

// Lightbox
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Slideshow from "yet-another-react-lightbox/plugins/slideshow";

// Types (Adjust import path as needed)
import { PropertyItem } from "@/types";

interface RealEstateCardProps extends Omit<PropertyItem, 'id' | 'title' | 'image'> {
  label: string;
  images: string[];
}

export default function RealEstateCard({
  id,
  images,
  label,
  description,
  specs,
  actions,
}: RealEstateCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const handleSlideClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      {/* LAYOUT CHANGE: 
         1. 'items-stretch' forces both children to equal height.
         2. 'h-full' on the card ensures it fills its own container if needed.
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-stretch w-full">
        
        {/* 1. LEFT COLUMN (CAROUSEL) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          // CHANGED: 
          // - Removed 'aspect-square' / 'aspect-[4/5]'.
          // - Added 'h-full' to fill the grid cell.
          // - Added 'min-h-[350px]' to ensure it has height on mobile or if text is short.
          className="relative h-full min-h-[350px] md:min-h-[450px] w-full rounded-xl bg-muted border border-border shadow-xl overflow-hidden order-1"
        >
          <CustomCarousel
            autoplay={true}
            autoplayDelay={5000}
            showArrows={true}
            showDots={true}
            onSlideClick={handleSlideClick}
            className="h-full w-full absolute inset-0" // Absolute inset ensures carousel fills the container
          >
            {images.map((src, index) => (
              <div key={index} className="relative w-full h-full">
                <Image
                  src={src}
                  alt={`${label} - Image ${index + 1}`}
                  fill
                  className="object-cover object-center transition-transform duration-700 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60 pointer-events-none" />
              </div>
            ))}
          </CustomCarousel>
        </motion.div>

        {/* 2. RIGHT COLUMN (DETAILS) */}
        <div className="flex flex-col h-full order-2 pt-2">
          {/* Main Content Group */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
              className="flex flex-col gap-4"
            >
              <h2 className="text-3xl font-serif text-foreground">{label}</h2>
              <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                {description}
              </p>
            </motion.div>

            <ul className="space-y-4 mt-6">
              {Object.entries(specs).map(([key, value], index) => (
                <motion.li
                  key={key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.05, duration: 0.4 }}
                  className="flex items-center justify-between border-b border-border pb-2 text-sm md:text-[15px]"
                >
                  <span className="font-medium text-muted-foreground capitalize">{key}</span>
                  <span className="font-semibold text-foreground font-serif tracking-wide">{value}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Spacer to push buttons down if you want them aligned to bottom */}
          <div className="flex-grow" />

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 mt-8 pt-4"
          >
            <button
              onClick={() => setIsBookingOpen(true)}
              className="cursor-pointer w-full sm:w-auto flex justify-center items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-md text-sm font-medium hover:bg-primary/90 transition-all shadow-md hover:shadow-lg whitespace-nowrap"
            >
              <Calendar className="w-4 h-4" />
              {actions?.primary || "Book a Visit"}
            </button>

            <button className="cursor-pointer group w-full sm:w-auto flex justify-center items-center gap-2 px-8 py-3 rounded-md text-sm font-medium text-foreground bg-transparent border border-border hover:border-accent hover:text-accent transition-all shadow-sm whitespace-nowrap">
              <Phone className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
              {actions?.secondary || "Call Us Now"}
            </button>
          </motion.div>
        </div>
      </div>

      {/* LIGHTBOX (Unchanged) */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={images.map((src) => ({ src }))}
        plugins={[Slideshow]}
        slideshow={{ autoplay: true, delay: 3000 }}
      />

      {/* BOOKING MODAL */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        propertyId={id ? String(id) : "demo-property-id"}
        propertyName={label}
      />
    </>
  );
}