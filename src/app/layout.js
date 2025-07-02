// src/app/layout.js

import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "../styles/globals.css";
import logo from "./image.png";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Спортакиада",
  description: "Система учёта соревнований",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen flex bg-gray-50">
          {/* Сайдбар */}
          <aside className="w-64 bg-white shadow h-screen sticky top-0 p-6">
            {/* Логотип */}
            <div className="flex items-center mb-8">
              <Image
                src={logo}
                alt="Спортакиада"
                width={32}
                height={32}
              />
              <span className="ml-2 text-xl font-bold">Спортакиада</span>
            </div>

            {/* Меню */}
            <nav className="space-y-1">
              <Link
                href="/members"
                className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded"
              >
                Участники
              </Link>
              <Link
                href="/competitions"
                className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded"
              >
                Соревнования
              </Link>
              <Link
                href="/final"
                className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded"
              >
                Итоги
              </Link>
            </nav>
          </aside>

          {/* Основной контент */}
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
