import { getToken, clearAuth } from "./auth";

const BASE = import.meta.env.VITE_API_URL || "/api";

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res) {
  if (res.status === 401) {
    clearAuth();
    throw new Error("Session expired. Please log in again.");
  }
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg = (data && (data.detail || data.error)) || res.statusText;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

export async function register(email, password) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handle(res);
}

export async function login(email, password) {
  const form = new URLSearchParams();
  form.append("grant_type", "password");
  form.append("username", email);
  form.append("password", password);
  form.append("scope", "");
  form.append("client_id", "");
  form.append("client_secret", "");

  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  return handle(res);
}

export async function analyzeContract(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/analyze`, { method: "POST", body: form });
  return handle(res);
}

export async function uploadContract(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/upload`, {
    method: "POST",
    headers: { ...authHeaders() },
    body: form,
  });
  return handle(res);
}

export async function listDocuments() {
  const res = await fetch(`${BASE}/documents`, {
    headers: { ...authHeaders() },
  });
  return handle(res);
}

export async function getDocument(id) {
  const res = await fetch(`${BASE}/documents/${id}`, {
    headers: { ...authHeaders() },
  });
  return handle(res);
}

export async function deleteDocument(id) {
  const res = await fetch(`${BASE}/documents/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handle(res);
}
