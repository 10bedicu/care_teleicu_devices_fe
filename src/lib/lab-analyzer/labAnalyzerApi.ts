import { HttpMethod, apiRoutes } from "@/lib/request";

export interface LabMessage {
  id: string;
  device_id: string;
  patient_id: string | null;
  encounter_id: string | null;
  message_type: "ORM" | "ORU" | "QRY" | "DSP";
  message_control_id: string;
  raw_message: string;
  parsed_data: Record<string, unknown>;
  status: string;
  error_details: string | null;
  created_date: string;
  modified_date: string;
}

export interface DeviceActivityDefinitionResponse {
  id: string;
  device_id: string;
  activity_definition_id: string;
  activity_definition_title: string;
  activity_definition_code: {
    system: string;
    code: string;
    display: string;
  } | null;
  created_date: string;
  modified_date: string;
}

export interface SendOrderRequest {
  patient_id: string;
  patient_name?: string;
  encounter_external_id?: string;
  specimen_external_id?: string;
  service_request_external_id?: string;
  placer_order_number: string;
  sample_id?: string;
  tests: Array<{ code: string; display: string; system?: string }>;
}

export interface LoincMappingEntry {
  code: string;
  display: string;
  system: string;
}

export type CommunicationMode = "unidirectional" | "host_query" | "download";
export type Hl7ConnectionMode = "inbound" | "outbound";
export type AstmConnectionMode = "inbound" | "outbound";

export type LabAnalyzerTransport = "ethernet" | "serial";
export type LabAnalyzerProtocol = "hl7" | "astm";

export interface LabAnalyzerDeviceType {
  id: string;
  name: string;
  hl7_version: string;
  communication_mode: CommunicationMode;
  hl7_connection_mode?: Hl7ConnectionMode;
  astm_connection_mode?: AstmConnectionMode;
  default_oru_port?: number;
  default_baud_rate?: number;
  default_data_bits?: number;
  default_parity?: string;
  default_stop_bits?: number;
  default_flow_control?: string;
  supports_query_orders: boolean;
  supported_protocols?: LabAnalyzerProtocol[];
  panel_mappings: Record<string, string | string[]>;
  code_mappings: Record<string, LoincMappingEntry>;
}

export interface CreateActivityDefinitionRequest {
  device_external_id: string;
  activity_definition_external_id: string;
}

export default apiRoutes({
  listDeviceTypes: {
    path: "/api/lab_analyzer_device/metadata/device_types/",
    method: HttpMethod.GET,
    TResponse: {} as { results: LabAnalyzerDeviceType[] },
  },
  listMessages: {
    path: "/api/lab_analyzer_device/devices/{deviceExternalId}/messages/",
    method: HttpMethod.GET,
    TResponse: {} as { count: number; results: LabMessage[] },
  },
  listActivityDefinitions: {
    path: "/api/lab_analyzer_device/devices/{deviceExternalId}/activity_definitions/",
    method: HttpMethod.GET,
    TResponse: {} as {
      count: number;
      results: DeviceActivityDefinitionResponse[];
    },
  },
  listAnalyzersForActivity: {
    path: "/api/lab_analyzer_device/activity_definitions/",
    method: HttpMethod.GET,
    TResponse: {} as {
      count: number;
      results: DeviceActivityDefinitionResponse[];
    },
  },
  sendOrder: {
    path: "/api/lab_analyzer_device/actions/{deviceExternalId}/send_order/",
    method: HttpMethod.POST,
    TResponse: {} as {
      message: string;
      lab_message_id: string;
      sample_id: string;
      gateway_response?: unknown;
    },
    TRequest: {} as SendOrderRequest,
  },
  createActivityDefinition: {
    path: "/api/lab_analyzer_device/devices/{deviceExternalId}/activity_definitions/",
    method: HttpMethod.POST,
    TResponse: {} as DeviceActivityDefinitionResponse,
    TRequest: {} as CreateActivityDefinitionRequest,
  },
  deleteActivityDefinition: {
    path: "/api/lab_analyzer_device/devices/{deviceExternalId}/activity_definitions/{externalId}/",
    method: HttpMethod.DELETE,
    TResponse: {} as void,
  },
});
