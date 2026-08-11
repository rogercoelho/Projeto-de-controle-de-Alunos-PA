import { useRef } from "react";
import PropTypes from "prop-types";
import {
  dataFormularioValida,
  formatarDataBR,
  formatarDataDigitada,
  normalizarDataISO,
} from "../../utils/Utils";

function DateInput({
  name,
  value,
  onChange,
  required = false,
  className = "",
  disabled = false,
  readOnly = false,
}) {
  const calendarInputRef = useRef(null);
  const dataISO = normalizarDataISO(value);
  const valorOriginal =
    value === undefined || value === null ? "" : String(value);
  const valorTexto = dataISO ? formatarDataBR(dataISO) : valorOriginal;

  const emitirMudanca = (nextValue) => {
    onChange({
      target: {
        name,
        value: nextValue,
        setCustomValidity: () => {},
      },
    });
  };

  const validarCampo = (input, nextValue) => {
    if (!input || typeof input.setCustomValidity !== "function") return;
    const vazio = !String(nextValue || "").trim();
    const completo = String(nextValue || "").length === 10;
    const invalido = !vazio && (!completo || !dataFormularioValida(nextValue));
    input.setCustomValidity(invalido ? "Informe uma data valida." : "");
  };

  const handleTextChange = (e) => {
    const proximoValor = formatarDataDigitada(e.target.value);
    validarCampo(e.target, proximoValor);
    emitirMudanca(proximoValor);
  };

  const handleCalendarChange = (e) => {
    emitirMudanca(e.target.value);
  };

  const abrirCalendario = () => {
    if (disabled || readOnly) return;
    const input = calendarInputRef.current;
    if (!input) return;

    input.focus();
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.click();
  };

  return (
    <div className="grid w-full grid-cols-[minmax(0,1fr)_2.75rem] gap-2 sm:grid-cols-[minmax(0,1fr)_3rem]">
      <input
        type="text"
        name={name}
        value={valorTexto}
        onChange={handleTextChange}
        onBlur={(e) => validarCampo(e.target, e.target.value)}
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        maxLength="10"
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        className={`${className} min-w-0`}
      />
      <div
        className={`relative flex min-h-10 w-11 items-center justify-center rounded-md border border-gray-600 bg-gray-700 text-white transition sm:w-12 ${
          disabled || readOnly
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:bg-gray-600 focus-within:ring-2 focus-within:ring-blue-500"
        }`}
        title="Abrir calendario"
      >
        <button
          type="button"
          onClick={abrirCalendario}
          disabled={disabled || readOnly}
          aria-label="Abrir calendario"
          className="flex h-full w-full items-center justify-center rounded-md disabled:cursor-not-allowed"
        >
          <span className="sr-only">Abrir calendario</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4" />
            <path d="M8 2v4" />
            <path d="M3 10h18" />
          </svg>
        </button>
        <input
          ref={calendarInputRef}
          type="date"
          value={dataISO}
          onChange={handleCalendarChange}
          disabled={disabled || readOnly}
          tabIndex="-1"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0 [color-scheme:dark]"
        />
      </div>
    </div>
  );
}

DateInput.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
};

export default DateInput;
