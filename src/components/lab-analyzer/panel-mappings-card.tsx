import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import useLabAnalyzerDeviceTypes from "@/lib/lab-analyzer/hooks/useLabAnalyzerDeviceTypes";
import labAnalyzerApi from "@/lib/lab-analyzer/labAnalyzerApi";
import { query } from "@/lib/request";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ComboboxInput } from "@/components/ui/combobox-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useTranslation } from "@/hooks/useTranslation";

interface Props {
  deviceType: string;
  panelMappingsOverride: Record<string, string | string[]> | null;
  codeMappingsOverride: Record<
    string,
    { code: string; system?: string }
  > | null;
}

function findDeviceProfile<T extends { id: string; name: string }>(
  deviceTypes: T[] | undefined,
  deviceType: string,
): T | undefined {
  return deviceTypes?.find(
    (dt) => dt.name === deviceType || dt.id === deviceType,
  );
}

function uniqueDevicePanelCodes(
  panelMappings: Record<string, string | string[]> | undefined,
): string[] {
  return [
    ...new Set(
      Object.values(panelMappings ?? {}).flatMap((v) =>
        Array.isArray(v) ? v : [v],
      ),
    ),
  ].sort();
}

interface SuggestInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
}

/** Free-text input with suggestions, using care_fe's ComboboxInput pattern. */
function SuggestInput({
  value,
  onChange,
  suggestions,
  placeholder,
  className,
}: SuggestInputProps) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const filtered = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return suggestions;
    return suggestions.filter((s) => s.toLowerCase().includes(query));
  }, [suggestions, value]);

  return (
    <ComboboxInput
      value={value}
      onValueChange={(next) => {
        onChange(next);
        setOpen(true);
      }}
      open={open}
      onOpenChange={setOpen}
      placeholder={placeholder}
      className={className}
    >
      <div className="max-h-48 overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <div className="px-3 py-2 text-xs text-gray-500">
            {t("no_results_found")}
          </div>
        ) : (
          filtered.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="flex w-full items-center px-3 py-1.5 text-left font-mono text-xs hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                onChange(suggestion);
                setOpen(false);
              }}
            >
              {suggestion}
            </button>
          ))
        )}
      </div>
    </ComboboxInput>
  );
}

