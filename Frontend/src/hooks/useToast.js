import { useState, useCallback } from "react";

export default function useToast(timeout = 4000) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback(
    (toastObj) => {
      setToast(toastObj);
      setTimeout(() => setToast(null), timeout);
    },
    [timeout]
  );

  return [toast, showToast];
}
