import type { Metadata } from "next";
import "./global.css";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "gritOS — Fitness Tracker",
  description: "Track your gains. Own your grind.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto" style={{ padding: "36px 40px" }}>{children}</main>
        </div>
      </body>
    </html>
  );
}
