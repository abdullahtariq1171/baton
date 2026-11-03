export type Checkpoint = {
  id: string;
  task: string;
  decisions: string[];
  nextSteps: string[];
  evidence: string[];
  createdAt: string;
};

export type CheckpointInput = {
  task: string;
  decisions: string[];
  nextSteps: string[];
  evidence: string[];
};
