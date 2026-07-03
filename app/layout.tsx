import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Riymar Task Dashboard",
  description: "Task management dashboard for internal agency operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
