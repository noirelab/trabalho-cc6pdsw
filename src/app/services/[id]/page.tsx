import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";

const API_URL = "http://localhost:3001";

interface Service {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

async function getService(id: string): Promise<Service | null> {
  try {
    const res = await fetch(`${API_URL}/api/services/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.service;
  } catch {
    return null;
  }
}

export default async function ServiceDetail({
  params,
}: {
  params: { id: string };
}) {
  const service = await getService(params.id);

  if (!service) {
    notFound();
  }

  return (
    <div className="py-12 max-w-3xl mx-auto">
      <Link href="/services">
        <Button variant="ghost" className="mb-6">
          Voltar para Serviços
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">{service.title}</CardTitle>
          <CardDescription className="text-sm text-gray-500">
            Criado em{" "}
            {new Date(service.createdAt).toLocaleDateString("pt-BR")}
            {" · "}
            Atualizado em{" "}
            {new Date(service.updatedAt).toLocaleDateString("pt-BR")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed text-lg">
            {service.description}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
