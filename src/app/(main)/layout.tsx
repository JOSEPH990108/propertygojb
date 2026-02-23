import { Navbar } from "@/components/layout/NavBar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="pt-0 md:pt-[calc(var(--header-height))]">
        {children}
      </main>
    </>
  );
}
