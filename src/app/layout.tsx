import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VreePN - Free VPN Service",
  description: "Protect your privacy with VreePN - a free, fast, and secure VPN service. Browse anonymously and securely.",
  keywords: ["VPN", "free VPN", "online privacy", "secure browsing", "anonymous VPN"],
  authors: [{ name: "Arnav Jugessur" }],
  openGraph: {
    title: "VreePN - Free VPN Service",
    description: "Protect your privacy with VreePN - a free, fast, and secure VPN service.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
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
