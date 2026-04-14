import { useContext } from "react";

import { UserBase } from "@/lib/types/common";

import {
  LoginRequest,
  LoginResponse,
  MfaLoginRequest,
  TokenData,
} from "@/state/type";

export interface AuthContextType {
  user: UserBase | undefined;
  signIn: (creds: LoginRequest) => Promise<LoginResponse>;
  verifyMFA: (data: MfaLoginRequest) => Promise<LoginResponse>;
  isAuthenticating: boolean;
  isVerifyingMFA: boolean;
  signOut: () => Promise<void>;
  patientLogin: (tokenData: TokenData, redirectUrl: string) => void;
  patientToken: TokenData | null;
}

export const AuthUserContext = window.AuthUserContext;

export const useAuthContext = () => {
  const ctx = useContext(AuthUserContext);
  if (!ctx) {
    throw new Error(
      "'useAuthContext' must be used within 'AuthUserProvider' only",
    );
  }
  return ctx;
};

export default function useAuthUser() {
  const user = useAuthContext().user;
  if (!user) {
    throw new Error("'useAuthUser' must be used within 'AppRouter' only");
  }
  return user;
}
