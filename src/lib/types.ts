export type MembershipType = "ON" | "MF" | "MR" | "MP" | "A";
export type MembershipStatus = "pending" | "approved" | "rejected";
export type CompetitionInterest = "yes" | "no";
export type PreferredPosition =
  | "setter"
  | "outside_hitter"
  | "opposite"
  | "middle_blocker"
  | "libero";

export interface Player {
  id: string;
  auth_user_id: string | null;
  email: string | null;
  name: string;
  nickname: string | null;
  birth_date: string;
  address: string;
  city_area: string;
  preferred_position: PreferredPosition | null;
  membership_type: MembershipType;
  membership_status: MembershipStatus;
  competition_interest: CompetitionInterest;
  notes: string | null;
  access_token: string | null;
  active: boolean;
  created_at: string;
  membership_fee_month: string | null;
  membership_fee_paid_at: string | null;
}

export interface InviteLink {
  id: string;
  token: string;
  used: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface SignupFormData {
  name: string;
  nickname: string;
  birth_date: string;
  address: string;
  city_area: string;
  preferred_position: PreferredPosition | "";
  membership_type: MembershipType;
  competition_interest: CompetitionInterest;
  notes: string;
}

export type FeedItemType = "announcement" | "call_up" | "reminder" | "system";

export interface FeedItem {
  id: string;
  type: FeedItemType;
  player_id: string | null;
  event_id: string | null;
  announcement_id: string | null;
  title: string;
  body: string;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  created_at: string;
}

export type EventType = "training" | "friendly" | "game";
export type EventSource = "recurring" | "manual";
export type AttendanceStatus =
  | "reserved"
  | "confirmed"
  | "released"
  | "waitlist"
  | "pending_payment";

export interface Event {
  id: string;
  type: EventType;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  capacity: number;
  opponent: string;
  notes: string;
  confirmation_opens_at: string | null;
  confirmation_closes_at: string | null;
  source: EventSource;
  created_at: string;
}

export interface Attendance {
  id: string;
  event_id: string;
  player_id: string;
  status: AttendanceStatus;
  waitlist_position: number | null;
  created_at: string;
  confirmed_at: string | null;
}

export interface TrainingWithAttendance extends Event {
  attendance: Attendance | null;
  occupied_spots: number;
}

export type CallUpStatus = "pending" | "accepted" | "declined";

export interface CallUp {
  id: string;
  event_id: string;
  player_id: string;
  status: CallUpStatus;
  message: string | null;
  called_up_at: string;
  responded_at: string | null;
}

export interface CallUpWithEvent extends CallUp {
  event: Event;
}

export interface GameWithCallUps extends Event {
  call_ups: CallUpWithPlayer[];
  stats: CallUpStats;
}

export interface CallUpWithPlayer extends CallUp {
  player: Pick<Player, "id" | "name" | "nickname" | "membership_type">;
}

export interface CallUpStats {
  total: number;
  pending: number;
  accepted: number;
  declined: number;
}

export interface EligiblePlayer {
  id: string;
  name: string;
  nickname: string | null;
  membership_type: MembershipType;
  group: "member" | "drop_in";
  already_called_up: boolean;
}

export interface FeedItemWithCallUp extends FeedItem {
  call_up_status?: CallUpStatus | null;
}
