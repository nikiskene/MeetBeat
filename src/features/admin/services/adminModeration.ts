export type ModerationCase = {
  id: string;
  caseNumber: number;
  type: string;
  status: string;
  priority: string;
  title: string;
  description: string | null;
  primaryMemberId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ModerationEvent = {
  id: string;
  eventType: string;
  category: string;
  subjectType: string | null;
  subjectId: string | null;
  relatedCaseId: string | null;
  relatedMemberId: string | null;
  severity: string;
  summary: string | null;
  createdAt: string;
};

export type ModerationLink = {
  id: string;
  caseId: string;
  linkType: string;
  linkedId: string | null;
  linkedText: string | null;
};

export type ModerationMember = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  country: string | null;
  isBanned: boolean;
};

export type ModerationSnapshot = {
  cases: ModerationCase[];
  events: ModerationEvent[];
  links: ModerationLink[];
  members: Record<string, ModerationMember>;
  unavailableReason: string | null;
};

export async function fetchModerationSnapshot(): Promise<ModerationSnapshot> {
  return {
    cases: [],
    events: [],
    links: [],
    members: {},
    unavailableReason: 'Moderation records require an operator-safe backend read service. Existing tables remain protected by row-level security.',
  };
}

export const moderationCapabilities = {
  markReviewed: false,
  createCase: false,
};
