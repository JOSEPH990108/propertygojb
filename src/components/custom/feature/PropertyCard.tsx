// src\components\custom\feature\PropertyCard.tsx
import { BedDouble, MoveDiagonal } from "lucide-react";
import Image from "next/image";
import { PropertySpecs } from "@/types";

interface PropertyCardProps {
  title: string;
  description: string;
  image: string;
  specs: PropertySpecs;
}

export function PropertyCard({ title, description, image, specs }: PropertyCardProps) {
  return (
    <div className="min-h-[600px] w-full grid grid-cols-1 lg:grid-cols-2 gap-8 py-8 bg-card border-b border-border text-card-foreground">
      
      {/* Left Column: Text Info */}
      <div className="flex flex-col justify-between p-6 h-full">
        <div>
          <h2 className="text-4xl font-bold text-foreground mb-6">{title}</h2>
          <p className="text-xl text-muted-foreground leading-relaxed font-light">
            {description}
          </p>
        </div>

        {/* Bottom Specs/Icons */}
        <div className="flex items-center gap-6 mt-auto pt-8 border-t border-border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MoveDiagonal className="w-5 h-5" />
            <span className="font-medium">{specs.area}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <BedDouble className="w-5 h-5" />
            <span className="font-medium">{specs.rooms}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div 
               className="w-4 h-4 rounded-full border border-border"
               style={{ backgroundColor: specs.color === 'White' ? '#fff' : specs.color?.toLowerCase() || '#ccc' }}
            />
            <span className="font-medium">{specs.color || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Right Column: Image */}
      <div className="relative h-full w-full rounded-2xl overflow-hidden shadow-sm">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover hover:scale-105 transition-transform duration-700"
        />
      </div>
    </div>
  );
}