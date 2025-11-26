import React from "react";

function Classes() {
  return (
    <>
      <ul className="flex flex-wrap gap-0">
        <li className="bg-emerald-600 rounded-2xl p-2 border-2 border-gray-300 m-1">
          Cadastrar Aula
        </li>
        <li className="bg-emerald-600 rounded-2xl p-2 border-2 border-gray-300 m-1">
          Editar Aula
        </li>
        <li className="bg-emerald-600 rounded-2xl p-2 border-2 border-gray-300 m-1">
          Deletar Aula
        </li>
        <li className="bg-emerald-600 rounded-2xl p-2 border-2 border-gray-300 m-1">
          Pesquisar Aula
        </li>
      </ul>
    </>
  );
}

export default Classes;
