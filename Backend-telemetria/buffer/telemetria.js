// Iniciar a variável de buffer com nada
const SEM_DADOS = -2

let buffer_sensores = SEM_DADOS;
let buffer_celulas  = SEM_DADOS;
let buffer_alertas  = SEM_DADOS;

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