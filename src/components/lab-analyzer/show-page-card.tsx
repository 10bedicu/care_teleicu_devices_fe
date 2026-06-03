import { AlertTriangle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import PluginComponent from "@/components/common/plugin-component";
import { ActivityDefinitionsCard } from "@/components/lab-analyzer/activity-definitions-card";
import { MessagesCard } from "@/components/lab-analyzer/messages-card";
import { PanelMappingsCard } from "@/components/lab-analyzer/panel-mappings-card";

import { useTranslation } from "@/hooks/useTranslation";

interface Props {
  facilityId: string;
  device: {
    id: string;
    care_type: "lab-analyzer";
    care_metadata: {
      type: string;
      transport?: "ethernet" | "serial";
      protocol?: "hl7" | "astm";
      endpoint_address?: string | null;
      oru_port?: number | null;
      hl7_connection_mode?: "inbound" | "outbound";
      orm_mode?: string | null;
      orm_port?: number | null;
      serial_port?: string | null;
      baud_rate?: number | null;
      data_bits?: number | null;
      parity?: string | null;
      stop_bits?:
        | number
        | { source: string; parsedValue: number }
        | string
        | null;
      flow_control?: string | null;
      panel_mappings: Record<string, string | string[]> | null;
      code_mappings: Record<string, { code: string; system?: string }> | null;
      gateway: {
        registered_name: string;
        care_type: "gateway";
        care_metadata: {
          endpoint_address: string;
          insecure: boolean;
        };
      } | null;
    };
  };
}

export const LabAnalyzerShowPageCard = ({ device, facilityId }: Props) => {
  const { t } = useTranslation();
  const meta = device.care_metadata;

  if (!meta.gateway) {
    return (
      <div className="text-xs bg-amber-50 px-3 py-2 rounded-md flex items-center gap-2 border border-amber-200 shadow-sm mt-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <span className="font-medium text-amber-700">{t("warning")}</span>
        <span className="text-amber-700 flex-1">
          {t("no_gateway_device_configured_for_this_device")}
        </span>
      </div>
    );
  }

  return (
    <PluginComponent>
      <div className="flex flex-col items-center gap-4 w-full max-w-full overflow-hidden">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{t("lab_analyzer_device_configuration")}</CardTitle>
            <CardDescription>
              {t("lab_analyzer_device_config_description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-500 dark:text-gray-400">
                    {t("device_type")}
                  </span>
                  <p className="text-sm">{meta.type}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500 dark:text-gray-400">
                    {t("lab_analyzer_transport")}
                  </span>
                  <p className="text-sm">
                    {meta.transport === "serial"
                      ? t("lab_analyzer_transport_serial")
                      : t("lab_analyzer_transport_ethernet")}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-500 dark:text-gray-400">
                    {t("lab_analyzer_protocol")}
                  </span>
                  <p className="text-sm">
                    {meta.protocol === "astm"
                      ? t("lab_analyzer_protocol_astm")
                      : t("lab_analyzer_protocol_hl7")}
                  </p>
                </div>
                {meta.transport !== "serial" ? (
                  <>
                    {meta.protocol === "hl7" && (
                      <div>
                        <span className="font-medium text-gray-500 dark:text-gray-400">
                          {t("lab_analyzer_hl7_connection_mode")}
                        </span>
                        <p className="text-sm">
                          {meta.hl7_connection_mode === "outbound"
                            ? t("lab_analyzer_hl7_connection_mode_outbound")
                            : t("lab_analyzer_hl7_connection_mode_inbound")}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-500 dark:text-gray-400">
                        {t("endpoint_address")}
                      </span>
                      <p className="text-sm">{meta.endpoint_address || "--"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500 dark:text-gray-400">
                        {meta.hl7_connection_mode === "outbound"
                          ? t("lab_analyzer_analyzer_mllp_port")
                          : t("lab_analyzer_oru_port")}
                      </span>
                      <p className="text-sm">{meta.oru_port ?? "--"}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="font-medium text-gray-500 dark:text-gray-400">
                        {t("lab_analyzer_serial_port")}
                      </span>
                      <p className="text-sm">{meta.serial_port || "--"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500 dark:text-gray-400">
                        {t("lab_analyzer_baud_rate")}
                      </span>
                      <p className="text-sm">{meta.baud_rate ?? "--"}</p>
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-2">
                {meta.transport !== "serial" &&
                meta.hl7_connection_mode !== "outbound" ? (
                  <>
                    <div>
                      <span className="font-medium text-gray-500 dark:text-gray-400">
                        {t("lab_analyzer_orm_mode")}
                      </span>
                      <p className="text-sm">{meta.orm_mode || "--"}</p>
                    </div>
                    {meta.orm_mode === "client" && meta.orm_port && (
                      <div>
                        <span className="font-medium text-gray-500 dark:text-gray-400">
                          {t("lab_analyzer_orm_port")}
                        </span>
                        <p className="text-sm">{meta.orm_port}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <span className="font-medium text-gray-500 dark:text-gray-400">
                        {t("lab_analyzer_data_bits")}
                      </span>
                      <p className="text-sm">{meta.data_bits ?? "--"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500 dark:text-gray-400">
                        {t("lab_analyzer_parity")}
                      </span>
                      <p className="text-sm">{meta.parity || "--"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500 dark:text-gray-400">
                        {t("lab_analyzer_stop_bits")}
                      </span>
                      <p className="text-sm">
                        {typeof meta.stop_bits === "object" &&
                        meta.stop_bits !== null &&
                        "parsedValue" in meta.stop_bits
                          ? meta.stop_bits.parsedValue
                          : (meta.stop_bits ?? "--")}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500 dark:text-gray-400">
                        {t("lab_analyzer_flow_control")}
                      </span>
                      <p className="text-sm">{meta.flow_control || "--"}</p>
                    </div>
                  </>
                )}
                <div>
                  <span className="font-medium text-gray-500 dark:text-gray-400">
                    {t("gateway")}
                  </span>
                  <p className="text-sm">
                    {meta.gateway?.registered_name || "--"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {meta.gateway?.care_metadata.endpoint_address || ""}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <ActivityDefinitionsCard deviceId={device.id} facilityId={facilityId} />
        <PanelMappingsCard
          deviceType={meta.type}
          panelMappingsOverride={meta.panel_mappings ?? null}
          codeMappingsOverride={meta.code_mappings ?? null}
        />
        <MessagesCard deviceId={device.id} />
      </div>
    </PluginComponent>
  );
};
