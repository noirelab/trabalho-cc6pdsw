import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const API_URL = "http://localhost:3001";

interface Project {
  id: number;
  title: string;
  description: string;
  createdAt: string;
}

export default async function Projects() {
  let projects: Project[] = [];

  try {
    const res = await fetch(`${API_URL}/api/projects`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      projects = data.projects;
    }
  } catch {}

  return (
    <div className="py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
          Nossos Projetos
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Conheça alguns dos trabalhos realizados pela nossa equipe.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {projects.map((project) => (
          <Card key={project.id} className="flex flex-col">
            <div className="h-40 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center rounded-t-lg">
              <span className="text-4xl text-gray-400">&#x1F4E6;</span>
            </div>
            <CardHeader>
              <CardTitle>{project.title}</CardTitle>
              <CardDescription>{project.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-400">
                {new Date(project.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {projects.length === 0 && (
        <p className="text-center text-gray-500 mt-8">
          Nenhum projeto cadastrado no momento.
        </p>
      )}
    </div>
  );
}
