import { useState, useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const WHATSAPP_URL =
  "https://wa.me/558183105992?text=Olá! Gostaria de tirar uma dúvida sobre meu acompanhamento no CliniRotina.";

const ALLOWED_ROUTES = ["/dashboard", "/plano", "/exames"];

export function WhatsAppFAB() {
  const { pathname } = useLocation();
  const { profile } = useAuth();
  const fabRef = useRef<HTMLButtonElement>(null);

  // Position state (default to bottom right edge)
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    const saved = localStorage.getItem("whatsapp_fab_pos");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          return parsed;
        }
      } catch {
        // Fallback below
      }
    }
    const defaultX = typeof window !== "undefined" ? window.innerWidth - 72 : 300;
    const defaultY = typeof window !== "undefined" ? window.innerHeight - 150 : 600;
    return { x: defaultX, y: defaultY };
  });

  const [isPointerDown, setIsPointerDown] = useState(false);
  const dragStartRef = useRef<{ pointerX: number; pointerY: number; startX: number; startY: number }>({
    pointerX: 0,
    pointerY: 0,
    startX: 0,
    startY: 0,
  });
  const hasDraggedRef = useRef(false);

  // Reposition on window resize if outside bounds
  useEffect(() => {
    function handleResize() {
      setPos((prev) => {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const buttonCenterX = prev.x + 28;
        const leftMargin = 16;
        const rightMargin = screenWidth - 72;

        const snappedX = buttonCenterX < screenWidth / 2 ? leftMargin : rightMargin;
        const clampedY = Math.max(16, Math.min(prev.y, screenHeight - 72));
        return { x: snappedX, y: clampedY };
      });
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isPatient = profile?.user_type === "patient";
  if (!isPatient || !ALLOWED_ROUTES.includes(pathname)) return null;

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    setIsPointerDown(true);
    hasDraggedRef.current = false;
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: pos.x,
      startY: pos.y,
    };
    if (fabRef.current) {
      fabRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isPointerDown) return;

    const deltaX = e.clientX - dragStartRef.current.pointerX;
    const deltaY = e.clientY - dragStartRef.current.pointerY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      hasDraggedRef.current = true;
    }

    const maxX = window.innerWidth - 68;
    const maxY = window.innerHeight - 68;
    const newX = Math.max(12, Math.min(dragStartRef.current.startX + deltaX, maxX));
    const newY = Math.max(12, Math.min(dragStartRef.current.startY + deltaY, maxY));

    setPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isPointerDown) return;
    setIsPointerDown(false);

    if (fabRef.current) {
      fabRef.current.releasePointerCapture(e.pointerId);
    }

    // Snap to nearest side edge (magnetic docking)
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const buttonCenterX = pos.x + 28;
    const leftMargin = 16;
    const rightMargin = screenWidth - 72;

    const snappedX = buttonCenterX < screenWidth / 2 ? leftMargin : rightMargin;
    const clampedY = Math.max(16, Math.min(pos.y, screenHeight - 72));
    const finalPos = { x: snappedX, y: clampedY };

    setPos(finalPos);
    localStorage.setItem("whatsapp_fab_pos", JSON.stringify(finalPos));

    // If it was just a click (not a drag), open WhatsApp link
    if (!hasDraggedRef.current) {
      window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <button
      ref={fabRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      aria-label="Falar no WhatsApp"
      className="fixed z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#E5859A] text-white shadow-xl border-2 border-white/60 touch-none cursor-grab active:cursor-grabbing hover:scale-105 active:scale-95"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transition: isPointerDown
          ? "none"
          : "left 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), top 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)",
      }}
    >
      <MessageCircle size={28} fill="white" strokeWidth={0} />
    </button>
  );
}
