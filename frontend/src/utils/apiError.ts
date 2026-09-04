import toast from "react-hot-toast";

/**
 * Call this after any authenticated fetch to handle error responses.
 * If the response is 401 (expired/invalid token), shows a friendly message
 * and optionally opens the login modal.
 *
 * Usage:
 *   const data = await res.json();
 *   if (!res.ok) { handleApiError(res.status, data, openLoginModal); return; }
 *
 * @param status       HTTP status code from the response
 * @param data         Parsed JSON body from the response
 * @param openLogin    Optional callback to open the login modal
 * @returns            true if the error was handled (caller should return/abort), false otherwise
 */
export function handleApiError(
  status: number,
  data: { error?: string } | null,
  openLogin?: () => void
): boolean {
  if (status === 401) {
    toast.error("Session expired. Please log in and try again.", {
      duration: 4000,
      style: {
        border: "1px solid #f97316",
        padding: "14px 16px",
        color: "#f97316",
        fontWeight: "bold",
        borderRadius: "12px",
        background: "#fff",
      },
    });
    if (openLogin) openLogin();
    return true;
  }

  // For all other errors, show the server message (already friendly after our backend fix)
  if (data?.error) {
    toast.error(data.error);
  }
  return false;
}
