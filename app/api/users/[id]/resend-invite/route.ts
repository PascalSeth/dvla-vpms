import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        branch: {
          select: { name: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (!user.email) {
      return NextResponse.json(
        { error: "This user does not have a registered email address." },
        { status: 400 }
      );
    }

    // Generate fresh reset token and temp password
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const tempPassword = `DVLA-${crypto.randomBytes(3).toString("hex").toUpperCase()}!`;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
        password: tempPassword,
        mustResetPassword: true,
      },
    });

    // Send Welcome / Activation Email
    const { sendWelcomeNewUserEmail } = await import("@/lib/mail");
    const emailResult = await sendWelcomeNewUserEmail({
      to: user.email,
      name: user.name,
      username: user.username,
      tempPassword,
      resetToken,
      role: user.role,
      branchName: user.branch?.name,
    });

    return NextResponse.json({
      success: true,
      message: `Activation email re-dispatched to ${user.email}.`,
      emailDispatched: emailResult.delivered,
      emailNote: emailResult.note,
    });
  } catch (error: any) {
    console.error("Resend invite error:", error);
    return NextResponse.json(
      { error: "Failed to resend invitation email." },
      { status: 500 }
    );
  }
}
