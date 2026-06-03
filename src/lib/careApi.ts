import { HttpMethod, PaginatedResponse, apiRoutes } from "@/lib/request";
import { LocationList } from "@/lib/types/location";

export interface ServiceRequestCodeMinimal {
  system: string;
  code: string;
  display: string;
}

export interface ServiceRequestPatientMinimal {
  id: string;
  name: string;
  year_of_birth?: number | null;
  date_of_birth?: string | null;
}

export interface ServiceRequestEncounterMinimal {
  id: string;
  patient: ServiceRequestPatientMinimal;
  facility?: { id: string } | null;
}

export interface ServiceRequestSpecimenMinimal {
  id: string;
  status?: string;
  accession_identifier?: string;
}

export interface ServiceRequestActivityDefinitionMinimal {
  id: string;
  title?: string;
}

export interface ServiceRequestReadMinimal {
  id: string;
  title: string;
  status: string;
  code: ServiceRequestCodeMinimal;
  encounter: ServiceRequestEncounterMinimal;
  activity_definition: ServiceRequestActivityDefinitionMinimal;
  specimens: ServiceRequestSpecimenMinimal[];
}

export interface ActivityDefinitionListItem {
  id: string;
  title: string;
  code: { system: string; code: string; display: string } | null;
  classification: string;
  status: string;
}

export default apiRoutes({
  listLocations: {
    path: "/api/v1/facility/{facilityId}/location/",
    method: HttpMethod.GET,
    TResponse: {} as PaginatedResponse<LocationList>,
  },
  listActivityDefinitions: {
    path: "/api/v1/facility/{facilityId}/activity_definition/",
    method: HttpMethod.GET,
    TResponse: {} as PaginatedResponse<ActivityDefinitionListItem>,
  },
  retrieveServiceRequest: {
    path: "/api/v1/facility/{facilityId}/service_request/{serviceRequestId}/",
    method: HttpMethod.GET,
    TResponse: {} as ServiceRequestReadMinimal,
  },
});
