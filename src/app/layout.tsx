import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Unobtainium",
    description: "Front-end da agência Unobtainium",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR">
            <body className={`${inter.className} min-h-screen bg-gray-50 flex flex-col`}>
                {/* Menu principal feito diretamente no layout sem componentização */}
                <nav className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
                        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
                            <h1 className="text-xl font-semibold text-gray-900">Unobtainium</h1>

                            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                                <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                                    Home
                                </Link>
                                <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                                    Sobre
                                </Link>
                                <Link href="/services" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                                    Serviços
                                </Link>
                                <Link href="/projects" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                                    Projetos
                                </Link>
                                <Link href="/contact" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                                    Contato
                                </Link>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 w-full sm:w-auto">
                            <Link href="/dashboard">
                                <Button variant="ghost" className="text-sm font-medium">
                                    Dashboard
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button className="text-sm font-medium">
                                    Entrar
                                </Button>
                            </Link>
                        </div>
                    </div>
                </nav>

                <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8">
                    {children}
                </main>

                <footer className="bg-white border-t border-gray-200 py-6 text-center text-sm text-gray-500">
                    <p>© Kaíque - CC6PDSW</p>
                </footer>
            </body>
        </html>
    );
}
