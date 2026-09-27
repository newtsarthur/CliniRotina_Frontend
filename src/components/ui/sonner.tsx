import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-[#1C1917] group-[.toaster]:border group-[.toaster]:border-white/80 group-[.toaster]:shadow-[0_12px_40px_-12px_rgba(139,61,90,0.22)] group-[.toaster]:rounded-2xl font-sans text-[13.5px] font-semibold py-3.5 px-4.5 transition-all duration-300",
          description: "group-[.toast]:text-[#7a5d56] font-normal text-[12px]",
          actionButton: "group-[.toast]:bg-[#8B3D5A] group-[.toast]:text-white group-[.toast]:rounded-xl font-bold",
          cancelButton: "group-[.toast]:bg-gray-100 group-[.toast]:text-[#7a5d56] group-[.toast]:rounded-xl",
          success: "group-[.toast]:text-[#8B3D5A] group-[.toast]:border-[#E5859A]/40",
          error: "group-[.toast]:text-red-900 group-[.toast]:border-red-200/80 group-[.toaster]:bg-red-50/95",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
