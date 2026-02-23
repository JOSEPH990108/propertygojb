// src\app\(demo)\demo-page\page.tsx
"use client";


import Image from "next/image";
import { motion } from "framer-motion";
import {
  MapPin,
  BedDouble,
  Bath,
  Star,
  Check,
  Shield,
  Ruler,
  LogIn,
} from "lucide-react";

// --- Components Imports ---

// Carousels
import { Carousel as RotateCarousel } from "@/components/carousel/3DRotateCarousel";
import { FanCarousel } from "@/components/carousel/FanCarousel";
import GeneralCarousel from "@/components/carousel/GeneralCarousel";
import { ScrollCarousel } from "@/components/carousel/ScrollCarousel";
import { SimpleCardCarousel } from "@/components/carousel/SimpleCardCarousel";

// Auth
import SignInForm from "@/components/auth/SignInForm";
import SignUpForm from "@/components/auth/SignUpForm";
import { useUIStore } from "@/stores/ui-store";

// Features & Tools
import DsrCalculatorLive from "@/components/custom/feature/tools/DSRCalculator";
import MortgageCalculator from "@/components/custom/feature/tools/MortgageCalculator";
import PropertyMatcher from "@/components/custom/feature/tools/PropertyMatcher";
import RealEstateCard from "@/components/custom/feature/RealEstateCard";
import VerticalTabs from "@/components/custom/ui/VerticalTabs";

// Shared & Layout
import { Navbar } from "@/components/layout/NavBar";
import { CollapsibleContainer } from "@/components/shared/CollapsibleContainer";
import { SwipeWrapper } from "@/components/shared/SwipeWrapper";
import { MotionSection } from "@/components/shared/MotionSection";

// UI Components (just Button for triggers)
import { Button } from "@/components/ui/button";
import { TabItem } from "@/types";

/* =========================================================================
   MOCK DATA
   ========================================================================= */

// --- Property Data for Cards ---
const MOCK_PROPERTIES = [
  {
    id: 1,
    title: "Eco Spring Luxury Villa",
    price: "RM 2,500,000",
    location: "Tebrau, Johor Bahru",
    beds: 5,
    baths: 4,
    size: "3,200 sqft",
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    title: "Horizon Hills Mansion",
    price: "RM 3,800,000",
    location: "Iskandar Puteri, Johor",
    beds: 6,
    baths: 6,
    size: "4,500 sqft",
    rating: 5.0,
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    title: "Princess Cove Condo",
    price: "RM 850,000",
    location: "JB City Centre",
    beds: 3,
    baths: 2,
    size: "1,100 sqft",
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1567496898905-af413988d4d2?auto=format&fit=crop&w=800&q=80",
  },
];

// --- Carousel Images/Items ---
const CAROUSEL_IMAGES = [
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2653&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2670&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=2670&auto=format&fit=crop",
];

// --- Vertical Tabs Mock Content ---
const ArchitectureContent = () => (
  <div className="space-y-6">
    <div className="relative h-64 w-full overflow-hidden rounded-xl">
      <img
        src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2653&auto=format&fit=crop"
        alt="Modern Architecture"
        className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
        <p className="text-white font-serif italic text-lg">
          "A silhouette that defines the skyline."
        </p>
      </div>
    </div>
    <div className="prose prose-zinc dark:prose-invert max-w-none">
      <h3 className="text-2xl font-serif text-foreground">The Glass Monolith</h3>
      <p className="text-muted-foreground leading-relaxed">
        Designed by award-winning architects, the façade features a signature
        double-glazed curtain wall system that maximizes natural light while
        ensuring thermal comfort.
      </p>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="p-4 bg-muted/30 rounded-lg border border-border">
          <span className="block text-xs uppercase tracking-widest text-accent mb-1">
            Height
          </span>
          <span className="text-xl font-bold">45 Stories</span>
        </div>
        <div className="p-4 bg-muted/30 rounded-lg border border-border">
          <span className="block text-xs uppercase tracking-widest text-accent mb-1">
            Style
          </span>
          <span className="text-xl font-bold">Neo-Futurist</span>
        </div>
      </div>
    </div>
  </div>
);

