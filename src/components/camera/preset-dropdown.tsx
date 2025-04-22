import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CameraDevice, PositionPreset } from "@/lib/camera/types";
import { query, mutate } from "@/lib/request";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, SaveIcon } from "lucide-react";
import cameraPositionPresetApi from "@/lib/camera/cameraPositionPresetApi";
import useCameraStatus from "@/lib/camera/useCameraStatus";

interface Props {
  device: CameraDevice;
  locationId: string;
  selectedPreset: PositionPreset | undefined;
  onSelectPreset: (preset: PositionPreset) => void;
  onUpdatePreset: () => void;
  isMoving: boolean;
  isAwayFromPreset: boolean;
}

export const PresetDropdown = ({
  device,
  locationId,
  selectedPreset,
  onSelectPreset,
  onUpdatePreset,
  isMoving,
  isAwayFromPreset,
}: Props) => {
  const queryClient = useQueryClient();
  const { data: cameraStatus } = useCameraStatus(device);

  const { data: positionPresets } = useQuery({
    queryKey: ["camera-presets", device.id, locationId],
    queryFn: query(cameraPositionPresetApi.list, {
      pathParams: { cameraId: device.id },
      queryParams: { location: locationId, limit: 100 },
    }),
  });

  const { mutate: updatePreset } = useMutation({
    mutationFn: (preset: PositionPreset) =>
      mutate(cameraPositionPresetApi.update, {
        pathParams: { cameraId: device.id, presetId: preset.id },
      })({
        name: preset.name,
        ptz: cameraStatus?.position ?? preset.ptz,
        location: preset.location?.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["camera-presets", device.id, locationId],
      });
      onUpdatePreset();
    },
  });

  return (
    <div className="flex gap-2">
      {isAwayFromPreset && selectedPreset && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (cameraStatus) {
              updatePreset(selectedPreset);
            }
          }}
          disabled={!cameraStatus || isMoving}
        >
          <SaveIcon className="size-4" />
          <span>Update</span>
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="justify-between"
            disabled={!positionPresets?.results.length || isMoving}
          >
            <span className="text-sm truncate">
              {selectedPreset?.name || "Select position preset..."}
            </span>
            <ChevronDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-64 sm:w-auto" align="end">
          <div className="max-h-80 overflow-y-auto">
            {positionPresets?.results.map((preset) => (
              <DropdownMenuItem
                key={preset.id}
                className="flex gap-3 items-center justify-between px-3 py-2"
                onClick={() => onSelectPreset(preset)}
              >
                <span className="font-medium truncate text-sm">
                  {preset.name}
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
