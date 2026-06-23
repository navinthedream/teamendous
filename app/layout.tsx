import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Teamendous | Reserve a Table",
  description: "Book a table at Teamendous, Toronto",
  icons: {
    icon: "/teamendous-logo.png",
    apple: "/teamendous-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
