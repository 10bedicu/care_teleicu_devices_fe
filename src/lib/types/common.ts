export interface ConfigureFormProps {
  facilityId: string;
  metadata: Record<string, any>;
  onChange: (metadata: Record<string, any>) => void;
}

export type UserBase = {
  id: string;
  first_name: string;
  username: string;
  email: string;
  last_name: string;
  last_login: string;
  profile_picture_url: string;
  phone_number: string;
  mfa_enabled: boolean;
  permissions: string[];
  is_superuser: boolean;
};

export const ContactPointSystems = [
  "phone",
  "fax",
  "email",
  "pager",
  "url",
  "sms",
  "other",
] as const;

export type ContactPointSystem = (typeof ContactPointSystems)[number];

export const ContactPointUses = ["home", "work", "temp", "mobile"] as const;

export type ContactPointUse = (typeof ContactPointUses)[number];

export interface ContactPoint {
  system: ContactPointSystem;
  value: string;
  use: ContactPointUse;
}
