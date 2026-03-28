export function getAppUrl(request) {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedHost = request.headers.get('x-forwarded-host');

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const origin = request.nextUrl?.origin || new URL(request.url).origin;
  if (origin) {
    return origin;
  }

  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}
