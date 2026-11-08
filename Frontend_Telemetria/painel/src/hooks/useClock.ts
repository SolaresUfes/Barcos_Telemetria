import {useState, useEffect} from "react";

export function useClock {
    // Estado Inicial
    const [currentTime, setCurrentTime] = useState(new Date());

    // Atualização do horário:
    // a função define uma variável timer que é atualizada a cada 1 segundo
    // essa atualização se trata de alterar o estado currentTime para o horário atual
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Retorno das funções e das variáveis
    return {
        currentTime,
        setCurrentTime,
    };

}

// Cria e exporta um tipo chamado useClock, que corresponde ao tipo de valor retornado pela função useClock
export type useClock = ReturnType<typeof useClock>;