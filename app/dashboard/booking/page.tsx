"use client";

import { useState } from "react";

/* ─── Static reference data ─── */

const BOOKING_TYPES = [
  { id: "REGISTRATION",         label: "Registration",                              sub: "New plate issuance", icon: BookingNewIcon      },
  { id: "REG_SPECIAL",          label: "Special Number",                            sub: "Custom plate request", icon: BookingStarIcon   },
  { id: "REG_TRANSFER",         label: "Registration & Transfer",                   sub: "Ownership change",   icon: BookingTransferIcon },
  { id: "REG_TRANSFER_SPECIAL", label: "Transfer + Special",                        sub: "Transfer with custom", icon: BookingComboIcon  },
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
export default function BookingPage() {

  /* ── Selectors ── */
  const [bookingType,    setBookingType]    = useState("REGISTRATION");
  const [classification, setClassification] = useState("PRIVATE");

  /* ── Owner ── */
  const [regNo,        setRegNo]        = useState("AD 0001-26");
  const [ownerName,    setOwnerName]    = useState("");
  const [address,      setAddress]      = useState("");
  const [phone,        setPhone]        = useState("");
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
    setRegNo("AD 0001-26");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
        <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">

          {/* ── Left panel (2/3) ── */}
          <div className="xl:col-span-2 space-y-5">

            {/* ══ Section 1: Booking Details ══ */}
            <div className="bg-white rounded-2xl border border-[#e8edf5] p-6 space-y-6"
              style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.045)" }}>
              <SectionHead n={1} title="Booking Type &amp; Owner Details" icon={<OwnerIcon />} />

              {/* ── Booking Type — card selector ── */}
              <div>
                <p className={LABEL + " mb-2.5"}>Booking / Service Type</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {BOOKING_TYPES.map(b => {
                    const active = bookingType === b.id;
                    const Icon = b.icon;
                    return (
                      <button key={b.id} type="button" onClick={() => setBookingType(b.id)}
                        className="relative flex flex-col items-start gap-2 p-3.5 rounded-xl border text-left transition-all"
                        style={{
                          background:   active ? "rgba(129,183,26,0.07)" : "#fafbfe",
                          borderColor:  active ? "#81B71A"               : "#e8edf5",
                          boxShadow:    active ? "0 0 0 2px rgba(129,183,26,0.15), 0 2px 8px rgba(129,183,26,0.08)" : "none",
                        }}>
                        {active && (
                          <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ background: "#81B71A" }}>
                            <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          </span>
                        )}
                        <span style={{ color: active ? "#81B71A" : "#9aa3be" }}>
                          <Icon />
                        </span>
                        <div>
                          <p className="text-[11px] font-bold leading-tight" style={{ color: active ? "#1a2e05" : "#374167" }}>{b.label}</p>
                          <p className="text-[10px] mt-0.5 font-medium" style={{ color: active ? "#6b7a99" : "#b0bbd6" }}>{b.sub}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Classification — card selector ── */}
              <div>
                <p className={LABEL + " mb-2.5"}>Vehicle / Plate Classification</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {CLASSIFICATIONS.map(c => {
                    const active = classification === c.id;
                    const Icon = c.icon;
                    return (
                      <button key={c.id} type="button" onClick={() => setClassification(c.id)}
                        className="relative flex flex-col items-start gap-2 p-3.5 rounded-xl border text-left transition-all"
                        style={{
                          background:  active ? "rgba(129,183,26,0.07)" : "#fafbfe",
                          borderColor: active ? "#81B71A"               : "#e8edf5",
                          boxShadow:   active ? "0 0 0 2px rgba(129,183,26,0.15), 0 2px 8px rgba(129,183,26,0.08)" : "none",
                        }}>
                        {active && (
                          <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ background: "#81B71A" }}>
                            <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          </span>
                        )}
                        <span style={{ color: active ? "#81B71A" : "#9aa3be" }}>
                          <Icon />
                        </span>
                        <div>
                          <p className="text-[11px] font-bold leading-tight" style={{ color: active ? "#1a2e05" : "#374167" }}>{c.label}</p>
                          <p className="text-[10px] mt-0.5 font-medium" style={{ color: active ? "#6b7a99" : "#b0bbd6" }}>{c.sub}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Registration No + Owner Name ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Registration Number" required>
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
                <Field label="Engine Number" required>
                  <input value={engineNo} onChange={e => setEngineNo(e.target.value)}
                    required placeholder="e.g. 1VD-FTV8912" className={INPUT} />
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
            <div className="bg-white rounded-2xl border border-[#e8edf5] p-5 space-y-4"
              style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.045)" }}>
              <SectionHead n={4} title="Audit &amp; Payment" icon={<AuditIcon />} />

              <Field label="Receipt Number" required>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#c3ccd8" }}>
                    <ReceiptFieldIcon />
                  </span>
                  <input value={receiptNo} onChange={e => setReceiptNo(e.target.value)}
                    required placeholder="e.g. R-908123" className={INPUT + " pl-8"} />
                </div>
              </Field>

              <Field label="Registration Date">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#c3ccd8" }}>
                    <CalendarFieldIcon />
                  </span>
                  <input type="date" value={regDate} onChange={e => setRegDate(e.target.value)}
                    className={INPUT + " pl-8"} />
                </div>
              </Field>

              <div className="h-px bg-[#f0f3f8]" />

              <Field label="Customs Number" required>
                <input value={customsNo} onChange={e => setCustomsNo(e.target.value)}
                  required placeholder="e.g. C-182901-ADT" className={INPUT} />
              </Field>

              <Field label="Customs Date" required>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#c3ccd8" }}>
                    <CalendarFieldIcon />
                  </span>
                  <input type="date" value={customsDate} onChange={e => setCustomsDate(e.target.value)}
                    required className={INPUT + " pl-8"} />
                </div>
              </Field>

              <div className="h-px bg-[#f0f3f8]" />

              <Field label="Supervising Officer">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#c3ccd8" }}>
                    <PersonFieldIcon />
                  </span>
                  <select value={supervisor} onChange={e => setSupervisor(e.target.value)}
                    className={INPUT + " pl-8"}>
                    <option value="Eric">Eric</option>
                    <option value="Saviour">Saviour</option>
                    <option value="Godson">Godson</option>
                  </select>
                </div>
              </Field>

              <button type="submit"
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-95 flex items-center justify-center gap-2"
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
