import { DeviceList } from "@/lib/device/types";
import { getVitalsCanvasSizeAndDuration } from "@/lib/vitals-observation/utils";

export interface VitalsDataBase {
  device_id: string;
  "date-time": string;
  "patient-id": string;
  "patient-name": string;
}

export interface VitalsValueBase extends VitalsDataBase {
  value: number;
  unit: string;
  interpretation: string;
  "low-limit": number;
  "high-limit": number;
}

export interface VitalsWaveformBase extends VitalsDataBase {
  observation_id: "waveform";
  resolution: string;
  "sampling rate": string;
  "data-baseline": number;
  "data-low-limit": number;
  "data-high-limit": number;
  data: string;
}

export interface ChannelOptions {
  /**
   * The baseline value for this channel.
   */
  baseline: number;
  /**
   * The minimum value that can be displayed for this channel.
   */
  lowLimit: number;
  /**
   * The maximum value that can be displayed for this channel.
   */
  highLimit: number;
  /**
   * No. of data points expected to be received per second.
   */
  samplingRate: number;
}

export interface IVitalsComponentProps {
  socketUrl: string;
  config?: ReturnType<typeof getVitalsCanvasSizeAndDuration>;
  hideHeader?: boolean;
  hideFooter?: boolean;
}

export interface VitalsObservationDevice extends DeviceList {
  care_type: "vitals-observation";
  care_metadata: {
    type: "HL7-Monitor" | "Ventilator";
    endpoint_address: string;
    gateway: {
      registered_name: string;
      care_type: "gateway";
      care_metadata: {
        endpoint_address: string;
      };
    } | null;
  };
}
