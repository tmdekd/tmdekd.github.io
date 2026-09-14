export interface MediaAsset {
  type: 'image' | 'video' | 'diagram' | 'placeholder';
  src?: string;
  poster?: string;
  alt: string;
  caption?: string;
  aspectRatio: string;
  captionsSrc?: string;
}

export interface Project {
  title: string;
  subtitle: string;
  order: number;
  period: string;
  role: string;
  platform: string;
  result: string;
  summary: string;
  tech: string[];
  githubUrl?: string;
  demoUrl?: string;
  heroMedia: MediaAsset;
  media: MediaAsset[];
  draft: boolean;
}
