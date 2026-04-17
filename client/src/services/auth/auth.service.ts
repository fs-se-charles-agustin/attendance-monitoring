import { api } from "../api/api";

export interface LoginPayLoad{
    email: string;
    password: string;
}

export interface SignupPayLoad{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

export interface ForgotPasswordPayload {
    email: string;
}

export interface ResetPasswordPayload {
    token: string;
    password: string;
}

export const authService = {
    login: async (payload: LoginPayLoad & { rememberMe?: boolean }) => {
        return api("/auth/login", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    signup: async (payload: SignupPayLoad) => {
        return api("/auth/signup", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    forgotPassword: async (email: string) => {
        return api("/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify({ email }),
        });
    },

    resetPassword: async (token: string, password: string) => {
        return api("/auth/reset-password", {
            method: "POST",
            body: JSON.stringify({ token, password }),
        });
    },

    verifySignupOtp: async (email: string, otp: string) => {
        return api("/auth/verify-signup-otp", {
            method: "POST",
            body: JSON.stringify({ email, otp }),
        });
    },
}