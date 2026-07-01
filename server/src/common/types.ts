import { Role } from './enums';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: Role;
}
