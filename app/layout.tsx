import { Roboto } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { UrlProvider } from "../context/urlContext";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata = {
  title: "Twitter Clone",
  description: "A Twitter clone built with Next.js",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={roboto.className + "!text-sm"}>
      <body className="!mt-20 md:!mt-0">
        <UrlProvider>
          <Toaster />
          {children}
        </UrlProvider>
      </body>
    </html>
  );
}
