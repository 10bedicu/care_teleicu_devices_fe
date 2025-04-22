import { DeviceListResponse } from "@/lib/device/types";
import { Encounter } from "@/lib/types/encounter";
import PluginComponent from "@/components/common/plugin-component";
import { Skeleton } from "@/components/ui/skeleton";
import { VitalsObservationDevice } from "@/lib/vitals-observation/types";
import { VitalsObservationMonitor } from "@/lib/vitals-observation/hl7-monitor/vitals-observation-monitor";
import deviceApi from "@/lib/device/deviceApi";
import { query } from "@/lib/request";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navigate, usePathParams } from "raviger";

interface Props {
  encounter: Encounter;
}

export const VitalsObservationEncounterOverview = ({ encounter }: Props) => {
  const { data: devices, isLoading } = useQuery({
    queryKey: ["vitals-observation-devices", encounter.id],
    queryFn: query(deviceApi.listDevices, {
      pathParams: { facilityId: encounter.facility.id },
      queryParams: {
        care_type: "vitals-observation",
        current_encounter: encounter.id,
      },
    }),
    select: (data: DeviceListResponse) => data.results,
  });

  if (isLoading || !devices) {
    return <Skeleton className="h-24 md:h-48 w-full" />;
  }

  if (devices.length === 0) {
    return null;
  }

  return (
    <PluginComponent>
      <div className="flex flex-col gap-4">
        {devices.map((device) => (
          <EncounterVitalsObservation
            key={device.id}
            device={device as unknown as VitalsObservationDevice}
          />
        ))}
      </div>
    </PluginComponent>
  );
};

const getWebSocketUrl = (gateway: string, device: string) => {
  const protocol = location.protocol === "https:" ? "wss:" : "wss:";
  return `${protocol}//${gateway}/observations/${device}`;
};

const EncounterVitalsObservation = ({
  device,
}: {
  device: VitalsObservationDevice;
}) => {
  const { facilityId } = usePathParams("/facility/:facilityId/*")!;

  if (device.care_metadata.type !== "HL7-Monitor") {
    return null;
  }

  if (!device.care_metadata.gateway) {
    return (
      <div className="text-xs bg-amber-50 px-3 py-2 rounded-md flex items-center gap-2 border border-amber-200 shadow-sm mt-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <span className="font-medium text-amber-700">Warning:</span>
        <span className="text-amber-700 flex-1">
          No gateway device has been configured for the vitals observation
          device "{device.user_friendly_name || device.registered_name}".
        </span>
        <Button
          variant="warning"
          size="sm"
          onClick={() =>
            navigate(`/facility/${facilityId}/settings/devices/${device.id}`)
          }
        >
          <SettingsIcon className="size-4" />
          Configure
        </Button>
      </div>
    );
  }

  const socketUrl = getWebSocketUrl(
    device.care_metadata.gateway.care_metadata.endpoint_address,
    device.care_metadata.endpoint_address
  );

  return <VitalsObservationMonitor socketUrl={socketUrl} />;
};
