export const generateFixedPolyline = (data: number[], width: number, height: number, minVal: number, maxVal: number, isIdle: boolean = false) => {
  if (!data || data.length === 0) return `0,${height / 2} ${width},${height / 2}`;
  const range = maxVal - minVal;

  if (isIdle) {
    const stepX = width / 39; // Trava o risco visual em 40 pontos virtuais
    const reversedData = [...data].reverse();
    const offsetX = width - ((reversedData.length - 1) * stepX);
    return reversedData.map((val, index) => {
      const x = offsetX + (index * stepX);
      const clampedVal = Math.max(minVal, Math.min(maxVal, val));
      const y = height - ((clampedVal - minVal) / range) * height;
      return `${x},${y}`;
    }).join(" ");
  } else {
    if (data.length === 1) {
      const y = height - ((data[0] - minVal) / range) * height;
      return `0,${y} ${width},${y}`;
    }
    const stepX = width / (data.length - 1);
    return data.map((val, index) => {
      const x = index * stepX;
      const clampedVal = Math.max(minVal, Math.min(maxVal, val));
      const y = height - ((clampedVal - minVal) / range) * height;
      return `${x},${y}`;
    }).join(" ");
  }
};

export const generatePolyline = (data: number[], width: number, height: number, maxVal: number) => {
  if (data.length === 0) return `1000,${height / 2}`; // Corrigido para usar crases
  
  const stepX = width / 39; // Trava a distância para 40 pontos máximos
  
  // Inverte para desenhar do mais antigo (esquerda) para o mais novo (direita)
  const reversedData = [...data].reverse(); 
  
  // Calcula o offset para empurrar o ponto mais novo para o final (x = 1000)
  const offsetX = width - ((reversedData.length - 1) * stepX);
  
  return reversedData
    .map((val: number, index: number) => {
      const x = offsetX + (index * stepX);
      const y = (height / 2) - (val / maxVal) * (height / 2);
      return `${x},${y}`;
    })
    .join(" ");
};

export const generateFullPolyline = (data: number[], width: number, height: number, isIdle: boolean = false) => {
  if (!data || data.length === 0) return `0,${height}`;
  
  const maxData = Math.max(...data);
  const minData = Math.min(...data);
  const padding = maxData === minData ? 1 : (maxData - minData) * 0.15;
  const adjustedMax = maxData + padding;
  const adjustedMin = minData - padding;
  const range = adjustedMax - adjustedMin;

  if (isIdle) {
    const stepX = width / 39;
    const reversedData = [...data].reverse();
    const offsetX = width - ((reversedData.length - 1) * stepX);
    return reversedData.map((val, index) => {
      const x = offsetX + (index * stepX);
      const y = height - ((val - adjustedMin) / range) * height;
      return `${x},${y}`;
    }).join(" ");
  } else {
    if (data.length === 1) return `0,${height / 2} ${width},${height / 2}`;
    if (maxData === minData) return data.map((_, i) => `${i * (width / (data.length - 1))},${height / 2}`).join(" ");
    
    const stepX = width / (data.length - 1);
    return data.map((val, index) => {
      const x = index * stepX;
      const y = height - ((val - adjustedMin) / range) * height;
      return `${x},${y}`;
    }).join(" ");
  }
};

// faz o grafico da bateria variar só de 0 a 100
export const generateBatteryPath = (data: number[], width: number, height: number, isIdle: boolean) => {
  if (!data || data.length === 0) return `1000,${height}`;
  if (isIdle) {
    const stepX = width / 39;
    const reversedData = [...data].reverse();
    const offsetX = width - ((reversedData.length - 1) * stepX);
    return reversedData.map((val, index) => {
      const x = offsetX + (index * stepX);
      const y = height - (Math.max(0, Math.min(100, val)) / 100) * height;
      return `${x},${y}`;
    }).join(" ");
  } else {
    if (data.length === 1) return `0,${height - (data[0]/100)*height} ${width},${height - (data[0]/100)*height}`;
    const stepX = width / (data.length - 1);
    return data.map((val, index) => {
      const x = index * stepX;
      const y = height - (val / 100) * height;
      return `${x},${y}`;
    }).join(" ");
  }
};
