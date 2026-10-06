import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarClock, FlaskConical, Loader2, MapPin, Pencil, Plus, Stethoscope, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { AppLayout } from "@/components/AppLayout";
import { SeletorIdoso, useIdososVinculados } from "@/components/SeletorIdoso";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  createCompromisso,
  deleteCompromisso,
  getCompromissos,
  getUsuario,
  mensagemErro,
  updateCompromisso,
  type Compromisso,
  type TipoCompromisso,
} from "@/services/api";

type Periodo = "futuros" | "passados" | "todos";

const compromissoSchema = z.object({
  id_idoso: z.string().optional(),
  tipo: z.enum(["CONSULTA", "EXAME"], { required_error: "Escolha o tipo" }),
  especialidade: z.string().trim().min(2, "Informe a especialidade ou o nome do exame").max(100),
  local_atendimento: z.string().max(255).optional(),
  data_hora: z.string().min(1, "Informe a data e a hora"),
  preparo: z.string().optional(),
});

type CompromissoForm = z.infer<typeof compromissoSchema>;

const VAZIO: CompromissoForm = {
  id_idoso: undefined,
  tipo: "CONSULTA",
  especialidade: "",
  local_atendimento: "",
  data_hora: "",
  preparo: "",
};

const formatarData = (iso: string) => {
  const texto = format(parseISO(iso), "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

export default function ConsultasPage() {
  const usuario = getUsuario();
  const isCuidador = usuario?.tipo_perfil === "CUIDADOR";
  const vinculos = useIdososVinculados(isCuidador);
  const nomeIdoso = useMemo(
    () => Object.fromEntries(vinculos.map((v) => [v.id_idoso, v.nome_idoso])),
    [vinculos],
  );

  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);
  const [periodo, setPeriodo] = useState<Periodo>("futuros");
  const [tipoFiltro, setTipoFiltro] = useState<"TODOS" | TipoCompromisso>("TODOS");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Compromisso | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<CompromissoForm>({
    resolver: zodResolver(
      compromissoSchema
        .refine((d) => !isCuidador || !!d.id_idoso, { message: "Selecione o idoso", path: ["id_idoso"] })
        .refine((d) => (editando && d.data_hora === editando.data_hora.slice(0, 16)) || new Date(d.data_hora) > new Date(), {
          message: "A data e hora não podem estar no passado",
          path: ["data_hora"],
        }),
    ),
    defaultValues: VAZIO,
  });

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setCompromissos(
        await getCompromissos({ periodo, tipo: tipoFiltro === "TODOS" ? undefined : tipoFiltro }),
      );
    } catch (err) {
      toast.error(mensagemErro(err, "Erro ao carregar compromissos"));
    } finally {
      setLoading(false);
    }
  }, [periodo, tipoFiltro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const abrirNovo = () => {
    setEditando(null);
    form.reset(VAZIO);
    setDialogOpen(true);
  };

  const abrirEdicao = (c: Compromisso) => {
    setEditando(c);
    form.reset({
      id_idoso: c.id_idoso,
      tipo: c.tipo,
      especialidade: c.especialidade,
      local_atendimento: c.local_atendimento ?? "",
      data_hora: c.data_hora.slice(0, 16),
      preparo: c.preparo ?? "",
    });
    setDialogOpen(true);
  };

  const onSubmit = async ({ id_idoso, ...data }: CompromissoForm) => {
    setSubmitting(true);
    try {
      if (editando) {
        // Só reenvia a data se ela mudou, para permitir editar dados de um compromisso já passado.
        const { data_hora, ...resto } = data;
        const mudouData = data_hora !== editando.data_hora.slice(0, 16);
        await updateCompromisso(editando.id, mudouData ? data : resto);
        toast.success("Compromisso atualizado!");
      } else {
        await createCompromisso(isCuidador ? { ...data, id_idoso } : data);
        toast.success(data.tipo === "EXAME" ? "Exame agendado!" : "Consulta agendada!");
      }
      setDialogOpen(false);
      carregar();
    } catch (err) {
      toast.error(mensagemErro(err, "Erro ao salvar compromisso"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCompromisso(deleteId);
      toast.success("Compromisso removido!");
      carregar();
    } catch (err) {
      toast.error(mensagemErro(err, "Erro ao remover compromisso"));
    } finally {
      setDeleteId(null);
    }
  };

  const tipoAtual = form.watch("tipo");

  return (
    <AppLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Consultas e Exames</h2>
          <p className="text-sm text-muted-foreground">
            {isCuidador ? "Agenda médica dos idosos que você acompanha" : "Sua agenda médica"}
          </p>
        </div>
        <Button onClick={abrirNovo} disabled={isCuidador && vinculos.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          Agendar
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
          <TabsList>
            <TabsTrigger value="futuros">Próximos</TabsTrigger>
            <TabsTrigger value="passados">Anteriores</TabsTrigger>
            <TabsTrigger value="todos">Todos</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={tipoFiltro} onValueChange={(v) => setTipoFiltro(v as typeof tipoFiltro)}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Consultas e exames</SelectItem>
            <SelectItem value="CONSULTA">Só consultas</SelectItem>
            <SelectItem value="EXAME">Só exames</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : compromissos.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center text-muted-foreground">
          <CalendarClock className="h-12 w-12" />
          <p className="mt-3">Nenhum compromisso encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {compromissos.map((c) => {
            const Icone = c.tipo === "EXAME" ? FlaskConical : Stethoscope;
            return (
              <Card key={c.id}>
                <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                  <div className="flex gap-3">
                    <Icone className="mt-1 h-6 w-6 shrink-0 text-primary" />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{c.especialidade}</span>
                        <Badge variant={c.tipo === "EXAME" ? "secondary" : "default"}>{c.tipo}</Badge>
                        {isCuidador && <Badge variant="outline">{nomeIdoso[c.id_idoso] ?? "Idoso"}</Badge>}
                      </div>
                      <p className="text-sm">{formatarData(c.data_hora)}</p>
                      {c.local_atendimento && (
                        <p className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {c.local_atendimento}
                        </p>
                      )}
                      {c.preparo && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Preparo:</strong> {c.preparo}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => abrirEdicao(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Remover" onClick={() => setDeleteId(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar compromisso" : "Agendar consulta ou exame"}</DialogTitle>
            <DialogDescription>Os horários seguem o fuso de Brasília.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {isCuidador && (
                <FormField
                  control={form.control}
                  name="id_idoso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Idoso</FormLabel>
                      <SeletorIdoso
                        vinculos={vinculos}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={submitting || !!editando}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={submitting}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CONSULTA">Consulta</SelectItem>
                          <SelectItem value="EXAME">Exame</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="data_hora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data e hora</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} disabled={submitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="especialidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tipoAtual === "EXAME" ? "Exame" : "Especialidade"}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={tipoAtual === "EXAME" ? "Ex: Hemograma completo" : "Ex: Cardiologia"}
                        {...field}
                        disabled={submitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="local_atendimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: UBS Centro, sala 3" {...field} disabled={submitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="preparo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preparo / observações</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ex: Jejum de 8 horas" {...field} disabled={submitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editando ? "Salvar" : "Agendar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover compromisso?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
