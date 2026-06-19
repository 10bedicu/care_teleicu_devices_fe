import { useEffect } from "react";

import useDevices from "@/lib/device/hooks/useDevices";
import useLabAnalyzerDeviceTypes from "@/lib/lab-analyzer/hooks/useLabAnalyzerDeviceTypes";
import { LabAnalyzerDeviceType } from "@/lib/lab-analyzer/labAnalyzerApi";
import { ConfigureFormProps } from "@/lib/types/common";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import PluginComponent from "@/components/common/plugin-component";
import {
  CodeMappingsEditor,
  PanelMappingsEditor,
} from "@/components/lab-analyzer/panel-mappings-card";

import { useTranslation } from "@/hooks/useTranslation";

function serialDefaultsFromDeviceType(
  deviceType: LabAnalyzerDeviceType | undefined,
): Record<string, unknown> {
  return {
    baud_rate: deviceType?.default_baud_rate ?? 9600,
    data_bits: deviceType?.default_data_bits ?? 8,
    parity: deviceType?.default_parity ?? "N",
    stop_bits: deviceType?.default_stop_bits ?? 1,
    flow_control: deviceType?.default_flow_control ?? "none",
  };
}

function defaultProtocolForDeviceType(
  deviceType: LabAnalyzerDeviceType | undefined,
): "hl7" | "astm" {
  const supported = deviceType?.supported_protocols ?? ["hl7"];
  return supported.includes("hl7") ? "hl7" : "astm";
}

function resolveProtocol(
  metadataProtocol: unknown,
  deviceType: LabAnalyzerDeviceType | undefined,
): "hl7" | "astm" {
  const supported = deviceType?.supported_protocols ?? ["hl7"];
  if (
    typeof metadataProtocol === "string" &&
    (metadataProtocol === "hl7" || metadataProtocol === "astm") &&
    supported.includes(metadataProtocol)
  ) {
    return metadataProtocol;
  }
  return defaultProtocolForDeviceType(deviceType);
}

