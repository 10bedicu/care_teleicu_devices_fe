import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  Pause,
  Play,
  XCircle,
} from "lucide-react";
import { useEffect } from "react";
import {
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useGatewayHealthCheck } from "@/lib/device/hooks/useGatewayHealthCheck";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { NetworkMetrics } from "@/components/common/network-metrics";
import PluginComponent from "@/components/common/plugin-component";

import { useTranslation } from "@/hooks/useTranslation";

interface Props {
  device: {
    care_type: string;
    care_metadata: {
      endpoint_address: string;
    };
  };
}

type ConnectionStatus = "idle" | "checking" | "connected" | "partial" | "error";

const PING_THRESHOLDS = {
  EXCELLENT: 100,
  GOOD: 200,
  FAIR: 500,
};

export const GatewayShowPageCard = ({ device }: Props) => {
  const {
    healthData,
    isLoading,
    error,
    pingHistory,
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
  } = useGatewayHealthCheck(device.care_metadata.endpoint_address);

  useEffect(
    () => {
      if (!isMonitoring) {
        startMonitoring();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isMonitoring],
  );

  const getConnectionStatus = (): ConnectionStatus => {
    if (isLoading) return "checking";
    if (error) return "error";
    if (!healthData) return "idle";
    if (healthData.server && healthData.database) return "connected";
    return "partial";
  };

  const getStatusMessage = () => {
    if (!healthData) return "Service status unknown";

    const operationalCount = [healthData.server, healthData.database].filter(
      Boolean,
    ).length;
    const totalServices = 2;

    if (operationalCount === 0) return "All services are down";
    if (operationalCount === totalServices)
      return "All services are operational";
    return `${operationalCount} of ${totalServices} services are operational`;
  };

  const getStatusIcon = () => {
    const status = getConnectionStatus();
    switch (status) {
      case "checking":
        return <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />;
      case "connected":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "partial":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const { t } = useTranslation();
  // Custom tooltip component for the chart
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: { value: number }[];
    label?: number;
  }) => {
    if (!active || !payload || !payload.length) return null;

    const ping = payload[0].value;
    let qualityLabel = "Poor";
    let qualityColor = "text-red-500";

    if (ping < PING_THRESHOLDS.EXCELLENT) {
      qualityLabel = "Excellent";
      qualityColor = "text-green-600";
    } else if (ping < PING_THRESHOLDS.GOOD) {
      qualityLabel = "Good";
      qualityColor = "text-green-500";
    } else if (ping < PING_THRESHOLDS.FAIR) {
      qualityLabel = "Fair";
      qualityColor = "text-yellow-500";
    }

    return (
      <div className="bg-white p-2 border border-gray-200 rounded-md shadow-md text-xs">
        {label && <p className="font-medium">{formatTimestamp(label)}</p>}
        <p className="flex items-center gap-1 mt-1">
          <span>{t("ping")}:</span>
          <span className={`font-mono font-medium ${qualityColor}`}>
            {ping} {t("ms")}
          </span>
          <span className={`text-xs ${qualityColor}`}>({qualityLabel})</span>
        </p>
      </div>
    );
  };

  return (
    <PluginComponent>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Header with Endpoint and Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Endpoint Address */}
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-500">
                  {t("endpoint_address")}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-medium">
                    {device.care_metadata.endpoint_address}
                  </p>
                  {getStatusIcon()}
                </div>
              </div>

              {/* Monitoring Controls */}
              {getConnectionStatus() !== "idle" && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={isMonitoring ? stopMonitoring : startMonitoring}
                    disabled={getConnectionStatus() !== "connected"}
                  >
                    {isMonitoring ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">
                          {t("pause_monitoring")}
                        </span>
                        <span className="sm:hidden">{t("pause")}</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">
                          {t("start_monitoring")}
                        </span>
                        <span className="sm:hidden">{t("start")}</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Health Status */}
            {getConnectionStatus() !== "idle" && (
              <div className="text-sm">
                <p className="font-medium text-gray-700">
                  {getStatusMessage()}:
                </p>
                <ul className="mt-1 pl-2 font-medium">
                  <li
                    className={
                      healthData?.server ? "text-green-600" : "text-red-600"
                    }
                  >
                    {t("server")}:{" "}
                    {healthData?.server ? t("online") : t("offline")}
                  </li>
                  <li
                    className={
                      healthData?.database ? "text-green-600" : "text-red-600"
                    }
                  >
                    {t("database")}:{" "}
                    {healthData?.database ? t("online") : t("offline")}
                  </li>
                </ul>
                {error && (
                  <p className="mt-1 text-red-600 font-medium">
                    {error instanceof Error ? error.message : String(error)}
                  </p>
                )}
              </div>
            )}

            {/* Network Metrics and Chart */}
            {getConnectionStatus() !== "idle" && metrics.samples > 0 && (
              <div className="space-y-4">
                <NetworkMetrics metrics={metrics} />

                {/* Ping History Chart */}
                <div className="h-[200px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={pingHistory}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      {/* Reference areas for ping quality zones */}
                      <ReferenceArea
                        y1={0}
                        y2={PING_THRESHOLDS.EXCELLENT}
                        fill="#dcfce7"
                        fillOpacity={0.3}
                      />
                      <ReferenceArea
                        y1={PING_THRESHOLDS.EXCELLENT}
                        y2={PING_THRESHOLDS.GOOD}
                        fill="#d1fae5"
                        fillOpacity={0.3}
                      />
                      <ReferenceArea
                        y1={PING_THRESHOLDS.GOOD}
                        y2={PING_THRESHOLDS.FAIR}
                        fill="#fef9c3"
                        fillOpacity={0.3}
                      />
                      <ReferenceArea
                        y1={PING_THRESHOLDS.FAIR}
                        y2={1000}
                        fill="#fee2e2"
                        fillOpacity={0.3}
                      />

                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={formatTimestamp}
                        interval="preserveStartEnd"
                        minTickGap={50}
                        tick={{
                          fontSize: 11,
                          fontFamily: "Figtree, sans-serif",
                        }}
                        stroke="#9ca3af"
                      />
                      <YAxis
                        domain={["dataMin - 10", "dataMax + 10"]}
                        label={{
                          value: `${t("ping")} (${t("ms")})`,
                          angle: -90,
                          // eslint-disable-next-line i18next/no-literal-string
                          position: "insideLeft",
                          style: {
                            // eslint-disable-next-line i18next/no-literal-string
                            textAnchor: "middle",
                            fontSize: 12,
                            // eslint-disable-next-line i18next/no-literal-string
                            fontFamily: "Figtree, sans-serif",
                            // eslint-disable-next-line i18next/no-literal-string
                            fill: "#6b7280",
                          },
                        }}
                        tick={{
                          fontSize: 11,
                          fontFamily: "Figtree, sans-serif",
                        }}
                        stroke="#9ca3af"
                      />

                      {/* Reference lines for quality thresholds */}
                      <ReferenceLine
                        y={PING_THRESHOLDS.EXCELLENT}
                        stroke="#10b981"
                        strokeDasharray="3 3"
                        strokeWidth={1}
                      />
                      <ReferenceLine
                        y={PING_THRESHOLDS.GOOD}
                        stroke="#22c55e"
                        strokeDasharray="3 3"
                        strokeWidth={1}
                      />
                      <ReferenceLine
                        y={PING_THRESHOLDS.FAIR}
                        stroke="#eab308"
                        strokeDasharray="3 3"
                        strokeWidth={1}
                      />

                      <Tooltip content={<CustomTooltip />} />

                      <Line
                        type="monotone"
                        dataKey="ping"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{
                          r: 4,
                          stroke: "#2563eb",
                          strokeWidth: 1,
                          fill: "#ffffff",
                        }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </PluginComponent>
  );
};
