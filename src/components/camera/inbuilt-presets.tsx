import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EyeIcon } from "lucide-react";

import cameraActionApi from "@/lib/camera/cameraActionApi";
import { CameraDevice } from "@/lib/camera/types";
import { mutate, query } from "@/lib/request";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { TableSkeleton } from "@/components/common/skeleton-loading";

import { useTranslation } from "@/hooks/useTranslation";

export const InbuiltPresets = ({ device }: { device: CameraDevice }) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["camera-presets", device.id],
    queryFn: query(cameraActionApi.getPresets, {
      pathParams: { cameraId: device.id },
    }),
  });

  const gotoPreset = useMutation({
    mutationFn: mutate(cameraActionApi.gotoPreset, {
      pathParams: { cameraId: device.id },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["camera-status", device.id],
      });
    },
  });

  const { t } = useTranslation();

  const handleGoToPreset = (presetNumber: number) => {
    gotoPreset.mutate({ preset: presetNumber });
  };

  if (isLoading || !data) {
    return <TableSkeleton count={5} />;
  }

  return (
    <div className="w-full">
      {Object.keys(data || {}).length === 0 ? (
        <div className="bg-gray-50 rounded-md p-6 text-center text-gray-500">
          {t("no_inbuilt_presets_found_for_this_camera")}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <Table className="border-collapse p-6">
              <TableHeader>
                <TableRow className="bg-gray-100 border-b border-gray-200">
                  <TableHead className="h-9 py-2 px-4 text-xs font-semibold text-gray-700">
                    {t("name")}
                  </TableHead>
                  <TableHead className="h-9 py-2 px-4 text-xs font-semibold text-gray-700 text-right">
                    {t("actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(data).map(
                  ([name, presetNumber], index, arr) => (
                    <TableRow
                      key={name}
                      className={`bg-white hover:bg-gray-50 transition-colors ${
                        index !== arr.length - 1
                          ? "border-b border-gray-200"
                          : ""
                      }`}
                    >
                      <TableCell className="py-3 px-4">
                        <span className="text-sm font-medium text-gray-700">
                          {name}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleGoToPreset(presetNumber)}
                            disabled={gotoPreset.isPending}
                          >
                            <EyeIcon className="size-3" />
                            <span className="md:inline">{t("view")}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};