const InteriorsContent = () => (
  <div className="space-y-6">
    <h3 className="text-2xl font-serif text-foreground">Bespoke Elegance</h3>
    <p className="text-muted-foreground">
      Every inch is meticulously crafted. From the imported Italian marble
      flooring to the gold-leaf ceiling accents, the interiors whisper quiet
      luxury.
    </p>
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {[
        "Italian Statuario Marble",
        "Walnut Veneer Cabinetry",
        "Smart Home Integration",
        "Hansgrohe Sanitary Ware",
        "Double Volume Ceilings",
        "Private Lift Lobby",
      ].map((item) => (
        <li
          key={item}
          className="flex items-center gap-3 text-sm text-foreground/80"
        >
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center">
            <Check className="w-3 h-3 text-accent" />
          </div>
          {item}
        </li>
      ))}
    </ul>
    <div className="grid grid-cols-2 gap-4 h-40">
      <img
        src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2600&auto=format&fit=crop"
        className="w-full h-full object-cover rounded-lg"
        alt="Interior 1"
      />
      <img
        src="https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?q=80&w=2670&auto=format&fit=crop"
        className="w-full h-full object-cover rounded-lg"
        alt="Interior 2"
      />
    </div>
  </div>
);

const AmenitiesContent = () => (
  <div className="space-y-8">
    <div className="flex items-start gap-4">
      <div className="p-3 bg-accent/10 rounded-lg text-accent">
        <Shield className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-lg font-bold text-foreground">Concierge Service</h4>
        <p className="text-sm text-muted-foreground">
          24/7 white-glove service for all your needs.
        </p>
      </div>
    </div>
    <div className="flex items-start gap-4">
      <div className="p-3 bg-accent/10 rounded-lg text-accent">
        <MapPin className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-lg font-bold text-foreground">Prime Location</h4>
        <p className="text-sm text-muted-foreground">
          Direct access to RTS Link and Marina Bay.
        </p>
      </div>
    </div>
    <div className="p-6 bg-gradient-to-br from-zinc-900 to-black text-white rounded-xl shadow-2xl">
      <h4 className="font-serif text-xl text-accent mb-2">The Sky Deck</h4>
      <p className="text-white/70 text-sm mb-4">
        An infinity pool suspended 200m in the air, offering panoramic views.
      </p>
      <button className="text-xs font-bold uppercase tracking-widest border-b border-accent pb-1 hover:text-accent transition-colors">
        View Gallery
      </button>
    </div>
  </div>
);

const TAB_ITEMS: TabItem[] = [
  { id: "arch", label: "Architecture", content: <ArchitectureContent /> },
  { id: "interior", label: "Interiors", content: <InteriorsContent /> },
  { id: "amenities", label: "Amenities", content: <AmenitiesContent /> },
  {
    id: "plans",
    label: "Floor Plans",
    content: (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-xl bg-muted/20">
        <Ruler className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="text-muted-foreground font-medium">
          Interactive Plans Loading...
        </p>
      </div>
    ),
  },
];

// --- Real Estate Card Mock Data (Featured Collection) ---
const FEATURED_COLLECTION_TABS: TabItem[] = [
  {
    id: "penthouse",
    label: "The Royal Penthouse",
    content: (
      <RealEstateCard
        label="The Royal Penthouse"
        images={[
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2560&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2053&auto=format&fit=crop",
        ]}
        description="Experience the pinnacle of luxury living in our exclusive Royal Penthouse. Featuring panoramic city views and a private infinity pool."
        specs={{
          area: "4,500 sqft",
          rooms: 4,
          bathrooms: 5,
          Floor: "52nd (Top)",
        }}
        actions={{ primary: "Private Tour" }}
      />
    ),
  },
  {
    id: "villa",
    label: "Oceanfront Villa",
    content: (
      <RealEstateCard
        label="Oceanfront Villa"
        images={[
          "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=2670&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop",
        ]}
        description="A sanctuary of calm, this Oceanfront Villa merges indoor and outdoor living with direct beach access."
        specs={{
          area: "6,200 sqft",
          rooms: 6,
          bathrooms: 7,
          Exterior: "Private Beach",
        }}
      />
    ),
  },
];

/* =========================================================================
   PAGE COMPONENT
   ========================================================================= */

