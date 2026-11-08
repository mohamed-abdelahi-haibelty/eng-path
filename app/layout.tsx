import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Nunito, Geist_Mono, Caveat } from "next/font/google";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexClientProvider } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { isLocale, routing } from "@/i18n/routing";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Eng Path",
  description: "Language learning platform — English (TOEFL) and French (DELF/DALF).",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // <html lang> follows the user's locale cookie. The next-intl middleware
  // sets NEXT_LOCALE whenever the user enters /en/... or /fr/...; the picker
  // also persists the choice. First-time visitors get the routing default.
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const lang =
    cookieLocale && isLocale(cookieLocale) ? cookieLocale : routing.defaultLocale;

  return (
    <ConvexAuthNextjsServerProvider>
      <html
        lang={lang}
        className={`${nunito.variable} ${geistMono.variable} ${caveat.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <ConvexClientProvider>{children}</ConvexClientProvider>
          <Toaster />
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
