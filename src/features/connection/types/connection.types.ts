export type ConnectionDimension = 'depth' | 'directness' | 'focus' | 'structure' | 'pace';

export type ConnectionAnswer = { id: 'a' | 'b' | 'c'; text: string; score: number };
export type ConnectionQuestion = {
  id: string;
  dimension: ConnectionDimension;
  text: string;
  answers: ConnectionAnswer[];
};

export type ConnectionProfile = {
  version: number;
  dimensions: Record<ConnectionDimension, number>;
  labels: Record<ConnectionDimension, string>;
  identifier: string;
};

export type StoredConnectionProfile = {
  user_id: string;
  questionnaire_version: number;
  answers: Record<string, string>;
  profile: ConnectionProfile;
  completed_at: string;
  updated_at: string;
};
