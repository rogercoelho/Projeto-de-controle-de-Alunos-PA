import React, { useState } from "react";
import PropTypes from "prop-types";

function PhotoSkeleton({ foto, nome }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [cacheBuster, setCacheBuster] = useState(() => Date.now());

  // Detecta se é uma URL local (blob) ou nome de arquivo
  const isBlob = foto && foto.startsWith("blob:");
  const imgSrc = isBlob
    ? foto
    : foto
    ? `https://api2.plantandoalegria.com.br/uploads/fotos/${foto}?t=${cacheBuster}`
    : "";

  React.useEffect(() => {
    setLoaded(false);
    setError(false);
    setCacheBuster(Date.now());
    if (!foto) return;
    const img = new window.Image();
    if (isBlob) {
      img.src = foto;
    } else {
      img.src = `https://api2.plantandoalegria.com.br/uploads/fotos/${foto}?t=${Date.now()}`;
    }
    img.onload = () => setLoaded(true);
    img.onerror = () => setError(true);
  }, [foto]);

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
  return (
    <div className="w-48 h-48 relative" style={{ background: "transparent" }}>
      {loaded && !error && (
        <img
          src={imgSrc}
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

PhotoSkeleton.propTypes = {
  foto: PropTypes.string,
  nome: PropTypes.string,
};
export default PhotoSkeleton;
