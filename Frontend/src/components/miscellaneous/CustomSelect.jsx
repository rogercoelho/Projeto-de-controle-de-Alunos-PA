import { useState, useRef, useEffect } from "react";

function CustomSelect({
  name,
  value,
  onChange,
  options,
  placeholder = "Selecione uma opção",
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Encontra o label da opção selecionada
  const selectedOption = options.find(
    (opt) => String(opt.value) === String(value)
  );
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Input hidden para validação do form */}
      <input type="hidden" name={name} value={value} required={required} />

      {/* Botão que abre o dropdown */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex justify-between items-start gap-2"
      >
        <span className={value ? "text-white" : "text-gray-400"}>
          {displayText}
        </span>
        <svg
          className={`w-4 h-4 mt-1 shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown com quebra de linha */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto border border-gray-600">
          {/* Opção placeholder */}
          <div
            onClick={() => handleSelect("")}
            className="px-4 py-2 text-gray-400 hover:bg-gray-600 cursor-pointer"
          >
            {placeholder}
          </div>
          {/* Opções */}
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`px-4 py-2 cursor-pointer hover:bg-gray-600 ${
                String(option.value) === String(value)
                  ? "bg-blue-600 text-white"
                  : "text-white"
              }`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomSelect;
