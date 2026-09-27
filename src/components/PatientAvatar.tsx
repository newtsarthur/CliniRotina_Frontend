import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface PatientAvatarProps {
  avatarUrl?: string | null;
  fullName?: string | null;
  className?: string;
  fallbackClassName?: string;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export function PatientAvatar({ avatarUrl, fullName, className, fallbackClassName }: PatientAvatarProps) {
  return (
    <Avatar className={cn("w-[60px] h-[60px]", className)}>
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} alt={fullName || "Paciente"} className="object-cover" />
      ) : null}
      <AvatarFallback className={cn("bg-[#FFF5F8] text-[#E5859A] font-bold", fallbackClassName)}>
        {getInitials(fullName)}
      </AvatarFallback>
    </Avatar>
  );
}
