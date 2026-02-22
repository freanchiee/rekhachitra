import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Rekhachitra – Live Math Classroom",
    template: "%s | Rekhachitra",
  },
  description:
    "Interactive math classroom platform for IB MYP teachers. Create graph-based activities, run live sessions, see instant student responses.",
  keywords: ["math", "classroom", "interactive", "IB MYP", "graphing", "EdTech", "live session"],
  authors: [{ name: "Rekhachitra" }],
  openGraph: {
    type: "website",
    siteName: "Rekhachitra",
    title: "Rekhachitra – Live Math Classroom",
    description:
      "Interactive math classroom platform for IB MYP teachers. Create graph-based activities, run live sessions.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Rekhachitra" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rekhachitra – Live Math Classroom",
    description: "Interactive math classroom platform for IB MYP teachers.",
  },
  robots: { index: true, follow: true },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://rekhachitra.vercel.app"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Rekhachitra",
              applicationCategory: "EducationalApplication",
              audience: {
                "@type": "EducationalAudience",
                educationalRole: "teacher",
              },
              offers: { "@type": "Offer", price: "0" },
              description:
                "Live interactive math classroom platform for IB MYP teachers and students.",
            }),
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
