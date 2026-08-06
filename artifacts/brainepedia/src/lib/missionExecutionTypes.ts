/** Mission execution phase (backend MissionExecutionPhase enum) */
export enum MissionExecutionPhase {
  Assigned = 0,
  WorkspaceCreated = 1,
  BriefReviewed = 2,
  Planning = 3,
  TaskBreakdown = 4,
  EvidenceCollection = 5,
  Coaching = 6,
  FinalSubmission = 7,
  TechnicalReview = 8,
  Feedback = 9,
  Reflection = 10,
  Completed = 11,
}

/** Submission stage (backend SubmissionStage enum) */
export enum SubmissionStage {
  Draft = 0,
  ReviewRequested = 1,
  FinalSubmitted = 2,
  Evaluated = 3,
}

/** Experience session status */
export enum SessionStatus {
  Active = 0,
  Submitted = 1,
  Evaluated = 2,
  Abandoned = 3,
}

/** Evidence type (backend EvidenceType enum) */
export enum EvidenceType {
  File = 1,
  Screenshot = 2,
  Video = 3,
  Audio = 4,
  Link = 5,
  Document = 6,
  Image = 7,
  ExternalReference = 8,
}

/** Mentor conversation intent */
export enum ConversationIntent {
  Question = 1,
  RequestHint = 2,
  Explanation = 3,
  DecisionSupport = 4,
  Feedback = 5,
  Confirmation = 6,
}

export interface MissionCheckpointDto {
  checkpointProgressId: string;
  name: string;
  description: string;
  order: number;
  isRequired: boolean;
  isCompleted: boolean;
  xpReward: number;
}

export interface MissionEvidenceDto {
  evidenceId?: string;
  title: string;
  description: string;
  evidenceType: number;
  url: string;
  createdAt?: string;
}

export interface MissionDraftDto {
  draftId: string;
  approachExplanation: string;
  codeSnippet: string;
  evidenceLinks: string[];
  stage: number;
  version: number;
  lastSavedAt: string;
}

export interface MissionWorkspaceDto {
  sessionId: string;
  problemNodeId: string;
  missionTitle: string;
  missionBrief: string;
  currentPhase: number;
  submissionStage: number;
  progressPercentage: number;
  briefReviewed: boolean;
  isReadyForFinalSubmission: boolean;
  employerChallengeAssignmentId?: string;
  checkpoints: MissionCheckpointDto[];
  evidence: MissionEvidenceDto[];
  latestDraft?: MissionDraftDto;
  sessionXpEarned: number;
}

export interface ReadinessDto {
  isReady: boolean;
  briefReviewed: boolean;
  requiredCheckpointsCompleted: boolean;
  hasExplanation: boolean;
  hasRequiredEvidence: boolean;
  missingRequirements: string[];
}

export interface MentorMessageDto {
  sender: number;
  message: string;
  responseType?: number;
  createdAt?: string;
  suggestedNextActions?: string[];
}

export interface MentorResponseDto {
  response: string;
  responseType: number;
  suggestedNextActions: string[];
  mentorInteractionCount: number;
  xpAwarded: number;
}

export interface ReflectionDto {
  whatLearned: string;
  whatToImprove: string;
  whatChallenged: string;
  savedAt?: string;
}

export interface ExtendedEvaluationFeedback {
  positiveFeedback?: string[] | string;
  improvementAreas?: string[] | string;
  strengths?: string[] | string;
  weaknesses?: string[] | string;
  missingRequirements?: string[];
  riskAssessment?: string[];
}

export interface ExtendedProcessResult {
  evaluationId?: string;
  score: number;
  isPassed: boolean;
  feedback?: ExtendedEvaluationFeedback;
  clientAcceptance?: string;
  finalRecommendation?: string;
  confidenceScore?: number;
  practicalityScore?: number;
  professionalismScore?: number;
  communicationScore?: number;
  creativityScore?: number;
  planningScore?: number;
  improvementScore?: number;
  mentoringScore?: number;
  taskCompletionScore?: number;
  evidenceScore?: number;
  requiresReflection?: boolean;
  netXpGained?: number;
  missionTitle?: string;
}

export const XP_HINTS = {
  missionStart: 5,
  checkpoint: 10,
  evidence: 10,
  mentor: 5,
  submission: 30,
} as const;

export const PHASE_LABELS: Record<number, string> = {
  [MissionExecutionPhase.Assigned]: "Mission Assigned",
  [MissionExecutionPhase.WorkspaceCreated]: "Workspace Ready",
  [MissionExecutionPhase.BriefReviewed]: "Brief Reviewed",
  [MissionExecutionPhase.Planning]: "Planning",
  [MissionExecutionPhase.TaskBreakdown]: "Task Breakdown",
  [MissionExecutionPhase.EvidenceCollection]: "Evidence Collection",
  [MissionExecutionPhase.Coaching]: "Coaching",
  [MissionExecutionPhase.FinalSubmission]: "Final Submission",
  [MissionExecutionPhase.TechnicalReview]: "Technical Review",
  [MissionExecutionPhase.Feedback]: "Feedback",
  [MissionExecutionPhase.Reflection]: "Reflection",
  [MissionExecutionPhase.Completed]: "Completed",
};

export const EVIDENCE_TYPE_OPTIONS = [
  { value: EvidenceType.Link, label: "Link (URL)" },
  { value: EvidenceType.File, label: "File" },
  { value: EvidenceType.Screenshot, label: "Screenshot" },
  { value: EvidenceType.Video, label: "Video" },
  { value: EvidenceType.Audio, label: "Audio" },
  { value: EvidenceType.Document, label: "Document" },
  { value: EvidenceType.Image, label: "Image" },
  { value: EvidenceType.ExternalReference, label: "External Reference" },
] as const;
