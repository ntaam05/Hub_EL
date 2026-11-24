export interface VideoDTO {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  channelId?: string;
  channelAvatarUrl?: string;
  viewCount?: number;
  likeCount?: number;
  duration?: string;
  score?: number;
  type?: string; 
  itemCount?: number; 
}

export interface SearchRequest {
  keyword: string;
  minViews?: number;
  minLikes?: number;
  duration?: string;
}