export const PanelMappingsCard = ({
  deviceType,
  panelMappingsOverride,
  codeMappingsOverride,
}: Props) => {
  const { t } = useTranslation();
  const { data: deviceTypesData } = useLabAnalyzerDeviceTypes();
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);

  const profile = useMemo(() => {
    return findDeviceProfile(deviceTypesData?.results, deviceType);
  }, [deviceTypesData, deviceType]);

  const panelMappings = useMemo(() => {
    const base = profile?.panel_mappings ?? {};
    const overrides = panelMappingsOverride ?? {};
    const merged = { ...base, ...overrides };

    return Object.entries(merged)
      .map(([orderCode, panelCode]) => ({
        orderCode,
        panelCodes: Array.isArray(panelCode) ? panelCode : [panelCode],
        isOverride: orderCode in overrides,
      }))
      .filter(
        (entry) =>
          !search ||
          entry.orderCode.toLowerCase().includes(search.toLowerCase()) ||
          entry.panelCodes.some((c) =>
            c.toLowerCase().includes(search.toLowerCase()),
          ),
      );
  }, [profile, panelMappingsOverride, search]);

  const codeMappings = useMemo(() => {
    const base = profile?.code_mappings ?? {};
    const overrides = codeMappingsOverride ?? {};
    const merged: Record<
      string,
      { code: string; display?: string; system?: string; isOverride: boolean }
    > = {};

    for (const [param, entry] of Object.entries(base)) {
      merged[param] = { ...entry, isOverride: false };
    }
    for (const [param, entry] of Object.entries(overrides)) {
      merged[param] = {
        ...entry,
        display: merged[param]?.display,
        isOverride: true,
      };
    }

    return Object.entries(merged)
      .map(([param, entry]) => ({
        param,
        code: entry.code,
        display: entry.display ?? "",
        system: entry.system ?? "",
        isOverride: entry.isOverride,
      }))
      .filter(
        (entry) =>
          !search ||
          entry.param.toLowerCase().includes(search.toLowerCase()) ||
          entry.code.toLowerCase().includes(search.toLowerCase()) ||
          entry.display.toLowerCase().includes(search.toLowerCase()),
      );
  }, [profile, codeMappingsOverride, search]);

  const hasOverrides =
    (panelMappingsOverride && Object.keys(panelMappingsOverride).length > 0) ||
    (codeMappingsOverride && Object.keys(codeMappingsOverride).length > 0);

  const panelCount = Object.keys({
    ...(profile?.panel_mappings ?? {}),
    ...(panelMappingsOverride ?? {}),
  }).length;
  const observationCount = Object.keys({
    ...(profile?.code_mappings ?? {}),
    ...(codeMappingsOverride ?? {}),
  }).length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("code_mappings_card")}</CardTitle>
        <CardDescription>{t("code_mappings_card_description")}</CardDescription>
        {hasOverrides && (
          <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md w-fit">
            {t("panel_mappings_using_custom")}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            {t("code_mappings_summary", {
              panelCount,
              observationCount,
            })}
          </p>

          <button
            type="button"
            className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 cursor-pointer w-fit"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            <ChevronDown
              className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
            {t("code_mappings_view_all")}
          </button>

          {expanded && (
            <div className="flex flex-col gap-4">
              {(panelMappings.length > 0 || codeMappings.length > 0) && (
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-gray-400" />
                  <Input
                    placeholder={t("search_code_mappings")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              )}

              {panelMappings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {t("panel_mappings")}
                  </p>
                  <Table>
                    <TableHeader className="[&_tr]:border-gray-100">
                      <TableRow>
                        <TableHead className="text-xs">
                          {t("panel_order_code")}
                        </TableHead>
                        <TableHead className="text-xs">
                          {t("device_panel_code")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {panelMappings.map((entry) => (
                        <TableRow
                          key={entry.orderCode}
                          className={`border-gray-100 ${entry.isOverride ? "bg-blue-50/50" : ""}`}
                        >
                          <TableCell className="font-mono text-xs py-1.5">
                            {entry.orderCode}
                          </TableCell>
                          <TableCell className="py-1.5">
                            <div className="flex flex-wrap gap-1">
                              {entry.panelCodes.map((code) => (
                                <span
                                  key={code}
                                  className="inline-block rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-700"
                                >
                                  {code}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {codeMappings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {t("observation_code_mappings")}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t("observation_code_mappings_description")}
                  </p>
                  <Table>
                    <TableHeader className="[&_tr]:border-gray-100">
                      <TableRow>
                        <TableHead className="text-xs">
                          {t("device_parameter")}
                        </TableHead>
                        <TableHead className="text-xs">
                          {t("loinc_code")}
                        </TableHead>
                        <TableHead className="text-xs">
                          {t("display_name")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {codeMappings.map((entry) => (
                        <TableRow
                          key={entry.param}
                          className={`border-gray-100 ${entry.isOverride ? "bg-blue-50/50" : ""}`}
                        >
                          <TableCell className="font-mono text-xs py-1.5">
                            {entry.param}
                          </TableCell>
                          <TableCell className="font-mono text-xs py-1.5">
                            {entry.code}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 py-1.5">
                            {entry.display}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {panelMappings.length === 0 && codeMappings.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  {search ? t("no_results_found") : t("no_code_mappings")}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// --- Editor components for the configure form ---

interface PanelMappingsEditorProps {
  deviceType: string;
  deviceId?: string;
  panelMappings: Record<string, string | string[]> | null;
  onChange: (mappings: Record<string, string | string[]> | null) => void;
}

export const PanelMappingsEditor = ({
  deviceType,
  deviceId,
  panelMappings,
  onChange,
}: PanelMappingsEditorProps) => {
  const { t } = useTranslation();
  const { data: deviceTypesData } = useLabAnalyzerDeviceTypes();
  const [newOrderCode, setNewOrderCode] = useState("");
  const [newPanelCode, setNewPanelCode] = useState("");

  const profile = useMemo(() => {
    return findDeviceProfile(deviceTypesData?.results, deviceType);
  }, [deviceTypesData, deviceType]);

  const { data: linkedAdsData } = useQuery({
    queryKey: ["device-activity-definitions", deviceId],
    queryFn: query(labAnalyzerApi.listActivityDefinitions, {
      pathParams: { deviceExternalId: deviceId! },
    }),
    enabled: !!deviceId,
  });

  const orderCodeSuggestions = useMemo(() => {
    const fromDefaults = Object.keys(profile?.panel_mappings ?? {});
    const fromAds = (linkedAdsData?.results ?? [])
      .map((r) => r.activity_definition_code?.code)
      .filter((code): code is string => !!code);
    return [...new Set([...fromDefaults, ...fromAds])].sort();
  }, [profile, linkedAdsData]);

  const devicePanelCodeSuggestions = useMemo(
    () => uniqueDevicePanelCodes(profile?.panel_mappings),
    [profile],
  );

  const entries = useMemo(() => {
    const base = profile?.panel_mappings ?? {};
    const overrides = panelMappings ?? {};
    const merged = { ...base, ...overrides };
    return Object.entries(merged).map(([orderCode, panelCode]) => ({
      orderCode,
      panelCodes: Array.isArray(panelCode) ? panelCode : [panelCode],
      isOverride: orderCode in overrides,
    }));
  }, [profile, panelMappings]);

  const handleAdd = () => {
    if (!newOrderCode || !newPanelCode) return;
    // Support comma-separated input for multiple codes
    const codes = newPanelCode
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    const value: string | string[] = codes.length === 1 ? codes[0] : codes;
    const updated = { ...(panelMappings ?? {}), [newOrderCode]: value };
    onChange(updated);
    setNewOrderCode("");
    setNewPanelCode("");
  };

  const handleRemove = (orderCode: string) => {
    if (!panelMappings) return;
    const updated = { ...panelMappings };
    delete updated[orderCode];
    onChange(Object.keys(updated).length > 0 ? updated : null);
  };

  return (
    <div className="space-y-3">
      <Label>{t("panel_mappings")}</Label>
      <p className="text-xs text-gray-500">{t("panel_mappings_description")}</p>

      {entries.length > 0 && (
        <Table>
          <TableHeader className="[&_tr]:border-gray-100">
            <TableRow>
              <TableHead className="text-xs">{t("panel_order_code")}</TableHead>
              <TableHead className="text-xs">
                {t("device_panel_code")}
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow
                key={entry.orderCode}
                className={`border-gray-100 ${entry.isOverride ? "bg-blue-50/50" : ""}`}
              >
                <TableCell className="font-mono text-xs py-1.5">
                  {entry.orderCode}
                </TableCell>
                <TableCell className="py-1.5">
                  <div className="flex flex-wrap gap-1">
                    {entry.panelCodes.map((code) => (
                      <span
                        key={code}
                        className="inline-block rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-700"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="py-1.5">
                  {entry.isOverride && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="p-0! cursor-pointer hover:bg-transparent"
                      onClick={() => handleRemove(entry.orderCode)}
                    >
                      <Trash2 className="size-4 text-gray-500" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <SuggestInput
            placeholder={t("panel_order_code")}
            value={newOrderCode}
            onChange={setNewOrderCode}
            suggestions={orderCodeSuggestions}
            className="h-8 text-xs"
          />
        </div>
        <div className="flex-1">
          <SuggestInput
            placeholder={t("device_panel_code")}
            value={newPanelCode}
            onChange={setNewPanelCode}
            suggestions={devicePanelCodeSuggestions}
            className="h-8 text-xs"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          onClick={handleAdd}
          disabled={!newOrderCode || !newPanelCode}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
};

interface CodeMappingsEditorProps {
  deviceType: string;
  codeMappings: Record<string, { code: string; system?: string }> | null;
  onChange: (
    mappings: Record<string, { code: string; system?: string }> | null,
  ) => void;
}

export const CodeMappingsEditor = ({
  deviceType,
  codeMappings,
  onChange,
}: CodeMappingsEditorProps) => {
  const { t } = useTranslation();
  const { data: deviceTypesData } = useLabAnalyzerDeviceTypes();
  const [newParam, setNewParam] = useState("");
  const [newCode, setNewCode] = useState("");

  const profile = useMemo(() => {
    return findDeviceProfile(deviceTypesData?.results, deviceType);
  }, [deviceTypesData, deviceType]);

  const entries = useMemo(() => {
    const base = profile?.code_mappings ?? {};
    const overrides = codeMappings ?? {};
    const merged: Record<
      string,
      { code: string; display?: string; system?: string; isOverride: boolean }
    > = {};

    for (const [param, entry] of Object.entries(base)) {
      merged[param] = { ...entry, isOverride: false };
    }
    for (const [param, entry] of Object.entries(overrides)) {
      merged[param] = {
        ...entry,
        display: merged[param]?.display,
        isOverride: true,
      };
    }

    return Object.entries(merged).map(([param, entry]) => ({
      param,
      code: entry.code,
      display: entry.display ?? "",
      isOverride: entry.isOverride,
    }));
  }, [profile, codeMappings]);

  const handleAdd = () => {
    if (!newParam || !newCode) return;
    const updated = { ...(codeMappings ?? {}), [newParam]: { code: newCode } };
    onChange(updated);
    setNewParam("");
    setNewCode("");
  };

  const handleRemove = (param: string) => {
    if (!codeMappings) return;
    const updated = { ...codeMappings };
    delete updated[param];
    onChange(Object.keys(updated).length > 0 ? updated : null);
  };

  return (
    <div className="space-y-3">
      <Label>{t("code_mappings")}</Label>
      <p className="text-xs text-gray-500">{t("code_mappings_edit_hint")}</p>

      {entries.length > 0 && (
        <Table>
          <TableHeader className="[&_tr]:border-gray-100">
            <TableRow>
              <TableHead className="text-xs">{t("device_parameter")}</TableHead>
              <TableHead className="text-xs">{t("loinc_code")}</TableHead>
              <TableHead className="text-xs">{t("display_name")}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow
                key={entry.param}
                className={`border-gray-100 ${entry.isOverride ? "bg-blue-50/50" : ""}`}
              >
                <TableCell className="font-mono text-xs py-1.5">
                  {entry.param}
                </TableCell>
                <TableCell className="font-mono text-xs py-1.5">
                  {entry.code}
                </TableCell>
                <TableCell className="text-xs text-gray-500 py-1.5">
                  {entry.display}
                </TableCell>
                <TableCell className="py-1.5">
                  {entry.isOverride && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="p-0! cursor-pointer hover:bg-transparent"
                      onClick={() => handleRemove(entry.param)}
                    >
                      <Trash2 className="size-4 text-gray-500" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input
            placeholder={t("device_parameter")}
            value={newParam}
            onChange={(e) => setNewParam(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="flex-1">
          <Input
            placeholder={t("loinc_code")}
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          onClick={handleAdd}
          disabled={!newParam || !newCode}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
};
