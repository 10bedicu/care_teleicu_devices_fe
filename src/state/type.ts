export interface JwtTokenObtainPair {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export type LoginResponse = JwtTokenObtainPair | MfaAuthenticationToken;

/** MFA related types */

export type MfaMethod = "totp" | "backup";

export interface MfaLoginRequest {
  method: MfaMethod;
  code: string;
  temp_token: string;
}

export interface MfaAuthenticationToken {
  temp_token: string;
}

export interface TokenData {
  token: string;
  phoneNumber: string;
  createdAt: string;
}
