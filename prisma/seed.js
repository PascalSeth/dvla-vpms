"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("../app/generated/prisma/client");
var adapter_pg_1 = require("@prisma/adapter-pg");
require("dotenv/config");
var adapter = new adapter_pg_1.PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
var prisma = new client_1.PrismaClient({
    adapter: adapter,
});
// All 16 Administrative Regions of Ghana
var GHANA_REGIONS = [
    { name: "Greater Accra Region", code: "GAR", description: "Capital territory and economic hub of Ghana" },
    { name: "Ashanti Region", code: "AR", description: "Central commercial region anchored by Kumasi" },
    { name: "Western Region", code: "WR", description: "Coastal region with industrial and port centers" },
    { name: "Central Region", code: "CR", description: "Historic coastal tourism and education hub" },
    { name: "Volta Region", code: "VR", description: "Eastern border region along Volta River" },
    { name: "Eastern Region", code: "ER", description: "Agricultural and mining center anchored by Koforidua" },
    { name: "Northern Region", code: "NR", description: "Largest northern region anchored by Tamale" },
    { name: "Upper East Region", code: "UER", description: "Northeastern border region anchored by Bolgatanga" },
    { name: "Upper West Region", code: "UWR", description: "Northwestern border region anchored by Wa" },
    { name: "Bono Region", code: "BR", description: "Mid-western agricultural belt anchored by Sunyani" },
    { name: "Bono East Region", code: "BER", description: "Commercial agricultural area anchored by Techiman" },
    { name: "Ahafo Region", code: "AHR", description: "Rich timber and mining region anchored by Goaso" },
    { name: "Oti Region", code: "OR", description: "Eastern ecological belt anchored by Dambai" },
    { name: "Savannah Region", code: "SR", description: "Northern wildlife and heritage area anchored by Damongo" },
    { name: "North East Region", code: "NER", description: "Northern administrative region anchored by Nalerigu" },
    { name: "Western North Region", code: "WNR", description: "Resource-rich cocoa belt anchored by Sefwi Wiawso" },
];
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var regionMap, _i, GHANA_REGIONS_1, r, region, adentaBranch, adminUser;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("🌱 Starting DVLA VPMS baseline database seed (Regions, Branch, Super Admin only)...");
                    // 1. Seed all 16 Ghana Administrative Regions
                    console.log("📍 Seeding 16 Ghana Administrative Regions...");
                    regionMap = {};
                    _i = 0, GHANA_REGIONS_1 = GHANA_REGIONS;
                    _a.label = 1;
                case 1:
                    if (!(_i < GHANA_REGIONS_1.length)) return [3 /*break*/, 4];
                    r = GHANA_REGIONS_1[_i];
                    return [4 /*yield*/, prisma.region.upsert({
                            where: { code: r.code },
                            update: { name: r.name, description: r.description },
                            create: {
                                name: r.name,
                                code: r.code,
                                description: r.description,
                            },
                        })];
                case 2:
                    region = _a.sent();
                    regionMap[r.code] = region.id;
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log("✅ All 16 administrative regions seeded successfully.");
                    // 2. Seed Single Branch: DVLA ADENTA (Headquarters)
                    console.log("🏢 Seeding single branch: DVLA ADENTA...");
                    return [4 /*yield*/, prisma.branch.upsert({
                            where: { code: "DVLA-ADENTA" },
                            update: {
                                name: "DVLA ADENTA",
                                slug: "dvla-adenta",
                                type: client_1.BranchType.HEADQUARTERS,
                                regionId: regionMap["GAR"],
                                address: "Jawaharlal Nehru Rd, Adenta Municipal, Accra",
                                phone: "030 274 6760",
                            },
                            create: {
                                name: "DVLA ADENTA",
                                slug: "dvla-adenta",
                                code: "DVLA-ADENTA",
                                type: client_1.BranchType.HEADQUARTERS,
                                regionId: regionMap["GAR"],
                                address: "Jawaharlal Nehru Rd, Adenta Municipal, Accra",
                                phone: "030 274 6760",
                            },
                        })];
                case 5:
                    adentaBranch = _a.sent();
                    console.log("\u2705 Branch created: ".concat(adentaBranch.name, " (").concat(adentaBranch.code, ")"));
                    // 3. Seed Single User: Super Admin
                    console.log("👤 Seeding single SUPERADMIN user...");
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { username: "admin" },
                            update: {
                                name: "System Administrator",
                                email: "admin@dvla.gov.gh",
                                password: "1234",
                                role: client_1.UserRole.SUPERADMIN,
                                branchId: adentaBranch.id,
                            },
                            create: {
                                username: "admin",
                                password: "1234",
                                name: "System Administrator",
                                email: "admin@dvla.gov.gh",
                                role: client_1.UserRole.SUPERADMIN,
                                branchId: adentaBranch.id,
                            },
                        })];
                case 6:
                    adminUser = _a.sent();
                    console.log("\u2705 SUPERADMIN user created: @".concat(adminUser.username, " (").concat(adminUser.name, ")"));
                    // 4. Create Initial Audit Log
                    return [4 /*yield*/, prisma.auditLog.create({
                            data: {
                                action: "SYSTEM_INITIALIZED",
                                entity: "Branch",
                                entityId: adentaBranch.id,
                                details: JSON.stringify({
                                    message: "DVLA VPMS clean baseline initialized with 16 administrative regions, DVLA Adenta branch, and Super Admin.",
                                }),
                                performedById: adminUser.id,
                                branchId: adentaBranch.id,
                            },
                        })];
                case 7:
                    // 4. Create Initial Audit Log
                    _a.sent();
                    console.log("\n🎉 Clean baseline seeding completed!");
                    console.log("📊 Summary:");
                    console.log("   • Regions: 16");
                    console.log("   • Branches: 1 (DVLA ADENTA)");
                    console.log("   • Users: 1 (admin / 1234 - SUPERADMIN)");
                    console.log("   • Services: None");
                    console.log("   • Data: None (0 invoices, 0 bookings, 0 reservations, 0 pickups)");
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
