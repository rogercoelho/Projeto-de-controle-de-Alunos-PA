import PropTypes from "prop-types";

function MessageToast({ messageToast }) {
  if (!messageToast || !messageToast.text) return null;

  let bgColor = "bg-yellow-600";
  if (messageToast.type === "success") bgColor = "bg-green-600";
  else if (messageToast.type === "error") bgColor = "bg-red-600";

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-2 rounded text-white shadow-lg ${bgColor}`}
      style={{ minWidth: 200, textAlign: "center" }}
    >
      {messageToast.text}
    </div>
  );
}

MessageToast.propTypes = {
  messageToast: PropTypes.shape({
    type: PropTypes.string,
    text: PropTypes.string,
  }),
};

export default MessageToast;
