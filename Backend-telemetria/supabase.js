// Cria a conexão com o supabase
const { createClient } = require("@supabase/supabase-js");

// Dados pra cadastro no Supabase
const supabase_url = process.env.SUPABASE_URL;
const supabase_key = process.env.SUPABASE_ANON_KEY;

// Cria o cliente (objeto que referencia ao cliente 'Supabase').
const supabase = createClient(supabase_url, supabase_key);


module.exports = supabase;