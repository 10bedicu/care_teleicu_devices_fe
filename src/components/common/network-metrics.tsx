import { Activity, Waves } from "lucide-react";

import { useTranslation } from "@/hooks/useTranslation";

export interface PingMetrics {
  current: number;
  min: number;
  max: number;
  avg: number;
  jitter: number;
  samples: number;
}

interface NetworkMetricsProps {
  metrics: PingMetrics;
}

const getPingQualityLabel = (ping: number) => {
  if (ping < 100) return { label: "Excellent", color: "text-green-600" };
  if (ping < 200) return { label: "Good", color: "text-green-500" };
  if (ping < 500) return { label: "Fair", color: "text-yellow-500" };
  return { label: "Poor", color: "text-red-500" };
};

const getJitterQualityLabel = (jitter: number) => {
  if (jitter < 10) return { label: "Excellent", color: "text-green-600" };
  if (jitter < 30) return { label: "Good", color: "text-green-500" };
  if (jitter < 70) return { label: "Fair", color: "text-yellow-500" };
  return { label: "Poor", color: "text-red-500" };
};

export const NetworkMetrics = ({ metrics }: NetworkMetricsProps) => {
  const { t } = useTranslation();

  if (metrics.samples === 0) return null;

  const { label: latencyLabel, color: latencyColor } = getPingQualityLabel(
    metrics.current,
  );

  return (
    <div className="mt-4 pt-3 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-semibold text-gray-700">
            {t("network_metrics")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex flex-col">
          <span className="text-gray-500 font-medium mb-1">
            {t("latency")}:
          </span>
          <span className={`${latencyColor} font-semibold`}>
            {metrics.current} {t("ms")}{" "}
            <span className="font-medium">({latencyLabel})</span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500 font-medium mb-1">
            {t("min")} / {t("avg")} / {t("max")}:
          </span>
          <span className="font-mono">
            <span className="text-green-600 font-semibold">
              {metrics.min} {t("ms")}
            </span>
            <span className="text-gray-400"> / </span>
            <span
              className={`${
                getPingQualityLabel(metrics.avg).color
              } font-semibold`}
            >
              {metrics.avg} {t("ms")}
            </span>
            <span className="text-gray-400"> / </span>
            <span
              className={`${
                getPingQualityLabel(metrics.max).color
              } font-semibold`}
            >
              {metrics.max} {t("ms")}
            </span>
          </span>
        </div>
        <div className="flex flex-col col-span-2 mt-1">
          <div className="flex items-center gap-2">
            <Waves className="h-4 w-4 text-gray-500" />
            <span className="text-gray-500 font-medium">{t("jitter")}:</span>
            <span
              className={`${
                getJitterQualityLabel(metrics.jitter).color
              } font-semibold`}
            >
              {metrics.jitter} {t("ms")}{" "}
              <span className="font-medium">
                ({getJitterQualityLabel(metrics.jitter).label})
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
