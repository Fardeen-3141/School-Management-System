// src\app\layout.tsx

import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // optional: include the weights you need
  display: "swap", // recommended for better font loading
});

export const metadata: Metadata = {
  title: "Anipur Adarsha Vidyaniketan",
  description: "Manage school fees, payments, and student records",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
