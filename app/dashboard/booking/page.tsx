"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getStoredReservations, checkPlateReservation, saveStoredReservations, Reservation } from "../../../components/reservationsData";
import { VRS_INVOICES } from "../../../components/vrsData";

/* ─── Static reference data ─── */

const BOOKING_TYPES = [
  { id: "REGISTRATION",         label: "Registration",                              sub: "New plate issuance", icon: BookingNewIcon      },
  { id: "REG_SPECIAL",          label: "Registration + Special Number",                            sub: "Custom plate request", icon: BookingStarIcon   },
  { id: "REG_TRANSFER",         label: "Registration & Transfer",                   sub: "Ownership change",   icon: BookingTransferIcon },
  { id: "REG_TRANSFER_SPECIAL", label: "Registration Transfer + Special Number",                        sub: "Transfer with custom", icon: BookingComboIcon  },
];

const CLASSIFICATIONS = [
  { id: "PRIVATE",    label: "Private",    sub: "Personal vehicle",   icon: ClassPrivateIcon    },
  { id: "COMMERCIAL", label: "Commercial", sub: "Trade / freight",    icon: ClassCommercialIcon },
  { id: "EQUIPMENT",  label: "Equipment",  sub: "Machinery / plant",  icon: ClassEquipmentIcon  },
  { id: "GOVERNMENT", label: "Government", sub: "State / ministry",   icon: ClassGovIcon        },
];

const BODY_TYPES = [
  { id: "Saloon",                label: "Saloon",    icon: BodySaloonIcon    },
  { id: "Hatchback",             label: "Hatchback", icon: BodyHatchIcon     },
  { id: "SUV / Station Wagon",   label: "SUV / 4WD", icon: BodySUVIcon       },
  { id: "Pickup / Truck",        label: "Pickup",    icon: BodyPickupIcon    },
  { id: "Minibus / Van",         label: "Minibus",   icon: BodyMinibusIcon   },
  { id: "Bus",                   label: "Bus",       icon: BodyBusIcon       },
  { id: "Equipment / Machinery", label: "Equipment", icon: BodyEquipIcon     },
];

const FUEL_TYPES = [
  { id: "PETROL",   label: "Petrol",   icon: FuelPetrolIcon   },
  { id: "DIESEL",   label: "Diesel",   icon: FuelDieselIcon   },
  { id: "ELECTRIC", label: "Electric", icon: FuelElectricIcon },
];

interface VehiclePreset {
  label: string; make: string; model: string; engineCC: string;
  cylinders: string; bodyType: string; netWeight: string;
  grossWeight: string; tyreW: string; tyreDia: string; fuelType: string;
}

const VEHICLE_PRESETS: VehiclePreset[] = [
  { label: "Toyota Corolla",       make: "Toyota",        model: "Corolla",        engineCC: "1800",           cylinders: "4",   bodyType: "Saloon",               netWeight: "1190", grossWeight: "1560", tyreW: "195", tyreDia: "15", fuelType: "PETROL"   },
  { label: "Toyota Camry",         make: "Toyota",        model: "Camry",          engineCC: "2500",           cylinders: "4",   bodyType: "Saloon",               netWeight: "1590", grossWeight: "2095", tyreW: "215", tyreDia: "17", fuelType: "PETROL"   },
  { label: "Toyota Land Cruiser",  make: "Toyota",        model: "Land Cruiser V8",engineCC: "4500",           cylinders: "8",   bodyType: "SUV / Station Wagon",  netWeight: "2630", grossWeight: "3300", tyreW: "285", tyreDia: "18", fuelType: "DIESEL"   },
  { label: "Toyota Hilux",         make: "Toyota",        model: "Hilux",          engineCC: "2800",           cylinders: "4",   bodyType: "Pickup / Truck",       netWeight: "1920", grossWeight: "3200", tyreW: "265", tyreDia: "17", fuelType: "DIESEL"   },
  { label: "Toyota Fortuner",      make: "Toyota",        model: "Fortuner",       engineCC: "2700",           cylinders: "4",   bodyType: "SUV / Station Wagon",  netWeight: "1920", grossWeight: "2560", tyreW: "265", tyreDia: "17", fuelType: "DIESEL"   },
  { label: "Hyundai Tucson",       make: "Hyundai",       model: "Tucson",         engineCC: "2000",           cylinders: "4",   bodyType: "SUV / Station Wagon",  netWeight: "1680", grossWeight: "2145", tyreW: "225", tyreDia: "17", fuelType: "PETROL"   },
  { label: "Hyundai Santa Fe",     make: "Hyundai",       model: "Santa Fe",       engineCC: "2200",           cylinders: "4",   bodyType: "SUV / Station Wagon",  netWeight: "1830", grossWeight: "2510", tyreW: "235", tyreDia: "18", fuelType: "DIESEL"   },
  { label: "Nissan Patrol",        make: "Nissan",        model: "Patrol",         engineCC: "4000",           cylinders: "6",   bodyType: "SUV / Station Wagon",  netWeight: "2280", grossWeight: "2890", tyreW: "265", tyreDia: "17", fuelType: "PETROL"   },
  { label: "Nissan Navara",        make: "Nissan",        model: "Navara",         engineCC: "2500",           cylinders: "4",   bodyType: "Pickup / Truck",       netWeight: "1960", grossWeight: "2910", tyreW: "255", tyreDia: "17", fuelType: "DIESEL"   },
  { label: "Kia Sportage",         make: "Kia",           model: "Sportage",       engineCC: "2000",           cylinders: "4",   bodyType: "SUV / Station Wagon",  netWeight: "1610", grossWeight: "2090", tyreW: "225", tyreDia: "17", fuelType: "PETROL"   },
  { label: "Kia Sorento",          make: "Kia",           model: "Sorento",        engineCC: "2200",           cylinders: "4",   bodyType: "SUV / Station Wagon",  netWeight: "1850", grossWeight: "2560", tyreW: "235", tyreDia: "18", fuelType: "DIESEL"   },
  { label: "Mercedes E-Class",     make: "Mercedes-Benz", model: "E-Class",        engineCC: "2000",           cylinders: "4",   bodyType: "Saloon",               netWeight: "1720", grossWeight: "2195", tyreW: "225", tyreDia: "17", fuelType: "PETROL"   },
  { label: "Isuzu D-Max",          make: "Isuzu",         model: "D-Max",          engineCC: "3000",           cylinders: "4",   bodyType: "Pickup / Truck",       netWeight: "1985", grossWeight: "3370", tyreW: "265", tyreDia: "17", fuelType: "DIESEL"   },
  { label: "VW Golf",              make: "Volkswagen",    model: "Golf",           engineCC: "1400",           cylinders: "4",   bodyType: "Hatchback",            netWeight: "1260", grossWeight: "1735", tyreW: "205", tyreDia: "16", fuelType: "PETROL"   },
  { label: "Ford Ranger",          make: "Ford",          model: "Ranger",         engineCC: "2000",           cylinders: "4",   bodyType: "Pickup / Truck",       netWeight: "1950", grossWeight: "3150", tyreW: "265", tyreDia: "17", fuelType: "DIESEL"   },
  { label: "Jetour Dashing",       make: "Jetour",        model: "Dashing",        engineCC: "1498",           cylinders: "4",   bodyType: "SUV / Station Wagon",  netWeight: "1535", grossWeight: "1888", tyreW: "235", tyreDia: "19", fuelType: "PETROL"   },
  { label: "Jetour X70",           make: "Jetour",        model: "X70",            engineCC: "1498",           cylinders: "4",   bodyType: "SUV / Station Wagon",  netWeight: "1560", grossWeight: "1930", tyreW: "235", tyreDia: "18", fuelType: "PETROL"   },
  { label: "Jetour T2 / Traveller",make: "Jetour",        model: "Traveller T2",   engineCC: "1998",           cylinders: "4",   bodyType: "SUV / Station Wagon",  netWeight: "1880", grossWeight: "2255", tyreW: "255", tyreDia: "20", fuelType: "PETROL"   },
  { label: "Tesla Model Y",        make: "Tesla",         model: "Model Y",        engineCC: "N/A (Electric)", cylinders: "N/A", bodyType: "SUV / Station Wagon",  netWeight: "1910", grossWeight: "2405", tyreW: "255", tyreDia: "19", fuelType: "ELECTRIC" },
  { label: "Tesla Model 3",        make: "Tesla",         model: "Model 3",        engineCC: "N/A (Electric)", cylinders: "N/A", bodyType: "Saloon",               netWeight: "1760", grossWeight: "2200", tyreW: "235", tyreDia: "18", fuelType: "ELECTRIC" },
  { label: "BYD Atto 3",           make: "BYD",           model: "Atto 3",         engineCC: "N/A (Electric)", cylinders: "N/A", bodyType: "SUV / Station Wagon",  netWeight: "1750", grossWeight: "2160", tyreW: "215", tyreDia: "18", fuelType: "ELECTRIC" },
  { label: "Hyundai Ioniq 5",      make: "Hyundai",       model: "Ioniq 5",        engineCC: "N/A (Electric)", cylinders: "N/A", bodyType: "SUV / Station Wagon",  netWeight: "2020", grossWeight: "2540", tyreW: "235", tyreDia: "19", fuelType: "ELECTRIC" },
  { label: "Audi e-tron",          make: "Audi",          model: "e-tron",         engineCC: "N/A (Electric)", cylinders: "N/A", bodyType: "SUV / Station Wagon",  netWeight: "2490", grossWeight: "3130", tyreW: "255", tyreDia: "20", fuelType: "ELECTRIC" },
  { label: "Honda Civic",          make: "Honda",         model: "Civic",          engineCC: "1500",           cylinders: "4",   bodyType: "Saloon",               netWeight: "1340", grossWeight: "1760", tyreW: "215", tyreDia: "17", fuelType: "PETROL"   },
];

