import React, { useState } from "react";
import PropTypes from "prop-types";

// Skeleton/placeholder para foto do aluno
function StudentPhotoSkeleton({ foto, nome }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  if (!foto || error) {
    return (
      <div className="w-48 h-48 flex items-center justify-center bg-transparent rounded-md border-2 border-gray-300">
        <img
          src="/controle_pa/logo.png"
          alt="Logo placeholder"
          className="w-24 h-24 object-contain opacity-60"
        />
      </div>
    );
  }

  // Pré-carregamento em segundo plano
  // Cache busting para garantir recarregamento da imagem
  const cacheBuster = React.useRef(Date.now());
  React.useEffect(() => {
    cacheBuster.current = Date.now();
    if (!foto) return;
    const img = new window.Image();
    img.src = `https://api2.plantandoalegria.com.br/uploads/fotos/${foto}?t=${cacheBuster.current}`;
    img.onload = () => setLoaded(true);
    img.onerror = () => setError(true);
    // eslint-disable-next-line
  }, [foto]);

  return (
    <div className="w-48 h-48 relative" style={{ background: "transparent" }}>
      {loaded && !error && (
        <img
          src={`https://api2.plantandoalegria.com.br/uploads/fotos/${foto}?t=${cacheBuster.current}`}
          alt={nome}
          className="w-48 h-48 object-contain rounded-md border-2 border-gray-300"
          style={{ zIndex: 1, position: "relative", background: "transparent" }}
        />
      )}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black rounded-md z-10 animate-pulse">
          <img
            src="/controle_pa/logo.png"
            alt="Logo placeholder"
            className="w-24 h-24 object-contain opacity-60"
          />
        </div>
      )}
    </div>
  );
}

function StudentDetails({ aluno, onEdit, onToggleSituacao, onBack }) {
  if (!aluno) return null;
  return (
    <div className="w-full h-auto space-y-2 mx-auto">
      <div className="flex gap-2 mb-4">
        <button
          onClick={onBack}
          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
        >
          ← Voltar para Pesquisa
        </button>
        <button
          onClick={onEdit}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          ✏️ Editar
        </button>
        <button
          onClick={onToggleSituacao}
          className={`text-white px-4 py-2 rounded-md ${
            aluno.Alunos_Situacao === "Ativo"
              ? "bg-orange-600 hover:bg-orange-700"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {aluno.Alunos_Situacao === "Ativo" ? "⛔ Desativar" : "✅ Ativar"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-center">
        <label className="font-bold">Foto:</label>
        <div className="flex flex-col gap-2">
          <StudentPhotoSkeleton
            foto={aluno.Alunos_Foto}
            nome={aluno.Alunos_Nome}
          />
          {aluno.Alunos_Foto && (
            <span className="text-xs text-gray-500">
              Arquivo: {aluno.Alunos_Foto}
            </span>
          )}
        </div>
      </div>

      {aluno.Alunos_Contrato &&
      typeof aluno.Alunos_Contrato === "string" &&
      aluno.Alunos_Contrato.trim() !== "" &&
      aluno.Alunos_Contrato.trim().toLowerCase() !== "null" &&
      aluno.Alunos_Contrato.trim().toLowerCase() !== "undefined" ? (
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-center">
          <label className="font-bold">Contrato:</label>
          <a
            href={`https://api2.plantandoalegria.com.br/uploads/contratos/${aluno.Alunos_Contrato}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 underline"
          >
            📄 Ver Contrato
          </a>
        </div>
      ) : null}

      <div className="bg-gray-800 rounded-xl p-4 space-y-3">
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Situação:</div>
          <div
            className={`font-semibold ${
              aluno.Alunos_Situacao === "Ativo"
                ? "text-green-400"
                : "text-orange-400"
            }`}
          >
            {aluno.Alunos_Situacao}
          </div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Código do Aluno:</div>
          <div>{aluno.Alunos_Codigo}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Nome Completo:</div>
          <div>{aluno.Alunos_Nome}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">CPF:</div>
          <div>{aluno.Alunos_CPF}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Nome do Responsável:</div>
          <div>{aluno.Alunos_Nome_Responsavel}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">CEP:</div>
          <div>{aluno.Alunos_Endereco_CEP}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Endereço:</div>
          <div>{aluno.Alunos_Endereco}</div>
        </div>
        {aluno.Alunos_Endereco_Complemento && (
          <div className="text-sm md:text-base">
            <div className="font-bold text-gray-400">Complemento:</div>
            <div>{aluno.Alunos_Endereco_Complemento}</div>
          </div>
        )}
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Bairro:</div>
          <div>{aluno.Alunos_Endereco_Bairro}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Localidade:</div>
          <div>{aluno.Alunos_Endereco_Localidade}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Cidade:</div>
          <div>{aluno.Alunos_Endereco_Cidade}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Estado:</div>
          <div>{aluno.Alunos_Endereco_Estado}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Telefone:</div>
          <div>{aluno.Alunos_Telefone}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Email:</div>
          <div>{aluno.Alunos_Email}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Contato de Emergência:</div>
          <div>{aluno.Alunos_Contato_Emergencia}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Telefone Emergência 1:</div>
          <div>{aluno.Alunos_Telefone_Emergencia_1}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Telefone Emergência 2:</div>
          <div>
            {aluno.Alunos_Telefone_Emergencia_2 || (
              <span className="text-gray-500 italic">Não informado</span>
            )}
          </div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Data de Matrícula:</div>
          <div>
            {aluno.Alunos_Data_Matricula ? (
              new Date(aluno.Alunos_Data_Matricula).toLocaleDateString("pt-BR")
            ) : (
              <span className="text-gray-500 italic">Não informada</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDetails;

StudentDetails.propTypes = {
  aluno: PropTypes.shape({
    Alunos_Codigo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    Alunos_Nome: PropTypes.string,
    Alunos_CPF: PropTypes.string,
    Alunos_Data_Nascimento: PropTypes.string,
    Alunos_Nome_Responsavel: PropTypes.string,
    Alunos_CPF_Responsavel: PropTypes.string,
    Alunos_Endereco_CEP: PropTypes.string,
    Alunos_Endereco: PropTypes.string,
    Alunos_Endereco_Complemento: PropTypes.string,
    Alunos_Endereco_Bairro: PropTypes.string,
    Alunos_Endereco_Localidade: PropTypes.string,
    Alunos_Endereco_Cidade: PropTypes.string,
    Alunos_Endereco_Estado: PropTypes.string,
    Alunos_Telefone: PropTypes.string,
    Alunos_Email: PropTypes.string,
    Alunos_Contato_Emergencia: PropTypes.string,
    Alunos_Telefone_Emergencia_1: PropTypes.string,
    Alunos_Telefone_Emergencia_2: PropTypes.string,
    Alunos_Data_Matricula: PropTypes.string,
    Alunos_Situacao: PropTypes.string,
    Alunos_Foto: PropTypes.string,
    Alunos_Contrato: PropTypes.string,
  }),
  onEdit: PropTypes.func,
  onToggleSituacao: PropTypes.func,
  onBack: PropTypes.func,
};
