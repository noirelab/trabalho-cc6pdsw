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
  price: z.number().min(0, "Preço deve ser >= 0"),
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
  imageUrl: z.string().optional(),
});
type ProjectFormData = z.infer<typeof projectSchema>;

const testimonialSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  role: z.string().min(1, "Cargo é obrigatório"),
  text: z.string().min(1, "Depoimento é obrigatório"),
});
type TestimonialFormData = z.infer<typeof testimonialSchema>;

interface User { id: number; username: string; name: string; }
interface Service { id: number; title: string; description: string; price: number; createdAt: string; }
interface Contact { id: number; name: string; email: string; message: string; createdAt: string; }
interface Project { id: number; title: string; description: string; imageUrl: string; createdAt: string; }
interface Testimonial { id: number; name: string; role: string; text: string; createdAt: string; }

interface Proposal {
  id: number;
  title: string;
  clientName: string;
  clientEmail: string;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items?: ProposalItem[];
  history?: ProposalHistory[];
}

interface ProposalItem {
  id: number;
  proposalId: number;
  serviceId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  service: { id: number; title: string; price: number };
}

interface ProposalHistory {
  id: number;
  field: string;
  oldValue: string | null;
  newValue: string;
  createdAt: string;
  user: { id: number; username: string };
}

interface ProposalReports {
  totalProposals: number;
  byStatus: Record<string, number>;
  totalRevenue: number;
  conversionRate: number;
}

