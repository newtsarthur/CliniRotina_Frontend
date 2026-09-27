import { useCallback, useEffect, useState } from "react";
import { 
  FileText, 
  Download, 
  Trash2, 
  Plus, 
  Upload, 
  Loader2, 
  X, 
  FileImage, 
  Search, 
  SlidersHorizontal 
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

interface Document {
  id: string;
  title: string;
  file_path: string;
  file_type: string;
  category: string | null;
  created_at: string | null;
  uploaded_by: string;
  patient_id: string;
}

const getFileExtension = (fileType: string) => {
  if (fileType === "application/pdf") return ".pdf";
  if (fileType === "image/png") return ".png";
  return ".jpg";
};

interface DocumentListProps {
  patientId: string;
  canUpload?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ".pdf,.jpg,.jpeg,.png";
const ACCEPTED_MIME = ["application/pdf", "image/jpeg", "image/png"];

const CATEGORIES = [
  { value: "Exame", label: "Exame Laboratorial / Imagem" },
  { value: "Receita", label: "Receita Médica" },
  { value: "Laudo", label: "Laudo ou Relatório" },
  { value: "Outros", label: "Outros Documentos" },
];

export function DocumentList({ patientId, canUpload = true }: DocumentListProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Exame");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Search & Filtering States
  const [docSearch, setDocSearch] = useState("");
  const [docCategoryFilter, setDocCategoryFilter] = useState("all");

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error);
      toast.error("Erro ao carregar documentos");
    } else {
      setDocuments(data || []);
    }
    setIsLoading(false);
  }, [patientId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_MIME.includes(file.type)) {
      toast.error("Formato inválido. Aceitos: PDF, JPG, PNG.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Arquivo muito grande. Máximo: 10MB.");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim() || !category || !user?.id) return;

    setIsUploading(true);

    const ext = selectedFile.name.split(".").pop();
    const filePath = `${patientId}/${Date.now()}.${ext}`;

    const { error: storageError } = await supabase.storage
      .from("medical_records")
      .upload(filePath, selectedFile);

    if (storageError) {
      console.error("Upload error:", storageError);
      toast.error("Erro ao enviar arquivo. Tente novamente.");
      setIsUploading(false);
      return;
    }

    const { error: dbError } = await supabase.from("documents").insert({
      patient_id: patientId,
      uploaded_by: user.id,
      title: title.trim(),
      file_path: filePath,
      file_type: selectedFile.type,
      category: category,
    });

    if (dbError) {
      console.error("DB insert error:", dbError);
      toast.error("Erro ao registrar documento.");
      await supabase.storage.from("medical_records").remove([filePath]);
      setIsUploading(false);
      return;
    }

    toast.success("Documento enviado com sucesso! ✨");
    setUploadOpen(false);
    setSelectedFile(null);
    setTitle("");
    setCategory("Exame");
    setIsUploading(false);
    fetchDocuments();
  };

  const handleDownload = async (doc: Document) => {
    if (downloadingId) return;
    setDownloadingId(doc.id);

    try {
      const { data, error } = await supabase.storage
        .from("medical_records")
        .download(doc.file_path);

      if (error || !data) {
        throw new Error(error?.message || "Blob vazio");
      }

      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.title + getFileExtension(doc.file_type);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Download concluído!");
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Erro ao baixar documento. Tente novamente.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);

    const { error: storageError } = await supabase.storage
      .from("medical_records")
      .remove([deleteTarget.file_path]);

    if (storageError) {
      console.error("Storage delete error:", storageError);
    }

    const { error: dbError } = await supabase
      .from("documents")
      .delete()
      .eq("id", deleteTarget.id);

    if (dbError) {
      console.error("DB delete error:", dbError);
      toast.error("Erro ao excluir documento.");
      setIsDeleting(false);
      return;
    }

    toast.success("Documento excluído.");
    setDeleteTarget(null);
    setIsDeleting(false);
    fetchDocuments();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return format(new Date(dateStr), "dd MMM yyyy 'às' HH:mm", { locale: ptBR });
  };

  // Styled Lucide indicators instead of plain emojis
  const renderFileIcon = (fileType: string) => {
    if (fileType === "application/pdf") {
      return (
        <div className="flex flex-col items-center justify-center">
          <FileText size={18} className="text-red-500" />
          <span className="text-[8px] font-extrabold text-red-600 tracking-wider mt-0.5">PDF</span>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center">
        <FileImage size={18} className="text-[#8B3D5A]" />
        <span className="text-[8px] font-extrabold text-[#8B3D5A]/80 tracking-wider mt-0.5">IMG</span>
      </div>
    );
  };

  const getCategoryBadgeClass = (category: string | null) => {
    const cat = category || "Exame";
    switch (cat) {
      case "Receita":
        return "bg-emerald-50 text-emerald-600 border border-emerald-200/50";
      case "Laudo":
        return "bg-blue-50 text-blue-600 border border-blue-200/50";
      case "Outros":
        return "bg-gray-50 text-gray-600 border border-gray-200/50";
      default:
        return "bg-purple-50 text-purple-600 border border-purple-200/50";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-[#9e837a]">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Carregando arquivos...</span>
      </div>
    );
  }

  const isFormValid = selectedFile && title.trim() && category;

  // Apply local filtering
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(docSearch.toLowerCase());
    const matchesCategory = docCategoryFilter === "all" || doc.category === docCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* Scoped Document Controls */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1 group">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9e837a] group-focus-within:text-[#E5859A] transition-colors">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Buscar documentos por título..."
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/60 border border-white/60 text-xs text-[#1C1917] placeholder:text-[#9e837a]/60 focus:outline-none focus:ring-2 focus:ring-[#E5859A]/20 transition-all font-medium"
            />
          </div>
          <div className="w-1/3">
            <Select value={docCategoryFilter} onValueChange={setDocCategoryFilter}>
              <SelectTrigger className="w-full h-10 bg-white/40 border-white/60 text-xs font-semibold text-[#7a5d56] rounded-xl">
                <SlidersHorizontal size={12} className="mr-1 text-[#E5859A]" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-md text-xs border-white/60 text-[#1C1917] rounded-xl shadow-xl">
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="Exame">Exame</SelectItem>
                <SelectItem value="Receita">Receita</SelectItem>
                <SelectItem value="Laudo">Laudo</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {canUpload && (
          <Button
            onClick={() => setUploadOpen(true)}
            className="w-full h-[52px] bg-[#E5859A]/10 hover:bg-[#E5859A]/20 text-[#8B3D5A] border border-[#E5859A]/25 rounded-2xl font-bold active:scale-95 transition-all duration-300 shadow-sm gap-1.5"
          >
            <Plus className="w-5 h-5" />
            Adicionar Documento
          </Button>
        )}
      </div>

      {/* Document cards */}
      {filteredDocs.length === 0 ? (
        <div 
          className="flex flex-col items-center justify-center py-12 px-6 rounded-[32px] backdrop-blur-md border border-white/70 shadow-sm"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(253,248,245,0.55) 100%)",
          }}
        >
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#FFF5F8] to-[#FCE7EC] flex items-center justify-center mb-4 border border-[#E5859A]/20 shadow-inner">
            <FileText className="w-7 h-7 text-[#8B3D5A]" />
          </div>
          <h3 className="text-[16px] font-bold text-[#1C1917] mb-1">Nenhum documento encontrado</h3>
          <p className="text-[13px] text-[#6A5A56] text-center font-medium leading-relaxed max-w-[280px]">
            {documents.length > 0 
              ? "Nenhum arquivo corresponde aos critérios de pesquisa e filtro aplicados."
              : "Envie exames, receitas ou laudos médicos para que apareçam organizados aqui."}
          </p>
        </div>
      ) : (
        <div className="space-y-3 pb-6">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="rounded-3xl p-5 backdrop-blur-md border border-white/70 flex items-center gap-4 min-h-[96px] hover:border-[#E5859A]/30 transition-all"
              style={{ 
                background: "linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(255,245,248,0.55) 100%)", 
                boxShadow: "0 10px 40px -20px rgba(139, 61, 90, 0.15)" 
              }}
            >
              {/* File icon container */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFF5F8] to-[#FCE7EC] flex items-center justify-center shrink-0 border border-[#E5859A]/10">
                {renderFileIcon(doc.file_type)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[14.5px] font-bold text-[#1C1917] truncate">
                  {doc.title}
                </p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getCategoryBadgeClass(doc.category)}`}>
                    {doc.category || "Exame"}
                  </span>
                  <span className="text-gray-300">•</span>
                  <p className="text-[11px] text-[#9e837a] font-medium uppercase tracking-[0.05em]">
                    {formatDate(doc.created_at)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleDownload(doc)}
                  disabled={downloadingId === doc.id}
                  className="p-2.5 rounded-xl hover:bg-[#FFF5F8] transition-colors disabled:opacity-50 text-[#8B3D5A]"
                  title="Baixar"
                >
                  {downloadingId === doc.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>

                {user?.id === doc.uploaded_by && (
                  <button
                    onClick={() => setDeleteTarget(doc)}
                    className="p-2.5 rounded-xl hover:bg-red-50 transition-colors group text-[#9e837a]"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4 group-hover:text-[#ED2B54]" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-xl rounded-[32px] border border-white/60 max-w-[90vw] sm:max-w-md p-6 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-[20px] font-bold text-[#1C1917] tracking-tight">
              Adicionar Documento
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#9e837a] leading-relaxed">
              Envie exames, receitas ou outros documentos médicos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#9e837a] uppercase tracking-wider px-1">Título *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Hemograma Completo"
                maxLength={100}
                className="w-full h-12 px-4 rounded-2xl bg-[#FFF5F8]/50 border border-[#E5859A]/15 text-[#1C1917] placeholder:text-[#9e837a]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#E5859A]/20 transition-all font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#9e837a] uppercase tracking-wider px-1">Categoria *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-12 px-4 rounded-2xl bg-[#FFF5F8]/50 border border-[#E5859A]/15 text-[#1C1917] text-sm focus:outline-none focus:ring-2 focus:ring-[#E5859A]/20 transition-all font-medium appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%238B3D5A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 16px center',
                  backgroundSize: '16px'
                }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#9e837a] uppercase tracking-wider px-1">Arquivo *</label>
              {selectedFile ? (
                <div className="flex items-center justify-between p-4 bg-[#FFF5F8]/40 border border-[#E5859A]/20 rounded-2xl transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm text-lg">
                      {selectedFile.type === "application/pdf" ? "📄" : "🖼️"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1C1917] truncate">{selectedFile.name}</p>
                      <p className="text-[10px] text-[#9e837a] font-medium">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-[#9e837a] hover:text-[#ED2B54] transition-colors"
                    title="Remover arquivo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-[#E5859A]/20 rounded-2xl cursor-pointer hover:border-[#8B3D5A] hover:bg-[#FFF5F8]/40 transition-all group">
                  <div className="w-10 h-10 rounded-full bg-[#FFF5F8] flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                    <Upload className="w-5 h-5 text-[#E5859A]" />
                  </div>
                  <span className="text-[12px] font-semibold text-[#8B3D5A] text-center px-4">
                    PDF, JPG ou PNG (máx. 10MB)
                  </span>
                  <input
                    type="file"
                    accept={ACCEPTED_TYPES}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <Button
              onClick={handleUpload}
              disabled={!isFormValid || isUploading}
              className={`w-full h-12 rounded-2xl font-bold shadow-md transition-all ${
                !isFormValid || isUploading
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                  : "bg-[#E5859A] hover:bg-[#d4748a] text-white shadow-[#E5859A]/20 active:scale-[0.98]"
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                "Enviar Documento"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-white/85 backdrop-blur-xl border border-white/60 rounded-[32px] shadow-[0_20px_50px_-15px_rgba(139,61,90,0.18)] max-w-[360px] p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-[#1C1917] text-center">Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-[#7a5d56] text-center mt-2 leading-relaxed">
              O documento "{deleteTarget?.title}" será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-6">
            <AlertDialogCancel className="w-full h-12 rounded-2xl bg-white/60 hover:bg-white/80 border-white/60 text-[#1C1917] font-bold mt-0" disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full h-12 rounded-2xl bg-[#ED2B54] hover:bg-[#d11a43] text-white font-bold m-0 shadow-lg shadow-[#ED2B54]/20 active:scale-95 transition-all"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
