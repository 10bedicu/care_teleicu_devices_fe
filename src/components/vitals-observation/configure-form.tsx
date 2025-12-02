import { useEffect } from "react";

import useDevices from "@/lib/device/hooks/useDevices";
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

import { useTranslation } from "@/hooks/useTranslation";

export const VitalsObservationConfigureForm = ({
  facilityId,
  metadata,
  onChange,
}: ConfigureFormProps) => {
  const { data, isLoading } = useDevices({
    facilityId,
    careType: "gateway",
  });

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

  return (
    <PluginComponent>
      <div className="space-y-4">
        <div>
          <Label className="mb-2">
            {t("type")}
            <span className="text-red-500">*</span>
          </Label>
          <Select
            value={metadata.type || ""}
            onValueChange={(value) => handleChange("type", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("select_device_type")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HL7-Monitor">{t("hl7_monitor")}</SelectItem>
              {/* <SelectItem value="Ventilator">Ventilator</SelectItem> */}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2">
            {t("gateway_device")}
            <span className="text-red-500">*</span>
          </Label>
          <Select
            value={gatewayId}
            onValueChange={(value) => handleChange("gateway", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select gateway device...">
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

        <div>
          <Label className="mb-2">
            {t("endpoint_address")}
            <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            placeholder={t("vitals_observation_endpoint_address")}
            value={metadata.endpoint_address || ""}
            onChange={(e) => handleChange("endpoint_address", e.target.value)}
          />
        </div>
      </div>
    </PluginComponent>
  );
};
