export type ToastTipo = "sucesso" | "aviso" | "erro";
export type ToastFn = (mensagem: string, tipo?: ToastTipo) => void;
export interface ToastState {
  mensagem: string;
  tipo: ToastTipo;
}
