import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  EyeIcon,
  Move,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { AlertTriangle } from "lucide-react";
import { Link } from "raviger";
import { useState } from "react";

import {
  CameraFeedProvider,
  useCameraFeed,
} from "@/lib/camera/camera-feed-context";
import cameraActionApi from "@/lib/camera/cameraActionApi";
import cameraPositionPresetApi from "@/lib/camera/cameraPositionPresetApi";
import CameraFeedControls from "@/lib/camera/player/feed-controls";
import CameraFeedPlayer from "@/lib/camera/player/feed-player";
import { CameraDevice, PTZPayload, PositionPreset } from "@/lib/camera/types";
import useCameraStatus from "@/lib/camera/useCameraStatus";
import {
  handleReorder,
  useReorderMutation,
} from "@/lib/hooks/useReorderMutation";
import { mutate, query } from "@/lib/request";
import { HttpMethod } from "@/lib/request";
import { LocationList } from "@/lib/types/location";
import { stringifyNestedObject } from "@/lib/utils";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { LocationSearch } from "@/components/common/location-search";
import PluginComponent from "@/components/common/plugin-component";
import { TableSkeleton } from "@/components/common/skeleton-loading";

export const CameraShowPageCard = ({
  device,
  facilityId,
}: {
  device: CameraDevice;
  facilityId: string;
}) => {
  return (
    <PluginComponent>
      <CameraStream device={device} />
      <CameraPositionPresets device={device} facilityId={facilityId} />
    </PluginComponent>
  );
};

const CameraStream = ({ device }: { device: CameraDevice }) => {
  const { data: status, isError, refetch } = useCameraStatus(device);

  return (
    <CameraFeedProvider device={device}>
      <div className="relative aspect-[16/9] bg-gray-950 group rounded-xl overflow-hidden shadow-lg">
        <CameraFeedPlayer />
        <div className="hidden sm:block">
          <CameraFeedControls inlineView />
        </div>
      </div>
      <div className="mt-2 sm:hidden">
        <CameraFeedControls />
      </div>
      {!!status && (
        <div className="mt-2 flex flex-wrap gap-2">
          <div className="text-xs bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1.5">
            <span className="font-medium text-gray-700">Position:</span>
            <span className="text-gray-600">
              X: {status.position.x.toFixed(1)}, Y:{" "}
              {status.position.y.toFixed(1)}, Z:{" "}
              {status.position.zoom.toFixed(1)}
            </span>
          </div>
          <div className="text-xs bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1.5">
            <span className="font-medium text-gray-700">Pan/Tilt:</span>
            <span
              className={`${
                status.moveStatus.panTilt === "MOVING"
                  ? "text-blue-600"
                  : "text-gray-600"
              }`}
            >
              {status.moveStatus.panTilt}
            </span>
          </div>
          <div className="text-xs bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1.5">
            <span className="font-medium text-gray-700">Zoom:</span>
            <span
              className={`${
                status.moveStatus.zoom === "MOVING"
                  ? "text-blue-600"
                  : "text-gray-600"
              }`}
            >
              {status.moveStatus.zoom}
            </span>
          </div>
          {status.error && (
            <div className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-md flex items-center gap-1.5">
              <span className="font-medium">Error:</span>
              <span>{status.error}</span>
            </div>
          )}
        </div>
      )}
      {!device.care_metadata.gateway ? (
        <div className="text-xs bg-amber-50 px-3 py-2 rounded-md flex items-center gap-2 border border-amber-200 shadow-sm mt-2">
          <AlertTriangle className="size-4 text-amber-500" />
          <span className="font-medium text-amber-700">Warning:</span>
          <span className="text-amber-700 flex-1">
            No gateway device has been configured for this device.
          </span>
        </div>
      ) : (
        isError && <CameraCommunicationError refetch={refetch} />
      )}
    </CameraFeedProvider>
  );
};

