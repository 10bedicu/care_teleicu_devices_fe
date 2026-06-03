import { PaginatedResponse } from "@/lib/request";
import { ContactPoint, UserBase } from "@/lib/types/common";
import { Encounter } from "@/lib/types/encounter";
import { LocationList } from "@/lib/types/location";

export type DeviceType =
  | "gateway"
  | "camera"
  | "vitals-observation"
  | "lab-analyzer";

export const DeviceStatuses = [
  "active",
  "inactive",
  "entered_in_error",
] as const;

export type DeviceStatus = (typeof DeviceStatuses)[number];

export const DeviceAvailabilityStatuses = [
  "lost",
  "damaged",
  "destroyed",
  "available",
] as const;

export type DeviceAvailabilityStatus =
  (typeof DeviceAvailabilityStatuses)[number];

export interface DeviceBase {
  identifier?: string;
  status: DeviceStatus;
  availability_status: DeviceAvailabilityStatus;
  manufacturer?: string;
  manufacture_date?: string; // datetime
  expiration_date?: string; // datetime
  lot_number?: string;
  serial_number?: string;
  registered_name: string;
  user_friendly_name?: string;
  model_number?: string;
  part_number?: string;
  contact: ContactPoint[];
  care_type?: string | undefined;
}

export interface DeviceDetail extends DeviceBase {
  id: string;
  current_encounter: Encounter | undefined;
  current_location: LocationList | undefined;
  created_by: UserBase;
  updated_by: UserBase;
  care_metadata: Record<string, unknown>;
}

export interface DeviceList extends DeviceBase {
  id: string;
  care_metadata: Record<string, unknown>;
}

export type DeviceListResponse = PaginatedResponse<DeviceList>;
