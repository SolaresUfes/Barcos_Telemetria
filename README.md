<p align="center">
  <img src="Frontend_Telemetria/painel/public/favicon.svg" alt="Logo da Telemetria Solares" width="96" />
</p>

<h1 align="center">Barcos Telemetria — Solares UFES</h1>

<p align="center">
  Sistema completo de telemetria do <b>barco solar</b> da equipe Solares (UFES).<br/>
  Do sensor no casco até o painel no navegador: firmware, backend, display de bordo e site em tempo real.
</p>

<p align="center">
  <a href="https://barcos-telemetria.vercel.app/"><img alt="Painel ao vivo" src="https://img.shields.io/badge/Painel-ao%20vivo-22c55e?logo=vercel&logoColor=white" /></a>
  <img alt="ESP32-S3" src="https://img.shields.io/badge/ESP32--S3-E7352C?logo=espressif&logoColor=white" />
  <img alt="PlatformIO" src="https://img.shields.io/badge/PlatformIO-FF7F00?logo=platformio&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-61dafb?logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-3ecf8e?logo=supabase&logoColor=white" />
  <img alt="Vercel" src="https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel" />
</p>

<p align="center">
  <a href="https://barcos-telemetria.vercel.app/"><b>🌊 Abrir o painel</b></a>
</p>

---

## Sobre

Este repositório reúne todo o código da sub-área de **Telemetria** da equipe Solares. Durante uma prova, o barco mede bateria, células, correntes, potências e velocidade; esses dados viajam até a nuvem e aparecem ao vivo para a equipe, que pode gravar a prova, consultar o histórico e analisar o desempenho depois.

## Como as peças se encaixam

```
┌──────────────┐   ESP-NOW   ┌──────────────┐   HTTP POST   ┌────────────────────┐
│ Sensores/BMS │────────────▶│ ESP32 (barco)│──────────────▶│ Backend-telemetria │
└──────────────┘             └──────┬───────┘               │      (Vercel)      │
                                    │                       └─────────┬──────────┘
                                    ▼                                 │
                          ┌──────────────────┐            Redis (última leitura)
                          │ Display_Telemetria│            Supabase (histórico)
                          │  (display de bordo)│                      │
                          └──────────────────┘                       ▼
                                                           ┌────────────────────┐
                                                           │ Frontend_Telemetria │
                                                           │  painel no navegador│
                                                           └────────────────────┘
```

## Módulos

| Pasta | O que é |
|---|---|
| [`ESP_Completo/`](./ESP_Completo) | Firmware do ESP32 que coleta as medições do barco e envia à nuvem. |
| [`Display_Telemetria/`](./Display_Telemetria) | Código do display de bordo, que mostra os dados no próprio barco. |
| [`Backend-telemetria/`](./Backend-telemetria) | API que recebe as leituras, guarda a última no Redis e o histórico no Supabase. |
| [`Frontend_Telemetria/`](./Frontend_Telemetria) | Painel web: ao vivo, gravação de provas, análise, modo piloto e gestão da equipe. |

> Cada pasta tem (ou deve ter) o seu próprio README com os detalhes de build e uso.

## Destaques

- 📡 **Tempo real**: bateria, potência, corrente, velocidade e temperatura das células, atualizados duas vezes por segundo.
- 🎥 **Gravação de provas** com histórico consultável e exportação em CSV.
- 📊 **Análise** com gráficos, sobreposição de séries e impressão.
- 🧑‍✈️ **Modo Piloto**: tela grande e simples, com alerta de bateria baixa.
- 🔐 **Acesso restrito** por login Google e cargos (piloto, engenheiro de prova, moderador).
- 🗺️ **Rastreamento GPS** embutido no painel.

## Tecnologias

| Camada | Stack |
|---|---|
| Firmware | ESP32-S3 · PlatformIO · ESP-NOW |
| Backend | API na Vercel · Redis (Upstash) · Supabase (Postgres) |
| Frontend | React · TypeScript · Vite · Tailwind CSS · Supabase Auth/Realtime |
| Deploy | Vercel |

## Começando

```bash
git clone https://github.com/SolaresUfes/Barcos_Telemetria.git
cd Barcos_Telemetria
```

- **Painel (frontend):** veja o [README do Frontend](./Frontend_Telemetria/README.md) para rodar localmente e configurar o Supabase.
- **Firmware:** abra a pasta do ESP no VS Code com a extensão PlatformIO e faça o upload para a placa.
- **Backend:** veja a pasta [`Backend-telemetria/`](./Backend-telemetria) para as variáveis de ambiente e rotas.

## Contribuindo

1. Crie uma branch a partir da `main` (`git checkout -b minha-feature`).
2. Faça commits pequenos e descritivos.
3. Abra um Pull Request explicando o que mudou e como testar.

Nunca suba chaves ou segredos (`service_role` do Supabase, tokens do Redis, senhas de Wi-Fi): use variáveis de ambiente.

## Equipe

Desenvolvido pela sub-área de **Telemetria** da equipe **Solares** — Universidade Federal do Espírito Santo (UFES).

<p align="center">
  <sub>Feito com ☀️ e muita água salgada.</sub>
</p>
