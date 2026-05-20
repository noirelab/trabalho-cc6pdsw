import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { logout } from "../login/actions";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Dashboard() {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token");

    if (!token) {
        redirect("/login");
    }

    return (
        <div className="py-12 max-w-4xl mx-auto">
            <Card className="border-green-200 bg-green-50/30">
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span className="text-sm font-medium text-green-700">Acesso Autorizado</span>
                    </div>
                    <CardTitle className="text-3xl font-bold">Área Restrita (Dashboard)</CardTitle>
                    <CardDescription>
                        Ambiente seguro protegido por autenticação.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-gray-700 leading-relaxed mb-4">
                            Você acessou a área privada. O acesso a esta rota foi protegido pelo Next.js Middleware.
                            Se um usuário não autenticado tentasse acessar <code>/dashboard</code>, ele seria redirecionado
                            automaticamente para a tela de login.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            O token atual armazenado no cookie é utilizado para validar a sua sessão em todo
                            o ciclo de vida da aplicação.
                        </p>
                    </div>

                    <form action={logout} className="pt-4">
                        <Button variant="destructive" type="submit">
                            Encerrar Sessão
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
