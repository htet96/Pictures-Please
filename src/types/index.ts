export type DisplayMode = "MASONRY" | "GRID" | "SLIDESHOW" | "CAROUSEL";
export type PhotoStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface GalleryWithCount {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  displayMode: DisplayMode;
  requireApproval: boolean;
  allowUserDelete: boolean;
  allowUserUpload: boolean;
  isPublic: boolean;
  hasPassword: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    photos: number;
  };
}

export interface PhotoPublic {
  id: string;
  galleryId: string;
  thumbnailPath: string;
  originalPath: string;
  filename: string;
  width: number;
  height: number;
  status: PhotoStatus;
  uploaderName: string | null;
  createdAt: string;
}

export interface GlobalSettingsData {
  allowUserGalleries: boolean;
  defaultRequireApproval: boolean;
  defaultAllowUserDelete: boolean;
}
