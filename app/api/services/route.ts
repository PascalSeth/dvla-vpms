import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const DEFAULT_SERVICE_TYPES = [
  {
    code: "REGISTRATION",
    name: "Standard Registration",
    description: "New standard plate issuance",
    category: "PRIVATE",
    isGlobal: true,
    isActive: true,
    requiresPreviousOwner: false,
  },
  {
    code: "REG_SPECIAL",
    name: "Registration + Special Number",
    description: "Custom requested sequence or reserved plate",
    category: "PRIVATE",
    isGlobal: true,
    isActive: true,
    requiresPreviousOwner: false,
  },
  {
    code: "REG_TRANSFER",
    name: "Registration & Transfer",
    description: "Ownership title transition to new registered keeper",
    category: "PRIVATE",
    isGlobal: true,
    isActive: true,
    requiresPreviousOwner: true,
    prevOwnerRequireName: true,
    prevOwnerRequirePhone: true,
    prevOwnerRequireAddress: true,
    prevOwnerRequireCustom: false,
    prevOwnerCustomLabel: null,
  },
  {
    code: "REG_TRANSFER_SPECIAL",
    name: "Transfer + Special Number",
    description: "Title transfer combined with custom plate assignment",
    category: "PRIVATE",
    isGlobal: true,
    isActive: true,
    requiresPreviousOwner: true,
    prevOwnerRequireName: true,
    prevOwnerRequirePhone: true,
    prevOwnerRequireAddress: true,
    prevOwnerRequireCustom: false,
    prevOwnerCustomLabel: null,
  },
  {
    code: "COMMERCIAL_FLEET",
    name: "Commercial Fleet Issuance",
    description: "High-density yellow plate registration for commercial haulage & taxis",
    category: "COMMERCIAL",
    isGlobal: true,
    isActive: true,
    requiresPreviousOwner: false,
  },
  {
    code: "ELECTRIC_SERIES",
    name: "Electric Vehicle Priority Series",
    description: "Zero-emission green border plate registration",
    category: "ELECTRIC",
    isGlobal: true,
    isActive: true,
    requiresPreviousOwner: false,
  },
  {
    code: "GOV_PROTOCOL",
    name: "Government & Protocol Allocation",
    description: "Ministry, department, agency, and state protocol vehicle registration",
    category: "GOVERNMENT",
    isGlobal: true,
    isActive: true,
    requiresPreviousOwner: false,
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");
    const activeOnly = searchParams.get("activeOnly") === "true";
    const scope = searchParams.get("scope"); // "all" | "global" | "branch"
    const search = searchParams.get("search")?.trim().toLowerCase();

    // Auto-seed default services if table is empty
    const totalCount = await prisma.serviceType.count();
    if (totalCount === 0) {
      await prisma.serviceType.createMany({
        data: DEFAULT_SERVICE_TYPES,
      });
    } else {
      // Ensure default transfer services have requiresPreviousOwner and default parameters set
      await prisma.serviceType.updateMany({
        where: {
          code: { in: ["REG_TRANSFER", "REG_TRANSFER_SPECIAL"] },
        },
        data: {
          requiresPreviousOwner: true,
          prevOwnerRequireName: true,
          prevOwnerRequirePhone: true,
          prevOwnerRequireAddress: true,
        },
      });
    }

    const whereClause: any = {};

    if (activeOnly) {
      whereClause.isActive = true;
    }

    if (scope === "global") {
      whereClause.isGlobal = true;
    } else if (scope === "branch") {
      whereClause.isGlobal = false;
      if (branchId) {
        whereClause.branchId = branchId;
      }
    } else if (branchId) {
      // Dynamic lookup for workstation: return all Global OR branch-specific
      whereClause.OR = [
        { isGlobal: true },
        { branchId },
      ];
    }

    if (search) {
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    const services = await prisma.serviceType.findMany({
      where: whereClause,
      include: {
        branch: {
          select: { id: true, name: true, code: true, slug: true },
        },
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: [
        { isGlobal: "desc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json(services);
  } catch (error: any) {
    console.error("Failed to fetch service types:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch service types" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      code,
      name,
      description,
      category,
      isGlobal = true,
      branchId,
      isActive = true,
      requiresPreviousOwner = false,
      prevOwnerRequireName = true,
      prevOwnerRequirePhone = false,
      prevOwnerRequireAddress = true,
      prevOwnerRequireCustom = false,
      prevOwnerCustomLabel,
      requiresCustoms = true,
      customFields,
      userId,
    } = body;

    if (!code?.trim() || !name?.trim()) {
      return NextResponse.json(
        { error: "Service Code and Service Name are required." },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");

    // Check unique code
    const existing = await prisma.serviceType.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Service code "${cleanCode}" already exists. Please choose a unique code.` },
        { status: 400 }
      );
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
      if (isGlobal) {
        return NextResponse.json(
          { error: "Permission Denied: Only Super Administrators have authority to designate nationwide Global services. Branch officers can only create station-specific services." },
          { status: 403 }
        );
      }
      if (userBranchId && branchId && branchId !== userBranchId) {
        return NextResponse.json(
          { error: "Permission Denied: You cannot create services for another branch. Scope is restricted to your assigned station." },
          { status: 403 }
        );
      }
    }

    const finalIsGlobal = isActorSuperAdmin ? Boolean(isGlobal) : false;
    const finalBranchId = finalIsGlobal ? null : (branchId || userBranchId);

    // If not global, must provide branchId
    if (!finalIsGlobal && !finalBranchId) {
      return NextResponse.json(
        { error: "A target branch must be designated for branch-specific service types." },
        { status: 400 }
      );
    }

    const newService = await prisma.serviceType.create({
      data: {
        code: cleanCode,
        name: name.trim(),
        description: description?.trim() || null,
        category: category?.trim() || "PRIVATE",
        isGlobal: finalIsGlobal,
        branchId: finalBranchId,
        isActive: Boolean(isActive),
        requiresPreviousOwner: Boolean(requiresPreviousOwner),
        prevOwnerRequireName: Boolean(prevOwnerRequireName),
        prevOwnerRequirePhone: Boolean(prevOwnerRequirePhone),
        prevOwnerRequireAddress: Boolean(prevOwnerRequireAddress),
        prevOwnerRequireCustom: Boolean(prevOwnerRequireCustom),
        prevOwnerCustomLabel: prevOwnerCustomLabel?.trim() || null,
        requiresCustoms: Boolean(requiresCustoms),
        customFields: customFields ? customFields : undefined,
        createdById: userId || null,
      },
      include: {
        branch: true,
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });

    // Automatically record Audit Log
    const { recordAuditLog } = await import("@/lib/audit");
    const actorName = newService.createdBy?.name || "Officer";
    await recordAuditLog({
      action: "SERVICE_TYPE_CREATED",
      entity: "ServiceType",
      entityId: newService.id,
      details: {
        message: `Officer ${actorName} registered new service type "${newService.name}" (${newService.code})`,
        code: newService.code,
        name: newService.name,
        isGlobal: newService.isGlobal,
        branch: newService.branch?.name || "Global (All Branches)",
      },
      performedById: userId || null,
      branchId: newService.branchId || null,
      request,
    });

    return NextResponse.json(newService, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create service type:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create service type" },
      { status: 500 }
    );
  }
}
