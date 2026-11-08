/** Séries de dados de telemetria (usadas tanto no modo ao vivo quanto na gravação). */
export interface SeriesData {
  tensao: number[];
  potenciaBateria: number[];
  potenciaMotor: number[];
  potenciaGeracao: number[];
  bateria: number[];
  velocidade: number[];
  correnteBateria: number[];
  correnteMotor: number[];
  s1: number[];
  s2: number[];
}
