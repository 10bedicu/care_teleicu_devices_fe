import { LocationList } from "@/lib/types/location";

export interface Encounter {
  id: string;
  patient: {
    id: string;
    name: string;
  };
  facility: {
    id: string;
    name: string;
  };
  current_location?: LocationList;
}
