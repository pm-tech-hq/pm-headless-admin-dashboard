import localFont from "next/font/local";
const poppins = localFont({
  src: [
    { path: "../../../public/fonts/poppins/Poppins-Thin.ttf", weight: "100", style: "normal" },
    { path: "../../../public/fonts/poppins/Poppins-ExtraLight.ttf", weight: "200", style: "normal" },
    { path: "../../../public/fonts/poppins/Poppins-Light.ttf", weight: "300", style: "normal" },
    { path: "../../../public/fonts/poppins/Poppins-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../../public/fonts/poppins/Poppins-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../../public/fonts/poppins/Poppins-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../../public/fonts/poppins/Poppins-Bold.ttf", weight: "700", style: "normal" },
    { path: "../../../public/fonts/poppins/Poppins-ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "../../../public/fonts/poppins/Poppins-Black.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-poppins",
});
import "@/styles/globals.css";

export const metadata = {
  title: "PM Dashboard",
  description: "Headless Admin Dashboard",
};



export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={poppins.variable}>
            <head>
            </head>
            <body className="flex flex-col min-h-screen">
                {children}
            </body>
        </html>
    );
}
