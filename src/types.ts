export type StatusState =
  | 'up'
  | 'up_direct_but_catalog_failed'
  | 'failing'
  | 'payment_or_quota'
  | 'not_checked';

export type LoginObserved = 'none' | 'oauth' | 'credentials' | 'unknown';
export type Access = 'read' | 'write' | 'destructive' | 'spends_money' | 'unknown';
export type Visibility = 'verified' | 'catalog_only' | 'hidden';

export type OperatorLabel =
  | 'vendor_documented'
  | 'verified_domain'
  | 'verified_github'
  | 'verified_domain_elsewhere'
  | 'vendor_domain'
  | 'truefoundry_hosted'
  | 'truefoundry_demo'
  | 'unverified';

export type CostType =
  | 'free'
  | 'free_tier'
  | 'paid_plan'
  | 'per_call'
  | 'free_claimed'
  | 'mentions_pricing'
  | 'unknown';

export interface Check {
  source: string;
  at: string;
  ok: boolean;
  detail: string;
}

export interface ToolItem {
  name: string;
  access: Access;
  access_basis: 'declared' | 'inferred';
  sends_data_out: boolean;
  price_in_description: boolean;
}

export interface Registry {
  name: string;
  method: 'domain' | 'github';
  owner: string;
  status: string;
  version: string;
  first_published: string | null;
  last_published: string | null;
  repository: string | null;
  versions_seen: number;
}

export interface Server {
  slug: string;
  name: string;
  provider: string;
  description: string;
  catalog: {
    category: string | null;
    auth_label: string;
    sample_prompts_generic: boolean;
    curated: boolean;
  };
  server_url: string;
  host: string;
  status: { state: StatusState; checks: Check[] };
  login: {
    claimed: string;
    observed: LoginObserved;
    observed_at: string | null;
    flags: { level: 'blocker' | 'info'; text: string }[];
    oauth: {
      authorization_servers: string[] | null;
      scopes: string[] | null;
      docs: string | null;
      policy: string | null;
      terms: string | null;
    } | null;
    note: string | null;
  };
  tools: {
    visibility: Visibility;
    count: number;
    listed_at: string | null;
    declared_share: number | null;
    access_counts: Partial<Record<Access, number>>;
    est_definition_tokens: number | null;
    items: ToolItem[];
  };
  operator: {
    label: OperatorLabel;
    text: string;
    basis: 'checked' | 'manual' | 'none';
    evidence: string;
    registry: Registry | null;
  };
  cost: {
    type: CostType;
    basis: 'manual' | 'checked' | 'keyword' | null;
    evidence: string | null;
    source: string | null;
    keyword_hint?: string;
    spend_tools: string[];
    priced_tools: string[];
  };
  duplicates: {
    same_endpoint_as: string[];
    possible_duplicates: string[];
    note: string | null;
  };
  connect: {
    direct: unknown;
    via_gateway_url: string;
    catalog_page: string;
  };
  notes: string | null;
  server_info: { name?: string; version?: string } | null;
}

export interface ToolDetail {
  name: string;
  title: string | null;
  description: string | null;
  inputs: string[];
  required: string[];
}

export type ToolDetails = Record<string, ToolDetail[]>;

export type Synonyms = Record<string, string[] | string>;
