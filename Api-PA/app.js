const express = require("express"); // Criando uma variavel constante para importar o framework Express
const cors = require("cors"); // Importando o pacote CORS para permitir requisicoes de diferentes origens
const path = require("path"); // Importando path para manipular caminhos de arquivos
//const securityroutes = require("./routes/securityroutes"); // Importando as rotas de seguranca
const {
  // Importando o roteador de seguranca e o middleware de autenticacao
  router: securityroutes, // Renomeando a constante router para securityroutes
  autenticarToken, // Importando o middleware de autenticacao
} = require("./routes/securityroutes"); // Importando as rotas de seguranca e o middleware de autenticacao
const alunosroutes = require("./routes/alunosroutes"); // Importando as rotas de alunos
const adminroutes = require("./routes/adminroutes"); // Importando as rotas de administracao
const planosroutes = require("./routes/planosroutes"); // Importando as rotas de planos
const faturamentoroutes = require("./routes/faturamentoroutes");
const presencaroutes = require("./routes/presencaroutes");
const horarioroutes = require("./routes/horarioroutes"); // Importando as rotas de horários
const agendamentoroutes = require("./routes/agendamentoroutes"); // Importando as rotas de agendamento
const app = express(); // Criando uma variavel constante para iniciar o express

//middlewares basicos
app.use(express.json()); // Configurando o Express para usar JSON
app.use(express.urlencoded({ extended: false })); // Configurando o Express para interpretar dados codificados na URL. true permite objetos aninhados. false nao permite.

// Servir arquivos estaticos da pasta uploads
const uploadsPath =
  process.env.NODE_ENV === "production"
    ? "/home2/goutechc/wwwplantandoalegria_API/uploads"
    : path.join(__dirname, "uploads");

console.log(`Servindo arquivos estaticos de: ${uploadsPath}`);
app.use("/uploads", express.static(uploadsPath));

//CORS  - Libera acesso apenas do dominio especificado
// Inicio - Restringindo o acesso a API apenas para o site especificado
const corsOptions = {
  origin: [
    "https://www.plantandoalegria.com.br",
    "https://plantandoalegria.com.br",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
  ], // Dominios permitidos (com e sem www)
  methods: ["GET", "DELETE", "PATCH", "POST"], // Metodos HTTP permitidos
  credentials: true, // Permite envio de cookies e headers de autenticacao
  optionsSuccessStatus: 200, // Alguns navegadores (como o IE11) exigem um status 200 para respostas de pre-voo
};
app.use(cors(corsOptions)); // Aplicando as opcoes de CORS ao aplicativo Express
// Fim - Restringindo o acesso a API apenas para o site especificado

// Middleware de verificacao de IP
// Inicio - Middleware para permitir acesso apenas de IPs autorizados
function verificarIP(req, res, next) {
  // Middleware para verificar o IP do cliente
  const ipCliente = req.ip.replace("::ffff:", ""); // Obtendo o IP do cliente e removendo o prefixo IPv6 se presente
  const ipsPermitidos = ["127.0.0.1", "::1", "51.222.94.140", "localhost"]; // Lista de IPs permitidos (adicione os IPs autorizados aqui)

  // Obtem o IP real do cliente considerando proxy/load balancer
  const realIP =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    ipCliente;

  console.log(
    `[IP] Tentativa de acesso de IP: ${realIP} (Original: ${ipCliente})`,
  );

  // Se o IP e localhost ou 127.x.x.x, permite (requisicoes internas do servidor)
  if (
    ipCliente.startsWith("127.") ||
    realIP.startsWith("127.") ||
    ipCliente === "::1" ||
    realIP === "::1"
  ) {
    console.log(`Acesso local permitido: ${realIP}`);
    return next();
  }

  if (!ipsPermitidos.includes(ipCliente) && !ipsPermitidos.includes(realIP)) {
    // Verificando se o IP do cliente esta na lista de permitidos
    console.log(`Tentativa de acesso nao autorizado de: ${realIP}`); // Log de tentativa de acesso nao autorizado
    return res
      .status(403) // Retornando status 403 Forbidden
      .json({
        message:
          "Acesso negado: IP nao autorizado. Esta querendo xeretar o que aqui???",
      }); // Mensagem de erro personalizada
  }

  next(); // Se o IP for permitido, prosseguir para a proxima funcao de middleware ou rota
}

//comentado para nao bloquear geral -->app.use(verificarIP); // Usando o middleware de verificacao de IP para todas as rotas

// ROTAS -- Rotas da API

// Rota publica para autenticacao (login)
app.use("/auth", securityroutes); // rotas de autenticacao (ex: /auth/login)

// rotas protegidas (so acessa quem tiver token valido)

app.use("/alunos", autenticarToken, alunosroutes);
app.use("/admin", autenticarToken, adminroutes);
app.use("/planos", autenticarToken, planosroutes);
app.use("/faturamento", autenticarToken, faturamentoroutes);
app.use("/presenca", autenticarToken, presencaroutes);
app.use("/horarios", autenticarToken, horarioroutes);
app.use("/agendamentos", autenticarToken, agendamentoroutes);

//Bloqueeia acesso a rota raiz
app.get("/", (req, res) => {
  res.status(403).json({
    // Retornando status 403 Forbidden
    message: "Acesso a rota raiz e proibido. Ta querendo xeretar o que aqui???",
  });
});

// SERVIDOR -- Inicializando o servidor

// Iniciando o servidor escutando na porta 8081
app.listen(8081, () => {
  // Iniciando o servidor na porta 8081
  console.log("Servidor rodando na url http://localhost:8081"); // Mensagem que aparece no terminal quando o servidor e iniciado.
});
