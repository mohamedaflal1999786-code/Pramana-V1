/**
 * Pramana-V1 Contact Inquiries API Route Handler
 * Endpoint: POST /api/contact
 * Team: Unknown GenZ
 *
 * Implements server-side validation, anti-abuse rate limiting, PHI guard,
 * and database persistence backed by PostgreSQL 'contact_inquiries'.
 */

import { NextRequest, NextResponse } from "next/server";
import { submitContactInquiry, ContactInquiryInput } from "@/lib/services/contact.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract client IP and User-Agent
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    const payload: ContactInquiryInput = {
      name: body.fullName || body.name || "",
      email: body.email || "",
      organization_name: body.institution || body.organization_name || "",
      role_title: body.role || body.role_title || "Clinical Investigator",
      inquiry_type: (body.inquiryType || body.inquiry_type || "pilot_inquiry") as any,
      message: body.message || "",
    };

    const result = await submitContactInquiry(payload, clientIp, userAgent);

    if (!result.success) {
      const isRateLimited = result.message.includes("Rate limit");
      return NextResponse.json(
        {
          success: false,
          persisted: false,
          message: result.message,
          errors: result.errors || [],
        },
        { status: isRateLimited ? 429 : 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        persisted: result.persisted,
        inquiryId: result.inquiryId,
        message: result.message,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Malformed request";
    return NextResponse.json(
      {
        success: false,
        persisted: false,
        message: "Failed to parse contact request payload.",
        errors: [msg],
      },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      error: "Method Not Allowed. POST a JSON payload with institutional inquiry details.",
      endpoint: "/api/contact",
    },
    { status: 405 }
  );
}
