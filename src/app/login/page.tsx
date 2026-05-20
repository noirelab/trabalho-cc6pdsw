import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { login } from "./actions";

export default function Login() {
  return (
    <div className="flex items-center justify-center py-20">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Autenticação</CardTitle>
          <CardDescription>
            Insira suas credenciais para acessar a área restrita do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={login} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input 
                id="username" 
                name="username" 
                placeholder="admin" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                placeholder="********" 
                required 
              />
            </div>
            <div className="pt-2">
              <Button type="submit" className="w-full">
                Entrar no Sistema
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
