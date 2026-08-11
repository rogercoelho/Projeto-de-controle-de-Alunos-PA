import PropTypes from "prop-types";

function SessionWarningModal({ open, onClose, onRenew, loading }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-gray-800 border-2 border-yellow-500/60 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex flex-col items-center gap-3 mb-5">
          <div className="w-14 h-14 rounded-full bg-yellow-500/20 border-2 border-yellow-500/60 flex items-center justify-center text-3xl">
            !
          </div>
          <h2 className="text-white font-bold text-lg text-center leading-tight">
            ATENCAO: Acesso ira expirar em 3 minutos
          </h2>
          <p className="text-gray-400 text-sm text-center">
            Deseja renovar sua sessao por mais 1 hora?
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            OK
          </button>
          <button
            type="button"
            onClick={onRenew}
            disabled={loading}
            className="flex-1 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            {loading ? "Renovando..." : "Renovar"}
          </button>
        </div>
      </div>
    </div>
  );
}

SessionWarningModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onRenew: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default SessionWarningModal;
