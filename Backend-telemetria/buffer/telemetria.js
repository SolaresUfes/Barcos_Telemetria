// Iniciar a variável de buffer com nada

let buffer_sensores = {
    potencia: -2,
    tensao: -2,
    corrente: -2,
    corrente_2: -2,
    string_1: -2,
    string_2: -2,
    porcentagem: -2,
    velocidade: -2,
    rpm: -2,
    momento: -2
};

let buffer_celulas = {
    celula: Array(16).fill(-2),
    temperatura: Array(16).fill(-2) 
};

let buffer_alertas  = {
    mensagem: "-2",
    risco: -2,
    codigos: Array(12).fill(-2)
};

// Função responsavel
function atualizar_ult_Sensores(dados_sensores) {
    buffer_sensores = dados_sensores;    
}

function coletar_ult_Sensores() {
    return buffer_sensores;
}


function atualizar_ult_Celulas(dados_celulas) {
    buffer_celulas = dados_celulas;    
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