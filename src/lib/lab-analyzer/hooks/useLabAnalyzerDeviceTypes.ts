import { useQuery } from "@tanstack/react-query";

import labAnalyzerApi from "@/lib/lab-analyzer/labAnalyzerApi";
import { query } from "@/lib/request";

export default function useLabAnalyzerDeviceTypes() {
  return useQuery({
    queryKey: ["labAnalyzerDeviceTypes"],
    queryFn: query(labAnalyzerApi.listDeviceTypes),
    staleTime: Infinity,
  });
}
