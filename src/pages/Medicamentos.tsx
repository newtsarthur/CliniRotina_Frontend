import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { AppLayout } from "@/components/AppLayout";
import { SeletorIdoso, useIdososVinculados } from "@/components/SeletorIdoso";
import { Button } from "@/components/ui/button";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  getMedicamentos,
  createMedicamento,
  updateMedicamento,
  deleteMedicamento,
  getUsuario,
  mensagemErro,
  type Medicamento,
} from "@/services/api";

const medicamentoSchema = z.object({
  nome_remedio: z.string().trim().min(1, "Nome do remédio é obrigatório").max(100),
  dosagem: z.string().trim().min(1, "Dosagem é obrigatória").max(50),
  instrucoes_uso: z.string().optional(),
  id_idoso: z.string().optional(),
});

type MedicamentoFormValues = z.infer<typeof medicamentoSchema>;

const VAZIO: MedicamentoFormValues = { nome_remedio: "", dosagem: "", instrucoes_uso: "", id_idoso: undefined };

export default function MedicamentosPage() {
  const usuario = getUsuario();
  const isCuidador = usuario?.tipo_perfil === "CUIDADOR";
  const vinculos = useIdososVinculados(isCuidador);
  const nomeIdoso = useMemo(
    () => Object.fromEntries(vinculos.map((v) => [v.id_idoso, v.nome_idoso])),
    [vinculos],
  );

  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<MedicamentoFormValues>({
    resolver: zodResolver(
      medicamentoSchema.refine((d) => !isCuidador || !!d.id_idoso, {
        message: "Selecione o idoso",
        path: ["id_idoso"],
      }),
    ),
    defaultValues: VAZIO,
  });

  const fetchMedicamentos = useCallback(async () => {
    try {
      setMedicamentos(await getMedicamentos());
    } catch (err) {
      toast.error(mensagemErro(err, "Erro ao carregar medicamentos"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedicamentos();
  }, [fetchMedicamentos]);

  const handleOpenCreate = () => {
    setEditingId(null);
    form.reset(VAZIO);
    setDialogOpen(true);
  };

  const handleOpenEdit = (m: Medicamento) => {
    setEditingId(m.id);
    form.reset({
      nome_remedio: m.nome_remedio,
      dosagem: m.dosagem,
      instrucoes_uso: m.instrucoes_uso ?? "",
      id_idoso: m.id_idoso,
    });
    setDialogOpen(true);
  };

  const onSubmit = async ({ id_idoso, ...data }: MedicamentoFormValues) => {
    setSubmitting(true);
    try {
      if (editingId) {
        await updateMedicamento(editingId, data);
        toast.success("Medicamento atualizado!");
      } else {
        await createMedicamento(isCuidador ? { ...data, id_idoso } : data);
        toast.success("Medicamento cadastrado!");
      }
      setDialogOpen(false);
      fetchMedicamentos();
    } catch (err) {
      toast.error(mensagemErro(err, "Erro ao salvar medicamento"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMedicamento(deleteId);
      toast.success("Medicamento removido!");
      fetchMedicamentos();
    } catch (err) {
      toast.error(mensagemErro(err, "Erro ao remover medicamento"));
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <AppLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Medicamentos</h2>
          <p className="text-sm text-muted-foreground">
            {isCuidador ? "Remédios dos idosos que você acompanha" : "Seus remédios e tratamentos"}
          </p>
        </div>
        <Button onClick={handleOpenCreate} disabled={isCuidador && vinculos.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          Novo medicamento
        </Button>
      </div>

      {isCuidador && vinculos.length === 0 && !loading && (
        <p className="mb-4 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          Você ainda não está vinculado a nenhum idoso. Vá em <strong>Meus Idosos</strong> para criar um vínculo.
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : medicamentos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">Nenhum medicamento cadastrado.</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {isCuidador && <TableHead>Idoso</TableHead>}
                <TableHead>Remédio</TableHead>
                <TableHead>Dosagem</TableHead>
                <TableHead>Instruções</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicamentos.map((m) => (
                <TableRow key={m.id}>
                  {isCuidador && <TableCell>{nomeIdoso[m.id_idoso] ?? "—"}</TableCell>}
                  <TableCell className="font-medium">{m.nome_remedio}</TableCell>
                  <TableCell>{m.dosagem}</TableCell>
                  <TableCell className="max-w-xs truncate">{m.instrucoes_uso || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => handleOpenEdit(m)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Remover" onClick={() => setDeleteId(m.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar medicamento" : "Novo medicamento"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Atualize os dados do remédio." : "Preencha os dados do novo remédio."}
            </DialogDescription>
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
                        disabled={submitting || !!editingId}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="nome_remedio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do remédio</FormLabel>
                    <FormControl><Input {...field} disabled={submitting} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dosagem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dosagem</FormLabel>
                    <FormControl><Input placeholder="Ex: 50mg" {...field} disabled={submitting} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="instrucoes_uso"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instruções de uso</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ex: Tomar 1 comprimido pela manhã" {...field} disabled={submitting} />
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
                  {editingId ? "Salvar" : "Cadastrar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover medicamento?</AlertDialogTitle>
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
