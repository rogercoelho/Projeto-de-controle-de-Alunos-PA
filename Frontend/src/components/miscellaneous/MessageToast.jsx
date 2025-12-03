import PropTypes from "prop-types";

function MessageToast({ messageToast }) {
  if (!messageToast || !messageToast.text) return null;

  let bgColor = "bg-yellow-100 text-yellow-700 border-yellow-500";
  if (messageToast.type === "success")
    bgColor = "bg-green-100 text-green-700 border-green-500";
  else if (messageToast.type === "error")
    bgColor = "bg-red-100 text-red-700 border-red-500";

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 p-4 rounded-md shadow-lg max-w-md w-auto border-2 ${bgColor}`}
      //style={{ minWidth: 200, textAlign: "center" }}
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
