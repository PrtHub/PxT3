import type { Metadata } from "next";
import { Silkscreen, Space_Grotesk, Sora } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { HydrationCleanup } from "@/lib/hydration-cleanup";

const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  weight: "400",
  subsets: ["latin"]
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"]
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "PxT3",
  description: "This is a high-performance AI Chat App, leveraging the type-safe, edge-ready power of the T3 Stack. By combining the lightning-fast Drizzle ORM with Neon's serverless database, we've eliminated the bottlenecks. The result is a conversation that flows as fast as you can think, with real-time streaming and a UI that never gets in your way.",
  keywords: ["PxT3", "AI Chat App", "T3 Stack", "Drizzle ORM", "Neon", "Serverless Database", "High-Performance", "Real-Time Streaming", "UI", "Conversation", "Fast", "Think", "Never Gets In Your Way", "Chat GPT", "Chat APP"],
  authors: [{ name: "PxT3" }],
  openGraph: {
    title: "PxT3",
    description: "This is a high-performance AI Chat App, leveraging the type-safe, edge-ready power of the T3 Stack. By combining the lightning-fast Drizzle ORM with Neon's serverless database, we've eliminated the bottlenecks. The result is a conversation that flows as fast as you can think, with real-time streaming and a UI that never gets in your way.",
    type: "website",
    locale: "en",
    siteName: "PxT3",
  },
  twitter: {
    title: "PxT3",
    description: "This is a high-performance AI Chat App, leveraging the type-safe, edge-ready power of the T3 Stack. By combining the lightning-fast Drizzle ORM with Neon's serverless database, we've eliminated the bottlenecks. The result is a conversation that flows as fast as you can think, with real-time streaming and a UI that never gets in your way.",
    card: "summary_large_image",
    site: "@PxT3",
    creator: "@PxT3",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${silkscreen.variable} ${sora.variable} antialiased dark`}
        suppressHydrationWarning
      >
        <SessionProvider>
          <HydrationCleanup />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
