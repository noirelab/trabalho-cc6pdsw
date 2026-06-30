import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: { role: "admin" },
    create: {
      username: "admin",
      password: hashedPassword,
      name: "Administrador",
      role: "admin",
    },
  });

  console.log("Usuário admin criado:", admin.username);

  const services = [
    {
      title: "Desenvolvimento Web",
      description:
        "Criação de portais corporativos e web apps escaláveis com as tecnologias mais modernas do mercado.",
      price: 15000,
    },
    {
      title: "Design UI/UX",
      description:
        "Interfaces minimalistas focadas em acessibilidade, usabilidade e conversão de usuários.",
      price: 8000,
    },
    {
      title: "Auditoria de Código",
      description:
        "Revisão e melhoria de bases de código legadas, identificando bugs, vulnerabilidades e débitos técnicos.",
      price: 5000,
    },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { id: services.indexOf(service) + 1 },
      update: {},
      create: service,
    });
  }

  console.log("Serviços criados:", services.length);

  const projects = [
    {
      title: "Portal Corporativo Acme",
      description: "Portal interno com dashboard, gestão de documentos e chat em tempo real.",
      imageUrl: "",
    },
    {
      title: "E-commerce Natura",
      description: "Loja virtual com checkout integrado, busca avançada e painel administrativo.",
      imageUrl: "",
    },
    {
      title: "App Mobile FitTrack",
      description: "Aplicativo de acompanhamento fitness com integração a wearables e gráficos.",
      imageUrl: "",
    },
  ];

  for (const project of projects) {
    await prisma.project.create({ data: project });
  }

  console.log("Projetos criados:", projects.length);

  const testimonials = [
    {
      name: "Maria Silva",
      role: "CEO da Acme Corp",
      text: "A Unobtainium transformou nossa presença digital. O portal corporativo superou todas as expectativas.",
    },
    {
      name: "João Santos",
      role: "CTO da Natura",
      text: "Equipe extremamente profissional. Entregaram o e-commerce no prazo e com qualidade excepcional.",
    },
    {
      name: "Ana Costa",
      role: "Founder da FitTrack",
      text: "App impecável, design moderno e performance incrível. Recomendo fortemente.",
    },
  ];

  for (const testimonial of testimonials) {
    await prisma.testimonial.create({ data: testimonial });
  }

  console.log("Depoimentos criados:", testimonials.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
