import "@/styles/globals.css";


export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>

            </head>
            <body className="flex flex-col min-h-screen">
                {children}
            </body>
        </html>
    );
}
