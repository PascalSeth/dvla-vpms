import prisma from "@/lib/prisma";

export interface RecordAuditOptions {
  action: string;
  entity?: string;
  entityId?: string;
  details: string | Record<string, any>;
  performedById?: string | null;
  branchId?: string | null;
  request?: Request;
  ipAddress?: string | null;
}

export function extractClientIp(request?: Request): string | null {
  if (!request) return null;
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
      const firstIp = forwardedFor.split(",")[0].trim();
      if (firstIp) return firstIp;
    }
    const realIp = request.headers.get("x-real-ip");
    if (realIp) return realIp.trim();
    const cfConnectingIp = request.headers.get("cf-connecting-ip");
    if (cfConnectingIp) return cfConnectingIp.trim();
  } catch {
    // Ignore header extraction failures
  }
  return null;
}

/**
 * Centrally and safely records an immutable Audit Log entry into PostgreSQL.
 * Automatically resolves missing branch associations from the performer if available,
 * extracts client IP, and guarantees that audit logging errors never disrupt primary workflows.
 */
export async function recordAuditLog(options: RecordAuditOptions) {
  try {
    const {
      action,
      entity,
      entityId,
      details,
      performedById,
      request,
    } = options;

    let targetBranchId = options.branchId || null;
    const ipAddress = options.ipAddress || extractClientIp(request) || null;

    // If branchId is not directly supplied, attempt to resolve it from the active user's profile
    if (!targetBranchId && performedById) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: performedById },
          select: { branchId: true },
        });
        if (user?.branchId) {
          targetBranchId = user.branchId;
        }
      } catch {
        // Fallback gracefully without throwing
      }
    }

    // Format details into JSON string containing a readable 'message'
    let detailsString: string;
    if (typeof details === "string") {
      detailsString = JSON.stringify({ message: details });
    } else if (typeof details === "object" && details !== null) {
      if (!details.message) {
        detailsString = JSON.stringify({
          message: `${action.replace(/_/g, " ")} on ${entity || "record"} ${entityId || ""}`.trim(),
          ...details,
        });
      } else {
        detailsString = JSON.stringify(details);
      }
    } else {
      detailsString = JSON.stringify({ message: action.replace(/_/g, " ") });
    }

    const createdLog = await prisma.auditLog.create({
      data: {
        action,
        entity: entity || null,
        entityId: entityId || null,
        details: detailsString,
        performedById: performedById || null,
        branchId: targetBranchId,
        ipAddress,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        performedBy: { select: { id: true, name: true, username: true, role: true } },
      },
    });

    return createdLog;
  } catch (error) {
    console.error(`[AUDIT_ERROR] Failed to record audit log for action "${options.action}":`, error);
    return null;
  }
}
