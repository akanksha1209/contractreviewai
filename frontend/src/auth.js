const TOKEN_KEY = "cr_token";
const EMAIL_KEY = "cr_email";

export function saveAuth(token, email) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, email || "");
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getEmail() {
  return localStorage.getItem(EMAIL_KEY) || "";
}

export function isLoggedIn() {
  return !!getToken();
}
