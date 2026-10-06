import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { HeartHandshake, UserRound, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { mascararCpf, mascararTelefone } from "@/lib/masks";
import { register, mensagemErro } from "@/services/api";

const registerSchema = z
  .object({
    nome: z.string().trim().min(2, "Informe o nome completo"),
    cpf: z.string().refine((v) => v.replace(/\D/g, "").length === 11, "CPF deve ter 11 dígitos"),
    telefone: z
      .string()
      .refine((v) => v === "" || v.replace(/\D/g, "").length >= 10, "Telefone incompleto"),
    senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    confirmarSenha: z.string(),
    tipo_perfil: z.enum(["IDOSO", "CUIDADOR"], { required_error: "Escolha um perfil" }),
  })
  .refine((d) => d.senha === d.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

const PERFIS = [
  { value: "IDOSO", label: "Sou idoso(a)", desc: "Organizo meus remédios e consultas", icon: UserRound },
  { value: "CUIDADOR", label: "Sou cuidador(a)", desc: "Acompanho a rotina de um idoso", icon: HeartHandshake },
] as const;

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { nome: "", cpf: "", telefone: "", senha: "", confirmarSenha: "" },
  });

  const onSubmit = async ({ confirmarSenha: _, telefone, ...data }: RegisterValues) => {
    setLoading(true);
    try {
      await register({ ...data, telefone: telefone || undefined } as Parameters<typeof register>[0]);
      toast.success("Conta criada com sucesso!");
      navigate("/medicamentos");
    } catch (err) {
      toast.error(mensagemErro(err, "Não foi possível criar a conta."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-8 shadow-lg">
        <div className="flex flex-col items-center gap-2 text-center">
          <UserPlus className="h-10 w-10 text-primary" />
          <h1 className="text-2xl font-bold">Criar conta</h1>
          <p className="text-sm text-muted-foreground">Cadastre-se no CliniRotina</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tipo_perfil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Perfil</FormLabel>
                  <FormControl>
                    <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 gap-3">
                      {PERFIS.map(({ value, label, desc, icon: Icon }) => (
                        <label
                          key={value}
                          className={cn(
                            "flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-3 text-center text-sm",
                            field.value === value && "border-primary bg-primary/5",
                          )}
                        >
                          <RadioGroupItem value={value} className="sr-only" />
                          <Icon className="h-6 w-6 text-primary" />
                          <span className="font-medium">{label}</span>
                          <span className="text-xs text-muted-foreground">{desc}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl><Input {...field} disabled={loading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="000.000.000-00"
                        inputMode="numeric"
                        {...field}
                        onChange={(e) => field.onChange(mascararCpf(e.target.value))}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(00) 00000-0000"
                        inputMode="tel"
                        {...field}
                        onChange={(e) => field.onChange(mascararTelefone(e.target.value))}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="senha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl><Input type="password" {...field} disabled={loading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmarSenha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar senha</FormLabel>
                  <FormControl><Input type="password" {...field} disabled={loading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Cadastrando..." : "Criar conta"}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
