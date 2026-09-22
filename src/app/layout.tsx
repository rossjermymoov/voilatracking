import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HeyVoila Queue Tracking CSV Uploader',
  description: 'Upload CSV shipments, map fields, and queue tracking events with HeyVoila API',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
