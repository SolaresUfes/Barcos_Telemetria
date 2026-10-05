const redis = require("../redis");

const SEM_DADOS = -2

// Iniciar a variável de buffer com nada
// let buffer_sensores = [{
//     potencia: SEM_DADOS,
//     tensao: SEM_DADOS,
//     corrente: SEM_DADOS,
//     corrente_2: SEM_DADOS,
//     string_1: SEM_DADOS,
//     string_2: SEM_DADOS,
//     porcentagem: SEM_DADOS,
//     velocidade: SEM_DADOS,
//     rpm: SEM_DADOS,
//     momento: SEM_DADOS
// }];

const CHAVE_SENSORES = "telemetria:sensores";

let buffer_celulas = [{
    celula: Array(16).fill(SEM_DADOS),
    temperatura: Array(16).fill(SEM_DADOS) 
}];

let buffer_alertas  = [{
    mensagem: "SEM_DADOS",
    risco: SEM_DADOS,
    codigos: Array(12).fill(SEM_DADOS)
}];

// Função responsavel
// function atualizar_ult_Sensores(dados_sensores) { 
//     buffer_sensores[0] = {
//         ...buffer_sensores[0],
//         ...dados_sensores
//     };
// }

// function coletar_ult_Sensores() {
//     return buffer_sensores;
// }

// async function atualizar_ult_Sensores(dados_sensores) {
//     await redis.set(CHAVE_SENSORES, dados_sensores);
// }

async function atualizar_ult_Sensores(dados_sensores) {
    const dados = {
        ...dados_sensores,
        potencia: dados_sensores.tensao * dados_sensores.corrente
    };

    await redis.set(CHAVE_SENSORES, dados);
}

async function coletar_ult_Sensores() {
    const dados = await redis.get(CHAVE_SENSORES);

    if (dados === null) {
        return [{
            potencia: SEM_DADOS,
            tensao: SEM_DADOS,
            corrente: SEM_DADOS,
            corrente_2: SEM_DADOS,
            string_1: SEM_DADOS,
            string_2: SEM_DADOS,
            porcentagem: SEM_DADOS,
            velocidade: SEM_DADOS,
            rpm: SEM_DADOS,
            momento: SEM_DADOS
        }];
    }

    return [dados];
}


function atualizar_ult_Celulas(dados_celulas) { 
    buffer_celulas = [{
        celula: dados_celulas.cells,
        temperatura: Array(16).fill(SEM_DADOS) // MODIFICAR QUANDO ENVIAR TEMPERATURA!!!!
    }];
}

function coletar_ult_Celulas() {
    return buffer_celulas;
}


function atualizar_ult_Alertas(dados_alertas) {
    buffer_alertas = dados_alertas;    
}

function coletar_ult_Alertas() {
    return buffer_alertas;
}

module.exports = {
    atualizar_ult_Sensores,
    coletar_ult_Sensores,

    atualizar_ult_Celulas,
    coletar_ult_Celulas,

    atualizar_ult_Alertas,
    coletar_ult_Alertas
}