export const LabAnalyzerConfigureForm = ({
  facilityId,
  metadata,
  onChange,
}: ConfigureFormProps) => {
  const { data, isLoading } = useDevices({
    facilityId,
    careType: "gateway",
  });

  const { data: deviceTypesData, isLoading: deviceTypesLoading } =
    useLabAnalyzerDeviceTypes();
  const deviceTypes = deviceTypesData?.results ?? [];

  const gatewayId =
    (typeof metadata.gateway === "object" && metadata.gateway?.id) ||
    metadata.gateway;

  const handleChange = (key: string, value: unknown) => {
    onChange({ ...metadata, gateway: gatewayId, [key]: value });
  };

  const { t } = useTranslation();

  useEffect(
    () => {
      if (gatewayId) {
        handleChange("gateway", gatewayId);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gatewayId],
  );

  const gatewayDevices = data?.results ?? [];
  const gateway = gatewayDevices.find((device) => device.id === gatewayId);

  const selectedDeviceType = deviceTypes.find((dt) => dt.id === metadata.type);

  // Keep protocol aligned with the selected device profile once metadata loads.
  useEffect(() => {
    if (!selectedDeviceType) {
      return;
    }

    const supported = selectedDeviceType.supported_protocols ?? ["hl7"];
    const resolved = resolveProtocol(metadata.protocol, selectedDeviceType);
    const updates: Record<string, unknown> = {};

    if (
      typeof metadata.protocol !== "string" ||
      !supported.includes(metadata.protocol)
    ) {
      updates.protocol = resolved;
    }

    if (resolved === "astm") {
      const profileAstmMode = selectedDeviceType.astm_connection_mode;
      if (
        profileAstmMode &&
        metadata.astm_connection_mode !== profileAstmMode
      ) {
        updates.astm_connection_mode = profileAstmMode;
      }
      if (metadata.oru_port == null || metadata.oru_port === 2575) {
        updates.oru_port = selectedDeviceType.default_oru_port ?? 2575;
      }
    }

    if (Object.keys(updates).length === 0) {
      return;
    }

    onChange({ ...metadata, gateway: gatewayId, ...updates });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeviceType?.id, metadata.protocol]);
  const isUnidirectional =
    selectedDeviceType?.communication_mode === "unidirectional";
  const transport = metadata.transport || "ethernet";
  const isSerial = transport === "serial";
  const supportedProtocols = selectedDeviceType?.supported_protocols ?? [
    "hl7",
    "astm",
  ];
  const protocol = resolveProtocol(metadata.protocol, selectedDeviceType);
  const hl7ConnectionMode =
    metadata.hl7_connection_mode ??
    selectedDeviceType?.hl7_connection_mode ??
    "inbound";
  const astmConnectionMode =
    metadata.astm_connection_mode ??
    selectedDeviceType?.astm_connection_mode ??
    "outbound";
  const isOutboundHl7 =
    !isSerial && protocol === "hl7" && hl7ConnectionMode === "outbound";
  const isInboundAstm =
    !isSerial && protocol === "astm" && astmConnectionMode === "inbound";
  const isOutboundAstm =
    !isSerial && protocol === "astm" && astmConnectionMode === "outbound";
  const defaultOruPort = selectedDeviceType?.default_oru_port ?? 2575;
  const showOrmMode =
    !isSerial && !isUnidirectional && !isOutboundHl7 && !isOutboundAstm;
  const showOrmPort =
    showOrmMode &&
    (metadata.orm_mode === "client" || metadata.orm_mode === "server");

  return (
    <PluginComponent>
      <div className="space-y-4">
        <div>
          <Label className="mb-2">
            {t("type")}
            <span className="text-red-500">*</span>
          </Label>
          <Select
            value={
              typeof metadata.type === "string" && metadata.type
                ? metadata.type
                : undefined
            }
            onValueChange={(value) => {
              const deviceType = deviceTypes.find((dt) => dt.id === value);
              const defaultProtocol = defaultProtocolForDeviceType(deviceType);
              const connectionMode =
                deviceType?.hl7_connection_mode ?? "inbound";
              const astmMode = deviceType?.astm_connection_mode ?? "outbound";
              const updates: Record<string, unknown> = {
                type: value,
                protocol: defaultProtocol,
                hl7_connection_mode: connectionMode,
                astm_connection_mode: astmMode,
                oru_port: deviceType?.default_oru_port ?? 2575,
                ...serialDefaultsFromDeviceType(deviceType),
              };
              if (connectionMode === "outbound" || defaultProtocol === "astm") {
                updates.orm_mode = "shared";
                updates.orm_port = null;
              }
              onChange({ ...metadata, gateway: gatewayId, ...updates });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("select_device_type")} />
            </SelectTrigger>
            <SelectContent>
              {deviceTypesLoading ? (
                <div className="px-2 py-1.5 text-sm text-gray-500">
                  {t("loading")}
                </div>
              ) : deviceTypes.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-gray-500">
                  {t("no_device_types_found")}
                </div>
              ) : (
                deviceTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {metadata.type && (
          <div>
            <Label className="mb-2">{t("lab_analyzer_protocol")}</Label>
            <Select
              value={protocol}
              onValueChange={(value) => {
                const updates: Record<string, unknown> = { protocol: value };
                if (value === "astm" && selectedDeviceType) {
                  updates.astm_connection_mode =
                    selectedDeviceType.astm_connection_mode ?? "outbound";
                  updates.oru_port =
                    selectedDeviceType.default_oru_port ?? 2575;
                  updates.orm_mode = "shared";
                  updates.orm_port = null;
                }
                if (value === "hl7" && selectedDeviceType) {
                  updates.hl7_connection_mode =
                    selectedDeviceType.hl7_connection_mode ?? "inbound";
                  updates.oru_port =
                    selectedDeviceType.default_oru_port ?? 2575;
                }
                onChange({ ...metadata, gateway: gatewayId, ...updates });
              }}
              disabled={supportedProtocols.length === 1}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supportedProtocols.includes("hl7") && (
                  <SelectItem value="hl7">
                    {t("lab_analyzer_protocol_hl7")}
                  </SelectItem>
                )}
                {supportedProtocols.includes("astm") && (
                  <SelectItem value="astm">
                    {t("lab_analyzer_protocol_astm")}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label className="mb-2">{t("lab_analyzer_transport")}</Label>
          <Select
            value={transport}
            onValueChange={(value) => {
              const updates: Record<string, unknown> = { transport: value };
              if (value === "serial") {
                Object.assign(
                  updates,
                  serialDefaultsFromDeviceType(selectedDeviceType),
                );
              }
              onChange({ ...metadata, gateway: gatewayId, ...updates });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ethernet">
                {t("lab_analyzer_transport_ethernet")}
              </SelectItem>
              <SelectItem value="serial">
                {t("lab_analyzer_transport_serial")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2">
            {t("gateway_device")}
            <span className="text-red-500">*</span>
          </Label>
          <Select
            value={
              typeof gatewayId === "string" && gatewayId ? gatewayId : undefined
            }
            onValueChange={(value) => handleChange("gateway", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("select_gateway_device")}>
                {gateway?.registered_name || gateway?.user_friendly_name}{" "}
                <span className="text-gray-500">
                  ({t("endpoint_address")}:{" "}
                  {(gateway?.care_metadata.endpoint_address as string) || "--"})
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <div className="px-2 py-1.5 text-sm text-gray-500">
                  {t("loading")}
                </div>
              ) : gatewayDevices.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-gray-500">
                  {t("no_gateway_devices_found")}
                </div>
              ) : (
                gatewayDevices.map((device) => (
                  <SelectItem key={device.id} value={device.id}>
                    <p className="text-sm">
                      {device.registered_name || device.user_friendly_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t("endpoint_address")}:{" "}
                      <span className="font-medium">
                        {(device.care_metadata.endpoint_address as string) ||
                          "--"}
                      </span>
                    </p>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {!isSerial && protocol === "astm" && (
          <div>
            <Label className="mb-2">
              {t("lab_analyzer_astm_connection_mode")}
            </Label>
            <Select
              value={astmConnectionMode}
              onValueChange={(value) => {
                onChange({
                  ...metadata,
                  gateway: gatewayId,
                  astm_connection_mode: value,
                });
              }}
              disabled={selectedDeviceType?.astm_connection_mode === "inbound"}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inbound">
                  {t("lab_analyzer_astm_connection_mode_inbound")}
                </SelectItem>
                <SelectItem value="outbound">
                  {t("lab_analyzer_astm_connection_mode_outbound")}
                </SelectItem>
              </SelectContent>
            </Select>
            {isInboundAstm && (
              <p className="mt-1.5 text-xs text-gray-500">
                {t("lab_analyzer_inbound_astm_connection_help")}
              </p>
            )}
            {isOutboundAstm && (
              <p className="mt-1.5 text-xs text-gray-500">
                {t("lab_analyzer_outbound_astm_connection_help")}
              </p>
            )}
          </div>
        )}

        {!isSerial && protocol === "hl7" && (
          <div>
            <Label className="mb-2">
              {t("lab_analyzer_hl7_connection_mode")}
            </Label>
            <Select
              value={hl7ConnectionMode}
              onValueChange={(value) => {
                const updates: Record<string, unknown> = {
                  hl7_connection_mode: value,
                };
                if (value === "outbound") {
                  updates.orm_mode = "shared";
                  updates.orm_port = null;
                }
                onChange({ ...metadata, gateway: gatewayId, ...updates });
              }}
              disabled={selectedDeviceType?.hl7_connection_mode === "outbound"}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inbound">
                  {t("lab_analyzer_hl7_connection_mode_inbound")}
                </SelectItem>
                <SelectItem value="outbound">
                  {t("lab_analyzer_hl7_connection_mode_outbound")}
                </SelectItem>
              </SelectContent>
            </Select>
            {isOutboundHl7 && (
              <p className="mt-1.5 text-xs text-gray-500">
                {t("lab_analyzer_outbound_connection_help")}
              </p>
            )}
          </div>
        )}

        {!isSerial && (
          <div>
            <Label className="mb-2">
              {t("endpoint_address")}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              placeholder={
                isOutboundHl7 || isOutboundAstm
                  ? t("lab_analyzer_analyzer_ip_placeholder")
                  : t("lab_analyzer_endpoint_address_placeholder")
              }
              value={metadata.endpoint_address || ""}
              onChange={(e) => handleChange("endpoint_address", e.target.value)}
            />
          </div>
        )}

        {!isSerial && (
          <div>
            <Label className="mb-2">
              {isOutboundHl7 || isOutboundAstm
                ? t("lab_analyzer_analyzer_mllp_port")
                : t("lab_analyzer_oru_port")}
            </Label>
            <Input
              type="number"
              placeholder={String(defaultOruPort)}
              value={metadata.oru_port ?? defaultOruPort}
              onChange={(e) =>
                handleChange(
                  "oru_port",
                  parseInt(e.target.value) || defaultOruPort,
                )
              }
            />
          </div>
        )}

        {isSerial && (
          <>
            <div>
              <Label className="mb-2">
                {t("lab_analyzer_serial_port")}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                placeholder={t("lab_analyzer_serial_port_placeholder")}
                value={metadata.serial_port || ""}
                onChange={(e) => handleChange("serial_port", e.target.value)}
              />
            </div>

            <div>
              <Label className="mb-2">{t("lab_analyzer_baud_rate")}</Label>
              <Select
                value={String(metadata.baud_rate ?? 9600)}
                onValueChange={(value) =>
                  handleChange("baud_rate", parseInt(value))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200].map(
                    (rate) => (
                      <SelectItem key={rate} value={String(rate)}>
                        {rate}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2">{t("lab_analyzer_data_bits")}</Label>
              <Select
                value={String(metadata.data_bits ?? 8)}
                onValueChange={(value) =>
                  handleChange("data_bits", parseInt(value))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 6, 7, 8].map((bits) => (
                    <SelectItem key={bits} value={String(bits)}>
                      {bits}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2">{t("lab_analyzer_parity")}</Label>
              <Select
                value={metadata.parity || "N"}
                onValueChange={(value) => handleChange("parity", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="N">
                    {t("lab_analyzer_parity_none")}
                  </SelectItem>
                  <SelectItem value="E">
                    {t("lab_analyzer_parity_even")}
                  </SelectItem>
                  <SelectItem value="O">
                    {t("lab_analyzer_parity_odd")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2">{t("lab_analyzer_stop_bits")}</Label>
              <Select
                value={String(
                  metadata.stop_bits &&
                    typeof metadata.stop_bits === "object" &&
                    "parsedValue" in metadata.stop_bits
                    ? metadata.stop_bits.parsedValue
                    : (metadata.stop_bits ?? 1),
                )}
                onValueChange={(value) =>
                  handleChange("stop_bits", parseFloat(value))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["1", "1.5", "2"].map((bits) => (
                    <SelectItem key={bits} value={bits}>
                      {bits}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2">{t("lab_analyzer_flow_control")}</Label>
              <Select
                value={metadata.flow_control || "none"}
                onValueChange={(value) => handleChange("flow_control", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {t("lab_analyzer_flow_control_none")}
                  </SelectItem>
                  <SelectItem value="xonxoff">
                    {t("lab_analyzer_flow_control_xonxoff")}
                  </SelectItem>
                  <SelectItem value="rtscts">
                    {t("lab_analyzer_flow_control_rtscts")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {showOrmMode && (
          <div>
            <Label className="mb-2">{t("lab_analyzer_orm_mode")}</Label>
            <Select
              value={metadata.orm_mode || "shared"}
              onValueChange={(value) => handleChange("orm_mode", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shared">
                  {t("lab_analyzer_orm_mode_shared")}
                </SelectItem>
                <SelectItem value="client">
                  {t("lab_analyzer_orm_mode_client")}
                </SelectItem>
                <SelectItem value="server">
                  {t("lab_analyzer_orm_mode_server")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {showOrmPort && (
          <div>
            <Label className="mb-2">{t("lab_analyzer_orm_port")}</Label>
            <Input
              type="number"
              placeholder="2576"
              value={metadata.orm_port || ""}
              onChange={(e) =>
                handleChange("orm_port", parseInt(e.target.value) || null)
              }
            />
          </div>
        )}

        {metadata.type && (
          <PanelMappingsEditor
            deviceType={metadata.type}
            panelMappings={metadata.panel_mappings ?? null}
            onChange={(mappings) => handleChange("panel_mappings", mappings)}
          />
        )}

        {metadata.type && (
          <CodeMappingsEditor
            deviceType={metadata.type}
            codeMappings={metadata.code_mappings ?? null}
            onChange={(mappings) => handleChange("code_mappings", mappings)}
          />
        )}
      </div>
    </PluginComponent>
  );
};
