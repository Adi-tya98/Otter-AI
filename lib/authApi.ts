import { DEFAULT_BACKEND_URL } from "./api";

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface AuthErrorResponse {
  detail: string | { msg: string }[];
}

/**
 * Register a new user with email, password, and optional full name.
 */
export async function signupApi(
  email: string,
  password: string,
  fullName?: string,
  backendUrl: string = DEFAULT_BACKEND_URL
): Promise<AuthResponse> {
  const res = await fetch(`${backendUrl}/api/v1/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      full_name: fullName?.trim() || undefined,
    }),
  });

  if (!res.ok) {
    let errorMsg = "Registration failed";
    try {
      const errJson = await res.json();
      if (typeof errJson.detail === "string") {
        errorMsg = errJson.detail;
      } else if (Array.isArray(errJson.detail)) {
        errorMsg = errJson.detail.map((e: any) => e.msg || JSON.stringify(e)).join(", ");
      }
    } catch {
      errorMsg = await res.text() || res.statusText;
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

/**
 * Log in an existing user with email and password.
 */
export async function loginApi(
  email: string,
  password: string,
  backendUrl: string = DEFAULT_BACKEND_URL
): Promise<AuthResponse> {
  const res = await fetch(`${backendUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!res.ok) {
    let errorMsg = "Login failed";
    try {
      const errJson = await res.json();
      if (typeof errJson.detail === "string") {
        errorMsg = errJson.detail;
      } else if (Array.isArray(errJson.detail)) {
        errorMsg = errJson.detail.map((e: any) => e.msg || JSON.stringify(e)).join(", ");
      }
    } catch {
      errorMsg = await res.text() || res.statusText;
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

/**
 * Fetch current user profile using JWT token.
 */
export async function fetchCurrentUserApi(
  token: string,
  backendUrl: string = DEFAULT_BACKEND_URL
): Promise<UserProfile> {
  const res = await fetch(`${backendUrl}/api/v1/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Session expired or invalid (HTTP ${res.status})`);
  }

  return res.json();
}
