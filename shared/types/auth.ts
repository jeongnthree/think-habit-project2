// Google OAuth 관련 타입 정의
export interface GoogleAuthResponse {
  access_token: string;
  id_token: string;
  scope: string;
  token_type: string;
  expires_in: number;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: 'email' | 'google';
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface GoogleOAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string[];
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
  error: string | null;
}
