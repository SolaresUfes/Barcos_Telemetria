import { useState, useEffect } from "react";

export function useClock() {
  const [currentTime, setCurrentTime] = useState(new Date());         // Horário atual

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return {
    currentTime,
    setCurrentTime,

  };
}

export type UseClock = ReturnType<typeof useClock>;
