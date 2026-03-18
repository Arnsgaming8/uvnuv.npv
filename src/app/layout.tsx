import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FreeVPN - Secure Your Connection",
  description: "A free, fast, and secure VPN service to protect your privacy online",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
