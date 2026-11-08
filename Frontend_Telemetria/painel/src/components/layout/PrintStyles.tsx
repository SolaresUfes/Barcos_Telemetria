

export function PrintStyles() {
  return (
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #area-graficos, #area-graficos * {
            visibility: visible;
          }
          #area-graficos {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
  );
}
