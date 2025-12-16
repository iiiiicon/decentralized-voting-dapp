export interface Candidate {
  id: number;
  name: string;
  description: string;
  voteCount: bigint;
}

export interface VotingInfo {
  id: bigint;
  title: string;
  description: string;
  creator: string;
  startTime: bigint;
  endTime: bigint;
  isActive: boolean;
  totalVotes: bigint;
  candidateCount: bigint;
}

export interface VotingFormData {
  title: string;
  description: string;
  duration: number;
  candidates: { name: string; description: string }[];
}