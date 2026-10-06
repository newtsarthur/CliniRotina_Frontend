import axios, { AxiosError } from "axios";

export type Perfil = "IDOSO" | "CUIDADOR";

export interface Usuario {
  id: string;
  nome: string;
  cpf: string;
  tipo_perfil: Perfil;
}

export interface Medicamento {
  id: string;
  id_idoso: string;
  nome_remedio: string;
  dosagem: string;
  instrucoes_uso: string | null;
}

export type TipoCompromisso = "CONSULTA" | "EXAME";

export interface Compromisso {
  id: string;
  id_idoso: string;
  tipo: TipoCompromisso;
  especialidade: string;
  local_atendimento: string | null;
  data_hora: string;
  preparo: string | null;
}

export interface Vinculo {
  id: string;
  id_cuidador: string;
  id_idoso: string;
  parentesco: string | null;
  nome_idoso: string | null;
  nome_cuidador: string | null;
}

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000" });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token expirado ou inválido: limpa a sessão e volta para o login.
API.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const isAuthRoute = error.config?.url?.startsWith("/auth/");
    if (error.response?.status === 401 && !isAuthRoute) {
      logout();
      window.location.assign("/login?expirado=1");
    }
    return Promise.reject(error);
  },
);

/** Extrai a mensagem de erro devolvida pela API (FastAPI usa o campo `detail`). */
export function mensagemErro(err: unknown, padrao = "Não foi possível concluir a operação."): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "Não foi possível conectar ao servidor. Verifique sua conexão.";
    const detail = (err.response.data as { detail?: unknown })?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const primeiro = detail[0] as { msg?: string };
      return (primeiro.msg ?? padrao).replace(/^Value error, /, "");
    }
  }
  return padrao;
}

export function getUsuario(): Usuario | null {
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as Usuario) : null;
  } catch {
    return null;
  }
}

function salvarSessao(data: Usuario & { access_token: string }) {
  localStorage.setItem("access_token", data.access_token);
  const usuario: Usuario = { id: data.id, nome: data.nome, cpf: data.cpf, tipo_perfil: data.tipo_perfil };
  localStorage.setItem("user", JSON.stringify(usuario));
  return usuario;
}

export const login = async (cpf: string, senha: string) => {
  const { data } = await API.post("/auth/login", { cpf, senha });
  return salvarSessao(data);
};

export const register = async (usuarioData: {
  nome: string;
  cpf: string;
  telefone?: string;
  senha: string;
  tipo_perfil: Perfil;
}) => {
  const { data } = await API.post("/auth/register", usuarioData);
  return salvarSessao(data);
};

export const logout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
};

export const getMedicamentos = async (id_idoso?: string): Promise<Medicamento[]> => {
  const { data } = await API.get("/medicamentos", { params: id_idoso ? { id_idoso } : {} });
  return data;
};

export const createMedicamento = async (body: Partial<Medicamento>) => (await API.post("/medicamentos", body)).data;

export const updateMedicamento = async (id: string, body: Partial<Medicamento>) =>
  (await API.put(`/medicamentos/${id}`, body)).data;

export const deleteMedicamento = async (id: string) => {
  await API.delete(`/medicamentos/${id}`);
};

export const getCompromissos = async (params: {
  periodo?: "futuros" | "passados" | "todos";
  tipo?: TipoCompromisso;
  id_idoso?: string;
}): Promise<Compromisso[]> => (await API.get("/consultas", { params })).data;

export const createCompromisso = async (body: Partial<Compromisso>) => (await API.post("/consultas", body)).data;

export const updateCompromisso = async (id: string, body: Partial<Compromisso>) =>
  (await API.put(`/consultas/${id}`, body)).data;

export const deleteCompromisso = async (id: string) => {
  await API.delete(`/consultas/${id}`);
};

export const getVinculos = async (): Promise<Vinculo[]> => (await API.get("/vinculos")).data;

export const createVinculo = async (cpf_idoso: string, parentesco?: string) =>
  (await API.post("/vinculos", { cpf_idoso, parentesco })).data;

export const deleteVinculo = async (id: string) => {
  await API.delete(`/vinculos/${id}`);
};
