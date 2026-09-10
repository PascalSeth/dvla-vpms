import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { emailOrUsername } = await request.json();

    if (!emailOrUsername?.trim()) {
      return NextResponse.json(
        { error: "Please enter your registered email address or username." },
        { status: 400 }
      );
    }

    const cleanInput = emailOrUsername.trim().toLowerCase();

    // Look up user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanInput, mode: "insensitive" } },
          { username: { equals: cleanInput, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        branchId: true,
      },
    });

    if (user && user.email) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      // Send Password Reset Email
      try {
        const { sendPasswordResetEmail } = await import("@/lib/mail");
        await sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          resetToken,
        });
      } catch (mailErr) {
        console.error("Failed sending password reset email:", mailErr);
      }

      // Record Audit Log
      try {
        const { recordAuditLog } = await import("@/lib/audit");
        await recordAuditLog({
          action: "PASSWORD_RESET_REQUESTED",
          entity: "User",
          entityId: user.id,
          details: {
            message: `Password reset requested for officer ${user.name} (@${user.username})`,
            email: user.email,
          },
          performedById: user.id,
          branchId: user.branchId,
          request,
        });
      } catch (auditErr) {
        console.error("Audit log error:", auditErr);
      }
    }

    // Always return success message to prevent user enumeration
    return NextResponse.json({
      success: true,
      message:
        "If an account matches that email or username, an official password reset link has been dispatched to the registered email.",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Unable to process password reset request at this time." },
      { status: 500 }
    );
  }
}
