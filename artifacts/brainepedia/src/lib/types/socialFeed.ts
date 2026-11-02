/** DTOs for the public feed, follows, external jobs, and compatibility report. */

export type FeedPostType =
  | "UserPost"
  | "Job"
  | "CandidateProgress"
  | "MissionResult"
  | "ForumPost"
  | "ForumComment"
  | "SystemAnnouncement"
  | "ExternalJob";

export type FeedVisibility = "Public" | "Followers" | "Private";

export type EmploymentType = "FullTime" | "PartTime" | "Contract" | "Internship" | "Freelance";

export type ExperienceLevel = "Entry" | "Junior" | "Mid" | "Senior" | "Lead";

export type CompatibilityJobType = "Internal" | "External";

export type CompatibilityLevel =
  | "NeedsDevelopment"
  | "PartiallyCompatible"
  | "Compatible"
  | "HighlyCompatible";

export type ApplicationType = "Internal" | "External";

export interface FeedAuthorDto {
  userId: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface FeedRelatedEntityDto {
  type: string | null;
  id: string | null;
}

export interface FeedPostDto {
  feedPostId: string;
  postType: FeedPostType | string;
  title: string | null;
  content: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  author: FeedAuthorDto | null;
  relatedEntity: FeedRelatedEntityDto | null;
  professionId: string | null;
  topicId: string | null;
  jobPostingId: string | null;
  externalJobId: string | null;
  organisationName: string | null;
  linkUrl: string | null;
  visibility: FeedVisibility | string | null;
  likeCount: number | null;
  commentCount: number | null;
  isLikedByCurrentUser: boolean;
  isFollowedByCurrentUser: boolean;
  isFollowingAuthor: boolean;
  publishedAt: string | null;
  createdAt: string | null;
}

export interface FeedListResponse {
  items: FeedPostDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface FeedQuery {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  postType?: FeedPostType | "";
  professionId?: string;
  topic?: string;
  jobId?: string;
  candidateId?: string;
  organisation?: string;
  fromDate?: string;
  toDate?: string;
}

export interface FeedPostCreateDto {
  title?: string | null;
  content: string;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  professionId?: string | null;
  topicId?: string | null;
  visibility?: FeedVisibility | null;
}

export interface FeedCommentDto {
  commentId: string;
  postId: string;
  content: string | null;
  author: FeedAuthorDto | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface FeedCommentCreateDto {
  content: string;
}

export interface FeedLikeResponseDto {
  postId: string;
  liked: boolean;
  likeCount: number;
}

export interface FeedSettingsDto {
  shareXpProgress: boolean;
  shareMissionResults: boolean;
  sharePortfolioUpdates: boolean;
}

export interface FollowResponseDto {
  userId: string;
  following: boolean;
  followerCount: number | null;
}

export interface PublicFollowUserDto {
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
  profession: string | null;
  currentTitle: string | null;
}

export interface ExternalJobDto {
  externalJobId: string;
  jobTitle: string | null;
  jobDescription: string | null;
  organisationName: string | null;
  organisationLogoUrl: string | null;
  organisationWebsite: string | null;
  location: string | null;
  country: string | null;
  employmentType: EmploymentType | string | null;
  experienceLevel: ExperienceLevel | string | null;
  salaryInformation: string | null;
  applicationType: ApplicationType | string | null;
  applicationUrl: string | null;
  professionId: string | null;
  professionName: string | null;
  closingDate: string | null;
  createdAt: string | null;
  isActive?: boolean | null;
  shareToFeed?: boolean | null;
  createdByUserId?: string | null;
  updatedAt?: string | null;
}

export interface ExternalJobCreateDto {
  jobTitle: string;
  jobDescription: string;
  organisationName: string;
  organisationLogoUrl?: string | null;
  organisationWebsite?: string | null;
  location?: string | null;
  country?: string | null;
  employmentType?: EmploymentType | null;
  experienceLevel?: ExperienceLevel | null;
  salaryInformation?: string | null;
  applicationUrl: string;
  professionId?: string | null;
  isActive?: boolean | null;
  shareToFeed?: boolean | null;
  closingDate?: string | null;
}

export interface ExternalJobQuery {
  search?: string;
  profession?: string;
  location?: string;
  employmentType?: EmploymentType | "";
  experienceLevel?: ExperienceLevel | "";
  organisation?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface CompatibilityReportRequestDto {
  jobIds?: string[];
  includeInternalJobs?: boolean;
  includeExternalJobs?: boolean;
  professionId?: string | null;
  customInstruction?: string | null;
}

export interface CompatibilityCandidateDto {
  userId: string | null;
  fullName: string | null;
  profession: string | null;
}

export interface CompatibilityResultDto {
  jobId: string;
  jobType: CompatibilityJobType | string | null;
  jobTitle: string | null;
  organisationName: string | null;
  compatibilityScore: number | null;
  compatibilityLevel: CompatibilityLevel | string | null;
  whyItMatches: string[];
  matchingSkills: string[];
  matchingExperience: string[];
  missingSkills: string[];
  missingExperience: string[];
  improvementRecommendations: string[];
  applicationUrl: string | null;
  applicationType: ApplicationType | string | null;
}

export interface CompatibilityReportDto {
  reportId: string | null;
  candidate: CompatibilityCandidateDto | null;
  totalJobsEvaluated: number | null;
  results: CompatibilityResultDto[];
  generalRecommendations: string[];
  disclaimer: string | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
