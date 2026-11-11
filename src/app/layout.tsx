import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PropertyGOJB | Johor Property Discovery",
  description:
    "Explore property types, Johor areas and clearly labelled demonstration concepts. No verified properties for sale are published yet.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
