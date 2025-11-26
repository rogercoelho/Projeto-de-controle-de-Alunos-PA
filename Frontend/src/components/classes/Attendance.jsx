import React from "react";

function Attendance() {
  return (
    <>
      <ul className="flex flex-wrap gap-0">
        <li className="bg-emerald-600 rounded-2xl p-2 border-2 border-gray-300 m-1">
          Cadastrar Frequencia
        </li>
        <li className="bg-emerald-600 rounded-2xl p-2 border-2 border-gray-300 m-1">
          Editar Frequencia
        </li>
        <li className="bg-emerald-600 rounded-2xl p-2 border-2 border-gray-300 m-1">
          Deletar Frequencia
        </li>
        <li className="bg-emerald-600 rounded-2xl p-2 border-2 border-gray-300 m-1">
          Pesquisar Frequencia
        </li>
      </ul>
    </>
  );
}

export default Attendance;