const TYRE_PRESETS = [
  { label: "195/65 R15", w: "195", d: "15" },
  { label: "205/55 R16", w: "205", d: "16" },
  { label: "215/55 R17", w: "215", d: "17" },
  { label: "225/60 R17", w: "225", d: "17" },
  { label: "235/60 R18", w: "235", d: "18" },
  { label: "265/65 R17", w: "265", d: "17" },
  { label: "285/60 R18", w: "285", d: "18" },
  { label: "275/70 R18", w: "275", d: "18" },
];

const PLATE_REGION_MAP: [RegExp, string][] = [
  [/adenta|adentan|frafraha|oyibi|dodowa/i, "AD"],
  [/greater accra|accra/i,                  "GR"],
  [/ashanti|kumasi/i,                       "AS"],
  [/western|takoradi/i,                     "WR"],
  [/eastern|koforidua/i,                    "ER"],
  [/northern|tamale/i,                      "NR"],
  [/volta|ho\b/i,                           "VR"],
  [/central|cape coast/i,                   "CR"],
  [/brong|ahafo|sunyani/i,                  "BA"],
  [/upper east|bolgatanga/i,                "UE"],
  [/upper west|wa\b/i,                      "UW"],
];

function suggestPrefix(address: string): string | null {
  for (const [rx, code] of PLATE_REGION_MAP) {
    if (rx.test(address)) return code;
  }
  return null;
}

/* ── Design tokens ── */
const INPUT =
  "px-3 py-2.5 bg-white border border-[#e2e8f0] rounded-lg text-xs text-[#1a2e05] font-medium focus:outline-none focus:ring-2 focus:ring-[#81B71A]/20 focus:border-[#81B71A]/60 transition w-full placeholder-[#c3ccd8]";
const LABEL = "text-[10px] font-bold uppercase text-[#6b7a99] tracking-wider";

