import { Poppins } from "next/font/google";
import "@/styles/globals.css";


const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "Dashboard",
  description: "Headless Admin Dashboard",
};



export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${poppins.className}`}>
            <head>
            </head>
            <body className="flex flex-col min-h-screen">
                {children}
            </body>
        </html>
    );
}
