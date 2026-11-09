import { useMemo, useRef, useState } from "react";
import { BookOpen, Boxes, Download, FileSpreadsheet, FileText, FileType2, Upload, Wallet } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import { useAuth } from "../hooks/useAuth";
import { useData } from "../hooks/useData";
import { useToast } from "../hooks/useToast";
import { baixarCSV, COLUNAS_COMPONENTES, gerarCSV, interpretarComponentes, lerCSV, type LinhaImportada } from "../utils/csv";
import { novoComponente, selecionarComponentes, tiposDe } from "../utils/componente";
import type { OpcoesPdf } from "../utils/pdf";
import type { OrcamentoStatus } from "../types";
import { STATUS_ORCAMENTO } from "../utils/constants";

const hoje = () => new Date().toISOString().slice(0, 10);

export default function ImportExportPage() {
  const { componentes, diario, orcamentos, precos, unidadesPorComponente, emprestimosPorComponente } = useData();
  const { podeEditar } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [nomeArquivo, setNomeArquivo] = useState("");
  const [validos, setValidos] = useState<LinhaImportada[]>([]);
  const [erros, setErros] = useState<string[]>([]);
  const [atualizarExistentes, setAtualizarExistentes] = useState(true);
  const [importando, setImportando] = useState(false);

  // PDF
  const [tiposPdf, setTiposPdf] = useState<string[]>([]);
  const [pdfEstado, setPdfEstado] = useState(true);
  const [pdfEmprestimo, setPdfEmprestimo] = useState(true);
  const [pdfLocal, setPdfLocal] = useState(true);
  const [pdfDescricao, setPdfDescricao] = useState(true);
  const [statusPdf, setStatusPdf] = useState<OrcamentoStatus[]>(["pendente", "aprovado", "comprado"]);
  const tiposDisponiveis = useMemo(() => {
    const todos = Array.from(new Set(componentes.itens.flatMap(tiposDe)));
    return todos.sort((a, b) => (a === "Básico" ? -1 : b === "Básico" ? 1 : a.localeCompare(b, "pt-BR")));
  }, [componentes.itens]);
  const qtdNoPdf = selecionarComponentes(componentes.itens, tiposPdf).length;

  const exportarPdf = async () => {
    if (qtdNoPdf === 0) return toast("Nenhum componente com esses tipos.", "aviso");
    const opcoes: OpcoesPdf = {
      tipos: tiposPdf,
      mostrarEstado: pdfEstado,
      mostrarEmprestimo: pdfEmprestimo,
      mostrarLocalizacao: pdfLocal,
      mostrarDescricao: pdfDescricao,
    };
    // carrega a biblioteca de PDF só quando for usada (ela é pesada)
    const { gerarPdfInventario } = await import("../utils/pdf");
    gerarPdfInventario({ componentes: componentes.itens, unidadesPorComponente, emprestimosPorComponente }, opcoes).save(
      `inventario_${hoje()}.pdf`,
    );
  };

  const exportarPdfOrcamento = async () => {
    const qtd = orcamentos.itens.filter((o) => statusPdf.includes(o.status)).length;
    if (qtd === 0) return toast("Nenhum item do orçamento com esses status.", "aviso");
    const { gerarPdfOrcamento } = await import("../utils/pdf");
    gerarPdfOrcamento(orcamentos.itens, { status: statusPdf }).save(`orcamento_${hoje()}.pdf`);
  };

  const exportarPrecos = () => {
    if (precos.itens.length === 0) return toast("Não há preços registrados.", "aviso");
    baixarCSV(
      `melhores_precos_${hoje()}.csv`,
      gerarCSV(precos.itens as unknown as Record<string, unknown>[], [
        { chave: "componente_nome", titulo: "componente" },
        { chave: "loja", titulo: "loja" },
        { chave: "preco_unitario", titulo: "preco_unitario" },
        { chave: "data_compra", titulo: "data_compra" },
        { chave: "link", titulo: "link" },
        { chave: "observacao", titulo: "observacao" },
      ]),
    );
  };

  // ---------- Exportações ----------
  const exportarComponentes = () => {
    if (componentes.itens.length === 0) return toast("Não há componentes para exportar.", "aviso");
    baixarCSV(`inventario_${hoje()}.csv`, gerarCSV(
        componentes.itens.map((c) => ({ ...c, outros_tipos: (c.outros_tipos ?? []).join(" | ") })) as unknown as Record<string, unknown>[],
        COLUNAS_COMPONENTES,
      ));
  };

  const exportarDiario = () => {
    if (diario.itens.length === 0) return toast("O diário está vazio.", "aviso");
    baixarCSV(
      `diario_${hoje()}.csv`,
      gerarCSV(diario.itens as unknown as Record<string, unknown>[], [
        { chave: "created_at", titulo: "data" },
        { chave: "tipo", titulo: "tipo" },
        { chave: "titulo", titulo: "titulo" },
        { chave: "texto", titulo: "texto" },
        { chave: "componente_nome", titulo: "componente" },
        { chave: "quantidade_afetada", titulo: "unidades_afetadas" },
        { chave: "autor_nome", titulo: "autor" },
      ]),
    );
  };

  const exportarOrcamento = () => {
    if (orcamentos.itens.length === 0) return toast("O orçamento está vazio.", "aviso");
    const linhas = orcamentos.itens.map((o) => ({ ...o, total: o.quantidade * Number(o.preco_unitario) }));
    baixarCSV(
      `orcamento_${hoje()}.csv`,
      gerarCSV(linhas as unknown as Record<string, unknown>[], [
        { chave: "nome", titulo: "componente" },
        { chave: "tipo", titulo: "tipo" },
        { chave: "quantidade", titulo: "quantidade" },
        { chave: "preco_unitario", titulo: "preco_unitario" },
        { chave: "total", titulo: "total" },
        { chave: "fornecedor", titulo: "fornecedor" },
        { chave: "link", titulo: "link" },
        { chave: "status", titulo: "status" },
      ]),
    );
  };

  const baixarModelo = () => {
    const exemplo = [
      { nome: "ESP32 DevKit V1", tipo: "Microcontrolador", quantidade: 5, quantidade_minima: 2, localizacao: "Armário 1", descricao: "30 pinos", outros_tipos: "", datasheet_url: "" },
      { nome: "Resistor 10kΩ", tipo: "Resistor", quantidade: 100, quantidade_minima: 20, localizacao: "Gaveta B", descricao: "", outros_tipos: "Básico", datasheet_url: "" },
    ];
    baixarCSV("modelo_importacao.csv", gerarCSV(exemplo, COLUNAS_COMPONENTES));
  };

  // ---------- Importação ----------
  const aoEscolherArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    const texto = await arquivo.text();
    const resultado = interpretarComponentes(lerCSV(texto));
    setNomeArquivo(arquivo.name);
    setValidos(resultado.validos);
    setErros(resultado.erros);
    e.target.value = "";
  };

  const limpar = () => {
    setNomeArquivo("");
    setValidos([]);
    setErros([]);
  };

  const confirmarImportacao = async () => {
    setImportando(true);
    const porNome = new Map(componentes.itens.map((c) => [c.nome.toLowerCase(), c]));
    const novos = [] as ReturnType<typeof novoComponente>[];
    let atualizados = 0;
    let ignorados = 0;

    for (const linha of validos) {
      const existente = porNome.get(linha.nome.toLowerCase());
      if (!existente) {
        novos.push(novoComponente(linha));
      } else if (atualizarExistentes) {
        if (await componentes.atualizar(existente.id, linha)) atualizados++;
      } else {
        ignorados++;
      }
    }

    if (novos.length > 0) await componentes.criarVarios(novos);
    await componentes.carregar();
    setImportando(false);
    toast(`Importação concluída: ${novos.length} novos, ${atualizados} atualizados, ${ignorados} ignorados.`);
    limpar();
  };

  const cartoes = [
    { icone: Boxes, titulo: "Inventário", desc: `${componentes.itens.length} componentes`, acao: exportarComponentes },
    { icone: BookOpen, titulo: "Diário de Bordo", desc: `${diario.itens.length} anotações`, acao: exportarDiario },
    { icone: Wallet, titulo: "Orçamento", desc: `${orcamentos.itens.length} itens`, acao: exportarOrcamento },
    { icone: Wallet, titulo: "Melhores Preços", desc: `${precos.itens.length} registros`, acao: exportarPrecos },
  ];

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl min-h-0 animate-fade-in flex-col overflow-y-auto pr-1">
      <PageHeader
        icone={FileSpreadsheet}
        cor="indigo"
        titulo="Importar / Exportar"
        subtitulo="Troque dados com planilhas (.csv) do Excel ou Google Sheets."
      />

      <h3 className="mb-3 flex items-center font-bold">
        <Download size={18} className="mr-2 text-orange-500" /> Exportar CSV
      </h3>
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cartoes.map(({ icone: Icone, titulo, desc, acao }) => (
          <button key={titulo} onClick={acao} className="card p-5 text-left transition-all hover:scale-[1.02] hover:shadow-lg">
            <Icone className="mb-3 text-orange-500" size={26} />
            <p className="font-bold">{titulo}</p>
            <p className="mb-3 text-xs text-gray-500">{desc}</p>
            <span className="flex items-center text-xs font-bold text-orange-500">
              <Download size={14} className="mr-1" /> Baixar .csv
            </span>
          </button>
        ))}
      </div>

      <h3 className="mb-3 flex items-center font-bold">
        <FileType2 size={18} className="mr-2 text-orange-500" /> Exportar inventário em PDF
      </h3>
      <div className="card mb-8 p-5">
        <p className="label">Quais tipos entram no PDF?</p>
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setTiposPdf([])}
            className={`rounded-full border px-3 py-1 text-xs font-bold transition-all ${
              tiposPdf.length === 0
                ? "border-orange-500 bg-orange-500 text-white"
                : "border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            Todos
          </button>
          {tiposDisponiveis.map((t) => (
            <button
              key={t}
              onClick={() => setTiposPdf(tiposPdf.includes(t) ? tiposPdf.filter((x) => x !== t) : [...tiposPdf, t])}
              className={`rounded-full border px-3 py-1 text-xs font-bold transition-all ${
                tiposPdf.includes(t)
                  ? "border-orange-500 bg-orange-500 text-white"
                  : "border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {[
            { v: pdfEstado, set: setPdfEstado, l: "Estado (bom / duvidoso / ruim)" },
            { v: pdfEmprestimo, set: setPdfEmprestimo, l: "Empréstimos" },
            { v: pdfLocal, set: setPdfLocal, l: "Localização" },
            { v: pdfDescricao, set: setPdfDescricao, l: "Descrição" },
          ].map((o) => (
            <label key={o.l} className="flex cursor-pointer items-center space-x-2">
              <input
                type="checkbox"
                checked={o.v}
                onChange={(e) => o.set(e.target.checked)}
                className="h-4 w-4 rounded text-orange-500 focus:ring-orange-500"
              />
              <span>{o.l}</span>
            </label>
          ))}
        </div>

        <button onClick={() => void exportarPdf()} className="btn-primary">
          <Download size={18} /> Baixar PDF ({qtdNoPdf} {qtdNoPdf === 1 ? "componente" : "componentes"})
        </button>
      </div>

      <h3 className="mb-3 flex items-center font-bold">
        <FileType2 size={18} className="mr-2 text-orange-500" /> Exportar orçamento em PDF (para a financeira)
      </h3>
      <div className="card mb-8 p-5">
        <p className="label">Quais status entram no PDF?</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_ORCAMENTO.map((st) => (
            <button
              key={st}
              onClick={() => setStatusPdf(statusPdf.includes(st) ? statusPdf.filter((x) => x !== st) : [...statusPdf, st])}
              className={`rounded-full border px-3 py-1 text-xs font-bold capitalize transition-all ${
                statusPdf.includes(st)
                  ? "border-orange-500 bg-orange-500 text-white"
                  : "border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
        <button onClick={() => void exportarPdfOrcamento()} className="btn-primary">
          <Download size={18} /> Baixar PDF do orçamento
        </button>
      </div>

      <h3 className="mb-3 flex items-center font-bold">
        <Upload size={18} className="mr-2 text-orange-500" /> Importar componentes
      </h3>

      {!podeEditar ? (
        <div className="card p-5 text-sm text-gray-500">Seu acesso é somente leitura (Trainee).</div>
      ) : (
        <div className="card mb-4 p-5 md:p-6">
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Colunas aceitas: <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">nome</code> (obrigatória),{" "}
            <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">tipo</code>,{" "}
            <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">quantidade</code>,{" "}
            <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">quantidade_minima</code>,{" "}
            <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">localizacao</code>,{" "}
            <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">descricao</code>,{" "}
            <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">outros_tipos</code> (separados por |) e{" "}
            <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">datasheet</code>. Separador “;” ou “,” — detectado
            automaticamente.
          </p>

          <div className="flex flex-wrap gap-3">
            <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => void aoEscolherArquivo(e)} />
            <button onClick={() => inputRef.current?.click()} className="btn-primary">
              <Upload size={18} /> Escolher arquivo .csv
            </button>
            <button onClick={baixarModelo} className="btn-ghost">
              <FileText size={18} /> Baixar modelo
            </button>
          </div>

          {nomeArquivo && (
            <div className="mt-5 border-t border-gray-200 pt-5 dark:border-gray-700">
              <p className="mb-2 text-sm font-bold">
                {nomeArquivo} — <span className="text-green-500">{validos.length} válidos</span>
                {erros.length > 0 && <span className="text-red-500"> · {erros.length} com problema</span>}
              </p>

              {erros.length > 0 && (
                <ul className="mb-3 max-h-32 list-disc overflow-y-auto rounded-xl bg-red-500/10 py-2 pl-8 pr-3 text-xs text-red-500">
                  {erros.map((er, i) => (
                    <li key={i}>{er}</li>
                  ))}
                </ul>
              )}

              {validos.length > 0 && (
                <>
                  <div className="mb-3 max-h-56 overflow-auto rounded-xl border border-gray-200 dark:border-gray-700">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-gray-100 dark:bg-gray-900">
                        <tr>
                          {["Nome", "Tipo", "Qtd", "Mín", "Local"].map((h) => (
                            <th key={h} className="px-3 py-2 font-bold uppercase text-gray-500">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {validos.slice(0, 50).map((v, i) => (
                          <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                            <td className="px-3 py-1.5 font-semibold">{v.nome}</td>
                            <td className="px-3 py-1.5">{v.tipo}</td>
                            <td className="px-3 py-1.5 tabular-nums">{v.quantidade}</td>
                            <td className="px-3 py-1.5 tabular-nums">{v.quantidade_minima}</td>
                            <td className="px-3 py-1.5">{v.localizacao ?? "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {validos.length > 50 && <p className="mb-3 text-xs text-gray-500">Mostrando as 50 primeiras linhas.</p>}

                  <label className="mb-4 flex cursor-pointer items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={atualizarExistentes}
                      onChange={(e) => setAtualizarExistentes(e.target.checked)}
                      className="h-4 w-4 rounded text-orange-500 focus:ring-orange-500"
                    />
                    <span>Atualizar itens que já existem (mesmo nome). Desmarcado: eles são ignorados.</span>
                  </label>

                  <div className="flex gap-3">
                    <button onClick={limpar} className="btn-ghost">
                      Cancelar
                    </button>
                    <button onClick={() => void confirmarImportacao()} disabled={importando} className="btn-success">
                      {importando ? "Importando..." : `Importar ${validos.length} itens`}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
