export interface IUser {
  name: string;
  email: string;
  password: string;
  verified: boolean;
  verificationCode?: string;
  verificationCodeValidation?: number;
  forgotPasswordCode?: string;
  forgotPasswordCodeValidation?: number;
}
