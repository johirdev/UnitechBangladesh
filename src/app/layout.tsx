import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import Tracker from "@/components/Tracker";
import DevBadge from "@/components/DevBadge";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Unitech Bangladesh — দক্ষ হবো ইউনিটেক এর সাথে", template: "%s | Unitech Bangladesh" },
  description:
    "Unitech Bangladesh — AutoCAD, Civil, Architecture, Web Development, Graphic Design, Digital Marketing, Video Editing সহ স্কিল কোর্স। ফার্মগেট, ঢাকা।",
  icons: { icon: "/images/logo.png" },
  openGraph: { type: "website", siteName: "Unitech Bangladesh", images: ["/images/banner/banner2.jpg"] },
};

export const viewport: Viewport = { themeColor: "#F99622" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Tracker />
        </AuthProvider>
        <DevBadge />
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
