import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function About() {
    return (
        <div className="max-w-3xl mx-auto py-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Sobre a Unobtainium</h1>
                <p className="text-gray-500">Agência de desenvolvimento e inovação tecnológica.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Empresa Fictícia de Desenvolvimento de Software</CardTitle>
                    <CardDescription>
                        Unobtainium é também um minério fictício.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-gray-700 leading-relaxed">
                    <p>
                        A aplicação também faz uso de componentes base fornecidos pela biblioteca <strong>shadcn/ui</strong>.
                        Esta é uma rota pública, o que significa que o acesso é livre e não passa pela
                        validação do middleware de autenticação.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
