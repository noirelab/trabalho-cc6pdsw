"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { logout } from "../login/actions";

const API_URL = "http://localhost:3001";

const inputClass =
  "flex h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";

const profileSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  password: z.string().min(6, "Mínimo 6 caracteres").or(z.literal("")),
});
type ProfileFormData = z.infer<typeof profileSchema>;

const serviceSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
});
type ServiceFormData = z.infer<typeof serviceSchema>;

const contactReplySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
});

const projectSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
});
type ProjectFormData = z.infer<typeof projectSchema>;

const testimonialSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  role: z.string().min(1, "Cargo é obrigatório"),
  text: z.string().min(1, "Depoimento é obrigatório"),
});
type TestimonialFormData = z.infer<typeof testimonialSchema>;

interface User { id: number; username: string; name: string; }
interface Service { id: number; title: string; description: string; createdAt: string; }
interface Contact { id: number; name: string; email: string; message: string; createdAt: string; }
interface Project { id: number; title: string; description: string; createdAt: string; }
interface Testimonial { id: number; name: string; role: string; text: string; createdAt: string; }

type Tab = "profile" | "services" | "contacts" | "projects" | "testimonials";

export default function DashboardContent() {
  const [tab, setTab] = useState<Tab>("profile");
  const [user, setUser] = useState<User | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);

  const profileForm = useForm<ProfileFormData>({ resolver: zodResolver(profileSchema) });
  const serviceForm = useForm<ServiceFormData>({ resolver: zodResolver(serviceSchema) });
  const projectForm = useForm<ProjectFormData>({ resolver: zodResolver(projectSchema) });
  const testimonialForm = useForm<TestimonialFormData>({ resolver: zodResolver(testimonialSchema) });

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        profileForm.reset({ name: data.user.name, password: "" });
      }
    } catch {}
  }, [profileForm]);

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/services`, { cache: "no-store" });
      if (res.ok) setServices((await res.json()).services);
    } catch {}
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/contacts`, { credentials: "include" });
      if (res.ok) setContacts((await res.json()).contacts);
    } catch {}
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/projects`, { cache: "no-store" });
      if (res.ok) setProjects((await res.json()).projects);
    } catch {}
  }, []);

  const fetchTestimonials = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/testimonials`, { cache: "no-store" });
      if (res.ok) setTestimonials((await res.json()).testimonials);
    } catch {}
  }, []);

  useEffect(() => {
    async function init() {
      await Promise.all([fetchUser(), fetchServices(), fetchContacts(), fetchProjects(), fetchTestimonials()]);
      setLoading(false);
    }
    init();
  }, [fetchUser, fetchServices, fetchContacts, fetchProjects, fetchTestimonials]);

  // Profile
  async function onProfileSubmit(data: ProfileFormData) {
    setMsg("");
    try {
      const body: any = { name: data.name };
      if (data.password) body.password = data.password;
      const res = await fetch(`${API_URL}/api/users/${user!.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) { setMsg((await res.json()).error || "Erro"); return; }
      setMsg("Perfil atualizado com sucesso");
      profileForm.resetField("password");
      await fetchUser();
    } catch { setMsg("Erro de conexão"); }
  }

  // Services
  async function onServiceSubmit(data: ServiceFormData) {
    setMsg("");
    try {
      const url = editingService ? `${API_URL}/api/services/${editingService.id}` : `${API_URL}/api/services`;
      const method = editingService ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) { setMsg((await res.json()).error || "Erro"); return; }
      setEditingService(null);
      serviceForm.reset({ title: "", description: "" });
      await fetchServices();
    } catch { setMsg("Erro de conexão"); }
  }

  async function deleteService(id: number) {
    await fetch(`${API_URL}/api/services/${id}`, { method: "DELETE", credentials: "include" });
    await fetchServices();
  }

  // Contacts
  async function deleteContact(id: number) {
    await fetch(`${API_URL}/api/contacts/${id}`, { method: "DELETE", credentials: "include" });
    await fetchContacts();
  }

  // Projects
  async function onProjectSubmit(data: ProjectFormData) {
    setMsg("");
    try {
      const url = editingProject ? `${API_URL}/api/projects/${editingProject.id}` : `${API_URL}/api/projects`;
      const method = editingProject ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) { setMsg((await res.json()).error || "Erro"); return; }
      setEditingProject(null);
      projectForm.reset({ title: "", description: "" });
      await fetchProjects();
    } catch { setMsg("Erro de conexão"); }
  }

  async function deleteProject(id: number) {
    await fetch(`${API_URL}/api/projects/${id}`, { method: "DELETE", credentials: "include" });
    await fetchProjects();
  }

  // Testimonials
  async function onTestimonialSubmit(data: TestimonialFormData) {
    setMsg("");
    try {
      const url = editingTestimonial ? `${API_URL}/api/testimonials/${editingTestimonial.id}` : `${API_URL}/api/testimonials`;
      const method = editingTestimonial ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) { setMsg((await res.json()).error || "Erro"); return; }
      setEditingTestimonial(null);
      testimonialForm.reset({ name: "", role: "", text: "" });
      await fetchTestimonials();
    } catch { setMsg("Erro de conexão"); }
  }

  async function deleteTestimonial(id: number) {
    await fetch(`${API_URL}/api/testimonials/${id}`, { method: "DELETE", credentials: "include" });
    await fetchTestimonials();
  }

  if (loading) return <div className="py-12 max-w-4xl mx-auto text-center text-gray-500">Carregando...</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: "profile", label: "Perfil" },
    { key: "services", label: "Serviços" },
    { key: "contacts", label: "Contatos" },
    { key: "projects", label: "Projetos" },
    { key: "testimonials", label: "Depoimentos" },
  ];

  return (
    <div className="py-12 max-w-4xl mx-auto space-y-6">
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-green-700">Acesso Autorizado</span>
          </div>
          <CardTitle className="text-3xl font-bold">Área Restrita (Dashboard)</CardTitle>
          <CardDescription>Ambiente seguro protegido por autenticação.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={logout}>
            <Button variant="destructive" type="submit">Encerrar Sessão</Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <Button key={t.key} variant={tab === t.key ? "default" : "outline"} onClick={() => { setTab(t.key); setMsg(""); }}>
            {t.label}
          </Button>
        ))}
      </div>

      {msg && <p className={`text-sm ${msg.includes("sucesso") ? "text-green-600" : "text-destructive"}`}>{msg}</p>}

      {/* Perfil */}
      {tab === "profile" && (
        <Card>
          <CardHeader>
            <CardTitle>Editar Perfil</CardTitle>
            <CardDescription>Logado como <strong>{user?.username}</strong></CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <input id="name" className={inputClass} {...profileForm.register("name")} />
                {profileForm.formState.errors.name && <p className="text-sm text-destructive">{profileForm.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha (deixe em branco para manter)</Label>
                <input id="password" type="password" className={inputClass} placeholder="******" {...profileForm.register("password")} />
                {profileForm.formState.errors.password && <p className="text-sm text-destructive">{profileForm.formState.errors.password.message}</p>}
              </div>
              <Button type="submit" disabled={profileForm.formState.isSubmitting}>Salvar Alterações</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Serviços */}
      {tab === "services" && (
        <Card>
          <CardHeader>
            <CardTitle>{editingService ? "Editar Serviço" : "Gerenciar Serviços"}</CardTitle>
            <CardDescription>{editingService ? `Editando: ${editingService.title}` : "Crie, edite ou remova serviços."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={serviceForm.handleSubmit(onServiceSubmit)} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="svc-title">Título</Label>
                <input id="svc-title" className={inputClass} placeholder="Nome do serviço" {...serviceForm.register("title")} />
                {serviceForm.formState.errors.title && <p className="text-sm text-destructive">{serviceForm.formState.errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="svc-desc">Descrição</Label>
                <input id="svc-desc" className={inputClass} placeholder="Descrição" {...serviceForm.register("description")} />
                {serviceForm.formState.errors.description && <p className="text-sm text-destructive">{serviceForm.formState.errors.description.message}</p>}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={serviceForm.formState.isSubmitting}>{editingService ? "Atualizar" : "Criar Serviço"}</Button>
                {editingService && <Button type="button" variant="outline" onClick={() => { setEditingService(null); serviceForm.reset({ title: "", description: "" }); }}>Cancelar</Button>}
              </div>
            </form>
            {services.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-gray-600">Serviços cadastrados ({services.length})</h3>
                {services.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{s.title}</p>
                      <p className="text-xs text-gray-500 truncate max-w-md">{s.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="xs" variant="outline" onClick={() => { setEditingService(s); serviceForm.reset({ title: s.title, description: s.description }); }}>Editar</Button>
                      <Button size="xs" variant="destructive" onClick={() => deleteService(s.id)}>Excluir</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contatos */}
      {tab === "contacts" && (
        <Card>
          <CardHeader>
            <CardTitle>Mensagens Recebidas</CardTitle>
            <CardDescription>Contatos enviados pelo formulário público.</CardDescription>
          </CardHeader>
          <CardContent>
            {contacts.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhuma mensagem recebida.</p>
            ) : (
              <div className="space-y-3">
                {contacts.map((c) => (
                  <div key={c.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">{c.name} <span className="text-gray-500 font-normal">({c.email})</span></p>
                        <p className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString("pt-BR")}</p>
                        <p className="text-sm text-gray-700 mt-2">{c.message}</p>
                      </div>
                      <Button size="xs" variant="destructive" onClick={() => deleteContact(c.id)}>Excluir</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Projetos */}
      {tab === "projects" && (
        <Card>
          <CardHeader>
            <CardTitle>{editingProject ? "Editar Projeto" : "Gerenciar Projetos"}</CardTitle>
            <CardDescription>{editingProject ? `Editando: ${editingProject.title}` : "Crie, edite ou remova projetos do portfólio."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={projectForm.handleSubmit(onProjectSubmit)} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="prj-title">Título</Label>
                <input id="prj-title" className={inputClass} placeholder="Nome do projeto" {...projectForm.register("title")} />
                {projectForm.formState.errors.title && <p className="text-sm text-destructive">{projectForm.formState.errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="prj-desc">Descrição</Label>
                <input id="prj-desc" className={inputClass} placeholder="Descrição do projeto" {...projectForm.register("description")} />
                {projectForm.formState.errors.description && <p className="text-sm text-destructive">{projectForm.formState.errors.description.message}</p>}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={projectForm.formState.isSubmitting}>{editingProject ? "Atualizar" : "Criar Projeto"}</Button>
                {editingProject && <Button type="button" variant="outline" onClick={() => { setEditingProject(null); projectForm.reset({ title: "", description: "" }); }}>Cancelar</Button>}
              </div>
            </form>
            {projects.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-gray-600">Projetos cadastrados ({projects.length})</h3>
                {projects.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{p.title}</p>
                      <p className="text-xs text-gray-500 truncate max-w-md">{p.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="xs" variant="outline" onClick={() => { setEditingProject(p); projectForm.reset({ title: p.title, description: p.description }); }}>Editar</Button>
                      <Button size="xs" variant="destructive" onClick={() => deleteProject(p.id)}>Excluir</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Depoimentos */}
      {tab === "testimonials" && (
        <Card>
          <CardHeader>
            <CardTitle>{editingTestimonial ? "Editar Depoimento" : "Gerenciar Depoimentos"}</CardTitle>
            <CardDescription>{editingTestimonial ? `Editando: ${editingTestimonial.name}` : "Gerencie os depoimentos exibidos na home page."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={testimonialForm.handleSubmit(onTestimonialSubmit)} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="t-name">Nome</Label>
                <input id="t-name" className={inputClass} placeholder="Nome do cliente" {...testimonialForm.register("name")} />
                {testimonialForm.formState.errors.name && <p className="text-sm text-destructive">{testimonialForm.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-role">Cargo</Label>
                <input id="t-role" className={inputClass} placeholder="CEO, CTO, etc." {...testimonialForm.register("role")} />
                {testimonialForm.formState.errors.role && <p className="text-sm text-destructive">{testimonialForm.formState.errors.role.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-text">Depoimento</Label>
                <input id="t-text" className={inputClass} placeholder="Texto do depoimento" {...testimonialForm.register("text")} />
                {testimonialForm.formState.errors.text && <p className="text-sm text-destructive">{testimonialForm.formState.errors.text.message}</p>}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={testimonialForm.formState.isSubmitting}>{editingTestimonial ? "Atualizar" : "Criar Depoimento"}</Button>
                {editingTestimonial && <Button type="button" variant="outline" onClick={() => { setEditingTestimonial(null); testimonialForm.reset({ name: "", role: "", text: "" }); }}>Cancelar</Button>}
              </div>
            </form>
            {testimonials.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-gray-600">Depoimentos cadastrados ({testimonials.length})</h3>
                {testimonials.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{t.name} <span className="text-gray-400 text-xs">- {t.role}</span></p>
                      <p className="text-xs text-gray-500 truncate max-w-md">{t.text}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="xs" variant="outline" onClick={() => { setEditingTestimonial(t); testimonialForm.reset({ name: t.name, role: t.role, text: t.text }); }}>Editar</Button>
                      <Button size="xs" variant="destructive" onClick={() => deleteTestimonial(t.id)}>Excluir</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
