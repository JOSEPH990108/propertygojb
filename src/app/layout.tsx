import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PropertyGOJB | Johor Bahru",
  description:
    "A thoughtful place to begin your Johor Bahru property journey. Listings and customer features are not available yet.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
