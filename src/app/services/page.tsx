import { Card, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Services() {
    const services = [
        { title: "Desenvolvimento Web", description: "Criação de portais corporativos e web apps escaláveis de alta performance." },
        { title: "Design UI/UX", description: "Interfaces de usuário minimalistas e focadas em acessibilidade." },
        { title: "Auditoria de Código", description: "Revisão e melhoria de bases de código legadas para maior segurança." },
    ];

    return (
        <div className="py-12">
            <div className="mb-10 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Serviços da Unobtainium</h1>
                <p className="text-gray-500 max-w-2xl mx-auto">
                    Conheça o catálogo de soluções que nossa agência oferece para transformar o seu negócio.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {services.map((service, index) => (
                    <Card key={index} className="flex flex-col">
                        <CardHeader>
                            <CardTitle>{service.title}</CardTitle>
                            <CardDescription>{service.description}</CardDescription>
                        </CardHeader>
                        <CardFooter className="mt-auto pt-6">
                            <Button variant="secondary" className="w-full">Saber mais</Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
