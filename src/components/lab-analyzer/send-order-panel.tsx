import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlaskConicalIcon, InfoIcon, Loader2, SendIcon } from "lucide-react";
import { useMemo, useState } from "react";

import careApi from "@/lib/careApi";
import deviceApi from "@/lib/device/deviceApi";
import useLabAnalyzerDeviceTypes from "@/lib/lab-analyzer/hooks/useLabAnalyzerDeviceTypes";
import labAnalyzerApi from "@/lib/lab-analyzer/labAnalyzerApi";
import { HttpError, mutate, query } from "@/lib/request";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface Props {
  serviceRequestId: string;
}

const COLLECTED_SPECIMEN_STATUSES = new Set(["available"]);

const getFacilityIdFromLocation = (): string | undefined => {
  const match = window.location.pathname.match(/\/facility\/([^/]+)/);
  return match?.[1];
};

export const LabAnalyzerSendOrderPanel = ({ serviceRequestId }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const facilityId = getFacilityIdFromLocation();

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
    sampleId?: string;
  } | null>(null);

  const { data: serviceRequest, isLoading: isServiceRequestLoading } = useQuery(
    {
      queryKey: ["service-request", facilityId, serviceRequestId],
      queryFn: query(careApi.retrieveServiceRequest, {
        pathParams: {
          facilityId: facilityId ?? "",
          serviceRequestId,
        },
      }),
      enabled: !!facilityId,
    },
  );

  const activityDefinitionId = serviceRequest?.activity_definition?.id;

  const { data: analyzerLinks, isLoading: isLinksLoading } = useQuery({
    queryKey: ["lab-analyzers-for-activity", activityDefinitionId],
    queryFn: query(labAnalyzerApi.listAnalyzersForActivity, {
      queryParams: { activity_definition: activityDefinitionId ?? "" },
    }),
    enabled: !!activityDefinitionId,
  });

  const { data: devicesResponse, isLoading: isDevicesLoading } = useQuery({
    queryKey: ["lab-analyzer-devices", facilityId],
    queryFn: query(deviceApi.listDevices, {
      pathParams: { facilityId: facilityId ?? "" },
      queryParams: { care_type: "lab-analyzer" },
    }),
    enabled: !!facilityId,
  });

  const { data: deviceTypesData } = useLabAnalyzerDeviceTypes();

  const { compatibleDevices, hasOnlyQueryDevices } = useMemo(() => {
    const all = devicesResponse?.results ?? [];
    const linked = analyzerLinks?.results ?? [];
    if (linked.length === 0) {
      return { compatibleDevices: [], hasOnlyQueryDevices: false };
    }
    const linkedDeviceIds = new Set(linked.map((l) => l.device_id));

    const deviceTypeMap = new Map(
      (deviceTypesData?.results ?? []).map((dt) => [dt.id, dt]),
    );

    const linkedDevices = all.filter((d) => linkedDeviceIds.has(d.id));

    // Separate by communication mode
    const downloadDevices = linkedDevices.filter((d) => {
      const deviceType =
        (d.care_metadata as { type?: string })?.type ?? "generic";
      const profile = deviceTypeMap.get(deviceType);
      return (
        profile?.communication_mode === "download" ||
        (!profile && deviceType === "generic")
      );
    });

    const queryDevices = linkedDevices.filter((d) => {
      const deviceType =
        (d.care_metadata as { type?: string })?.type ?? "generic";
      const profile = deviceTypeMap.get(deviceType);
      return profile?.communication_mode === "host_query";
    });

    return {
      compatibleDevices: downloadDevices,
      hasOnlyQueryDevices:
        downloadDevices.length === 0 && queryDevices.length > 0,
    };
  }, [devicesResponse, analyzerLinks, deviceTypesData]);

  const hasCollectedSpecimen = useMemo(() => {
    return (
      serviceRequest?.specimens?.some((s) =>
        COLLECTED_SPECIMEN_STATUSES.has(s.status ?? ""),
      ) ?? false
    );
  }, [serviceRequest]);

  const { mutate: sendOrder, isPending: isSending } = useMutation({
    mutationFn: (deviceExternalId: string) => {
      const activeSpecimen = serviceRequest?.specimens.find((s) =>
        COLLECTED_SPECIMEN_STATUSES.has(s.status ?? ""),
      );
      return mutate(labAnalyzerApi.sendOrder, {
        pathParams: { deviceExternalId },
        silent: true,
      })({
        patient_id: serviceRequest?.encounter.patient.id ?? "",
        encounter_external_id: serviceRequest?.encounter.id,
        service_request_external_id: serviceRequest?.id,
        specimen_external_id: activeSpecimen?.id,
        sample_id: activeSpecimen?.accession_identifier,
        placer_order_number: serviceRequest?.id ?? "",
        tests: serviceRequest
          ? [
              {
                code: serviceRequest.code.code,
                display: serviceRequest.code.display,
                system: serviceRequest.code.system,
              },
            ]
          : [],
      });
    },
    onSuccess: (data) => {
      setFeedback({
        type: "success",
        message: t("lab_analyzer_send_order_success"),
        sampleId: data.sample_id,
      });
      queryClient.invalidateQueries({
        queryKey: ["lab-analyzer-messages"],
      });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof HttpError
          ? ((error.cause as { error?: string })?.error ??
            t("lab_analyzer_send_order_failed"))
          : t("lab_analyzer_send_order_failed");
      setFeedback({ type: "error", message });
    },
  });

  const isLoading =
    isServiceRequestLoading || isLinksLoading || isDevicesLoading;

  if (!facilityId) {
    return null;
  }

  return (
    <PluginComponent>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConicalIcon className="size-4" />
            {t("lab_analyzer_send_order_panel_title")}
          </CardTitle>
          <CardDescription>
            {t("lab_analyzer_send_order_panel_description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="size-4 animate-spin" />
              {t("loading")}
            </div>
          ) : hasOnlyQueryDevices ? (
            <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
              <InfoIcon className="size-4 shrink-0" />
              <p>{t("lab_analyzer_host_query_message")}</p>
            </div>
          ) : compatibleDevices.length === 0 ? (
            <p className="text-sm text-gray-500">
              {t("lab_analyzer_no_compatible_analyzers")}
            </p>
          ) : !hasCollectedSpecimen ? (
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              <InfoIcon className="size-4 shrink-0" />
              <p>{t("lab_analyzer_sample_not_collected")}</p>
            </div>
          ) : (
            <>
              <div>
                <Label className="mb-2">
                  {t("lab_analyzer_select_analyzer")}
                </Label>
                <Select
                  value={selectedDeviceId}
                  onValueChange={(value) => {
                    setSelectedDeviceId(value);
                    setFeedback(null);
                  }}
                  disabled={isSending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t(
                        "lab_analyzer_select_analyzer_placeholder",
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {compatibleDevices.map((device) => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.user_friendly_name || device.registered_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="button"
                onClick={() => {
                  setFeedback(null);
                  if (selectedDeviceId) {
                    sendOrder(selectedDeviceId);
                  }
                }}
                disabled={!selectedDeviceId || isSending}
              >
                {isSending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <SendIcon className="size-4" />
                )}
                {t("lab_analyzer_send_order")}
              </Button>
            </>
          )}

          {feedback && (
            <div
              className={`rounded-md border px-3 py-2 text-sm ${
                feedback.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              <p>{feedback.message}</p>
              {feedback.sampleId && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-xs text-emerald-600">
                    {t("lab_analyzer_sample_id")}:
                  </span>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-xs text-emerald-800">
                    {feedback.sampleId}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </PluginComponent>
  );
};

export default LabAnalyzerSendOrderPanel;
