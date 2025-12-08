import { i18nRouter } from 'next-i18n-router';
import i18nConfig from './i18nConfig';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // 1. Rate Limiting (Basic Placeholder)
    // In production, use Upstash Redis or similar
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    // console.log(`Request from ${ip}`);

    // 2. i18n Routing
    return i18nRouter(request, i18nConfig);
}

export const config = {
    matcher: '/((?!api|static|impersonate|.*\\..*|_next).*)'
};
