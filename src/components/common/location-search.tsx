import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  LocationForm,
  LocationList,
  LocationMode,
  LocationTypeIcons,
} from "@/lib/types/location";
import { PaginatedResponse, query } from "@/lib/request";
import careApi from "@/lib/careApi";
import { stringifyNestedObject } from "@/lib/utils";
import { Autocomplete } from "@/components/ui/autocomplete";

interface LocationSearchProps {
  facilityId: string;
  mode?: LocationMode;
  form?: LocationForm;
  onSelect: (location: LocationList) => void;
  disabled?: boolean;
  value?: LocationList | null;
}

export function LocationSearch({
  facilityId,
  mode,
  form,
  onSelect,
  disabled,
  value,
}: LocationSearchProps) {
  const [search, setSearch] = useState("");

  const { data: locations, isLoading } = useQuery({
    queryKey: ["locations", facilityId, mode, search],
    queryFn: query(careApi.listLocations, {
      pathParams: { facilityId },
      queryParams: { mode, name: search, form },
    }),
    enabled: facilityId !== "preview",
    select: (data: PaginatedResponse<LocationList>) => data.results,
  });

  const renderLocationOption = (location: LocationList) => {
    const LocationIcon = location.form
      ? LocationTypeIcons[location.form]
      : null;

    return (
      <div className="flex items-center gap-2">
        {LocationIcon && <LocationIcon className="h-4 w-4 text-gray-500" />}
        <span>{stringifyNestedObject(location)}</span>
      </div>
    );
  };

  const renderLocationValue = (location: LocationList | null) => {
    if (!location) return "Select location...";

    const LocationIcon = location.form
      ? LocationTypeIcons[location.form]
      : null;

    return (
      <div className="flex items-center gap-2 truncate">
        {LocationIcon && (
          <LocationIcon className="h-4 w-4 text-gray-500 shrink-0" />
        )}
        <span className="truncate">{stringifyNestedObject(location)}</span>
      </div>
    );
  };

  return (
    <Autocomplete
      options={locations}
      value={value}
      onSelect={onSelect}
      onSearch={setSearch}
      isLoading={isLoading}
      disabled={disabled}
      placeholder="Select location..."
      searchPlaceholder="Search locations..."
      noResultsText="No locations found"
      renderOption={renderLocationOption}
      renderValue={renderLocationValue}
    />
  );
}
