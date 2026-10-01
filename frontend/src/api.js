// Backend address. Set VITE_API_URL in a .env file to change it.
export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

// Calls an API endpoint and sends the login session cookie with it
export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_URL}/api/${path}`, {
    credentials: "include",
    ...options,
  });

  // Session expired: forget the saved user and go to the Login page
  if (response.status === 401 && localStorage.getItem("user")) {
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  return response;
}

// Sends JSON data to an API endpoint with POST
export function apiPost(path, body = {}) {
  return apiFetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

// Development only: the backend does not send real emails (mail_mode "log"),
// so it returns the link from the email and we offer to open it.
// Returns true when the user chose to open the link.
export function openDevLink(data, navigate) {
  if (!data.dev_link) {
    return false;
  }

  const open = window.confirm(
    "Development mode: no real email is sent.\n\n" +
      "Click OK to open the link from the email now."
  );

  if (open) {
    const url = new URL(data.dev_link);
    navigate(url.pathname + url.search);
  }

  return open;
}
