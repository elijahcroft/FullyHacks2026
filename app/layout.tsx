import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Polution Path Prediction",
  description: "Predict the path of pollution in the ocean.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden bg-[#060d1a]">{children}</body>
    </html>
  );
}