const CameraCommunicationError = ({ refetch }: { refetch: () => void }) => {
  const { playerStatus } = useCameraFeed();

  if (playerStatus !== "playing") {
    return null;
  }

  return (
    <div className="text-xs bg-amber-50 px-3 py-2 rounded-md flex items-center gap-2 border border-amber-200 shadow-sm mt-2">
      <AlertTriangle className="size-4 text-amber-500" />
      <span className="font-medium text-amber-700">Warning:</span>
      <span className="text-amber-700 flex-1">
        Unable to communicate with the camera device. The camera credentials may
        be incorrect.
      </span>
      <Button variant="warning" size="sm" onClick={() => refetch()}>
        Retry
      </Button>
    </div>
  );
};

const CameraPositionPresets = ({
  device,
  facilityId,
}: {
  device: CameraDevice;
  facilityId: string;
}) => {
  const queryClient = useQueryClient();
  const [presetToDelete, setPresetToDelete] = useState<PositionPreset | null>(
    null,
  );
  const [presetName, setPresetName] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationList | null>(
    null,
  );

  // Add state for the preset being edited
  const [presetToEdit, setPresetToEdit] = useState<PositionPreset | null>(null);
  const [editPopoverOpen, setEditPopoverOpen] = useState(false);
  const [editPresetName, setEditPresetName] = useState("");
  const [editSelectedLocation, setEditSelectedLocation] =
    useState<LocationList | null>(null);
  const [editPTZ, setEditPTZ] = useState<PTZPayload | null>(null);
  const [ptzUpdated, setPtzUpdated] = useState(false);
  // Fetch presets - the API now returns location data directly
  const { data, isLoading } = useQuery({
    queryKey: ["camera-position-presets", device.id],
    queryFn: query(cameraPositionPresetApi.list, {
      pathParams: { cameraId: device.id },
      queryParams: { limit: 100, ordering: "location__name,sort_index" },
    }),
  });

  const { data: cameraStatus } = useCameraStatus(device);

  const { mutate: createPreset, isPending: isCreatingPreset } = useMutation({
    mutationFn: mutate(cameraPositionPresetApi.create, {
      pathParams: { cameraId: device.id },
    }),
    onSuccess: () => {
      // Refresh the presets list after creation
      queryClient.invalidateQueries({
        queryKey: ["camera-position-presets", device.id],
      });
      setPresetName("");
      setSelectedLocation(null);
      setPopoverOpen(false);
    },
  });

  const deletePresetMutation = useMutation({
    mutationFn: (presetId: string) => {
      return query(cameraPositionPresetApi.delete, {
        pathParams: { cameraId: device.id, presetId },
      })({ signal: new AbortController().signal });
    },
    onSuccess: () => {
      // Refresh the presets list after deletion
      queryClient.invalidateQueries({
        queryKey: ["camera-position-presets", device.id],
      });

      // Show success toast
      // toast.success("Preset deleted", {
      //   description: `The preset "${presetToDelete?.name}" was successfully deleted.`,
      // });

      setPresetToDelete(null);
    },
  });

  // Add mutation for absolute move
  const absoluteMoveMutation = useMutation({
    mutationFn: mutate(cameraActionApi.absoluteMove, {
      pathParams: { cameraId: device.id },
      silent: true,
    }),
    onSuccess: () => {
      // Refresh camera status after moving
      queryClient.invalidateQueries({
        queryKey: ["camera-status", device.id],
      });

      // Show success toast
      // toast.success("Camera moved", {
      //   description: "Camera has been moved to the selected preset position.",
      // });
    },
  });

  // Add mutation for updating preset
  const updatePresetMutation = useMutation({
    mutationFn: mutate(cameraPositionPresetApi.update, {
      pathParams: { cameraId: device.id, presetId: presetToEdit?.id || "" },
    }),
    onSuccess: () => {
      // Refresh the presets list after update
      queryClient.invalidateQueries({
        queryKey: ["camera-position-presets", device.id],
      });

      // Reset edit state
      setPresetToEdit(null);
      setEditPresetName("");
      setEditSelectedLocation(null);
      setEditPopoverOpen(false);

      // Show success toast
      // toast.success("Preset updated", {
      //   description: `The preset "${presetToEdit?.name}" was successfully updated.`,
      // });
    },
  });

  const reorderPresetMutation = useReorderMutation<PositionPreset>({
    queryKey: ["camera-position-presets", device.id],
    updateEndpoint: cameraPositionPresetApi.update.path,
    updateMethod: HttpMethod.PUT,
    getUpdateBody: (preset) => ({
      name: preset.name,
      ptz: preset.ptz,
      location: preset.location.id,
      sort_index: preset.sort_index,
    }),
    cameraId: device.id,
  });

  // Handle moving preset up or down in order
  const handleReorderPreset = (
    preset: PositionPreset,
    direction: "up" | "down",
    presets: PositionPreset[],
  ) => {
    const result = handleReorder(preset, direction, presets);
    if (result) {
      reorderPresetMutation.mutate(result);
    }
  };

  const { mutate: setAsDefault } = useMutation({
    mutationFn: (presetId: string) =>
      mutate(cameraPositionPresetApi.set_default, {
        pathParams: { cameraId: device.id, presetId },
      })({}),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["camera-position-presets", device.id],
      });
    },
  });

  const handleDeletePreset = (preset: PositionPreset) => {
    setPresetToDelete(preset);
  };

  const confirmDeletePreset = () => {
    if (presetToDelete) {
      deletePresetMutation.mutate(presetToDelete.id);
    }
  };

  // Add handler for move action
  const handleMoveToPreset = (preset: PositionPreset) => {
    absoluteMoveMutation.mutate(preset.ptz);
  };

  // Add handler for edit action
  const handleEditPreset = (preset: PositionPreset) => {
    setPresetToEdit(preset);
    setEditPresetName(preset.name);
    setEditSelectedLocation(preset.location);
    setEditPTZ(preset.ptz);
    setEditPopoverOpen(true);
    setPtzUpdated(false);
  };

  // Add handler for update preset
  const handleUpdatePreset = () => {
    if (
      !presetToEdit ||
      !editPresetName.trim() ||
      !editSelectedLocation ||
      !editPTZ
    )
      return;

    updatePresetMutation.mutate({
      name: editPresetName.trim(),
      ptz: editPTZ,
      location: editSelectedLocation.id,
      sort_index: presetToEdit.sort_index, // Preserve existing sort_index
    });
  };

  const handleCreatePreset = () => {
    if (!presetName.trim() || !cameraStatus) return;

    createPreset({
      name: presetName.trim(),
      ptz: cameraStatus.position,
      location: selectedLocation?.id,
      sort_index: 0,
    });
  };

  if (isLoading || !data) {
    return <TableSkeleton count={5} />;
  }

  // Group presets by location
  type GroupedPresets = {
    locationId: string;
    locationName: string;
    presets: PositionPreset[];
  };

  const groupedPresets: GroupedPresets[] = [];

  const presetsWithLocation = data.results.filter((preset) => preset.location);
  const locationMap = new Map<string, GroupedPresets>();

  presetsWithLocation.forEach((preset) => {
    const locationId = preset.location?.id;
    if (locationId && !locationMap.has(locationId)) {
      locationMap.set(locationId, {
        locationId,
        locationName: stringifyNestedObject(preset.location),
        presets: [],
      });
    }
    if (locationId) {
      locationMap.get(locationId)?.presets.push(preset);
    }
  });

  // Add location groups to the groupedPresets array
  locationMap.forEach((group) => {
    groupedPresets.push(group);
  });

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Position Presets</h3>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
              <Plus className="size-3.5" />
              Create Preset
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">
                Save current position as a preset
              </h4>
              <div className="space-y-2">
                <Label htmlFor="preset-name">
                  Preset Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="preset-name"
                  placeholder="Enter preset name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">
                  Location <span className="text-red-500">*</span>
                </Label>
                <LocationSearch
                  facilityId={facilityId}
                  mode="instance"
                  onSelect={setSelectedLocation}
                  value={selectedLocation}
                  disabled={isCreatingPreset}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setPopoverOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleCreatePreset}
                  disabled={
                    !presetName.trim() ||
                    !selectedLocation ||
                    isCreatingPreset ||
                    !cameraStatus
                  }
                >
                  Save
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {data?.results.length === 0 ? (
        <div className="bg-gray-50 rounded-md p-6 text-center text-gray-500">
          No position presets found for this camera
        </div>
      ) : (
        <div className="space-y-8">
          {groupedPresets.map((group) => (
            <div key={group.locationId ?? "no-location"} className="space-y-3">
              {/* Location Group Header */}
              <div className="flex items-center border-b border-gray-200 pb-2">
                <div className="flex items-center gap-2">
                  <div className="size-1.5 rounded-full bg-primary-500"></div>
                  <Link
                    href={`/facility/${facilityId}/settings/locations/${group.locationId}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800 hover:underline"
                  >
                    {group.locationName}
                    <ExternalLink className="size-3.5" />
                  </Link>
                  <span className="text-xs text-gray-500 ml-2">
                    ({group.presets.length}{" "}
                    {group.presets.length === 1 ? "preset" : "presets"})
                  </span>
                </div>
              </div>

              {/* Presets Table */}
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <Table className="border-collapse">
                  <TableHeader>
                    <TableRow className="bg-gray-100 border-b border-gray-200">
                      <TableHead className="h-9 py-2 px-4 text-xs font-semibold text-gray-700">
                        Name
                      </TableHead>
                      <TableHead className="h-9 py-2 px-4 text-xs font-semibold text-gray-700 hidden md:table-cell">
                        Position
                      </TableHead>
                      <TableHead className="h-9 py-2 px-4 text-xs font-semibold text-gray-700 text-right">
                        Actions
                      </TableHead>
                      <TableHead className="h-9 py-2 px-4 text-xs font-semibold text-gray-700">
                        <span className="sr-only">Move</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.presets.map((preset, index) => (
                      <TableRow
                        key={preset.id}
                        className={`bg-white hover:bg-gray-50 transition-colors ${
                          index !== group.presets.length - 1
                            ? "border-b border-gray-200"
                            : ""
                        }`}
                      >
                        <TableCell className="py-3 px-4">
                          <span className="text-sm font-medium text-gray-700">
                            {preset.name}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-4 hidden md:table-cell">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-1">
                              <span className="text-xs font-medium text-gray-500">
                                X:
                              </span>
                              <span className="text-xs text-gray-700">
                                {preset.ptz.x.toFixed(1)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs font-medium text-gray-500">
                                Y:
                              </span>
                              <span className="text-xs text-gray-700">
                                {preset.ptz.y.toFixed(1)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs font-medium text-gray-500">
                                Zoom:
                              </span>
                              <span className="text-xs text-gray-700">
                                {preset.ptz.zoom.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <div className="flex items-center gap-2 mr-3">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <Switch
                                      checked={preset.is_default}
                                      onCheckedChange={() =>
                                        setAsDefault(preset.id)
                                      }
                                      disabled={preset.is_default}
                                      className="data-[state=checked]:bg-primary-500"
                                    />
                                  </div>
                                </TooltipTrigger>
                                {preset.is_default && (
                                  <TooltipContent>
                                    To change the default preset, set another
                                    preset as default
                                  </TooltipContent>
                                )}
                              </Tooltip>
                              <span className="text-xs text-gray-600">
                                Default
                              </span>
                            </div>
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleMoveToPreset(preset)}
                              disabled={absoluteMoveMutation.isPending}
                            >
                              <EyeIcon className="size-3" />
                              <span className="md:inline">View</span>
                            </Button>
                            <Popover
                              open={
                                editPopoverOpen &&
                                presetToEdit?.id === preset.id
                              }
                              onOpenChange={(open) => {
                                if (!open) {
                                  setEditPopoverOpen(false);
                                  setPresetToEdit(null);
                                }
                              }}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="xs"
                                  onClick={() => handleEditPreset(preset)}
                                  disabled={updatePresetMutation.isPending}
                                >
                                  <Pencil className="size-3" />
                                  <span className="md:inline">Modify</span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 p-4">
                                <div className="space-y-4">
                                  <h4 className="font-medium text-sm">
                                    Modify preset
                                  </h4>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-preset-name">
                                      Preset Name{" "}
                                      <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                      id="edit-preset-name"
                                      placeholder="Enter preset name"
                                      value={editPresetName}
                                      onChange={(e) =>
                                        setEditPresetName(e.target.value)
                                      }
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-location">
                                      Location{" "}
                                      <span className="text-red-500">*</span>
                                    </Label>
                                    <LocationSearch
                                      facilityId={facilityId}
                                      mode="instance"
                                      onSelect={setEditSelectedLocation}
                                      value={editSelectedLocation}
                                      disabled={updatePresetMutation.isPending}
                                    />
                                  </div>
                                  <hr className="my-4 bg-gray-200 h-px" />
                                  <div className="space-y-2">
                                    <Label>Current PTZ Position</Label>

                                    <div className="grid grid-cols-3 gap-2">
                                      <div className="space-y-1">
                                        <Label className="text-xs text-gray-500">
                                          Pan (X)
                                        </Label>
                                        <Input
                                          value={editPTZ?.x.toFixed(1)}
                                          disabled
                                          className="h-8 text-sm"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs text-gray-500">
                                          Tilt (Y)
                                        </Label>
                                        <Input
                                          value={editPTZ?.y.toFixed(1)}
                                          disabled
                                          className="h-8 text-sm"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs text-gray-500">
                                          Zoom
                                        </Label>
                                        <Input
                                          value={editPTZ?.zoom.toFixed(1)}
                                          disabled
                                          className="h-8 text-sm"
                                        />
                                      </div>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full h-8 text-xs mt-2"
                                      onClick={() => {
                                        if (cameraStatus) {
                                          setEditPTZ(cameraStatus.position);
                                          setPtzUpdated(true);
                                        }
                                      }}
                                      disabled={
                                        !cameraStatus ||
                                        updatePresetMutation.isPending
                                      }
                                    >
                                      <Move className="size-3" />
                                      {ptzUpdated ? (
                                        <p>Updated</p>
                                      ) : (
                                        <p>
                                          Update with Camera's Current Position
                                        </p>
                                      )}
                                    </Button>
                                    <hr className="my-4 bg-gray-200 h-px" />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 text-xs"
                                      onClick={() => {
                                        setEditPopoverOpen(false);
                                        setPresetToEdit(null);
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      className="h-8 text-xs"
                                      onClick={handleUpdatePreset}
                                      disabled={
                                        !editPresetName.trim() ||
                                        !editSelectedLocation ||
                                        updatePresetMutation.isPending
                                      }
                                    >
                                      Update
                                    </Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleDeletePreset(preset)}
                              disabled={deletePresetMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              <Trash2 className="size-3" />
                              <span className="md:inline">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="flex flex-col p-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() =>
                                  handleReorderPreset(
                                    preset,
                                    "up",
                                    group.presets,
                                  )
                                }
                                disabled={
                                  reorderPresetMutation.isPending || index === 0
                                }
                              >
                                <ChevronUp className="size-3" />
                                <span className="sr-only">Move Up</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Move this preset up</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() =>
                                  handleReorderPreset(
                                    preset,
                                    "down",
                                    group.presets,
                                  )
                                }
                                disabled={
                                  reorderPresetMutation.isPending ||
                                  index === group.presets.length - 1
                                }
                              >
                                <ChevronDown className="size-3" />
                                <span className="sr-only">Move Down</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Move this preset below
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!presetToDelete}
        onOpenChange={(open) => !open && setPresetToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Position Preset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the preset "{presetToDelete?.name}
              "? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePreset}
              className={buttonVariants({ variant: "destructive" })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
