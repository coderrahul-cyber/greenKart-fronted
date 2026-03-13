import type { Metadata } from "next";
import { Geist, Roboto , Poppins ,  Playfair_Display } from "next/font/google";
import "./globals.css";
import { CartProvider } from "../context/CartContext";
import { AuthProvider } from "../context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
});

const popins = Poppins({
  variable: "--font-popins",
  subsets: ["latin"],
  weight : ["400", "500", "600", "700", "800", "900"]
})

const PlayfairDisplay = Playfair_Display({
  variable : "--font-playfair-display",
  subsets : ["latin"],
  weight : ["400", "500", "600", "700", "800", "900"]
})

export const metadata: Metadata = {
  title: "GreenKart",
  description: "A Plave where you can Order viggies to your home",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${popins.variable} ${roboto.variable} ${PlayfairDisplay.variable} antialiased`}
      >
        <AuthProvider>
        <CartProvider>
        {children}
        </CartProvider>

        </AuthProvider>
      </body>
    </html>
  );
}
