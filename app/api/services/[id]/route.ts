import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const service = await prisma.serviceType.findUnique({
      where: { id },
      include: {
        branch: true,
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service type not found" }, { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch service type" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const body = await request.json();
    const {
      code,
      name,
      description,
      category,
      isGlobal,
      branchId,
      isActive,
      requiresPreviousOwner,
      prevOwnerRequireName,
      prevOwnerRequirePhone,
      prevOwnerRequireAddress,
      prevOwnerRequireCustom,
      prevOwnerCustomLabel,
      userId,
    } = body;

    const existing = await prisma.serviceType.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Service type not found" }, { status: 404 });
    }

    // Role-based Scope Permission Check
    let userRole = body.userRole || null;
    let userBranchId: string | null = null;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, branchId: true },
      });
      if (user) {
        userRole = user.role;
        userBranchId = user.branchId;
      }
    }

    const isActorSuperAdmin = userRole ? userRole.toUpperCase() === "SUPERADMIN" : false;

    if (!isActorSuperAdmin) {
      // Non-superadmin cannot convert any service to Global
      if (isGlobal === true) {
        return NextResponse.json(
          { error: "Permission Denied: Only Super Administrators have authority to designate nationwide Global services." },
          { status: 403 }
        );
      }
      // Non-superadmin cannot edit a global service
      if (existing.isGlobal) {
        return NextResponse.json(
          { error: "Permission Denied: Only Super Administrators can modify nationwide Global service types." },
          { status: 403 }
        );
      }
      // Non-superadmin cannot edit or reassign services of another branch
      if (existing.branchId && userBranchId && existing.branchId !== userBranchId) {
        return NextResponse.json(
          { error: "Permission Denied: You cannot modify service types belonging to another station." },
          { status: 403 }
        );
      }
      if (branchId && userBranchId && branchId !== userBranchId) {
        return NextResponse.json(
          { error: "Permission Denied: You cannot reassign services to another station." },
          { status: 403 }
        );
      }
    }

    const updateData: any = {};

    if (code !== undefined) {
      const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
      if (cleanCode !== existing.code) {
        const dup = await prisma.serviceType.findUnique({ where: { code: cleanCode } });
        if (dup) {
          return NextResponse.json(
            { error: `Service code "${cleanCode}" is already in use.` },
            { status: 400 }
          );
        }
        updateData.code = cleanCode;
      }
    }

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (category !== undefined) updateData.category = category?.trim() || "PRIVATE";
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (requiresPreviousOwner !== undefined) updateData.requiresPreviousOwner = Boolean(requiresPreviousOwner);
    if (prevOwnerRequireName !== undefined) updateData.prevOwnerRequireName = Boolean(prevOwnerRequireName);
    if (prevOwnerRequirePhone !== undefined) updateData.prevOwnerRequirePhone = Boolean(prevOwnerRequirePhone);
    if (prevOwnerRequireAddress !== undefined) updateData.prevOwnerRequireAddress = Boolean(prevOwnerRequireAddress);
    if (prevOwnerRequireCustom !== undefined) updateData.prevOwnerRequireCustom = Boolean(prevOwnerRequireCustom);
    if (prevOwnerCustomLabel !== undefined) updateData.prevOwnerCustomLabel = prevOwnerCustomLabel?.trim() || null;

    if (isActorSuperAdmin && isGlobal !== undefined) {
      updateData.isGlobal = Boolean(isGlobal);
      if (isGlobal) {
        updateData.branchId = null;
      } else if (branchId) {
        updateData.branchId = branchId;
      }
    } else if (branchId !== undefined && !existing.isGlobal) {
      updateData.branchId = isActorSuperAdmin ? (branchId || null) : (userBranchId || existing.branchId);
    }

    const updated = await prisma.serviceType.update({
      where: { id },
      data: updateData,
      include: {
        branch: true,
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });

    // Create Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          action: "SERVICE_TYPE_UPDATED",
          entity: "ServiceType",
          entityId: updated.id,
          details: JSON.stringify({
            code: updated.code,
            name: updated.name,
            changes: Object.keys(updateData),
          }),
          performedById: userId || null,
          branchId: updated.branchId || null,
        },
      });
    } catch (auditErr) {
      console.error("Audit log error:", auditErr);
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Failed to update service type:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update service type" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    let userRole = searchParams.get("userRole");
    let userBranchId: string | null = null;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, branchId: true },
      });
      if (user) {
        userRole = user.role;
        userBranchId = user.branchId;
      }
    }

    const isActorSuperAdmin = userRole ? userRole.toUpperCase() === "SUPERADMIN" : false;

    const existing = await prisma.serviceType.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Service type not found" }, { status: 404 });
    }

    // Role-based Scope Permission Check on DELETE
    if (!isActorSuperAdmin) {
      if (existing.isGlobal) {
        return NextResponse.json(
          { error: "Permission Denied: Only Super Administrators can delete nationwide Global service types." },
          { status: 403 }
        );
      }
      if (existing.branchId && userBranchId && existing.branchId !== userBranchId) {
        return NextResponse.json(
          { error: "Permission Denied: You cannot delete service types belonging to another station." },
          { status: 403 }
        );
      }
    }

    await prisma.serviceType.delete({ where: { id } });

    // Create Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          action: "SERVICE_TYPE_DELETED",
          entity: "ServiceType",
          entityId: id,
          details: JSON.stringify({
            code: existing.code,
            name: existing.name,
          }),
          performedById: userId || null,
          branchId: existing.branchId || null,
        },
      });
    } catch (auditErr) {
      console.error("Audit log error:", auditErr);
    }

    return NextResponse.json({ success: true, message: `Service type "${existing.name}" deleted.` });
  } catch (error: any) {
    console.error("Failed to delete service type:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete service type" },
      { status: 500 }
    );
  }
}
