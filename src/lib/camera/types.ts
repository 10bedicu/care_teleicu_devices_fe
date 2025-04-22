import { LocationList } from "@/lib/types/location";
import { LinkedGateway } from "@/lib/types/gateway";
import { DeviceList } from "@/lib/device/types";

export interface PTZPayload {
  x: number;
  y: number;
  zoom: number;
}

export type CameraType = "ONVIF";

export interface CameraDevice extends DeviceList {
  care_type: "camera";
  care_metadata: {
    type: CameraType;
    gateway: LinkedGateway | null;
    endpoint_address: string;
    username: string;
    password: string;
    stream_id: string;
  };
}

interface PositionPresetBase {
  name: string;
  ptz: PTZPayload;
}

export interface PositionPresetWriteRequest extends PositionPresetBase {
  location?: string;
}

export interface PositionPreset extends PositionPresetBase {
  id: string;
  location: LocationList;
  created_by: {
    id: string;
    username: string;
  };
  updated_by: {
    id: string;
    username: string;
  };
  created_at: string;
  modified_at: string;
}
