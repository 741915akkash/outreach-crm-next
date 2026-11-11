import { NextResponse } from 'next/server';

import { generateRequestId } from '@server/context/request-id';

export function proxy(request: Request) {
  const requestId = generateRequestId();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: '/api/:path*',
};
