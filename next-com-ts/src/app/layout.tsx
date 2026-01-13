import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Painel COVID-19 - Nordeste Brasileiro',
  description: 'Dashboard interativo com dados da COVID-19 para os estados do Nordeste do Brasil',
  keywords: ['covid-19', 'nordeste', 'brasil', 'dashboard', 'dados'],
  authors: [{ name: 'Kaynan Pereira de Sousa' }],
  openGraph: {
    title: 'Painel COVID-19 - Nordeste Brasileiro',
    description: 'Dashboard interativo com dados da COVID-19',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}