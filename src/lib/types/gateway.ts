export interface LinkedGateway {
  id: string;
  registered_name: string;
  user_friendly_name: string;
  care_type: "gateway";
  care_metadata: {
    endpoint_address: string;
    insecure?: boolean;
    jwks_url?: string;
  };
}
