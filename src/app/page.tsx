import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl mb-6">
                Bem-vindo à Unobtainium
            </h1>

            <p className="max-w-2xl text-lg text-gray-600 mb-10">
                Esta é a página inicial da Unobtainium.
                Acesse as demais áreas pelo menu superior ou através dos links rápidos abaixo.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
                <Link href="/services" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full">
                        Ver Serviços
                    </Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="w-full">
                        Fazer Login
                    </Button>
                </Link>
            </div>
        </div>
    );
}
