// Função para tocar um sonzinho quando chegar notificação
export function tocarSomSuave() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    // Frequência inicial e transição rápida para dar um tom agradável e limpo
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // Nota D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.08); // Sobe levemente para A5

    // Volume baixo (0.08) para não ser irritante nem alto demais
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.18);
  } catch (e) {
    console.log("Erro de audio: ", e)
  }
}
