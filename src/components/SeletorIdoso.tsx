import { useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getVinculos, type Vinculo } from "@/services/api";

/** Lista de idosos vinculados ao cuidador logado. */
export function useIdososVinculados(ativo: boolean) {
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  useEffect(() => {
    if (ativo) getVinculos().then(setVinculos).catch(() => setVinculos([]));
  }, [ativo]);
  return vinculos;
}

interface SeletorIdosoProps {
  vinculos: Vinculo[];
  value: string | undefined;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export function SeletorIdoso({ vinculos, value, onChange, disabled }: SeletorIdosoProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione o idoso" />
      </SelectTrigger>
      <SelectContent>
        {vinculos.map((v) => (
          <SelectItem key={v.id_idoso} value={v.id_idoso}>
            {v.nome_idoso}
            {v.parentesco ? ` (${v.parentesco})` : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
