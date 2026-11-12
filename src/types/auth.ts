/** Admin identity derived from a verified Firebase session cookie. */
export interface AdminSession {
  uid: string;
  email: string | null;
  name: string | null;
  picture: string | null;
  /** Session cookie expiry (unix seconds). */
  exp: number;
}
