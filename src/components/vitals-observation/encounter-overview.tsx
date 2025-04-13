import { DeviceListResponse } from "@/lib/device/types";
import { Encounter } from "@/lib/types/encounter";
import PluginComponent from "@/components/common/plugin-component";
import { Skeleton } from "@/components/ui/skeleton";
import { VitalsObservationDevice } from "@/lib/vitals-observation/types";
import { VitalsObservationMonitor } from "@/lib/vitals-observation/hl7-monitor/vitals-observation-monitor";
import deviceApi from "@/lib/device/deviceApi";
import { query } from "@/lib/request";
import { useQuery } from "@tanstack/react-query";

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
  const socketUrl = getWebSocketUrl(
    device.care_metadata.gateway.care_metadata.endpoint_address,
    device.care_metadata.endpoint_address
  );

  return <VitalsObservationMonitor socketUrl={socketUrl} />;
};