type Tab = "profile" | "services" | "contacts" | "projects" | "testimonials" | "proposals";

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
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [proposalReports, setProposalReports] = useState<ProposalReports | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [proposalItems, setProposalItems] = useState<{ serviceId: number; quantity: number }[]>([]);
  const [availableServices, setAvailableServices] = useState<{ id: number; title: string; price: number }[]>([]);

  const profileForm = useForm<ProfileFormData>({ resolver: zodResolver(profileSchema) });
  const serviceForm = useForm<ServiceFormData>({ resolver: zodResolver(serviceSchema) });
  const projectForm = useForm<ProjectFormData>({ resolver: zodResolver(projectSchema) });
  const testimonialForm = useForm<TestimonialFormData>({ resolver: zodResolver(testimonialSchema) });

  const proposalSchema = z.object({
    title: z.string().min(1, "Título é obrigatório"),
    clientName: z.string().min(1, "Nome do cliente é obrigatório"),
    clientEmail: z.string().email("Email inválido"),
    notes: z.string().optional(),
    discount: z.number().min(0),
  });
  type ProposalFormData = z.infer<typeof proposalSchema>;

  const proposalForm = useForm<ProposalFormData>({ resolver: zodResolver(proposalSchema) });

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
      if (res.ok) {
        const json = await res.json();
        setServices(json.data);
      }
    } catch {}
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/contacts`, { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        setContacts(json.data);
      }
    } catch {}
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/projects`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setProjects(json.data);
      }
    } catch {}
  }, []);

  const fetchTestimonials = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/testimonials`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setTestimonials(json.data);
      }
    } catch {}
  }, []);

  const fetchProposals = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/proposals`, { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        setProposals(json.data);
      }
    } catch {}
  }, []);

  const fetchProposalReports = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/proposals/reports`, { credentials: "include" });
      if (res.ok) setProposalReports(await res.json());
    } catch {}
  }, []);

  const fetchAvailableServices = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/services?limit=100`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setAvailableServices(json.data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    async function init() {
      await Promise.all([fetchUser(), fetchServices(), fetchContacts(), fetchProjects(), fetchTestimonials(), fetchProposals(), fetchProposalReports(), fetchAvailableServices()]);
      setLoading(false);
    }
    init();
  }, [fetchUser, fetchServices, fetchContacts, fetchProjects, fetchTestimonials, fetchProposals, fetchProposalReports, fetchAvailableServices]);

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
      serviceForm.reset({ title: "", description: "", price: 0 });
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
      projectForm.reset({ title: "", description: "", imageUrl: "" });
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

  async function onProposalSubmit(data: ProposalFormData) {
    setMsg("");
    try {
      const body: any = { ...data, items: proposalItems };
      const res = await fetch(`${API_URL}/api/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        setMsg(err.message || err.error || "Erro");
        return;
      }
      setMsg("Proposta criada com sucesso");
      proposalForm.reset({ title: "", clientName: "", clientEmail: "", notes: "", discount: 0 });
      setProposalItems([]);
      await fetchProposals();
      await fetchProposalReports();
    } catch { setMsg("Erro de conexão"); }
  }

  async function transitionProposal(id: number, status: string) {
    setMsg("");
    try {
      const res = await fetch(`${API_URL}/api/proposals/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json();
        setMsg(err.message || "Erro");
        return;
      }
      setMsg(`Proposta ${status === "sent" ? "enviada" : status === "accepted" ? "aceita" : "recusada"} com sucesso`);
      await fetchProposals();
      await fetchProposalReports();
    } catch { setMsg("Erro de conexão"); }
  }

  async function deleteProposal(id: number) {
    await fetch(`${API_URL}/api/proposals/${id}`, { method: "DELETE", credentials: "include" });
    await fetchProposals();
    await fetchProposalReports();
  }

  async function viewProposal(id: number) {
    setMsg("");
    try {
      const res = await fetch(`${API_URL}/api/proposals/${id}`, { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        setSelectedProposal(json.proposal);
      }
    } catch { setMsg("Erro de conexão"); }
  }

  function addProposalItem(serviceId: number) {
    const svc = availableServices.find((s) => s.id === serviceId);
    if (!svc) return;
    setProposalItems([...proposalItems, { serviceId: svc.id, quantity: 1 }]);
  }

  function updateProposalItemQuantity(index: number, quantity: number) {
    const updated = [...proposalItems];
    updated[index].quantity = Math.max(1, quantity);
    setProposalItems(updated);
  }

  function removeProposalItem(index: number) {
    setProposalItems(proposalItems.filter((_, i) => i !== index));
  }

  function calcProposalTotal(): number {
    const subtotal = proposalItems.reduce((sum, item) => {
      const svc = availableServices.find((s) => s.id === item.serviceId);
      return sum + (svc ? svc.price * item.quantity : 0);
    }, 0);
    const discount = proposalForm.watch("discount") || 0;
    return Math.max(0, subtotal - discount);
  }

  if (loading) return <div className="py-12 max-w-4xl mx-auto text-center text-gray-500">Carregando...</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: "profile", label: "Perfil" },
    { key: "services", label: "Serviços" },
    { key: "contacts", label: "Contatos" },
    { key: "projects", label: "Projetos" },
    { key: "testimonials", label: "Depoimentos" },
    { key: "proposals", label: "Orçamentos" },
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
              <div className="space-y-2">
                <Label htmlFor="svc-price">Preço (R$)</Label>
                <input id="svc-price" type="number" min="0" step="0.01" className={inputClass} placeholder="0,00" {...serviceForm.register("price", { valueAsNumber: true })} />
                {serviceForm.formState.errors.price && <p className="text-sm text-destructive">{serviceForm.formState.errors.price.message}</p>}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={serviceForm.formState.isSubmitting}>{editingService ? "Atualizar" : "Criar Serviço"}</Button>
                {editingService && <Button type="button" variant="outline" onClick={() => { setEditingService(null); serviceForm.reset({ title: "", description: "", price: 0 }); }}>Cancelar</Button>}
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
                      <p className="text-xs text-green-700">R$ {(s.price ?? 0).toFixed(2)}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="xs" variant="outline" onClick={() => { setEditingService(s); serviceForm.reset({ title: s.title, description: s.description, price: s.price ?? 0 }); }}>Editar</Button>
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
              <div className="space-y-2">
                <Label htmlFor="prj-image">URL da Imagem</Label>
                <div className="flex gap-2">
                  <input id="prj-image" className={inputClass} placeholder="https://exemplo.com/imagem.jpg" {...projectForm.register("imageUrl")} />
                  <input type="file" accept="image/*" className="hidden" id="file-upload" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append("file", file);
                    try {
                      const res = await fetch(`${API_URL}/api/upload`, { method: "POST", body: formData, credentials: "include" });
                      if (res.ok) {
                        const data = await res.json();
                        projectForm.setValue("imageUrl", data.url);
                      }
                    } catch {}
                  }} />
                  <Button type="button" size="sm" variant="outline" onClick={() => (document.getElementById("file-upload") as HTMLInputElement)?.click()}>Upload</Button>
                </div>
                {projectForm.formState.errors.imageUrl && <p className="text-sm text-destructive">{projectForm.formState.errors.imageUrl.message}</p>}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={projectForm.formState.isSubmitting}>{editingProject ? "Atualizar" : "Criar Projeto"}</Button>
                {editingProject && <Button type="button" variant="outline" onClick={() => { setEditingProject(null); projectForm.reset({ title: "", description: "", imageUrl: "" }); }}>Cancelar</Button>}
              </div>
            </form>
            {projects.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-gray-600">Projetos cadastrados ({projects.length})</h3>
                {projects.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {p.imageUrl && (
                        <img src={p.imageUrl} alt={p.title} className="w-12 h-12 rounded object-cover" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{p.title}</p>
                        <p className="text-xs text-gray-500 truncate max-w-md">{p.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="xs" variant="outline" onClick={() => { setEditingProject(p); projectForm.reset({ title: p.title, description: p.description, imageUrl: p.imageUrl || "" }); }}>Editar</Button>
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

      {/* Orçamentos */}
      {tab === "proposals" && (
        selectedProposal ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedProposal.title}</CardTitle>
                  <CardDescription>
                    Cliente: {selectedProposal.clientName} ({selectedProposal.clientEmail})
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedProposal(null)}>Voltar</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-semibold text-sm uppercase">{selectedProposal.status}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Subtotal</p>
                  <p className="font-semibold text-sm">R$ {selectedProposal.subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-semibold text-sm text-green-700">R$ {selectedProposal.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-2">Itens da Proposta</h3>
                <div className="space-y-2">
                  {selectedProposal.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{item.service.title}</p>
                        <p className="text-xs text-muted-foreground">R$ {item.unitPrice.toFixed(2)} x {item.quantity} = R$ {item.subtotal.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedProposal.history && selectedProposal.history.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">Histórico</h3>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {selectedProposal.history.map((h) => (
                      <div key={h.id} className="text-xs text-muted-foreground flex justify-between p-1 border-b">
                        <span><strong>{h.user.username}</strong>: {h.field} — {h.oldValue || "—"} → {h.newValue}</span>
                        <span>{new Date(h.createdAt).toLocaleString("pt-BR")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedProposal.notes && (
                <div>
                  <h3 className="font-semibold text-sm mb-1">Observações</h3>
                  <p className="text-sm text-muted-foreground">{selectedProposal.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Orçamentos</CardTitle>
              <CardDescription>Crie propostas comerciais com múltiplos serviços.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Reports */}
              {proposalReports && (
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-700">{proposalReports.totalProposals}</p>
                    <p className="text-xs text-blue-600">Total</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-700">{proposalReports.byStatus.accepted}</p>
                    <p className="text-xs text-green-600">Aceitas</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-yellow-700">R$ {proposalReports.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</p>
                    <p className="text-xs text-yellow-600">Receita</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-700">{(proposalReports.conversionRate * 100).toFixed(0)}%</p>
                    <p className="text-xs text-purple-600">Conversão</p>
                  </div>
                </div>
              )}

              {/* Create form */}
              <form onSubmit={proposalForm.handleSubmit(onProposalSubmit)} className="space-y-4 max-w-lg border p-4 rounded-lg">
                <h3 className="font-semibold text-sm">Nova Proposta</h3>
                <div className="space-y-2">
                  <Label htmlFor="prop-title">Título</Label>
                  <input id="prop-title" className={inputClass} placeholder="Ex: Proposta Site Institucional" {...proposalForm.register("title")} />
                  {proposalForm.formState.errors.title && <p className="text-sm text-destructive">{proposalForm.formState.errors.title.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prop-client">Cliente</Label>
                    <input id="prop-client" className={inputClass} placeholder="Nome" {...proposalForm.register("clientName")} />
                    {proposalForm.formState.errors.clientName && <p className="text-sm text-destructive">{proposalForm.formState.errors.clientName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prop-email">Email</Label>
                    <input id="prop-email" className={inputClass} placeholder="cliente@email.com" {...proposalForm.register("clientEmail")} />
                    {proposalForm.formState.errors.clientEmail && <p className="text-sm text-destructive">{proposalForm.formState.errors.clientEmail.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prop-discount">Desconto (R$)</Label>
                  <input id="prop-discount" type="number" min="0" step="0.01" className={inputClass} {...proposalForm.register("discount", { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prop-notes">Observações</Label>
                  <textarea id="prop-notes" className={inputClass} rows={2} {...proposalForm.register("notes")} />
                </div>

                <div>
                  <Label className="mb-2 block">Serviços</Label>
                  <div className="flex gap-2 mb-2">
                    <select
                      className="flex h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base"
                      onChange={(e) => {
                        if (e.target.value) {
                          addProposalItem(Number(e.target.value));
                          e.target.value = "";
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>Adicionar serviço...</option>
                      {availableServices.map((s) => (
                        <option key={s.id} value={s.id}>{s.title} — R$ {(s.price ?? 0).toFixed(2)}</option>
                      ))}
                    </select>
                  </div>
                  {proposalItems.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {proposalItems.map((item, idx) => {
                        const svc = availableServices.find((s) => s.id === item.serviceId);
                        return (
                          <div key={idx} className="flex items-center gap-2 p-2 border rounded-lg">
                            <span className="text-sm flex-1">{svc?.title || `Serviço #${item.serviceId}`}</span>
                            <input
                              type="number"
                              min={1}
                              className="h-7 w-16 rounded border border-input bg-transparent px-1.5 text-sm"
                              value={item.quantity}
                              onChange={(e) => updateProposalItemQuantity(idx, Number(e.target.value))}
                            />
                            <span className="text-xs text-muted-foreground w-20 text-right">R$ {((svc?.price || 0) * item.quantity).toFixed(2)}</span>
                            <Button size="xs" variant="destructive" type="button" onClick={() => removeProposalItem(idx)}>X</Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {proposalItems.length > 0 && (
                    <p className="text-sm font-semibold">Total: R$ {calcProposalTotal().toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  )}
                </div>

                <Button type="submit" disabled={proposalForm.formState.isSubmitting || proposalItems.length === 0}>
                  Criar Proposta
                </Button>
              </form>

              {/* Proposals list */}
              {proposals.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-gray-600">Propostas ({proposals.length})</h3>
                  {proposals.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{p.title}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            p.status === "draft" ? "bg-gray-200 text-gray-700" :
                            p.status === "sent" ? "bg-blue-200 text-blue-700" :
                            p.status === "accepted" ? "bg-green-200 text-green-700" :
                            p.status === "rejected" ? "bg-red-200 text-red-700" :
                            "bg-yellow-200 text-yellow-700"
                          }`}>{p.status}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {p.clientName} — R$ {p.total.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="xs" variant="outline" onClick={() => viewProposal(p.id)}>Ver</Button>
                        {p.status === "draft" && (
                          <Button size="xs" variant="default" onClick={() => transitionProposal(p.id, "sent")}>Enviar</Button>
                        )}
                        {p.status === "sent" && (
                          <>
                            <Button size="xs" variant="default" onClick={() => transitionProposal(p.id, "accepted")}>Aceitar</Button>
                            <Button size="xs" variant="destructive" onClick={() => transitionProposal(p.id, "rejected")}>Recusar</Button>
                          </>
                        )}
                        <Button size="xs" variant="destructive" onClick={() => deleteProposal(p.id)}>Excluir</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
