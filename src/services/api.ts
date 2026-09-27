import axios from "axios";

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000" });

export const login = async (cpf: string, senha: string) => {
  const { data } = await API.post("/auth/login", { cpf, senha });
  if (data.access_token) localStorage.setItem("access_token", data.access_token);
  if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
  return data;
};

export const register = async (usuarioData: Record<string, unknown>) => {
  const { data } = await API.post("/auth/register", usuarioData);
  return data;
};

export const getMedicamentos = async (id_idoso?: string) => {
  const params = id_idoso ? { id_idoso } : {};
  const { data } = await API.get("/medicamentos", { params });
  return data;
};

export const createMedicamento = async (medicamentoData: Record<string, unknown>) => {
  const { data } = await API.post("/medicamentos", medicamentoData);
  return data;
};

export const updateMedicamento = async (id: string, medicamentoData: Record<string, unknown>) => {
  const { data } = await API.put(`/medicamentos/${id}`, medicamentoData);
  return data;
};

export const deleteMedicamento = async (id: string) => {
  const { data } = await API.delete(`/medicamentos/${id}`);
  return data;
};

export const logout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
};
