import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
  largura?: string; // ex: "max-w-lg"
}

// Pilha de modais abertos: o Esc fecha só o de cima
const pilha: symbol[] = [];

export default function Modal({ titulo, onFechar, children, largura = "max-w-lg" }: Props) {
  const idRef = useRef(Symbol("modal"));
  const fecharRef = useRef(onFechar);
  fecharRef.current = onFechar;

  useEffect(() => {
    const id = idRef.current;
    pilha.push(id);
    const aoApertar = (e: KeyboardEvent) => {
      if (e.key === "Escape" && pilha[pilha.length - 1] === id) fecharRef.current();
    };
    window.addEventListener("keydown", aoApertar);
    return () => {
      window.removeEventListener("keydown", aoApertar);
      pilha.splice(pilha.indexOf(id), 1);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex animate-fade-in items-center justify-center bg-black/70 p-4 backdrop-blur-md"
      onClick={onFechar}
    >
      <div
        className={`card max-h-[90vh] w-full ${largura} overflow-y-auto p-6 shadow-2xl md:p-8`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-5 text-xl font-bold">{titulo}</h3>
        {children}
      </div>
    </div>
  );
}
