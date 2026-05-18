export interface LoginActionState {
  error: string | null;
}

export interface ChangePasswordActionState {
  error: string | null;
  success: string | null;
}

export const initialLoginActionState: LoginActionState = {
  error: null,
};

export const initialChangePasswordActionState: ChangePasswordActionState = {
  error: null,
  success: null,
};
