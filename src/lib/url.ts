/**
 * Builds the base URL dynamically from request headers.
 * Respects X-Forwarded-Host and X-Forwarded-Proto for reverse proxy setups.
 */
export function getBaseUrl(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("host");

  const hostname = forwardedHost ?? host ?? "localhost:3000";
  const protocol = forwardedProto ?? "http";

  return `${protocol}://${hostname}`;
}

export function getUploadUrl(request: Request, galleryId: string): string {
  return `${getBaseUrl(request)}/gallery/${galleryId}/upload`;
}
