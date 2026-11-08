import type { Dispatch, SetStateAction } from "react";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { tocarSomSuave } from "../utils/sound";
import { supabase } from "../lib/supabase";
import type { Member } from "../types/member";
import type { ToastFn } from "../types/ui";

export function usePresence(currentUser: Member | null,
  setMembers: Dispatch<SetStateAction<Member[]>>,
  dispararToast: ToastFn) {
  const [cutucaoRecebido, setCutucaoRecebido] = useState<{ remetente: string } | null>(null);

  const teamChannelRef = useRef<any>(null);

 // Efeito usado para verificar as pessoas online e gerar o canal de broadcast
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel("sala_equipe");
    teamChannelRef.current = channel; // Guarda a referência ativa do canal

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const onlineEmails = new Set();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.values(state).forEach((presences: any) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          presences.forEach((p: any) => onlineEmails.add(p.email));
        });

        setMembers((prevMembers) =>
          prevMembers.map((m) => ({
            ...m,
            isOnline: onlineEmails.has(m.email),
            lastSeen: onlineEmails.has(m.email)
              ? "agora"
              : m.isOnline
                ? new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                : m.lastSeen,
          }))
        );
      })
      .on("broadcast", { event: "cutucar" }, (payload) => {
        if (payload.payload.destinatario === currentUser.email) {
          setCutucaoRecebido({ remetente: payload.payload.remetenteNome });
          tocarSomSuave();

          setTimeout(() => {
            setCutucaoRecebido(null);
          }, 4000);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ email: currentUser.email });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      teamChannelRef.current = null;
    };
  }, [currentUser]);

  const enviarCutucao = async (membroEmail: string, membroNome: string) => {
    if (!teamChannelRef.current) {
      dispararToast("Canal de equipa ainda não conectado.", "aviso");
      return;
    }

    await teamChannelRef.current.send({
      type: "broadcast",
      event: "cutucar",
      payload: {
        destinatario: membroEmail,
        remetenteNome: currentUser?.name.split(" ")[0] || "Alguém",
      },
    });
    
    dispararToast(`Cutucão enviado para ${membroNome}! 👋`, "sucesso");
  };
  return {
    cutucaoRecebido,
    setCutucaoRecebido,
    teamChannelRef,
    enviarCutucao,

  };
}

export type UsePresence = ReturnType<typeof usePresence>;