export default function DemoPage() {
  const { setLoginOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-background text-foreground pb-40">

      {/* 1. LAYOUT COMPONENTS: NavBar (Visual Representation) */}
      {/* Because (demo) might not have the main layout nav, we render it here */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden bg-brand-950">
        <Image
          src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80"
          alt="Hero"
          fill
          className="object-cover opacity-40"
        />
        <div className="relative z-10 text-center px-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-serif font-bold text-white mb-6"
          >
            Component Gallery
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/80 max-w-2xl mx-auto"
          >
            Comprehensive showcase of all custom components, tools, and features.
          </motion.p>
        </div>
      </section>

      <div className="container mx-auto px-4 space-y-32 py-20">

        {/* =======================================================
            SECTION: CAROUSELS
           ======================================================= */}
        <section>
          <SectionHeader title="01. Carousels" description="Interactive media showcases." />

          <div className="space-y-16">

            {/* 3D Rotate Carousel */}
            <div>
              <h3 className="text-xl font-bold mb-6">3D Rotate Carousel</h3>
              <div className="h-[400px] w-full bg-zinc-900/5 dark:bg-zinc-900/50 rounded-2xl overflow-hidden relative">
                 <RotateCarousel radius={300} duration={30}>
                    {CAROUSEL_IMAGES.slice(0, 4).map((src, i) => (
                      <div key={i} className="w-[200px] h-[280px] rounded-xl overflow-hidden border-2 border-white/20">
                         <img src={src} className="w-full h-full object-cover" alt={`Slide ${i}`} />
                      </div>
                    ))}
                 </RotateCarousel>
              </div>
            </div>

            {/* Fan Carousel */}
            <div>
              <h3 className="text-xl font-bold mb-6">Fan Carousel</h3>
              <FanCarousel className="h-[500px]">
                {CAROUSEL_IMAGES.map((src, i) => (
                  <div key={i} className="w-full h-full rounded-xl overflow-hidden shadow-2xl bg-black">
                     <img src={src} className="w-full h-full object-cover" alt={`Fan ${i}`} />
                     <div className="absolute bottom-4 left-4 text-white font-bold text-xl drop-shadow-md">
                        Residence {i + 1}
                     </div>
                  </div>
                ))}
              </FanCarousel>
            </div>

            {/* Scroll Carousel */}
            <div>
              <h3 className="text-xl font-bold mb-6">Scroll Carousel</h3>
              <div className="flex justify-center">
                 <ScrollCarousel autoScroll interval={4000} className="max-w-xl">
                   {CAROUSEL_IMAGES.slice(0, 3).map((src, i) => (
                      <div key={i} className="relative w-full h-64 rounded-xl overflow-hidden">
                        <img src={src} className="object-cover w-full h-full" alt="Scroll Item"/>
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                           <h4 className="text-white text-2xl font-serif">Feature {i + 1}</h4>
                        </div>
                      </div>
                   ))}
                 </ScrollCarousel>
              </div>
            </div>

             {/* Simple Card Carousel */}
             <div>
              <h3 className="text-xl font-bold mb-6">Simple Card Carousel (Draggable)</h3>
              <SimpleCardCarousel
                items={MOCK_PROPERTIES}
                renderItem={(item) => (
                   <div className="w-full h-full bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="h-48 relative">
                         <img src={item.image} alt={item.title} className="w-full h-full object-cover"/>
                         <div className="absolute top-2 right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                            <Star size={10} /> {item.rating}
                         </div>
                      </div>
                      <div className="p-4">
                         <h4 className="font-bold text-lg truncate">{item.title}</h4>
                         <p className="text-muted-foreground text-sm">{item.location}</p>
                         <p className="text-accent font-bold mt-2">{item.price}</p>
                      </div>
                   </div>
                )}
              />
            </div>

            {/* General Carousel */}
            <div>
               <h3 className="text-xl font-bold mb-6">General Carousel (Button Navigation)</h3>
               <GeneralCarousel>
                  {MOCK_PROPERTIES.map((prop) => (
                    <div key={prop.id} className="w-80 h-96 bg-card border border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm shrink-0">
                       <div className="w-32 h-32 rounded-full overflow-hidden mb-4 relative">
                          <Image src={prop.image} fill className="object-cover" alt={prop.title}/>
                       </div>
                       <h4 className="text-xl font-serif font-bold">{prop.title}</h4>
                       <p className="text-muted-foreground text-sm mt-2">{prop.location}</p>
                       <div className="flex gap-4 mt-6 text-sm text-foreground/70">
                          <span className="flex items-center gap-1"><BedDouble size={14}/> {prop.beds}</span>
                          <span className="flex items-center gap-1"><Bath size={14}/> {prop.baths}</span>
                       </div>
                    </div>
                  ))}
               </GeneralCarousel>
            </div>

          </div>
        </section>

        {/* =======================================================
            SECTION: FEATURES & TOOLS
           ======================================================= */}
        <section>
          <SectionHeader title="02. Calculators & Tools" description="Functional tools for real estate." />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
             <div className="space-y-8">
                <h3 className="text-xl font-bold border-b pb-2">Mortgage Calculator</h3>
                <MortgageCalculator />
             </div>
             <div className="space-y-8">
                <h3 className="text-xl font-bold border-b pb-2">DSR Calculator</h3>
                <DsrCalculatorLive />
             </div>
          </div>

          <div className="mt-20">
             <h3 className="text-xl font-bold border-b pb-2 mb-8">Property Matcher</h3>
             {/* Note: This component might manage its own height */}
             <div className="min-h-[600px] border border-border rounded-3xl overflow-hidden">
                <PropertyMatcher />
             </div>
          </div>
        </section>

        {/* =======================================================
            SECTION: UI COMPONENTS (COMPLEX)
           ======================================================= */}
        <section>
          <SectionHeader title="03. Complex UI" description="Advanced interface elements." />

          <div className="space-y-16">

            {/* Vertical Tabs */}
            <div>
               <h3 className="text-xl font-bold mb-6">Vertical Tabs (Content Switcher)</h3>
               <div className="bg-muted/10 rounded-3xl border border-border overflow-hidden">
                 <VerticalTabs items={TAB_ITEMS} />
               </div>
            </div>

            {/* Feature Tabs (using VerticalTabs with RealEstateCard) */}
            <div>
               <h3 className="text-xl font-bold mb-6">Real Estate Card Integration</h3>
               <div className="bg-muted/10 rounded-3xl border border-border overflow-hidden p-4">
                 <VerticalTabs items={FEATURED_COLLECTION_TABS} />
               </div>
            </div>

          </div>
        </section>


        {/* =======================================================
            SECTION: AUTH & SHARED
           ======================================================= */}
        <section>
           <SectionHeader title="04. Auth & Shared" description="Authentication forms and utilities." />

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">

              {/* Isolated Auth Forms */}
              <div className="space-y-6">
                 <h3 className="text-xl font-bold">Sign In Form (Isolated)</h3>
                 <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
                    <SignInForm />
                 </div>
              </div>

              <div className="space-y-6">
                 <h3 className="text-xl font-bold">Sign Up Form (Isolated)</h3>
                 <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
                    <SignUpForm />
                 </div>
              </div>
           </div>

           {/* Interactive Triggers & Utilities */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              {/* Login Modal Trigger */}
              <div className="p-6 border border-border rounded-xl bg-card flex flex-col items-center justify-center text-center gap-4">
                 <div className="p-4 bg-primary/10 text-primary rounded-full">
                    <LogIn size={24} />
                 </div>
                 <h4 className="font-bold">Global Login Modal</h4>
                 <p className="text-sm text-muted-foreground">
                    Controlled via global theme store.
                 </p>
                 <Button onClick={() => setLoginOpen(true)}>Open Modal</Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => {
                     useUIStore.getState().resetDismissed();
                     alert("Login trigger reset! Refresh or scroll to test.");
                   }}
                 >
                   Reset Trigger State
                 </Button>
              </div>

              {/* Collapsible Container Demo */}
              <div className="col-span-1 md:col-span-2">
                 <CollapsibleContainer title="Collapsible Utility" defaultOpen>
                    <div className="p-4 space-y-4">
                       <p className="text-sm text-muted-foreground">
                          This container uses Framer Motion for smooth height transitions.
                          It also includes a <code>DraggableScrollArea</code> inside.
                       </p>
                       <div className="h-32 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
                          Scrollable Content Area
                       </div>
                    </div>
                 </CollapsibleContainer>
              </div>

              {/* Swipe Wrapper Demo */}
              <div className="col-span-1 md:col-span-3">
                 <SwipeWrapper
                    className="bg-accent/10 p-12 rounded-xl text-center cursor-ew-resize border border-accent/20"
                    onNext={() => alert("Swiped Next!")}
                    onPrev={() => alert("Swiped Prev!")}
                 >
                    <p className="font-bold text-accent">Swipe Me (Left/Right)</p>
                    <p className="text-xs text-muted-foreground mt-2">Uses useSwipe hook</p>
                 </SwipeWrapper>
              </div>

           </div>
        </section>

      </div>
    </div>
  );
}

// --- Helper Components ---

function SectionHeader({ title, description }: { title: string; description: string }) {
   return (
      <MotionSection className="mb-12 border-b border-border pb-6">
         <h2 className="text-3xl md:text-4xl font-serif font-bold mb-2">{title}</h2>
         <p className="text-muted-foreground text-lg">{description}</p>
      </MotionSection>
   );
}
