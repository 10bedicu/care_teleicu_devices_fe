import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";

import useDevices from "@/lib/device/hooks/useDevices";
import { ConfigureFormProps } from "@/lib/types/common";

import { Button } from "@/components/ui/button";
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

export const CameraDeviceConfigureForm = ({
  facilityId,
  metadata,
  onChange,
}: ConfigureFormProps) => {
  const { data, isLoading } = useDevices({
    facilityId,
    careType: "gateway",
  });

  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation();

  const gatewayId =
    (typeof metadata.gateway === "object" && metadata.gateway?.id) ||
    metadata.gateway;

  const handleChange = (key: string, value: unknown) => {
    onChange({ ...metadata, gateway: gatewayId, [key]: value });
  };

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
          <Label className="mb-2">{t("type")}</Label>
          <Select
            value={metadata.type}
            onValueChange={(value) => handleChange("type", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("select_device_type")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ONVIF">ONVIF</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2">{t("gateway_device")}</Label>
          <Select
            value={gatewayId}
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
                  Loading...
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
          <Label className="mb-2">{t("endpoint_address")}</Label>
          <Input
            type="text"
            placeholder={t("camera_endpoint_address")}
            value={metadata.endpoint_address || ""}
            onChange={(e) => handleChange("endpoint_address", e.target.value)}
          />
        </div>

        <div>
          <Label className="mb-2">{t("username")}</Label>
          <Input
            placeholder={t("camera_username")}
            autoComplete="off"
            value={metadata.username || ""}
            onChange={(e) => handleChange("username", e.target.value)}
          />
        </div>

        <div>
          <Label className="mb-2">{t("password")}</Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete="off"
              placeholder={t("camera_password")}
              value={metadata.password || ""}
              onChange={(e) => handleChange("password", e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div>
          <Label className="mb-2">{t("stream_id")}</Label>
          <Input
            placeholder={t("camera_stream_id")}
            autoComplete="off"
            value={metadata.stream_id || ""}
            onChange={(e) => handleChange("stream_id", e.target.value)}
          />
        </div>
      </div>
    </PluginComponent>
  );
};
