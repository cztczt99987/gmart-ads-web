/**
 * TikTok Video API
 * Based on TikTok Direct Post API guidelines
 * https://developers.tiktok.com/doc/content-sharing-guidelines
 */

import { requestClient } from '#/api/request';

// ==================== Types ====================

/**
 * TikTok OAuth authorization state
 */
export interface TiktokAuthState {
  authorized: boolean;
  creatorId?: string;
  nickname?: string;
  avatarUrl?: string;
  expiresAt?: string;
}

/**
 * Authorized TikTok account item
 */
export interface TiktokAccountItem {
  avatar?: string;
  avatarUrl?: string;
  bioDescription?: string;
  canMakePost?: boolean;
  createdAt?: string;
  createTime?: string;
  displayName?: string;
  followerCount?: number;
  followingCount?: number;
  likesCount?: number;
  maxVideoPostDurationSec?: number;
  nickname?: string;
  openId?: string;
  privacyLevelOptions?: string[];
  profileDeepLink?: string;
  revokedAt?: null | string;
  scope?: string;
  status?: number;
  syncedAt?: string;
  tid?: string;
  tokenType?: string;
  ttAccountId: string;
  uid?: string;
  unionId?: string;
  updatedAt?: string;
  username?: string;
  videoCount?: number;
}

export interface TiktokAccountListResponse {
  list: TiktokAccountItem[];
  total: number;
}

export interface TiktokVideoAuthUrlPayload {
  authorizationUrl?: string;
  authUrl?: string;
  redirectUrl?: string;
  url?: string;
}

/**
 * TikTok authorization callback params
 */
export interface TiktokAuthCallbackParams {
  code: string;
  state: string;
  scopes?: string;
}

/**
 * TikTok authorization response
 */
export interface TiktokAuthResponse {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  scope: string;
  tokenType: string;
}

/**
 * Creator information from TikTok API
 */
export interface TiktokCreatorInfo {
  commentDisabled: boolean;
  creatorAvatarUrl: string;
  creatorNickname: string;
  creatorUsername: string;
  duetDisabled: boolean;
  maxVideoPostDurationSec: number;
  privacyLevelOptions: string[];
  stitchDisabled: boolean;
  tid: string;
}

export interface VideoPublishParams {
  brandContentToggle: boolean;
  brandOrganicToggle: boolean;
  disableComment: boolean;
  disableDuet: boolean;
  disableStitch: boolean;
  fileId: string;
  isAigc: boolean;
  privacyLevel: string;
  remark: string;
  tid: string;
  title: string;
  type: 0;
  videoCoverTimestampMs: number;
}

interface FileUploadResponse {
  fileId?: string;
  id?: string;
}

/**
 * Video upload request
 */
export interface TiktokVideoUploadRequest {
  brandContentToggle: boolean;
  brandOrganic: boolean;
  brandedContent: boolean;
  description?: string;
  disableComment: boolean;
  disableDuet: boolean;
  disableStitch: boolean;
  privacyLevel: string;
  title: string;
  ttAccountId?: string;
  videoFile?: File;
  videoUrl?: string;
}

/**
 * Video item
 */
export interface TiktokVideoItem {
  brandContentToggle: boolean;
  brandOrganicToggle: boolean;
  createdAt: string;
  disableComment: boolean;
  disableDuet: boolean;
  disableStitch: boolean;
  error?: string;
  id: string;
  isAigc: boolean;
  privacyLevel: string;
  publishAt: string;
  publishId?: string;
  publishStatus: -1 | 0 | 1;
  remark?: string;
  tid: string;
  title: string;
  type: number;
  uploadUrl?: string;
  username?: string;
  videoCoverTimestampMs: number;
}

/**
 * Video list query parameters
 */
export interface TiktokVideoQueryParams {
  endDate?: string;
  page?: number;
  pageSize?: number;
  publishStatus?: -1 | 0 | 1;
  startDate?: string;
  title?: string;
  username?: string;
}

/**
 * Video list response
 */
export interface TiktokVideoListResponse {
  list: TiktokVideoItem[];
  total: number;
}

/**
 * Publish status response
 */
export interface TiktokPublishStatus {
  embedUrl?: string;
  failReason?: string;
  publishId: string;
  shareUrl?: string;
  status: 'FAILED' | 'PENDING' | 'PROCESSING' | 'PUBLISHED' | 'PUBLISHING';
}

// ==================== API Functions ====================

// ==================== OAuth Authorization ====================

/**
 * Get TikTok OAuth authorization URL
 * Redirect user to this URL to authorize their TikTok account
 */
export async function getTiktokAuthUrlApi() {
  return requestClient.get<{ authUrl: string; state: string }>(
    '/v1/tiktok/auth/url',
  );
}

/**
 * Get OAuth redirect URL for TikTok video authorization
 */
