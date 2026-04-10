import type { Metadata } from "next";
import "./global.css";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";

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
          <div className="desktop-sidebar">
            <Sidebar />
          </div>
          <main
            className="flex-1 overflow-y-auto layout-main"
            style={{ padding: "36px 40px", display: "flex", flexDirection: "column" }}
          >
            {children}
          </main>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
