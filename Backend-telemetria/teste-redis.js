const redis = require("./redis");

async function testar() {
    await redis.set("teste:telemetria", "Redis funcionando!");

    const resultado = await redis.get("teste:telemetria");

    console.log("Resultado:", resultado);
}

testar();