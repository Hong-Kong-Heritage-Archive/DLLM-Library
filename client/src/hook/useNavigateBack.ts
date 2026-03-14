import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Returns a back-navigation function that is SSR-aware.
 * If the user arrived via SSR or external link (no prior same-origin history),
 * it navigates to `fallbackPath` instead of going back.
 */
export function useNavigateBack(fallbackPath: string = "/") {
  const navigate = useNavigate();

  return useCallback(() => {
    // React Router v6 stores an index in history.state.
    // idx === 0 means this is the session entry point (SSR redirect / direct access).
    const hasPreviousPage =
      window.history.state && window.history.state.idx > 0;
    if (hasPreviousPage) {
      navigate(-1);
    } else {
      navigate(fallbackPath, { replace: true });
    }
  }, [navigate, fallbackPath]);
}
