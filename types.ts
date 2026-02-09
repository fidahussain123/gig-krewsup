
export type Role = 'organizer' | 'worker';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Gig {
  id: string;
  title: string;
  organizerName: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  pay: number;
  type: string;
  description: string;
  requirements: string[];
  status: 'active' | 'urgent' | 'filled' | 'verified';
  image?: string;
}

export interface Event {
  id: string;
  name: string;
  location: string;
  date: string;
  month: string;
  day: string;
  image: string;
  totalSpent?: number;
}
