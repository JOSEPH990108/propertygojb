import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PropertyGOJB",
  description: "PropertyGOJB application foundation",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
