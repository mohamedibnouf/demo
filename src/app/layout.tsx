import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "SAMCO Integrated IMS/QMS Platform",
  description: "Interactive enterprise quality management demo for Saudi Airconditioning Manufacturing Co. Ltd. | Carrier",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