export async function getTiktokVideoAuthUrlApi() {
  return requestClient.get<string | TiktokVideoAuthUrlPayload>(
    '/v1/auth/tiktok/video',
  );
}

/**
 * Handle TikTok OAuth callback
 * Exchange authorization code for access token
 */
export async function handleTiktokAuthCallbackApi(
  params: TiktokAuthCallbackParams,
) {
  return requestClient.post<TiktokAuthResponse>(
    '/v1/tiktok/auth/callback',
    params,
  );
}

/**
 * Check if user has authorized TikTok account
 */
export async function getTiktokAuthStateApi() {
  return requestClient.get<TiktokAuthState>('/v1/tiktok/auth/state');
}

/**
 * Disconnect TikTok account
 */
export async function disconnectTiktokAccountApi() {
  return requestClient.delete('/v1/tiktok/auth/disconnect');
}

/**
 * Disconnect TikTok video account by tid
 */
export async function disconnectTiktokVideoAccountApi(tid: string) {
  return requestClient.delete(`/v1/auth/tiktok/video/${tid}`);
}

/**
 * Get all authorized TikTok accounts for current user
 */
export async function getTiktokAccountListApi() {
  return requestClient.get<TiktokAccountListResponse>('/v1/users/tt');
}

/**
 * Refresh TikTok access token
 */
export async function refreshTiktokTokenApi() {
  return requestClient.post<TiktokAuthResponse>('/v1/tiktok/auth/refresh');
}

// ==================== Creator Info ====================

/**
 * Get creator information
 * Required for UX: display creator nickname and check posting limits
 */
export async function getTiktokCreatorInfoApi(tid: string) {
  return requestClient.get<TiktokCreatorInfo>(`/v1/video/creator/info/${tid}`);
}

/**
 * Upload short video file and return fileId
 * bizType: 10 = 短视频发布
 */
export async function uploadShortVideoFileApi(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bizType', '10');
  return requestClient.post<FileUploadResponse>('/v1/file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/**
 * Submit publish task
 */
export async function publishTiktokVideoApi(params: VideoPublishParams) {
  return requestClient.post('/v1/video/publish', params);
}

/**
 * Upload video to TikTok
 * Uses FILE_UPLOAD when video is on user's device
 * Uses PULL_FROM_URL when video is already on server
 */
export async function uploadTiktokVideoApi(data: FormData) {
  return requestClient.post<TiktokVideoItem>('/v1/tiktok/video/upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/**
 * Get video list
 */
export async function getTiktokVideoListApi(params?: TiktokVideoQueryParams) {
  return requestClient.get<TiktokVideoListResponse>('/v1/video/publish', {
    params,
  });
}

/**
 * Get video detail
 */
export async function getTiktokVideoDetailApi(id: string) {
  return requestClient.get<TiktokVideoItem>(`/v1/tiktok/video/${id}`);
}

/**
 * Get publish status
 * Poll this API to track video processing status
 */
export async function getTiktokPublishStatusApi(publishId: string) {
  return requestClient.get<TiktokPublishStatus>(
    `/v1/tiktok/video/status/${publishId}`,
  );
}

/**
 * Delete video
 */
export async function deleteTiktokVideoApi(id: string) {
  return requestClient.delete(`/v1/tiktok/video/${id}`);
}

/**
 * Get video upload URL for large files (optional)
 * For videos larger than 100MB, use chunked upload
 */
export async function getTiktokVideoUploadUrlApi() {
  return requestClient.get<{ uploadId: string; uploadUrl: string }>(
    '/v1/tiktok/video/upload-url',
  );
}

// ==================== Constants ====================

/**
 * Privacy level options
 * These should be fetched from creator_info API
 * This is a fallback list
 */
export const PRIVACY_LEVEL_OPTIONS = [
  { label: 'FOLLOWER_OF_CREATOR', value: 'FOLLOWER_OF_CREATOR' },
  { label: 'MUTUAL_FOLLOW_FRIENDS', value: 'MUTUAL_FOLLOW_FRIENDS' },
  { label: 'PUBLIC_TO_EVERYONE', value: 'PUBLIC_TO_EVERYONE' },
  { label: 'SELF_ONLY', value: 'SELF_ONLY' },
];

/**
 * Video status map for display
 */
export const VIDEO_STATUS_MAP: Record<number, { color: string; text: string }> =
  {
    [-1]: { color: 'error', text: '发布失败' },
    0: { color: 'default', text: '待发布' },
    1: { color: 'success', text: '发布成功' },
  };

/**
 * Max video file size (bytes)
 * TikTok limit is typically 500MB for web upload
 */
export const MAX_VIDEO_SIZE = 500 * 1024 * 1024;

/**
 * Allowed video formats
 */
export const ALLOWED_VIDEO_FORMATS = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
];
