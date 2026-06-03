import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import careApi from "@/lib/careApi";
import labAnalyzerApi from "@/lib/lab-analyzer/labAnalyzerApi";
import { mutate, query } from "@/lib/request";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

import { CardListSkeleton } from "@/components/common/skeleton-loading";

import { useTranslation } from "@/hooks/useTranslation";

interface Props {
  deviceId: string;
  facilityId: string;
}

export const ActivityDefinitionsCard = ({ deviceId, facilityId }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: linkedDefinitions, isLoading: isLinkedLoading } = useQuery({
    queryKey: ["device-activity-definitions", deviceId],
    queryFn: query(labAnalyzerApi.listActivityDefinitions, {
      pathParams: { deviceExternalId: deviceId },
    }),
  });

  const { data: searchResults, isLoading: isSearchLoading } = useQuery({
    queryKey: ["activity-definitions-search", facilityId, searchQuery],
    queryFn: query.debounced(careApi.listActivityDefinitions, {
      pathParams: { facilityId },
      queryParams: {
        title: searchQuery,
        classification: "laboratory",
        status: "active",
      },
    }),
    enabled: searchQuery.length > 0,
  });

  const linkedIds = useMemo(() => {
    return new Set(
      (linkedDefinitions?.results ?? []).map((d) => d.activity_definition_id),
    );
  }, [linkedDefinitions]);

  const filteredOptions = useMemo(() => {
    return (searchResults?.results ?? []).filter(
      (item) => !linkedIds.has(item.id),
    );
  }, [searchResults, linkedIds]);

  const { mutate: addDefinition, isPending: isAdding } = useMutation({
    mutationFn: (activityDefinitionId: string) =>
      mutate(labAnalyzerApi.createActivityDefinition, {
        pathParams: { deviceExternalId: deviceId },
      })({
        device_external_id: deviceId,
        activity_definition_external_id: activityDefinitionId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["device-activity-definitions", deviceId],
      });
    },
  });

  const { mutate: removeDefinition } = useMutation({
    mutationFn: (externalId: string) =>
      mutate(labAnalyzerApi.deleteActivityDefinition, {
        pathParams: { deviceExternalId: deviceId, externalId },
      })(undefined as never),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["device-activity-definitions", deviceId],
      });
    },
  });

  const items = linkedDefinitions?.results ?? [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("activity_definitions")}</CardTitle>
        <CardDescription>
          {t("activity_definitions_description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={isOpen}
                className="w-full justify-between"
              >
                <span>
                  {items.length === 0
                    ? t("add_activity_definition")
                    : `${items.length} ${t("items_selected")}`}
                </span>
                <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 size-4 shrink-0 opacity-50" />
                <Input
                  placeholder={t("search_activity_definitions")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-none shadow-none focus-visible:ring-0"
                />
              </div>
              <ScrollArea className="max-h-64">
                <div className="p-2">
                  {isSearchLoading || isAdding ? (
                    <CardListSkeleton count={3} />
                  ) : searchQuery.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="rounded-full bg-primary/10 p-3 mb-2">
                        <Search className="size-4 text-primary" />
                      </div>
                      <p className="text-sm text-gray-500">
                        {t("search_activity_definitions")}
                      </p>
                    </div>
                  ) : filteredOptions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="rounded-full bg-primary/10 p-3 mb-2">
                        <Search className="size-4 text-primary" />
                      </div>
                      <p className="text-sm text-gray-500">
                        {t("no_results_found")}
                      </p>
                    </div>
                  ) : (
                    filteredOptions.map((option) => (
                      <div
                        key={option.id}
                        className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 hover:bg-gray-100"
                        onClick={() => addDefinition(option.id)}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm">{option.title}</span>
                          {option.code && (
                            <span className="text-xs text-gray-500">
                              {option.code.display} ({option.code.code})
                            </span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            addDefinition(option.id);
                          }}
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {isLinkedLoading ? (
            <CardListSkeleton count={2} />
          ) : items.length > 0 ? (
            <div className="flex flex-col gap-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-row justify-between rounded-sm border border-gray-200 bg-white px-2 py-1"
                >
                  <div className="flex flex-col gap-0.5 self-center">
                    <p className="font-medium text-sm text-gray-900">
                      {item.activity_definition_title}
                    </p>
                    {item.activity_definition_code && (
                      <p className="text-xs text-gray-500">
                        {item.activity_definition_code.display} (
                        {item.activity_definition_code.code})
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => removeDefinition(item.id)}
                    className="p-0! cursor-pointer hover:bg-transparent"
                    variant="ghost"
                  >
                    <Trash2 className="size-4 text-gray-500" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-2">
              {t("no_activity_definitions_linked")}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