/* ── Field wrapper ── */
function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={LABEL}>
        {label}{required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

/* ── Section header ── */
function SectionHead({ n, title, icon }: { n: number; title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pb-4 border-b border-[#f0f3f8]">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "linear-gradient(135deg, #1a2e05, #81B71A)", color: "white" }}>
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#b0bbd6" }}>Step {n}</p>
        <h3 className="text-sm font-bold text-[#1a2e05] leading-none mt-0.5">{title}</h3>
      </div>
    </div>
  );
}

/* ════════════════════════════════ PAGE ════════════════════════════════ */
function BookingDeskContent() {

  const searchParams = useSearchParams();
  const isPrefill = searchParams ? searchParams.get("prefill") === "1" : false;

  /* ── Selectors ── */
  const [bookingType,    setBookingType]    = useState(() => {
    if (isPrefill && searchParams) {
      const platePattern = searchParams.get("platePattern");
      const rangeStart = searchParams.get("rangeStart");
      if (platePattern || rangeStart) return "REG_SPECIAL";
    }
    return "REGISTRATION";
  });

  const [classification, setClassification] = useState(() => {
    if (isPrefill && searchParams) {
      const holder = searchParams.get("holder");
      if (holder) {
        const lowerHolder = holder.toLowerCase();
        if (
          lowerHolder.includes("police") ||
          lowerHolder.includes("state house") ||
          lowerHolder.includes("ministry") ||
          lowerHolder.includes("assembly") ||
          lowerHolder.includes("government")
        ) {
          return "GOVERNMENT";
        }
      }
    }
    return "PRIVATE";
  });

  /* ── VRS Quick-Fill states ── */
  const [vrsInvoiceNo, setVrsInvoiceNo] = useState("");
  const [isFetchingVrs, setIsFetchingVrs] = useState(false);
  const [vrsSuccessMessage, setVrsSuccessMessage] = useState("");
  const [auditHighlightActive, setAuditHighlightActive] = useState(false);

  /* ── Owner ── */
  const [regNo,        setRegNo]        = useState(() => {
    if (isPrefill && searchParams) {
      const platePattern = searchParams.get("platePattern");
      if (platePattern) return platePattern;
      const rangeStart = searchParams.get("rangeStart");
      if (rangeStart) {
        const prefix = searchParams.get("prefix") || "AD";
        const year = searchParams.get("year") || "26";
        return `${prefix} ${rangeStart}-${year}`;
      }
    }
    return "";
  });

  const [ownerName,    setOwnerName]    = useState(() => {
    return isPrefill && searchParams ? (searchParams.get("holder") || "") : "";
  });

  const [address,      setAddress]      = useState(() => {
    return isPrefill ? "Adenta Municipal Area, Accra" : "";
  });

  const [phone,        setPhone]        = useState(() => {
    return isPrefill ? "+233 24 123 4567" : "";
  });

  const [oldOwnerName, setOldOwnerName] = useState("");
  const [oldOwnerAddr, setOldOwnerAddr] = useState("");

  /* ── Vehicle specs ── */
  const [presetSearch, setPresetSearch] = useState("");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [make,         setMake]         = useState("");
  const [yearModel,    setYearModel]    = useState("");
  const [engineCC,     setEngineCC]     = useState("");
  const [cylinders,    setCylinders]    = useState("4");
  const [engineNo,     setEngineNo]     = useState("");
  const [chassisNo,    setChassisNo]    = useState("");
  const [bodyType,     setBodyType]     = useState("");
  const [fuelType,     setFuelType]     = useState("PETROL");
  const [netWeight,    setNetWeight]    = useState("");
  const [grossWeight,  setGrossWeight]  = useState("");

  /* ── Tyres ── */
  const [tyreFW, setTyreFW] = useState("");
  const [tyreFD, setTyreFD] = useState("");
  const [tyreMW, setTyreMW] = useState("");
  const [tyreMD, setTyreMD] = useState("");
  const [tyreRW, setTyreRW] = useState("");
  const [tyreRD, setTyreRD] = useState("");

  /* ── Audit ── */
  const [regDate,     setRegDate]     = useState("2026-05-19");
  const [receiptNo,   setReceiptNo]   = useState("");
  const [customsNo,   setCustomsNo]   = useState("");
  const [customsDate, setCustomsDate] = useState("2026-05-19");
  const [supervisor,  setSupervisor]  = useState("Eric");
  const regOfficer = "A. Owusu";

  /* ── UI state ── */
  const [isSuccess,    setIsSuccess]    = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setReservations(getStoredReservations());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const activeReservation = checkPlateReservation(regNo, reservations);

  const isTransfer = bookingType.startsWith("REG_TRANSFER");
  const vinLen     = chassisNo.replace(/\s/g, "").length;
  const vinValid   = vinLen === 17;
  const prefixHint = suggestPrefix(address);

  const filteredPresets = VEHICLE_PRESETS.filter(p =>
    p.label.toLowerCase().includes(presetSearch.toLowerCase())
  );

  function applyPreset(p: VehiclePreset) {
    setActivePreset(p.label);
    setMake(p.make); setYearModel(p.model); setEngineCC(p.engineCC);
    setCylinders(p.cylinders); setBodyType(p.bodyType);
    setNetWeight(p.netWeight); setGrossWeight(p.grossWeight);
    setTyreFW(p.tyreW); setTyreFD(p.tyreDia);
    setTyreRW(p.tyreW); setTyreRD(p.tyreDia);
    setTyreMW(""); setTyreMD("");
    setFuelType(p.fuelType);
  }

  function applyTyre(w: string, d: string, pos: "F" | "M" | "R" | "FR") {
    if (pos === "F"  || pos === "FR") { setTyreFW(w); setTyreFD(d); }
    if (pos === "M")                  { setTyreMW(w); setTyreMD(d); }
    if (pos === "R"  || pos === "FR") { setTyreRW(w); setTyreRD(d); }
  }

  function handleAutofillSimulation() {
    setIsSimulating(true);
    setTimeout(() => {
      const p = VEHICLE_PRESETS[17];
      setOwnerName("Ebenezer Kwabena Boateng");
      setAddress("House No. 12, Frafraha Junction, Adenta, Accra");
      setPhone("+233 24 489 0291");
      setRegNo("AD 0824-26");
      setEngineNo("SQRF4J20-291823");
      setChassisNo("JTEBU5JR8P2091837");
      setYearModel("Traveller T2 2025");
      setReceiptNo("470260*****");
      setCustomsNo("470*****/**");
      setCustomsDate("2026-05-15");
      setSupervisor("Saviour");
      if (isTransfer) {
        setOldOwnerName("Seth Pascal Kofi");
        setOldOwnerAddr("Plot 8, Adentan Municipal Area, Accra");
      }
      applyPreset(p);
      setIsSimulating(false);
    }, 850);
  }

  function handleReset() {
    setIsSuccess(false);
    setOwnerName(""); setAddress(""); setPhone("");
    setOldOwnerName(""); setOldOwnerAddr("");
    setActivePreset(null);
    setMake(""); setYearModel(""); setEngineCC(""); setEngineNo(""); setChassisNo("");
    setBodyType(""); setNetWeight(""); setGrossWeight("");
    setTyreFW(""); setTyreFD(""); setTyreMW(""); setTyreMD(""); setTyreRW(""); setTyreRD("");
    setReceiptNo(""); setCustomsNo(""); setCustomsDate("2026-05-19"); setSupervisor("Eric");
    setCylinders("4"); setFuelType("PETROL"); setPresetSearch("");
    setRegNo("");
    setVrsInvoiceNo("");
    setVrsSuccessMessage("");
    setAuditHighlightActive(false);
  }

  function handleFetchVrs(invoiceNoToFetch: string) {
    if (!invoiceNoToFetch) return;
    setIsFetchingVrs(true);
    setVrsSuccessMessage("");
    setAuditHighlightActive(false);

    setTimeout(() => {
      const invoice = VRS_INVOICES.find(i => i.invoiceNo === invoiceNoToFetch.trim());
      if (invoice) {
        setBookingType(invoice.bookingType);
        setClassification(invoice.classification);
        setRegNo(invoice.regNo);
        setOwnerName(invoice.ownerName);
        setAddress(invoice.address);
        setPhone(invoice.phone);
        
        setMake(invoice.make);
        setYearModel(invoice.yearModel);
        setEngineCC(invoice.engineCC);
        setCylinders(invoice.cylinders);
        setEngineNo(invoice.engineNo);
        setChassisNo(invoice.chassisNo);
        setBodyType(invoice.bodyType);
        setFuelType(invoice.fuelType);
        setNetWeight(invoice.netWeight);
        setGrossWeight(invoice.grossWeight);

        setTyreFW(invoice.tyreFW);
        setTyreFD(invoice.tyreFD);
        setTyreMW(invoice.tyreMW);
        setTyreMD(invoice.tyreMD);
        setTyreRW(invoice.tyreRW);
        setTyreRD(invoice.tyreRD);

        // Clear Step 4 Audit & Payment inputs so that the user is forced to fill them manually!
        setReceiptNo("");
        setCustomsNo("");
        setCustomsDate("");

        setVrsSuccessMessage(`🎉 VRS Invoice ${invoice.invoiceNo} successfully fetched! Steps 1, 2, and 3 have been auto-populated. Please complete Step 4 (Audit & Payment) manually below.`);
        setAuditHighlightActive(true);
      } else {
        alert("Invoice not found in VRS. Please check the 14-digit invoice number (e.g. 40726012083437).");
      }
      setIsFetchingVrs(false);
    }, 650);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const activeRes = checkPlateReservation(regNo, reservations);
    if (activeRes) {
      const updated = reservations.map(r => {
        if (r.id === activeRes.id) {
          return {
            ...r,
            claimedCount: Math.min(r.totalCount, r.claimedCount + 1)
          };
        }
        return r;
      });
      setReservations(updated);
      saveStoredReservations(updated);
    }
    setIsSuccess(true);
  }

  /* ════════════════ RENDER ════════════════ */
  return (
    <div className="space-y-5 pb-12">

      {/* ── Hero Banner ── */}
      <div className="relative rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(115deg, #0d1a03 0%, #1a2e05 18%, #2d5009 48%, #4a7c10 74%, #81B71A 100%)" }}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.06 }} preserveAspectRatio="none">
          <defs>
            <pattern id="bookinggrid" width="38" height="38" patternUnits="userSpaceOnUse">
              <path d="M 38 0 L 0 0 0 38" fill="none" stroke="white" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#bookinggrid)" />
        </svg>
        <div className="relative px-6 py-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.55)" }} />
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600 }}>
                DVLA — Adenta Branch Digitization Desk
              </p>
            </div>
            <h2 className="text-white text-2xl font-extrabold tracking-tight">Filing &amp; Booking Desk</h2>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.85rem", marginTop: "0.3rem" }}>
              Use vehicle presets and quick-fill tools to log entries faster from the physical register.
            </p>
          </div>
          <button type="button" onClick={handleAutofillSimulation} disabled={isSimulating}
            className="px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition disabled:opacity-50 shrink-0"
            style={{ background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.22)", color: "white" }}>
            {isSimulating ? <><SpinIcon /> Scanning document…</> : <><ScanIcon /> Simulate Document Scan</>}
          </button>
        </div>
      </div>

      {/* ── Success receipt ── */}
      {isSuccess ? (
        <div className="bg-white rounded-2xl border border-[#e8edf5] p-8 max-w-2xl mx-auto space-y-6"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.07)" }}>

          {/* Success header */}
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(129,183,26,0.1)" }}>
              <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#81B71A" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg" style={{ color: "#1a2e05" }}>Logbook Filing Complete</h3>
              <p className="text-xs mt-1" style={{ color: "#6b7a99" }}>
                Vehicle record digitally logged and matched to the physical register.
              </p>
            </div>
          </div>

          {/* Receipt slip */}
          <div className="rounded-xl border border-dashed p-5 space-y-3 font-mono text-[11px]"
            style={{ borderColor: "#d1dae8", background: "#f8faff" }}>
            <div className="text-center pb-3 border-b border-[#e8edf5]">
              <p className="font-bold text-xs uppercase text-[#1a2e05]">Driver &amp; Vehicle Licensing Authority (DVLA)</p>
              <p className="text-[10px] font-semibold mt-0.5" style={{ color: "#81B71A" }}>Adenta Branch — Official Digital Filing Registry</p>
            </div>
            <div className="grid grid-cols-2 gap-y-2 text-[#374167]">
              <span className="text-[#9aa3be]">SERVICE TYPE:</span>
              <span className="font-bold text-[#1a2e05]">{BOOKING_TYPES.find(b => b.id === bookingType)?.label}</span>
              <span className="text-[#9aa3be]">CLASSIFICATION:</span>
              <span className="font-bold">{CLASSIFICATIONS.find(c => c.id === classification)?.label}</span>
              <span className="text-[#9aa3be]">PLATE ASSIGNED:</span>
              <span className="font-bold font-mono tracking-wider">{regNo || "N/A"}</span>
              {isTransfer ? (
                <>
                  <span className="text-[#9aa3be]">OLD OWNER:</span>
                  <span className="font-bold" style={{ color: "#991b1b" }}>{oldOwnerName || "N/A"}</span>
                  <span className="text-[#9aa3be]">NEW OWNER:</span>
                  <span className="font-bold" style={{ color: "#3d6b08" }}>{ownerName || "N/A"}</span>
                </>
              ) : (
                <>
                  <span className="text-[#9aa3be]">OWNER NAME:</span>
                  <span className="font-bold">{ownerName || "N/A"}</span>
                  <span className="text-[#9aa3be]">ADDRESS:</span>
                  <span className="font-bold">{address || "N/A"}</span>
                </>
              )}
              <span className="text-[#9aa3be]">VEHICLE:</span>
              <span className="font-bold">{make} {yearModel || "N/A"} ({fuelType})</span>
              <span className="text-[#9aa3be]">CHASSIS NO:</span>
              <span className="font-bold">{chassisNo || "N/A"}</span>
              <span className="text-[#9aa3be]">RECEIPT NO:</span>
              <span className="font-bold">{receiptNo || "N/A"}</span>
              <span className="text-[#9aa3be]">CUSTOMS NO:</span>
              <span className="font-bold">{customsNo || "N/A"}</span>
              <span className="text-[#9aa3be]">CUSTOMS DATE:</span>
              <span className="font-bold">{customsDate || "N/A"}</span>
              <span className="text-[#9aa3be]">SUPERVISOR:</span>
              <span className="font-bold" style={{ color: "#3d6b08" }}>{supervisor}</span>
              <span className="text-[#9aa3be]">DATE FILED:</span>
              <span className="font-bold">{regDate}</span>
            </div>
            <div className="border-t border-[#e8edf5] pt-2.5 text-center text-[10px]" style={{ color: "#9aa3be" }}>
              Adenta Branch · Book ID: 11851-A &nbsp;|&nbsp; Authorized by: {regOfficer}
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button type="button" onClick={() => setIsSuccess(false)}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(115deg, #2d5009, #81B71A)" }}>
              File New Vehicle
            </button>
            <button type="button" onClick={handleReset}
              className="px-6 py-2.5 rounded-xl text-xs font-bold border border-[#e2e8f0] transition-all hover:bg-[#f4f6fb]"
              style={{ color: "#374167" }}>
              Reset Form
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* VRS Integration Terminal Success Alert */}
          {vrsSuccessMessage && (
            <div className="bg-emerald-50 border-2 border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3 shadow-lg shadow-emerald-500/5 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">VRS Auto-Population Success</h4>
                <p className="text-[11px] font-semibold text-emerald-800 mt-0.5 leading-relaxed">{vrsSuccessMessage}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setVrsSuccessMessage("")}
                className="text-emerald-500 hover:text-emerald-700 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* VRS Live Integration Terminal Card */}
          <div className="bg-linear-to-br from-white via-slate-50 to-white rounded-2xl border border-slate-200 p-6 relative overflow-hidden shadow-md shadow-slate-100/50">
            {/* Ambient background glow decoration */}
            <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-[#81B71A]/5 blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-36 h-36 rounded-full bg-[#81B71A]/5 blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-lg shadow-slate-950/20">
                  <svg className="w-5 h-5 text-[#81B71A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">VRS Integration Terminal</h3>
                  <p className="text-[11px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">High-Speed Paid Invoice Filing Desk</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start md:self-center">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
                  VRS Live Database Connected
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-5 relative z-10">
              <div className="lg:col-span-2 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center justify-between">
                    <span>14-Digit VRS Invoice Number</span>
                    <span className="font-mono text-[9px] text-slate-400">{vrsInvoiceNo.length}/14 Digits</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      value={vrsInvoiceNo}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 14);
                        setVrsInvoiceNo(val);
                      }}
                      placeholder="e.g. 40726012083437"
                      className="w-full pl-10 pr-24 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold font-mono tracking-widest text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#81B71A]/20 focus:border-[#81B71A] transition-all shadow-sm"
                    />
                    <button
                      type="button"
                      disabled={vrsInvoiceNo.length !== 14 || isFetchingVrs}
                      onClick={() => handleFetchVrs(vrsInvoiceNo)}
                      className="absolute right-2 top-1.5 bottom-1.5 px-3 rounded-lg text-[10px] font-black uppercase text-white transition-all disabled:opacity-35 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm shadow-[#81B71A]/20 animate-none hover:opacity-90 active:scale-[0.98]"
                      style={{ background: "linear-gradient(135deg, #1a2e05, #81B71A)" }}
                    >
                      {isFetchingVrs ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Syncing
                        </>
                      ) : "Fetch"}
                    </button>
                  </div>
                  <p className="text-[9px] font-semibold text-slate-400">
                    Entering a valid paid invoice connects directly to the Virtual Registration System to retrieve specs instantly.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-3 space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[#81B71A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Prefilled Illustrative Presets
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {VRS_INVOICES.map(inv => {
                    const isCorolla = inv.make.toLowerCase().includes("toyota");
                    const isTucson = inv.make.toLowerCase().includes("hyundai");
                    
                    let iconBg = "bg-blue-50 text-blue-600";
                    let emoji = "🚗";
                    if (isTucson) {
                      iconBg = "bg-amber-50 text-amber-600";
                      emoji = "🚙";
                    } else if (!isCorolla) {
                      iconBg = "bg-emerald-50 text-emerald-600";
                      emoji = "🛻";
                    }

                    return (
                      <button
                        key={inv.invoiceNo}
                        type="button"
                        onClick={() => {
                          setVrsInvoiceNo(inv.invoiceNo);
                          handleFetchVrs(inv.invoiceNo);
                        }}
                        disabled={isFetchingVrs}
                        className="group flex flex-col justify-between p-3 bg-white border border-slate-200/80 hover:border-[#81B71A]/60 hover:shadow-md hover:shadow-slate-100 hover:-translate-y-0.5 rounded-xl text-left transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-[#81B71A]/1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        
                        <div className="flex items-center gap-2">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${iconBg}`}>
                            {emoji}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[11px] font-black text-slate-800 truncate leading-snug group-hover:text-[#2d5009] transition-colors">{inv.ownerName}</p>
                            <p className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase leading-none mt-0.5">{inv.make} {inv.bodyType.split(" ")[0]}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 w-full">
                          <code className="text-[10px] font-bold font-mono text-slate-500 tracking-tight group-hover:text-[#81B71A] transition-colors">{inv.invoiceNo}</code>
                          <span className="text-[9px] font-black text-[#81B71A] opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                            →
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">

            {/* ── Left panel (2/3) ── */}
            <div className="xl:col-span-2 space-y-5">

            {/* ══ Section 1: Booking Details ══ */}
            <div className="bg-white rounded-2xl border border-[#e8edf5] p-6 space-y-6"
              style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.045)" }}>
              <SectionHead n={1} title="Booking Type &amp; Owner Details" icon={<OwnerIcon />} />

              {/* ── Booking Type — dropdown selector ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <Field label="Booking / Service Type" required>
                  <select value={bookingType} onChange={(e) => setBookingType(e.target.value)} className={INPUT}>
                    {BOOKING_TYPES.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </Field>

                {/* ── Classification — dropdown selector ── */}
                <Field label="Vehicle / Plate Classification" required>
                  <select value={classification} onChange={(e) => setClassification(e.target.value)} className={INPUT}>
                    {CLASSIFICATIONS.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* ── Registration No + Owner Name ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Registration Number of Vehicle" required>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <PlateFieldIcon />
                    </span>
                    <input value={regNo} onChange={e => setRegNo(e.target.value)}
                      placeholder="e.g. AD 0001-26"
                      className={INPUT + " pl-8 font-mono tracking-widest pr-24"} />
                    {prefixHint && (
                      <button type="button"
                        onClick={() => {
                          const cur = regNo.replace(/^[A-Z]{2}\s*/, "");
                          setRegNo(`${prefixHint} ${cur}`);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md text-[10px] font-bold transition"
                        style={{ background: "rgba(129,183,26,0.12)", color: "#3d6b08" }}>
                        Use {prefixHint}
                      </button>
                    )}
                  </div>
                  {activeReservation && (
                    <div className="mt-3 p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/60 text-amber-900 text-xs space-y-2 shadow-sm backdrop-blur-sm">
                      <div className="flex items-start gap-2.5">
                        <div className="p-1 rounded-lg bg-amber-100/80 text-amber-700 shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="font-extrabold text-amber-800 tracking-wide text-xs">🛡️ Reserved Allocation Detected</p>
                          <p className="text-[11px] text-amber-850 leading-relaxed font-medium">
                            This registration number belongs to a reserved block held by <strong className="text-amber-950 font-bold bg-amber-100/60 px-1.5 py-0.5 rounded">{activeReservation.holder}</strong> under authorization reference <code className="bg-amber-100/80 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono text-amber-900">{activeReservation.authRef}</code>.
                          </p>
                          <p className="text-[10px] text-amber-700 leading-relaxed font-semibold">
                            ⚠️ This is an informational alert. Booking is unlocked and will automatically register the vehicle, incrementing the claimed slot count for this block.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </Field>
                <Field label={isTransfer ? "New Owner Name (Transferee)" : "Name of Owner"} required>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <PersonFieldIcon />
                    </span>
                    <input value={ownerName} onChange={e => setOwnerName(e.target.value)}
                      required placeholder="Enter full legal name"
                      className={INPUT + " pl-8"} />
                  </div>
                </Field>
              </div>

              {/* ── Address + Phone ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Field label={isTransfer ? "New Owner Address" : "Address of Owner"} required>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <LocationFieldIcon />
                      </span>
                      <input value={address} onChange={e => setAddress(e.target.value)}
                        required placeholder="Street, City, Region"
                        className={INPUT + " pl-8"} />
                    </div>
                  </Field>
                </div>
                <Field label={isTransfer ? "New Owner Phone" : "Phone Number"} required>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <PhoneFieldIcon />
                    </span>
                    <input value={phone} onChange={e => setPhone(e.target.value)}
                      required placeholder="+233 24 123 4567"
                      className={INPUT + " pl-8"} />
                  </div>
                </Field>
              </div>

              {/* ── Transfer: Previous owner ── */}
              {isTransfer && (
                <div className="rounded-xl border p-4 space-y-4"
                  style={{ background: "rgba(59,130,246,0.03)", borderColor: "rgba(59,130,246,0.15)" }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6" }}>
                      <TransferIcon />
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#1e40af" }}>
                      Change of Ownership — Previous Owner
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Old Owner Name (Transferor)" required>
                      <input value={oldOwnerName} onChange={e => setOldOwnerName(e.target.value)}
                        required={isTransfer} placeholder="Previous owner's full name" className={INPUT} />
                    </Field>
                    <Field label="Old Owner Address" required>
                      <input value={oldOwnerAddr} onChange={e => setOldOwnerAddr(e.target.value)}
                        required={isTransfer} placeholder="Previous owner's address" className={INPUT} />
                    </Field>
                  </div>
                </div>
              )}
            </div>

            {/* ══ Section 2: Vehicle Description ══ */}
            <div className="bg-white rounded-2xl border border-[#e8edf5] p-6 space-y-6"
              style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.045)" }}>
              <SectionHead n={2} title="Vehicle Description" icon={<VehicleIcon />} />

              {/* ── Quick-fill presets ── */}
              <div className="rounded-xl border border-[#e8edf5] p-4 space-y-3 bg-[#f8faff]">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BoltIcon />
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6b7a99" }}>
                      Quick Fill — {VEHICLE_PRESETS.length} Models
                    </p>
                  </div>
                  {activePreset && (
                    <button type="button" onClick={() => setActivePreset(null)}
                      className="text-[10px] font-semibold flex items-center gap-1 hover:opacity-70 transition"
                      style={{ color: "#9aa3be" }}>
                      <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                      Clear
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9aa3be" }}>
                    <SearchIcon size={13} />
                  </span>
                  <input type="text" value={presetSearch} onChange={e => setPresetSearch(e.target.value)}
                    placeholder="Search model, make, or fuel type…"
                    className="pl-8 pr-8 py-2 bg-white border border-[#e2e8f0] rounded-lg text-xs text-[#1a2e05] font-medium placeholder-[#c3ccd8] focus:outline-none focus:ring-2 focus:ring-[#81B71A]/20 focus:border-[#81B71A]/50 transition w-full" />
                  {presetSearch && (
                    <button type="button" onClick={() => setPresetSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-4 h-4 rounded-full transition hover:opacity-70"
                      style={{ color: "#9aa3be" }}>
                      <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {filteredPresets.map(p => {
                    const active = activePreset === p.label;
                    return (
                      <button key={p.label} type="button" onClick={() => applyPreset(p)}
                        className="px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all whitespace-nowrap"
                        style={{
                          background:  active ? "rgba(129,183,26,0.1)" : "white",
                          borderColor: active ? "#81B71A"              : "#e2e8f0",
                          color:       active ? "#2d5009"              : "#374167",
                          boxShadow:   active ? "0 0 0 2px rgba(129,183,26,0.15)" : "none",
                        }}>
                        {p.label}
                      </button>
                    );
                  })}
                  {filteredPresets.length === 0 && (
                    <p className="text-[10px] text-[#b0bbd6] italic px-1">No models match &quot;{presetSearch}&quot;</p>
                  )}
                </div>
                {activePreset && (
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: "#81B71A" }}>
                    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Specs loaded from <strong>{activePreset}</strong> — review and adjust below.
                  </div>
                )}
              </div>

              {/* ── Make / Year / Engine ── */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Field label="Make of Vehicle" required>
                  <input value={make} onChange={e => { setMake(e.target.value); setActivePreset(null); }}
                    required placeholder="e.g. Toyota" className={INPUT} />
                </Field>
                <Field label="Year and Model" required>
                  <input value={yearModel} onChange={e => setYearModel(e.target.value)}
                    required placeholder="e.g. 2024 Land Cruiser" className={INPUT} />
                </Field>
                <Field label="Engine Capacity (CC)" required>
                  <input value={engineCC} onChange={e => setEngineCC(e.target.value)}
                    required placeholder="e.g. 4500" className={INPUT} />
                </Field>
              </div>

              {/* ── Cylinders / Engine No / Chassis ── */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Field label="No. of Cylinders">
                  <select value={cylinders} onChange={e => setCylinders(e.target.value)} className={INPUT}>
                    {["N/A", "2", "4", "6", "8", "12"].map(n => <option key={n}>{n}</option>)}
                  </select>
                </Field>
                <Field label="Engine Number">
                  <input value={engineNo} onChange={e => setEngineNo(e.target.value)}
                    placeholder="e.g. 1VD-FTV8912" className={INPUT} />
                </Field>
                <Field label={`Chassis / VIN${vinLen > 0 ? ` (${vinLen}/17)` : ""}`} required>
                  <div className="relative">
                    <input value={chassisNo} onChange={e => setChassisNo(e.target.value)}
                      required placeholder="17-character VIN"
                      className={INPUT + " pr-9"}
                      maxLength={17}
                      style={{ borderColor: vinLen > 0 ? (vinValid ? "#81B71A" : "#ef4444") : undefined }} />
                    {vinLen > 0 && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        {vinValid
                          ? <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#81B71A" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                          : <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        }
                      </span>
                    )}
                  </div>
                </Field>
              </div>

              {/* ── Body Type ── */}
              <div>
                <p className={LABEL + " mb-2.5"}>Type of Body</p>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                  {BODY_TYPES.map(bt => {
                    const active = bodyType === bt.id;
                    const Icon = bt.icon;
                    return (
                      <button key={bt.id} type="button" onClick={() => setBodyType(bt.id)}
                        className="flex flex-col items-center gap-1.5 py-3 px-1.5 rounded-xl border transition-all"
                        style={{
                          background:  active ? "rgba(129,183,26,0.08)" : "#fafbfe",
                          borderColor: active ? "#81B71A"               : "#e8edf5",
                          boxShadow:   active ? "0 0 0 2px rgba(129,183,26,0.15)" : "none",
                          color:       active ? "#2d5009"               : "#6b7a99",
                        }}>
                        <Icon />
                        <span className="text-[9px] font-bold text-center leading-tight"
                          style={{ color: active ? "#1a2e05" : "#6b7a99" }}>
                          {bt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Fuel Type ── */}
              <div>
                <p className={LABEL + " mb-2.5"}>Fuel Type</p>
                <div className="flex flex-wrap gap-2.5">
                  {FUEL_TYPES.map(f => {
                    const active = fuelType === f.id;
                    const Icon = f.icon;
                    return (
                      <button key={f.id} type="button" onClick={() => setFuelType(f.id)}
                        className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all"
                        style={{
                          background:  active ? "rgba(129,183,26,0.08)" : "#fafbfe",
                          borderColor: active ? "#81B71A"               : "#e8edf5",
                          color:       active ? "#2d5009"               : "#374167",
                          boxShadow:   active ? "0 0 0 2px rgba(129,183,26,0.15)" : "none",
                        }}>
                        <span style={{ color: active ? "#81B71A" : "#9aa3be" }}><Icon /></span>
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Net / Gross weight ── */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Net Weight (kg)" required>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#c3ccd8" }}>
                      <WeightIcon />
                    </span>
                    <input value={netWeight} onChange={e => setNetWeight(e.target.value)}
                      required placeholder="e.g. 2630" className={INPUT + " pl-8"} />
                  </div>
                </Field>
                <Field label="Gross Weight (kg)" required>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#c3ccd8" }}>
                      <WeightIcon />
                    </span>
                    <input value={grossWeight} onChange={e => setGrossWeight(e.target.value)}
                      required placeholder="e.g. 3300" className={INPUT + " pl-8"} />
                  </div>
                </Field>
              </div>
            </div>

            {/* ══ Section 3: Tyre Specifications ══ */}
            <div className="bg-white rounded-2xl border border-[#e8edf5] p-6 space-y-5"
              style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.045)" }}>
              <SectionHead n={3} title="Tyre Size Specifications" icon={<TyreIcon />} />

              {/* Quick-fill tyre presets */}
              <div className="rounded-xl border border-[#e8edf5] p-4 space-y-3 bg-[#f8faff]">
                <div className="flex items-center gap-2">
                  <BoltIcon />
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6b7a99" }}>
                    Quick Fill — Standard Tyre Sizes
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TYRE_PRESETS.map(t => {
                    const active = tyreFW === t.w && tyreFD === t.d;
                    return (
                      <button key={t.label} type="button" onClick={() => applyTyre(t.w, t.d, "FR")}
                        className="px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all"
                        style={{
                          background:  active ? "rgba(129,183,26,0.1)" : "white",
                          borderColor: active ? "#81B71A"              : "#e2e8f0",
                          color:       active ? "#2d5009"              : "#374167",
                          boxShadow:   active ? "0 0 0 2px rgba(129,183,26,0.15)" : "none",
                        }}>
                        {t.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px]" style={{ color: "#b0bbd6" }}>
                  Selecting a size fills Front &amp; Rear automatically. Override individually below.
                </p>
              </div>

              {/* Tyre inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {([
                  { label: "Front Tyre",        icon: <TyreFrontIcon />, w: tyreFW, setW: setTyreFW, d: tyreFD, setD: setTyreFD },
                  { label: "Middle Tyre (opt.)", icon: <TyreMidIcon />,   w: tyreMW, setW: setTyreMW, d: tyreMD, setD: setTyreMD },
                  { label: "Rear Tyre",         icon: <TyreRearIcon />,  w: tyreRW, setW: setTyreRW, d: tyreRD, setD: setTyreRD },
                ] as const).map(tyre => (
                  <div key={tyre.label} className="rounded-xl border border-[#e8edf5] p-4 space-y-3"
                    style={{ background: "#fafbfe" }}>
                    <div className="flex items-center gap-2">
                      <span style={{ color: "#81B71A" }}>{tyre.icon}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6b7a99" }}>
                        {tyre.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[9px] font-bold uppercase text-[#b0bbd6] mb-1">Width (mm)</p>
                        <input value={tyre.w} onChange={e => (tyre.setW as (v: string) => void)(e.target.value)}
                          placeholder="e.g. 225"
                          className="px-2.5 py-2 bg-white border border-[#e2e8f0] rounded-lg text-xs font-semibold text-[#1a2e05] placeholder-[#c3ccd8] focus:outline-none focus:ring-1 focus:ring-[#81B71A]/30 w-full" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase text-[#b0bbd6] mb-1">Rim Dia</p>
                        <input value={tyre.d} onChange={e => (tyre.setD as (v: string) => void)(e.target.value)}
                          placeholder="e.g. 17"
                          className="px-2.5 py-2 bg-white border border-[#e2e8f0] rounded-lg text-xs font-semibold text-[#1a2e05] placeholder-[#c3ccd8] focus:outline-none focus:ring-1 focus:ring-[#81B71A]/30 w-full" />
                      </div>
                    </div>
                    {tyre.w && tyre.d && (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono"
                        style={{ color: "#81B71A" }}>
                        <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        {tyre.w}/65 R{tyre.d}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right panel (1/3) ── */}
          <div className="space-y-4 xl:sticky xl:top-20">

            {/* ══ Section 4: Audit & Payment ══ */}
            <div 
              className={`rounded-2xl border p-5 space-y-4 transition-all duration-500 ${
                auditHighlightActive 
                  ? "bg-emerald-50/20 border-emerald-400 ring-4 ring-emerald-500/15 shadow-xl shadow-emerald-500/10 animate-[pulse_2s_infinite]" 
                  : "bg-white border-[#e8edf5]"
              }`}
              style={{ boxShadow: auditHighlightActive ? undefined : "0 2px 16px rgba(0,0,0,0.045)" }}
            >
              <SectionHead n={4} title="Audit &amp; Payment" icon={<AuditIcon />} />

              <Field label="Receipt Number" required>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#c3ccd8" }}>
                    <ReceiptFieldIcon />
                  </span>
                  <input value={receiptNo} onChange={e => { setReceiptNo(e.target.value); setAuditHighlightActive(false); }}
                    required placeholder="470260*****" className={INPUT + " pl-8"} />
                </div>
              </Field>

              <Field label="Registration Date">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#c3ccd8" }}>
                    <CalendarFieldIcon />
                  </span>
                  <input type="date" value={regDate} onChange={e => { setRegDate(e.target.value); setAuditHighlightActive(false); }}
                    className={INPUT + " pl-8"} />
                </div>
              </Field>

              <div className="h-px bg-[#f0f3f8]" />

              <Field label="Customs Number" required>
                <input value={customsNo} onChange={e => { setCustomsNo(e.target.value); setAuditHighlightActive(false); }}
                  required placeholder="470260*****/**" className={INPUT} />
              </Field>

              <Field label="Customs Date" required>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#c3ccd8" }}>
                    <CalendarFieldIcon />
                  </span>
                  <input type="date" value={customsDate} onChange={e => { setCustomsDate(e.target.value); setAuditHighlightActive(false); }}
                    required className={INPUT + " pl-8"} />
                </div>
              </Field>

              <div className="h-px bg-[#f0f3f8]" />

              <Field label="Supervising Officer">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#c3ccd8" }}>
                    <PersonFieldIcon />
                  </span>
                  <select value={supervisor} onChange={e => { setSupervisor(e.target.value); setAuditHighlightActive(false); }}
                    className={INPUT + " pl-8"}>
                    <option value="Eric">Eric</option>
                    <option value="Saviour">Saviour</option>
                    <option value="Godson">Godson</option>
                  </select>
                </div>
              </Field>

              <button type="submit"
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 hover:opacity-95"
                style={{ background: "linear-gradient(115deg, #2d5009, #81B71A)", boxShadow: "0 4px 18px rgba(129,183,26,0.35)" }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                File Digital Logbook Entry
              </button>
            </div>

            {/* ── Live register preview ── */}
            <div className="rounded-2xl border overflow-hidden"
              style={{ background: "#0a150a", borderColor: "rgba(129,183,26,0.15)" }}>

              {/* Preview header */}
              <div className="flex items-center justify-between px-4 py-3 border-b"
                style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: "#81B71A" }} />
                  <span className="text-[9px] font-bold tracking-widest uppercase"
                    style={{ color: "rgba(255,255,255,0.45)" }}>Live Preview — Sheet 11851</span>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider"
                  style={{ background: "rgba(129,183,26,0.15)", color: "#81B71A", border: "1px solid rgba(129,183,26,0.2)" }}>
                  {CLASSIFICATIONS.find(c => c.id === classification)?.label}
                </span>
              </div>

              {/* Plate visual */}
              <div className="px-4 pt-4 pb-1">
                <div
                  className="relative w-full max-w-[320px] aspect-[4.2/1] mx-auto rounded-xl border-4 border-slate-900 p-1 shadow-2xl overflow-hidden select-none flex items-center"
                  style={{
                    background:
                      CLASSIFICATIONS.find(c => c.id === classification)?.id === "COMMERCIAL"
                        ? "linear-gradient(180deg, #ffe066 0%, #fcc419 60%, #fab005 100%)"
                        : CLASSIFICATIONS.find(c => c.id === classification)?.id === "GOVERNMENT"
                        ? "linear-gradient(180deg, #2f9e44 0%, #2b8a3e 60%, #1e702e 100%)"
                        : "linear-gradient(180deg, #f8f9fa 0%, #e9ecef 60%, #dee2e6 100%)",
                    boxShadow: "0 15px 30px rgba(0,0,0,0.18), inset 0 3px 6px rgba(255,255,255,0.8), inset 0 -3px 6px rgba(0,0,0,0.2)",
                  }}
                >
                  {/* Embossed inner rim */}
                  <div className="absolute inset-0.5 rounded-lg border border-slate-950/20 pointer-events-none" />

                  {/* Reflective light shine */}
                  <div className="absolute inset-0 pointer-events-none bg-linear-to-tr from-transparent via-white/20 to-white/40 z-10" />

                  {/* Ghana flag / left strip */}
                  <div
                    className="w-[12%] h-full shrink-0 flex flex-col items-center justify-between py-1 bg-[#0c3b87] rounded-l-[5px] relative overflow-hidden z-20"
                    style={{ boxShadow: "1px 0 3px rgba(0,0,0,0.15)" }}
                  >
                    <div className="w-[85%] aspect-3/2 flex flex-col rounded-sm overflow-hidden border border-white/10 shrink-0">
                      <div className="flex-1 bg-red-600" />
                      <div className="flex-1 bg-yellow-400 flex items-center justify-center relative">
                        <span className="absolute text-[5px] text-black leading-none -top-0.5">★</span>
                      </div>
                      <div className="flex-1 bg-green-600" />
                    </div>
                    <span className="text-[10px] font-black text-white leading-none tracking-tighter">GH</span>
                  </div>

                  {/* Plate text */}
                  <div className="flex-1 flex items-center justify-center px-3 relative h-full z-20">
                    <div
                      className="absolute right-3 top-1.5 w-5 h-5 rounded-full bg-linear-to-tr from-yellow-300 via-amber-400 to-yellow-500 opacity-60 flex items-center justify-center"
                      style={{ boxShadow: "0 0 5px rgba(245,158,11,0.6)", border: "0.5px solid rgba(255,255,255,0.2)" }}
                    >
                      <span className="text-[5px] font-black text-amber-950 select-none tracking-tighter">DVLA</span>
                    </div>

                    <span
                      className="font-mono text-[18px] md:text-[20px] font-black tracking-wide whitespace-nowrap uppercase"
                      style={{
                        fontFamily: "'Courier New', Courier, monospace",
                        letterSpacing: "3px",
                        color:
                          CLASSIFICATIONS.find(c => c.id === classification)?.id === "GOVERNMENT"
                            ? "#ffffff"
                            : CLASSIFICATIONS.find(c => c.id === classification)?.id === "EQUIPMENT"
                            ? "#1b8a3e"
                            : "#1e293b",
                        textShadow:
                          CLASSIFICATIONS.find(c => c.id === classification)?.id === "GOVERNMENT"
                            ? "2px 2px 2px rgba(0,0,0,0.5), -1px -1px 0px rgba(0,0,0,0.3)"
                            : "1.5px 1.5px 1px rgba(255,255,255,0.8), -1.5px -1.5px 1px rgba(0,0,0,0.5)",
                      }}
                    >
                      {regNo || "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3 font-mono text-[10px]" style={{ color: "#c5d9a8" }}>
                <Row label="TRANSACTION" value={BOOKING_TYPES.find(b => b.id === bookingType)?.label.split(" ")[0] ?? "—"} />
                <Row label="PLATE NO"    value={regNo || "PENDING"} highlight />

                {isTransfer && (
                  <div className="rounded-lg p-2.5 space-y-1 border"
                    style={{ background: "rgba(59,130,246,0.07)", borderColor: "rgba(59,130,246,0.18)" }}>
                    <span className="text-[8px] font-black uppercase block" style={{ color: "#93c5fd" }}>TRANSFER FROM</span>
                    <p className="text-white font-bold truncate">{oldOwnerName || "—"}</p>
                  </div>
                )}

                <Row label={isTransfer ? "NEW OWNER" : "OWNER"} value={ownerName || "Awaiting…"} />
                {address && <Row label="ADDRESS" value={address} />}
                {phone    && <Row label="TEL"     value={phone}   highlight />}

                <div className="border-t pt-3 space-y-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <Row label="MAKE"    value={make     || "—"} />
                  <Row label="MODEL"   value={yearModel || "—"} />
                  <Row label="CHASSIS" value={chassisNo || "—"} />
                  <Row label="ENGINE"  value={engineNo ? `${engineNo} (${engineCC}cc)` : "—"} />
                  {fuelType && <Row label="FUEL" value={fuelType} />}
                  {bodyType && <Row label="BODY" value={bodyType} />}
                </div>

                {(tyreFW || tyreRW) && (
                  <div className="border-t pt-3 grid grid-cols-3 gap-2"
                    style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <MiniRow label="FRONT" value={tyreFW && tyreFD ? `${tyreFW}/${tyreFD}` : "—"} />
                    <MiniRow label="MID"   value={tyreMW && tyreMD ? `${tyreMW}/${tyreMD}` : "—"} />
                    <MiniRow label="REAR"  value={tyreRW && tyreRD ? `${tyreRW}/${tyreRD}` : "—"} />
                  </div>
                )}

                {receiptNo && (
                  <div className="border-t pt-3 space-y-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <Row label="RECEIPT"      value={receiptNo} />
                    <Row label="CUSTOMS NO"   value={customsNo || "—"} />
                    <Row label="CUSTOMS DATE" value={customsDate || "—"} />
                    <Row label="SUPERVISOR"   value={supervisor} highlight />
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    )}


    </div>
  );
}

/* ── Register preview helpers ── */
function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <span className="text-[8px] font-black uppercase block mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</span>
      <p className="font-bold truncate text-[11px]" style={{ color: highlight ? "#81B71A" : "rgba(255,255,255,0.9)" }}>{value}</p>
    </div>
  );
}
function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[8px] font-black uppercase block mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</span>
      <p className="font-semibold text-[10px]" style={{ color: "#c5d9a8" }}>{value}</p>
    </div>
  );
}

/* ════════════════ ICON LIBRARY ════════════════ */

function SearchIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function BoltIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#81B71A" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
function ScanIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="3" y1="12" x2="21" y2="12" strokeWidth={2.5} />
    </svg>
  );
}
function SpinIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
      style={{ animation: "spin 1s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

/* Section icons */
function OwnerIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function VehicleIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-3" />
      <circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  );
}
function TyreIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="8" /><line x1="12" y1="16" x2="12" y2="22" />
      <line x1="2" y1="12" x2="8" y2="12" /><line x1="16" y1="12" x2="22" y2="12" />
    </svg>
  );
}
function AuditIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
function TransferIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

/* Field prefix icons */
function PlateFieldIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#9aa3be" strokeWidth={2} strokeLinecap="round">
      <rect x="2" y="7" width="20" height="10" rx="2" /><line x1="6" y1="12" x2="18" y2="12" strokeWidth={2.5} />
    </svg>
  );
}
function PersonFieldIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#9aa3be" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function LocationFieldIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#9aa3be" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function PhoneFieldIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#9aa3be" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.9a16 16 0 0 0 6.18 6.18l1.16-.85a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function ReceiptFieldIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#9aa3be" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
function CalendarFieldIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#9aa3be" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function WeightIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="6" />
      <path d="M5 10l7-4 7 4v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
    </svg>
  );
}

/* Booking type icons */
function BookingNewIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}
function BookingStarIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function BookingTransferIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}
function BookingComboIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17 5.8 21.3l2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

/* Classification icons */
function ClassPrivateIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function ClassCommercialIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 5v3h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}
function ClassEquipmentIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z" />
    </svg>
  );
}
function ClassGovIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="22" x2="21" y2="22" /><line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" /><line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 20 7 4 7" />
    </svg>
  );
}

/* Body type icons */
function BodySaloonIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17H3a2 2 0 0 1-2-2v-3l3-5h13l3 5v3a2 2 0 0 1-2 2h-2" />
      <path d="M7 9l2-4h6l2 4" />
      <circle cx="7.5" cy="17.5" r="2.5" /><circle cx="16.5" cy="17.5" r="2.5" />
    </svg>
  );
}
function BodyHatchIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 17H2a2 2 0 0 1-2-2v-3l2-5h16l2 5v3a2 2 0 0 1-2 2h-2" />
      <path d="M5 7l3-5h8l3 5" />
      <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
    </svg>
  );
}
function BodySUVIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17H1v-5l4-6h14l4 6v5h-2" />
      <path d="M5 6V4h14v2" />
      <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
    </svg>
  );
}
function BodyPickupIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 10h10V6l3-3h6v11H1z" />
      <path d="M13 6l2-3" /><line x1="1" y1="14" x2="20" y2="14" />
      <circle cx="5" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
    </svg>
  );
}
function BodyMinibusIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="6" width="22" height="11" rx="2" />
      <path d="M7 6V4h10v2" />
      <circle cx="6" cy="17" r="1.5" /><circle cx="18" cy="17" r="1.5" />
      <line x1="1" y1="11" x2="23" y2="11" />
    </svg>
  );
}
function BodyBusIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6H2v9.5" /><path d="M22 6H8v10h14V6z" />
      <circle cx="5.5" cy="17.5" r="1.5" /><circle cx="18.5" cy="17.5" r="1.5" />
      <line x1="8" y1="10" x2="22" y2="10" />
    </svg>
  );
}
function BodyEquipIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="12" width="14" height="8" rx="1" />
      <path d="M16 14h2l4-6V6h-6v8z" />
      <circle cx="6" cy="20" r="2" /><circle cx="12" cy="20" r="2" />
      <line x1="2" y1="16" x2="16" y2="16" />
    </svg>
  );
}

/* Fuel type icons */
function FuelPetrolIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22V8l7-6 7 6v14H3z" />
      <path d="M17 8l3-3 1 1-3 3" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  );
}
function FuelDieselIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="7" ry="3" />
      <path d="M5 5v10a7 3 0 0 0 14 0V5" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function FuelElectricIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

/* Tyre position icons */
function TyreFrontIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
      <line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}
function TyreMidIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
      <line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" />
    </svg>
  );
}
function TyreRearIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
      <line x1="4.93" y1="4.93" x2="7.05" y2="7.05" /><line x1="16.95" y1="16.95" x2="19.07" y2="19.07" />
    </svg>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-100 text-slate-500 font-semibold text-xs bg-slate-900/10 backdrop-blur-md rounded-2xl border border-slate-200/50">
        Loading Booking Desk Registry...
      </div>
    }>
      <BookingDeskContent />
    </Suspense>
  );
}
