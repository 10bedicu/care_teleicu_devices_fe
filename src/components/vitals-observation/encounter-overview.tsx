import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIcon, AlertTriangle, SettingsIcon } from "lucide-react";
import { navigate, usePathParams } from "raviger";

import deviceApi from "@/lib/device/deviceApi";
import { DeviceListResponse } from "@/lib/device/types";
import { mutate, query } from "@/lib/request";
import { Encounter } from "@/lib/types/encounter";
import { VitalsObservationMonitor } from "@/lib/vitals-observation/hl7-monitor/vitals-observation-monitor";
import { VitalsObservationDevice } from "@/lib/vitals-observation/types";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import PluginComponent from "@/components/common/plugin-component";
import { Trans } from "@/components/common/trans";

import { useTranslation } from "@/hooks/useTranslation";

interface Props {
  encounter: Encounter;
}

export const VitalsObservationEncounterOverview = ({ encounter }: Props) => {
  const { data: encounterDevices, isLoading: isLoadingEncounterDevices } =
    useQuery({
      queryKey: ["encounter-vitals-observation-devices", encounter.id],
      queryFn: query(deviceApi.listDevices, {
        pathParams: { facilityId: encounter.facility.id },
        queryParams: {
          care_type: "vitals-observation",
          current_encounter: encounter.id,
          limit: 100,
        },
      }),
      select: (data: DeviceListResponse) => data.results,
    });

  const { data: locationDevices, isLoading: isLoadingLocationDevices } =
    useQuery({
      queryKey: ["location-vitals-observation-devices", encounter.facility.id],
      queryFn: query(deviceApi.listDevices, {
        pathParams: { facilityId: encounter.facility.id },
        queryParams: {
          care_type: "vitals-observation",
          current_location: encounter.current_location?.id,
          limit: 100,
        },
      }),
      enabled: !!encounter.current_location?.id,
      select: (data: DeviceListResponse) => data.results,
    });

  if (
    isLoadingEncounterDevices ||
    !encounterDevices ||
    (!!encounter.current_location?.id &&
      (isLoadingLocationDevices || !locationDevices))
  ) {
    return <Skeleton className="h-24 md:h-48 w-full" />;
  }

  const encounterDeviceIds = encounterDevices.map((device) => device.id);

  const encounterLinkableDevices =
    locationDevices?.filter(
      (device) => !encounterDeviceIds.includes(device.id),
    ) ?? [];

  if (encounterDevices.length === 0 && encounterLinkableDevices.length === 0) {
    return null;
  }

  return (
    <PluginComponent>
      <div className="flex flex-col gap-4">
        {encounterDevices.map((device) => (
          <EncounterVitalsObservation
            key={device.id}
            device={device as unknown as VitalsObservationDevice}
          />
        ))}

        {encounterLinkableDevices.map((device) => (
          <LinkableDeviceCallout
            key={device.id}
            device={device as unknown as VitalsObservationDevice}
            encounterId={encounter.id}
            facilityId={encounter.facility.id}
          />
        ))}
      </div>
    </PluginComponent>
  );
};

const getWebSocketUrl = ({ care_metadata: meta }: VitalsObservationDevice) => {
  const scheme = meta.gateway?.care_metadata.insecure ? "ws:" : "wss:";
  const gateway = meta.gateway?.care_metadata.endpoint_address;
  const deviceAddress = meta.endpoint_address;
  return `${scheme}//${gateway}/observations/${deviceAddress}`;
};

const EncounterVitalsObservation = ({
  device,
}: {
  device: VitalsObservationDevice;
}) => {
  const { facilityId } = usePathParams("/facility/:facilityId/*")!;
  const { t } = useTranslation();

  if (device.care_metadata.type !== "HL7-Monitor") {
    return null;
  }

  if (!device.care_metadata.gateway) {
    return (
      <div className="text-xs bg-amber-50 px-3 py-2 rounded-md flex items-center gap-2 border border-amber-200 shadow-sm mt-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <span className="font-medium text-amber-700">{t("warning")}</span>
        <span className="text-amber-700 flex-1">
          {t("no_gateway_device_configured", {
            device_name: device.user_friendly_name || device.registered_name,
          })}
        </span>
        <Button
          variant="warning"
          size="sm"
          onClick={() =>
            navigate(`/facility/${facilityId}/settings/devices/${device.id}`)
          }
        >
          <SettingsIcon className="size-4" />
          {t("configure")}
        </Button>
      </div>
    );
  }

  const socketUrl = getWebSocketUrl(device);

  return <VitalsObservationMonitor socketUrl={socketUrl} />;
};

const LinkableDeviceCallout = ({
  device,
  encounterId,
  facilityId,
}: {
  device: VitalsObservationDevice;
  encounterId: string;
  facilityId: string;
}) => {
  const queryClient = useQueryClient();
  const { mutate: associateDevice, isPending } = useMutation({
    mutationFn: mutate(deviceApi.associateEncounter, {
      pathParams: { facilityId, deviceId: device.id },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["encounter-vitals-observation-devices", encounterId],
      });
    },
  });

  const { t } = useTranslation();

  return (
    <div className="text-xs bg-yellow-50 px-3 py-2 rounded-md flex flex-col sm:flex-row items-start sm:items-center gap-2 border border-yellow-200 shadow-sm mt-2">
      <div className="flex gap-2 items-start flex-1 w-full">
        <ActivityIcon className="size-4 text-yellow-500 mt-0.5 shrink-0" />
        <span className="text-yellow-700">
          <p>
            <Trans
              i18nKey="vital_observation_device_availability"
              values={{
                device_name:
                  device.user_friendly_name || device.registered_name,
                device_type: device.care_metadata.type,
              }}
              components={{
                strong: <strong className="font-semibold" />,
              }}
            />
          </p>
          <p>{t("do_you_want_to_associate_it_to_this_encounter")}</p>
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => associateDevice({ encounter: encounterId })}
        disabled={isPending}
        className="w-full sm:w-auto mt-1 sm:mt-0"
      >
        {isPending ? t("associating") : t("associate")}
      </Button>
    </div>
  );
};
