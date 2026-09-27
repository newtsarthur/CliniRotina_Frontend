import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircleHeart } from "lucide-react";

export function DoctorMessage({ userId }: { userId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("protocols")
        .select("message")
        .eq("patient_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0 && data[0].message) {
        setMessage(data[0].message);
      }
      setLoading(false);
    };
    fetch();
  }, [userId]);

  if (loading) {
    return <Skeleton className="h-16 w-full rounded-2xl" />;
  }

  if (!message) return null;

  return (
    <div className="rounded-2xl bg-[#E5859A]/5 border border-[#E5859A]/15 p-4 flex gap-3 items-start">
      <div className="w-8 h-8 rounded-full bg-[#E5859A]/10 flex items-center justify-center shrink-0 mt-0.5">
        <MessageCircleHeart className="w-4 h-4 text-[#E5859A]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#E5859A] mb-1">Recado da sua médica</p>
        <p className="text-sm text-[#434343] italic leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
