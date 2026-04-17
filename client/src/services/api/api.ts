const API_URL = import.meta.env.VITE_API_URL;

export const api = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  });

  const data = await res.json().catch(() => ({})); // parse JSON once

  if (!res.ok) {
    throw new Error(data.message || `HTTP error! status: ${res.status}`);
  }

  return data;
};
