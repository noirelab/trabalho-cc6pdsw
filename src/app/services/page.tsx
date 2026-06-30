import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_URL = "http://localhost:3001";

interface Service {
  id: number;
  title: string;
  description: string;
}

export default async function Services() {
  let services: Service[] = [];

  try {
    const res = await fetch(`${API_URL}/api/services`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      services = data.data;
    }
  } catch {
    // Fallback para array vazio se API estiver offline
  }

  return (
    <div className="py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
          Serviços da Unobtainium
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Conheça o catálogo de soluções que nossa agência oferece para transformar o seu negócio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {services.map((service) => (
          <Card key={service.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{service.title}</CardTitle>
              <CardDescription>{service.description}</CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto pt-6">
              <Link href={`/services/${service.id}`} className="w-full">
                <Button variant="secondary" className="w-full">
                  Saber mais
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      {services.length === 0 && (
        <p className="text-center text-gray-500 mt-8">
          Nenhum serviço disponível no momento.
        </p>
      )}
    </div>
  );
}
