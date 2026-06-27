import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Aura.AI • Pulse Agent Nexus',
  description: 'Autonomous Personalized Research Extraction Hub',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}