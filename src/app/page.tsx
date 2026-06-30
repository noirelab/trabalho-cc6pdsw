import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const API_URL = "http://localhost:3001";

interface Testimonial {
  id: number;
  name: string;
  role: string;
  text: string;
}

async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const res = await fetch(`${API_URL}/api/testimonials`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return data.data;
    }
  } catch {}
  return [];
}

export default async function Home() {
  const testimonials = await getTestimonials();

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl mb-6">
        Bem-vindo à Unobtainium
      </h1>

      <p className="max-w-2xl text-lg text-gray-600 mb-10">
        Esta é a página inicial da Unobtainium. Acesse as demais áreas pelo menu superior ou através dos links rápidos abaixo.
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

      {testimonials.length > 0 && (
        <div className="mt-20 w-full max-w-5xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            O que nossos clientes dizem
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.id}>
                <CardContent className="pt-6 text-left">
                  <p className="text-gray-600 italic mb-4 leading-relaxed">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
