# Backup Portatil - Registrar Presenca

Este pacote contem a funcionalidade de registro de presenca para reaproveitar em outro projeto.

## Estrutura

- `Frontend/src/components/Attendance/RegistrarPresenca.jsx`
- `Api-PA/models/Alunos_Presenca.js`
- `Api-PA/routes/presencaroutes.js`

## Como usar no novo projeto

1. Copie os 3 arquivos para caminhos equivalentes no projeto novo.
2. No backend, registre a rota de presenca no `app.js`:

```js
const presencaroutes = require("./routes/presencaroutes");
app.use("/presenca", autenticarToken, presencaroutes);
```

3. Garanta que o modelo de alunos exista com os campos:
- `Alunos_Codigo`
- `Alunos_Nome`
- `Alunos_Situacao`

4. No frontend, importe e renderize o componente:

```jsx
import RegistrarPresenca from "./components/Attendance/RegistrarPresenca";
```

5. O componente usa estes utilitarios do projeto atual:
- `api` em `src/services/api`
- `useToast` em `src/hooks/useToast`
- `MessageToast` em `src/components/miscellaneous/MessageToast`

Se o novo projeto nao tiver esses utilitarios, adapte os imports e chamadas.

## Recursos incluidos

- Selecao de aluno ativo (codigo + nome)
- Calendario por competencia (`Mes / Ano`) com navegacao
- Ciclo de clique por dia:
  - `Presente` -> `Ausente` -> `Reposicao` -> `Aula Realizada` -> `Nenhum`
- Modal obrigatorio para informar a falta em dias de reposicao
- Validacoes de negocio no backend:
  - reposicao exige data de referencia
  - data de referencia deve estar como ausente
  - nao permite reposicao para dia marcado como aula realizada
- Salvamento em lote (create/update por dia)

## Observacao

O modelo `Alunos_Presenca.js` executa `sync({ force: false })`.  
Se seu ambiente usa migracoes, converta o modelo para migration antes de producao.

