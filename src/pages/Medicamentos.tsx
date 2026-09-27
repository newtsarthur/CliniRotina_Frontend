import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Pill,
  Plus,
  Pencil,
  Trash2,
  LogOut,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { getMedicamentos, createMedicamento, updateMedicamento, deleteMedicamento, logout } from "@/services/api";

const medicamentoSchema = z.object({
  nome_remedio: z.string().min(1, "Nome do remédio é obrigatório"),
  dosagem: z.string().min(1, "Dosagem é obrigatória"),
  instrucoes_uso: z.string().optional(),
  id_idoso: z.string().optional(),
});

type MedicamentoFormValues = z.infer<typeof medicamentoSchema>;

export default function MedicamentosPage() {
  const navigate = useNavigate();
  const [medicamentos, setMedicamentos] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<MedicamentoFormValues>({
    resolver: zodResolver(medicamentoSchema),
    defaultValues: { nome_remedio: "", dosagem: "", instrucoes_uso: "", id_idoso: "" },
  });

  const fetchMedicamentos = useCallback(async () => {
    try {
      const data = await getMedicamentos();
      setMedicamentos(data as Record<string, unknown>[]);
    } catch {
      toast.error("Erro ao carregar medicamentos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMedicamentos(); }, [fetchMedicamentos]);

  const handleOpenCreate = () => {
    setEditingId(null);
    form.reset({ nome_remedio: "", dosagem: "", instrucoes_uso: "", id_idoso: "" });
    setDialogOpen(true);
  };

  const handleOpenEdit = (m: Record<string, unknown>) => {
    setEditingId(m.id as string);
    form.reset({
      nome_remedio: (m.nome_remedio as string) ?? "",
      dosagem: (m.dosagem as string) ?? "",
      instrucoes_uso: (m.instrucoes_uso as string) ?? "",
      id_idoso: (m.id_idoso as string) ?? "",
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: MedicamentoFormValues) => {
    setSubmitting(true);
    try {
      if (editingId) {
        await updateMedicamento(editingId, data);
        toast.success("Medicamento atualizado!");
      } else {
        await createMedicamento(data);
        toast.success("Medicamento criado!");
      }
      setDialogOpen(false);
      fetchMedicamentos();
    } catch {
      toast.error("Erro ao salvar medicamento");
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
    } catch {
      toast.error("Erro ao remover medicamento");
    } finally {
      setDeleteId(null);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Saindo...");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Pill className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">CliniRotina</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Medicamentos</h2>
            <p className="text-sm text-muted-foreground">
              Gerencie os remédios e tratamentos
            </p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo medicamento
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : medicamentos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">Nenhum medicamento cadastrado.</p>
            <Button variant="link" onClick={handleOpenCreate}>
              Cadastrar primeiro medicamento
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Remédio</TableHead>
                  <TableHead>Dosagem</TableHead>
                  <TableHead>Instruções</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicamentos.map((m) => (
                  <TableRow key={m.id as string}>
                    <TableCell className="font-medium">{m.nome_remedio as string}</TableCell>
                    <TableCell>{m.dosagem as string}</TableCell>
                    <TableCell className="max-w-xs truncate">{m.instrucoes_uso as string ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(m)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(m.id as string)}>
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
      </main>

      {/* Create / Edit Dialog */}
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
                    <FormControl><Input placeholder="Ex: 10mg" {...field} disabled={submitting} /></FormControl>
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
                    <FormControl><Input placeholder="Ex: Tomar 1 comprimido pela manhã" {...field} disabled={submitting} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="id_idoso"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID do idoso</FormLabel>
                    <FormControl><Input {...field} disabled={submitting} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>Cancelar</Button>
                <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingId ? "Salvar" : "Criar"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover medicamento?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
