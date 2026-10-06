import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { HeartHandshake, Loader2, Trash2, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { mascararCpf } from "@/lib/masks";
import { createVinculo, deleteVinculo, getVinculos, mensagemErro, type Vinculo } from "@/services/api";

const vinculoSchema = z.object({
  cpf_idoso: z.string().refine((v) => v.replace(/\D/g, "").length === 11, "CPF deve ter 11 dígitos"),
  parentesco: z.string().max(50).optional(),
});

type VinculoForm = z.infer<typeof vinculoSchema>;

export default function VinculosPage() {
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<VinculoForm>({
    resolver: zodResolver(vinculoSchema),
    defaultValues: { cpf_idoso: "", parentesco: "" },
  });

  const carregar = useCallback(async () => {
    try {
      setVinculos(await getVinculos());
    } catch (err) {
      toast.error(mensagemErro(err, "Erro ao carregar vínculos"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const onSubmit = async ({ cpf_idoso, parentesco }: VinculoForm) => {
    setSubmitting(true);
    try {
      const novo = await createVinculo(cpf_idoso, parentesco || undefined);
      toast.success(`Vínculo criado com ${novo.nome_idoso}!`);
      form.reset();
      carregar();
    } catch (err) {
      toast.error(mensagemErro(err, "Erro ao criar vínculo"));
    } finally {
      setSubmitting(false);
    }
  };

  const remover = async (id: string) => {
    try {
      await deleteVinculo(id);
      toast.success("Vínculo removido.");
      carregar();
    } catch (err) {
      toast.error(mensagemErro(err, "Erro ao remover vínculo"));
    }
  };

  return (
    <AppLayout>
      <h2 className="mb-6 text-2xl font-bold tracking-tight">Meus Idosos</h2>
      <div className="grid gap-6 md:grid-cols-[2fr_3fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5" /> Vincular idoso
            </CardTitle>
            <CardDescription>Informe o CPF de um idoso já cadastrado no CliniRotina.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="cpf_idoso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF do idoso</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="000.000.000-00"
                          inputMode="numeric"
                          {...field}
                          onChange={(e) => field.onChange(mascararCpf(e.target.value))}
                          disabled={submitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="parentesco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parentesco (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Filha, Neto, Enfermeira" {...field} disabled={submitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Vincular
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {loading ? (
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          ) : vinculos.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
              <HeartHandshake className="h-12 w-12" />
              <p className="mt-3">Você ainda não acompanha nenhum idoso.</p>
            </div>
          ) : (
            vinculos.map((v) => (
              <Card key={v.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">{v.nome_idoso}</p>
                    <p className="text-sm text-muted-foreground">{v.parentesco || "Parentesco não informado"}</p>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Remover vínculo" onClick={() => remover(v.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
