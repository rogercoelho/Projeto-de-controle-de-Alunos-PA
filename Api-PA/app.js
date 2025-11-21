const express = require("express"); // Criando uma variavel constante para importar o framework Express
const cors = require("cors"); // Importando o pacote CORS para permitir requisições de diferentes origens
const path = require("path"); // Importando path para manipular caminhos de arquivos
//const securityroutes = require("./routes/securityroutes"); // Importando as rotas de segurança
const {
  // Importando o roteador de segurança e o middleware de autenticação
  router: securityroutes, // Renomeando a constante router para securityroutes
  autenticarToken, // Importando o middleware de autenticação
} = require("./routes/securityroutes"); // Importando as rotas de segurança e o middleware de autenticação
const alunosroutes = require("./routes/alunosroutes"); // Importando as rotas de alunos
const adminroutes = require("./routes/adminroutes"); // Importando as rotas de administração
const planosroutes = require("./routes/planosroutes"); // Importando as rotas de planos
const Alunos_Cadastro = require("./models/Alunos_Cadastro"); // Importando o modelo Alunos_Cadastro
const app = express(); // Criando uma variavel constante para iniciar o express

//middlewares basicos
app.use(express.json()); // Configurando o Express para usar JSON
app.use(express.urlencoded({ extended: false })); // Configurando o Express para interpretar dados codificados na URL. true permite objetos aninhados. false não permite.

// Servir arquivos estáticos da pasta uploads
const uploadsPath =
  process.env.NODE_ENV === "production"
    ? "/home2/goutechc/wwwplantandoalegria_API/uploads"
    : path.join(__dirname, "uploads");

console.log(`📁 Servindo arquivos estáticos de: ${uploadsPath}`);
app.use("/uploads", express.static(uploadsPath));

//CORS  - Libera acesso apenas do dominio especificado
//🧰 Inicio - Restringindo o acesso a API apenas para o site especificado
const corsOptions = {
  origin: [
    "https://www.plantandoalegria.com.br",
    "https://plantandoalegria.com.br",
    "http://localhost:5173", // Vite dev server
    "http://localhost:5174", // Vite dev server (porta alternativa)
    "http://127.0.0.1:5173", // Vite dev server alternativo
  ], // Domínios permitidos (com e sem www)
  optionsSuccessStatus: 200, // Alguns navegadores (como o IE11) exigem um status 200 para respostas de pré-voo
  methods: ["GET", "DELETE", "PATCH", "POST"], // Métodos HTTP permitidos
  credentials: true, // Permite envio de cookies e headers de autenticação
};
app.use(cors(corsOptions)); // Aplicando as opções de CORS ao aplicativo Express
//🧰 Fim - Restringindo o acesso a API apenas para o site especificado

// Middleware de verificação de IP
// 🧰 Inicio - Middleware para permitir acesso apenas de IPs autorizados
function verificarIP(req, res, next) {
  // Middleware para verificar o IP do cliente
  const ipCliente = req.ip.replace("::ffff:", ""); // Obtendo o IP do cliente e removendo o prefixo IPv6 se presente
  const ipsPermitidos = ["127.0.0.1", "::1", "51.222.94.140", "localhost"]; // Lista de IPs permitidos (adicione os IPs autorizados aqui)

  // Obtém o IP real do cliente considerando proxy/load balancer
  const realIP =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    ipCliente;

  console.log(
    `📍 Tentativa de acesso de IP: ${realIP} (Original: ${ipCliente})`
  );

  // Se o IP é localhost ou 127.x.x.x, permite (requisições internas do servidor)
  if (
    ipCliente.startsWith("127.") ||
    realIP.startsWith("127.") ||
    ipCliente === "::1" ||
    realIP === "::1"
  ) {
    console.log(`✅ Acesso local permitido: ${realIP}`);
    return next();
  }

  if (!ipsPermitidos.includes(ipCliente) && !ipsPermitidos.includes(realIP)) {
    // Verificando se o IP do cliente está na lista de permitidos
    console.log(`🤬Tentativa de acesso não autorizado de: ${realIP}`); // Log de tentativa de acesso não autorizado
    return res
      .status(403) // Retornando status 403 Forbidden
      .json({
        message:
          " 🤬 Acesso negado: IP não autorizado. 🤬 Está querendo xeretar oquê aqui???",
      }); // Mensagem de erro personalizada
  }

  next(); // Se o IP for permitido, prosseguir para a próxima função de middleware ou rota
}

app.use(verificarIP); // Usando o middleware de verificação de IP para todas as rotas

// ROTAS -- Rotas da API

// Rota publica para autenticação (login)
app.use("/auth", securityroutes); // rotas de autenticação (ex: /auth/login)

// rotas protegidas (só acessa quem tiver token válido)
app.use("/alunos", autenticarToken, alunosroutes);
app.use("/admin", autenticarToken, adminroutes);
app.use("/planos", autenticarToken, planosroutes);

//Bloqueeia acesso a rota raiz
app.get("/", (req, res) => {
  res.status(403).json({
    // Retornando status 403 Forbidden
    message:
      "🤬 Acesso à rota raiz é proibido. Tá querendo xeretar o quê aqui??? 🤬",
  });
});

// SERVIDOR -- Inicializando o servidor

// Iniciando o servidor escutando na porta 8081
app.listen(8081, () => {
  // Iniciando o servidor na porta 8081
  console.log("Servidor rodando na url http://localhost:8081"); // Mensagem que aparece no terminal quando o servidor é iniciado.
});
