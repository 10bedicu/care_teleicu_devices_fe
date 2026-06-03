import {
  ActivityIcon,
  CctvIcon,
  FlaskConicalIcon,
  ServerIcon,
} from "lucide-react";
import { lazy } from "react";

import { CameraDeviceConfigureForm } from "@/components/camera/configure-form";
import { CameraEncounterOverview } from "@/components/camera/encounter-overview";
import { CameraShowPageCard } from "@/components/camera/show-page-card";
import { GatewayDeviceConfigureForm } from "@/components/gateway/configure-form";
import { GatewayShowPageCard } from "@/components/gateway/show-page-card";
import { LabAnalyzerConfigureForm } from "@/components/lab-analyzer/configure-form";
import { LabAnalyzerShowPageCard } from "@/components/lab-analyzer/show-page-card";
import { VitalsObservationConfigureForm } from "@/components/vitals-observation/configure-form";
import { VitalsObservationEncounterOverview } from "@/components/vitals-observation/encounter-overview";
import { VitalsObservationShowPageCard } from "@/components/vitals-observation/show-page-card";

import routes from "./routes";

const LabAnalyzerSendOrderPanel = lazy(
  () => import("@/components/lab-analyzer/send-order-panel"),
);

const manifest = {
  plugin: "care-gateway-device",
  routes,
  extends: [],
  components: {
    ServiceRequestAction: LabAnalyzerSendOrderPanel,
  },
  devices: [
    {
      type: "gateway",
      icon: ServerIcon,
      configureForm: GatewayDeviceConfigureForm,
      showPageCard: GatewayShowPageCard,
    },
    {
      type: "camera",
      configureForm: CameraDeviceConfigureForm,
      icon: CctvIcon,
      showPageCard: CameraShowPageCard,
      encounterOverview: CameraEncounterOverview,
    },
    {
      type: "vitals-observation",
      icon: ActivityIcon,
      configureForm: VitalsObservationConfigureForm,
      showPageCard: VitalsObservationShowPageCard,
      encounterOverview: VitalsObservationEncounterOverview,
    },
    {
      type: "lab-analyzer",
      icon: FlaskConicalIcon,
      configureForm: LabAnalyzerConfigureForm,
      showPageCard: LabAnalyzerShowPageCard,
    },
  ],
} as const;

export default manifest;
