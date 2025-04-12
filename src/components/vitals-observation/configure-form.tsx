import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useDevices from "@/lib/device/hooks/useDevices";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfigureFormProps } from "@/lib/types/common";
import { useEffect } from "react";
import PluginComponent from "@/components/common/plugin-component";

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

  const handleChange = (key: string, value: any) => {
    onChange({ ...metadata, gateway: gatewayId, [key]: value });
  };

  useEffect(() => {
    if (gatewayId) {
      handleChange("gateway", gatewayId);
    }
  }, [gatewayId]);

  const gatewayDevices = data?.results ?? [];
  const gateway = gatewayDevices.find((device) => device.id === gatewayId);

  return (
    <PluginComponent>
      <div className="space-y-4">
        <div>
          <Label className="mb-2">
            Type
            <span className="text-red-500">*</span>
          </Label>
          <Select
            value={metadata.type || ""}
            onValueChange={(value) => handleChange("type", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select device type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HL7-Monitor">HL7 Monitor</SelectItem>
              {/* <SelectItem value="Ventilator">Ventilator</SelectItem> */}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2">
            Gateway Device
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
                  (Endpoint Address:{" "}
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
                  No gateway devices found
                </div>
              ) : (
                gatewayDevices.map((device) => (
                  <SelectItem key={device.id} value={device.id}>
                    <p className="text-sm">
                      {device.registered_name || device.user_friendly_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Endpoint Address:{" "}
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
            Endpoint Address
            <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            placeholder="Vitals Observation Device's endpoint address (e.g., 192.168.1.100)"
            value={metadata.endpoint_address || ""}
            onChange={(e) => handleChange("endpoint_address", e.target.value)}
          />
        </div>
      </div>
    </PluginComponent>
  );
};
