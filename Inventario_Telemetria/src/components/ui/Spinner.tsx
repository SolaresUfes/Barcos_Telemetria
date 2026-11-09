export default function Spinner({ texto = "Carregando..." }: { texto?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      <p className="text-sm font-medium text-gray-500">{texto}</p>
    </div>
  );
}
