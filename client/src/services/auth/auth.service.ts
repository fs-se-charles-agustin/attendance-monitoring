const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const handleResponse = async (res: Response) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed: ${res.status}`);
  return data;
};

export const authService = {
  login: (credentials: { email: string; password: string; rememberMe?: boolean }) =>
    fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    }).then(handleResponse),

  signup: (data: { firstName: string; lastName: string; email: string; password: string; requiredOjtHours: number }) =>
    fetch(`${API}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handleResponse),

  verifySignupOtp: (email: string, otp: string) =>
    fetch(`${API}/auth/verify-signup-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    }).then(handleResponse),

  verifyOtp: (email: string, otp: string) =>
    authService.verifySignupOtp(email, otp),

  forgotPassword: (email: string) =>
    fetch(`${API}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).then(handleResponse),

  resetPassword: (token: string, password: string) =>
    fetch(`${API}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    }).then(handleResponse),

  getMe: (token: string) =>
    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(handleResponse),
};