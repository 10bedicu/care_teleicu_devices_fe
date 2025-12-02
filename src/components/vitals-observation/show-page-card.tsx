import { AlertTriangle } from "lucide-react";

import { VitalsObservationMonitor } from "@/lib/vitals-observation/hl7-monitor/vitals-observation-monitor";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import PluginComponent from "@/components/common/plugin-component";

import { useTranslation } from "@/hooks/useTranslation";

interface Props {
  device: {
    care_type: "vitals-observation";
    care_metadata: {
      type: "HL7-Monitor" | "Ventilator";
      endpoint_address: string;
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

const getWebSocketUrl = ({ care_metadata: meta }: Props["device"]) => {
  const scheme = meta.gateway?.care_metadata.insecure ? "ws:" : "wss:";
  const gateway = meta.gateway?.care_metadata.endpoint_address;
  const deviceAddress = meta.endpoint_address;
  return `${scheme}//${gateway}/observations/${deviceAddress}`;
};

export const VitalsObservationShowPageCard = ({ device }: Props) => {
  const { t } = useTranslation();

  if (!device.care_metadata.gateway) {
    return (
      <div className="text-xs bg-amber-50 px-3 py-2 rounded-md flex items-center gap-2 border border-amber-200 shadow-sm mt-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <span className="font-medium text-amber-700">{t("warning")}</span>
        <span className="text-amber-700 flex-1">
          {t("no_gateway_device_configured_for_vitals_observation_device")}
        </span>
      </div>
    );
  }

  const socketUrl = getWebSocketUrl(device);

  if (device.care_metadata.type !== "HL7-Monitor") {
    return null;
  }

  return (
    <PluginComponent>
      <div className="flex flex-col items-center gap-4 w-full max-w-full overflow-hidden">
        {/* Device Information Card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>
              {t("vitals_observation_device_configuration")}
            </CardTitle>
            <CardDescription>
              {t("details_about_the_connected_vitals_observation_device")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-500 dark:text-gray-400">
                    {t("device_type")}:
                  </span>
                  <span className="ml-2 font-semibold">
                    {device.care_metadata.type}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-500 dark:text-gray-400">
                    {t("endpoint_address")}:
                  </span>
                  <span className="ml-2 font-semibold">
                    {device.care_metadata.endpoint_address}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-500 dark:text-gray-400">
                    {t("gateway")}
                  </span>
                  <span className="ml-2 font-semibold">
                    {device.care_metadata.gateway.registered_name}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-500 dark:text-gray-400">
                    {t("gateway_endpoint")}:
                  </span>
                  <span className="ml-2 font-semibold break-all">
                    {
                      device.care_metadata.gateway.care_metadata
                        .endpoint_address
                    }
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <details className="text-xs text-gray-500 dark:text-gray-400">
                <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 select-none">
                  {t("show_technical_details")}
                </summary>
                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                  <code className="break-all text-[11px] whitespace-pre-wrap">
                    {socketUrl}
                  </code>
                </div>
              </details>
            </div>
          </CardContent>
        </Card>

        {/* Vitals Observation Monitor Container */}
        <div className="max-w-full overflow-hidden">
          <VitalsObservationMonitor socketUrl={socketUrl} />
        </div>
      </div>
    </PluginComponent>
  );
};
