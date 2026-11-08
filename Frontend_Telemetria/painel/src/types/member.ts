export interface Member {
  id: number;
  email: string;
  name: string;
  mainRole: string;
  isModerador: boolean;
  photo: string;
  isOnline?: boolean;
  lastSeen?: string;
}
