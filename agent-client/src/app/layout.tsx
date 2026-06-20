import type { Metadata } from "next";
import "@/app/globals.css";


export const metadata: Metadata = {
  title: "Agent Client",
  description: "A chat interface for Alchemyst Agent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
