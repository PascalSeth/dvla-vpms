"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getStoredReservations, checkPlateReservation, saveStoredReservations, Reservation } from "../../../components/reservationsData";
import { DigitalPlate, PlateCategory } from "@/components/DigitalPlate";
import {
  VehicleModel,
  VEHICLE_CATALOG,
  YEARS_LIST,
  searchVehicles,
} from "@/lib/vehicleCatalog";

/* ─── Static reference data ─── */

const CLASSIFICATIONS = [
  { id: "PRIVATE", label: "Private (White Plate)", badge: "⚪ Private" },
  { id: "COMMERCIAL", label: "Commercial (Yellow Plate)", badge: "🟡 Commercial" },
  { id: "ELECTRIC", label: "Electric Vehicle (EV Green Plate)", badge: "🟢 EV Green" },
  { id: "GOVERNMENT", label: "Government (GV Split Plate)", badge: "🏛️ GV Split" },
  { id: "TRAILER", label: "Trailer (Yellow T Plate)", badge: "🟡 Trailer" },
  { id: "MOTORCYCLE", label: "Motorcycle (Light Blue Plate)", badge: "🔵 Motorcycle" },
  { id: "TEMPORARY", label: "Temporary (TMP Sticker Plate)", badge: "🔷 TMP Sticker" },
  { id: "AGRICULTURAL", label: "Agricultural (Farm Machinery)", badge: "🚜 Agri" },
];

const BODY_TYPES = [
  "Saloon",
  "Hatchback",
  "SUV / Station Wagon",
  "Pickup / Truck",
  "Minibus / Van",
  "Bus",
  "Coupe",
  "Equipment / Machinery",
];

const FUEL_TYPES = [
  { id: "PETROL", label: "Petrol" },
  { id: "DIESEL", label: "Diesel" },
  { id: "ELECTRIC", label: "Electric" },
];

interface VehiclePreset {
  label: string; year: string; make: string; model: string; engineCC: string;
  cylinders: string; bodyType: string; netWeight: string;
  grossWeight: string; tyreW: string; tyreDia: string; fuelType: string;
}

const VEHICLE_PRESETS: VehiclePreset[] = [
  // 2025 Models
  { label: "Toyota Camry (2025)", year: "2025", make: "Toyota", model: "Camry", engineCC: "2500", cylinders: "4", bodyType: "Saloon", netWeight: "1590", grossWeight: "2095", tyreW: "235", tyreDia: "18", fuelType: "PETROL" },
  { label: "Toyota Corolla (2025)", year: "2025", make: "Toyota", model: "Corolla", engineCC: "2000", cylinders: "4", bodyType: "Saloon", netWeight: "1350", grossWeight: "1790", tyreW: "215", tyreDia: "18", fuelType: "PETROL" },
  { label: "Honda CR-V (2025)", year: "2025", make: "Honda", model: "CR-V", engineCC: "1500", cylinders: "4", bodyType: "SUV / Station Wagon", netWeight: "1630", grossWeight: "2150", tyreW: "235", tyreDia: "18", fuelType: "PETROL" },
  { label: "Honda Accord (2025)", year: "2025", make: "Honda", model: "Accord", engineCC: "1500", cylinders: "4", bodyType: "Saloon", netWeight: "1480", grossWeight: "1920", tyreW: "225", tyreDia: "19", fuelType: "PETROL" },
  { label: "Ford Explorer (2025)", year: "2025", make: "Ford", model: "Explorer", engineCC: "2300", cylinders: "4", bodyType: "SUV / Station Wagon", netWeight: "1970", grossWeight: "2790", tyreW: "255", tyreDia: "20", fuelType: "PETROL" },
  { label: "Ford Mustang (2025)", year: "2025", make: "Ford", model: "Mustang", engineCC: "5000", cylinders: "8", bodyType: "Coupe", netWeight: "1720", grossWeight: "2150", tyreW: "255", tyreDia: "19", fuelType: "PETROL" },
  { label: "Tesla Model Y (2025)", year: "2025", make: "Tesla", model: "Model Y", engineCC: "N/A (Electric)", cylinders: "N/A", bodyType: "SUV / Station Wagon", netWeight: "1910", grossWeight: "2405", tyreW: "255", tyreDia: "19", fuelType: "ELECTRIC" },
  { label: "Hyundai Santa Fe (2025)", year: "2025", make: "Hyundai", model: "Santa Fe", engineCC: "2500", cylinders: "4", bodyType: "SUV / Station Wagon", netWeight: "1830", grossWeight: "2510", tyreW: "235", tyreDia: "18", fuelType: "PETROL" },
  { label: "Kia Telluride (2025)", year: "2025", make: "Kia", model: "Telluride", engineCC: "3800", cylinders: "6", bodyType: "SUV / Station Wagon", netWeight: "1980", grossWeight: "2640", tyreW: "245", tyreDia: "20", fuelType: "PETROL" },
  { label: "BMW X5 (2025)", year: "2025", make: "BMW", model: "X5", engineCC: "3000", cylinders: "6", bodyType: "SUV / Station Wagon", netWeight: "2100", grossWeight: "2850", tyreW: "275", tyreDia: "20", fuelType: "PETROL" },
  { label: "BMW 3 Series (2025)", year: "2025", make: "BMW", model: "3 Series", engineCC: "2000", cylinders: "4", bodyType: "Saloon", netWeight: "1620", grossWeight: "2100", tyreW: "225", tyreDia: "18", fuelType: "PETROL" },
  { label: "Mercedes GLE (2025)", year: "2025", make: "Mercedes-Benz", model: "GLE", engineCC: "2000", cylinders: "4", bodyType: "SUV / Station Wagon", netWeight: "2150", grossWeight: "2930", tyreW: "275", tyreDia: "20", fuelType: "PETROL" },
  { label: "Lexus RX 350 (2025)", year: "2025", make: "Lexus", model: "RX 350", engineCC: "2400", cylinders: "4", bodyType: "SUV / Station Wagon", netWeight: "1950", grossWeight: "2600", tyreW: "235", tyreDia: "19", fuelType: "PETROL" },
  { label: "Nissan Rogue (2025)", year: "2025", make: "Nissan", model: "Rogue", engineCC: "1500", cylinders: "3", bodyType: "SUV / Station Wagon", netWeight: "1620", grossWeight: "2080", tyreW: "235", tyreDia: "19", fuelType: "PETROL" },

  // 2024 Models
  { label: "Toyota Land Cruiser (2024)", year: "2024", make: "Toyota", model: "Land Cruiser", engineCC: "2400", cylinders: "4", bodyType: "SUV / Station Wagon", netWeight: "2200", grossWeight: "2950", tyreW: "265", tyreDia: "18", fuelType: "PETROL" },
  { label: "Toyota Tacoma (2024)", year: "2024", make: "Toyota", model: "Tacoma", engineCC: "2400", cylinders: "4", bodyType: "Pickup / Truck", netWeight: "1950", grossWeight: "2630", tyreW: "265", tyreDia: "18", fuelType: "PETROL" },
  { label: "Toyota Highlander (2024)", year: "2024", make: "Toyota", model: "Highlander", engineCC: "2400", cylinders: "4", bodyType: "SUV / Station Wagon", netWeight: "1920", grossWeight: "2610", tyreW: "235", tyreDia: "18", fuelType: "PETROL" },
  { label: "Hyundai Tucson (2024)", year: "2024", make: "Hyundai", model: "Tucson", engineCC: "2000", cylinders: "4", bodyType: "SUV / Station Wagon", netWeight: "1680", grossWeight: "2145", tyreW: "235", tyreDia: "19", fuelType: "PETROL" },
  { label: "Kia Sportage (2024)", year: "2024", make: "Kia", model: "Sportage", engineCC: "2000", cylinders: "4", bodyType: "SUV / Station Wagon", netWeight: "1610", grossWeight: "2090", tyreW: "235", tyreDia: "19", fuelType: "PETROL" },
  { label: "Honda Civic (2024)", year: "2024", make: "Honda", model: "Civic", engineCC: "1500", cylinders: "4", bodyType: "Saloon", netWeight: "1340", grossWeight: "1760", tyreW: "215", tyreDia: "17", fuelType: "PETROL" },
  { label: "Jetour Dashing (2024)", year: "2024", make: "Jetour", model: "Dashing", engineCC: "1498", cylinders: "4", bodyType: "SUV / Station Wagon", netWeight: "1535", grossWeight: "1888", tyreW: "235", tyreDia: "19", fuelType: "PETROL" },
  { label: "Jetour Traveller T2 (2024)", year: "2024", make: "Jetour", model: "Traveller T2", engineCC: "1998", cylinders: "4", bodyType: "SUV / Station Wagon", netWeight: "1880", grossWeight: "2255", tyreW: "255", tyreDia: "20", fuelType: "PETROL" },
  { label: "Tesla Model 3 (2024)", year: "2024", make: "Tesla", model: "Model 3", engineCC: "N/A (Electric)", cylinders: "N/A", bodyType: "Saloon", netWeight: "1760", grossWeight: "2200", tyreW: "235", tyreDia: "18", fuelType: "ELECTRIC" },

  // 2023 & Older
  { label: "Toyota Hilux (2023)", year: "2023", make: "Toyota", model: "Hilux", engineCC: "2800", cylinders: "4", bodyType: "Pickup / Truck", netWeight: "1920", grossWeight: "3200", tyreW: "265", tyreDia: "17", fuelType: "DIESEL" },
  { label: "Toyota Fortuner (2023)", year: "2023", make: "Toyota", model: "Fortuner", engineCC: "2700", cylinders: "4", bodyType: "SUV / Station Wagon", netWeight: "1920", grossWeight: "2560", tyreW: "265", tyreDia: "17", fuelType: "DIESEL" },
  { label: "Nissan Navara (2023)", year: "2023", make: "Nissan", model: "Navara", engineCC: "2500", cylinders: "4", bodyType: "Pickup / Truck", netWeight: "1960", grossWeight: "2910", tyreW: "255", tyreDia: "17", fuelType: "DIESEL" },
  { label: "Mercedes E-Class (2023)", year: "2023", make: "Mercedes-Benz", model: "E-Class", engineCC: "2000", cylinders: "4", bodyType: "Saloon", netWeight: "1720", grossWeight: "2195", tyreW: "245", tyreDia: "18", fuelType: "PETROL" },
  { label: "Ford Ranger (2023)", year: "2023", make: "Ford", model: "Ranger", engineCC: "2000", cylinders: "4", bodyType: "Pickup / Truck", netWeight: "1950", grossWeight: "3150", tyreW: "265", tyreDia: "17", fuelType: "DIESEL" },
  { label: "Toyota Land Cruiser V8 (2022)", year: "2022", make: "Toyota", model: "Land Cruiser V8", engineCC: "4500", cylinders: "8", bodyType: "SUV / Station Wagon", netWeight: "2630", grossWeight: "3300", tyreW: "285", tyreDia: "18", fuelType: "DIESEL" },
  { label: "Toyota Prado (2022)", year: "2022", make: "Toyota", model: "Prado", engineCC: "2700", cylinders: "4", bodyType: "SUV / Station Wagon", netWeight: "2040", grossWeight: "2990", tyreW: "265", tyreDia: "17", fuelType: "PETROL" },
  { label: "Nissan Patrol (2022)", year: "2022", make: "Nissan", model: "Patrol", engineCC: "4000", cylinders: "6", bodyType: "SUV / Station Wagon", netWeight: "2280", grossWeight: "2890", tyreW: "265", tyreDia: "17", fuelType: "PETROL" },
];

const TYRE_PRESETS = [
  { label: "195/65 R15", w: "195", d: "15" },
  { label: "205/55 R16", w: "205", d: "16" },
  { label: "215/55 R17", w: "215", d: "17" },
  { label: "225/60 R17", w: "225", d: "17" },
  { label: "235/60 R18", w: "235", d: "18" },
  { label: "265/65 R17", w: "265", d: "17" },
  { label: "285/60 R18", w: "285", d: "18" },
];

const SAMPLE_VRS_INVOICES = [
  { no: "4N92P81C11VR7K", label: "Seth Pascal (Audi Q7)" },
  { no: "9X14T73B12MQ5W", label: "Nana Opoku (Lexus RX)" },
  { no: "5Q27A81C09TK6V", label: "Selasi Dzifa (EV Tesla)" },
];

/* ── Design tokens ── */
const INPUT =
  "px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#81B71A] focus:border-[#81B71A] transition-all w-full placeholder-slate-400";

interface FieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  isFilled?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  hint?: string;
  optional?: boolean;
  fieldId?: string;
}

function Field({
  label,
  children,
  required = false,
  isFilled = false,
  hasError = false,
  errorMessage,
  hint,
  optional = false,
  fieldId,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1" id={fieldId ? `field-container-${fieldId}` : undefined}>
      <label className="text-[11px] font-semibold flex items-center justify-between gap-1.5 flex-wrap">
        <span className="flex items-center gap-1.5 flex-wrap">
          <span className={hasError ? "text-rose-700 font-bold" : "text-slate-700"}>
            {label}
          </span>
          {required && (
            isFilled ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                FILLED
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                hasError
                  ? "bg-rose-600 text-white shadow-xs animate-bounce"
                  : "bg-rose-100 text-rose-700 border border-rose-300"
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                REQUIRED
              </span>
            )
          )}
          {optional && (
            <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200/60">
              Optional
            </span>
          )}
        </span>
        {hint && (
          <span className="text-[10px] text-slate-400 font-normal hidden sm:inline-block">
            {hint}
          </span>
        )}
      </label>

      <div className={`transition-all duration-200 rounded-lg ${
        hasError
          ? "ring-2 ring-rose-400 border border-rose-500 bg-rose-50/20"
          : ""
      }`}>
        {children}
      </div>

      {hasError && (
        <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in duration-150">
          <svg className="w-3.5 h-3.5 text-rose-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{errorMessage || `${label} is required`}</span>
        </p>
      )}
    </div>
  );
}

function ChecklistItem({
  label,
  value,
  isDone,
  onClick,
}: {
  label: string;
  value?: string;
  isDone: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left transition cursor-pointer border ${
        isDone
          ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-950 hover:bg-emerald-100/70"
          : "bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50/30 text-slate-700"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
            isDone
              ? "bg-emerald-600 text-white"
              : "border-2 border-dashed border-rose-400 text-rose-500 bg-rose-50"
          }`}
        >
          {isDone ? "✓" : "!"}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold truncate leading-tight">
            {label}
          </p>
          {isDone && value ? (
            <p className="text-[10px] text-emerald-700 truncate font-mono">
              {value}
            </p>
          ) : (
            <p className="text-[10px] text-rose-600 font-semibold">
              Action Required
            </p>
          )}
        </div>
      </div>
      <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-1">
        {isDone ? "Edit" : "Fill →"}
      </span>
    </button>
  );
}

/* ════════════════ PAGE CONTENT ════════════════ */
function BookingDeskContent() {
  const searchParams = useSearchParams();
  const isPrefill = searchParams ? searchParams.get("prefill") === "1" : false;
  const serviceParam = searchParams ? searchParams.get("service") : null;

  /* ── Tab navigation state ── */
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4>(1);

  /* ── Map service to booking type ── */
  const getBookingTypeFromService = (service: string | null): string => {
    if (!service) return "REGISTRATION";
    if (service.includes("Special")) return "REG_SPECIAL";
    if (service.includes("Transfer")) return "REG_TRANSFER";
    if (service.includes("Customized")) return "REG_SPECIAL";
    return "REGISTRATION";
  };

  const getClassificationFromService = (service: string | null): string => {
    if (!service) return "PRIVATE";
    if (service.includes("GV")) return "GOVERNMENT";
    if (service.includes("CD")) return "GOVERNMENT";
    return "PRIVATE";
  };

  /* ── Selectors ── */
  const [bookingType, setBookingType] = useState(() => {
    if (isPrefill && searchParams) {
      const platePattern = searchParams.get("platePattern");
      const rangeStart = searchParams.get("rangeStart");
      if (platePattern || rangeStart) return "REG_SPECIAL";
    }
    return getBookingTypeFromService(serviceParam);
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
    return getClassificationFromService(serviceParam);
  });

  const [selectedService] = useState(serviceParam || "");

  /* ── VRS Quick-Fill states ── */
  const [vrsInvoiceNo, setVrsInvoiceNo] = useState("");
  const [isFetchingVrs, setIsFetchingVrs] = useState(false);
  const [vrsSuccessMessage, setVrsSuccessMessage] = useState("");
  const [alreadyBookedError, setAlreadyBookedError] = useState<string | null>(null);

  /* ── Owner ── */
  const [regNo, setRegNo] = useState(() => {
    if (isPrefill && searchParams) {
      const platePattern = searchParams.get("platePattern");
      if (platePattern) return platePattern;
      const rangeStart = searchParams.get("rangeStart");
      if (rangeStart) {
        const prefix = searchParams.get("prefix") || "KX";
        return `${prefix} ${rangeStart}-AD`;
      }
    }
    return "";
  });

  const [ownerName, setOwnerName] = useState(() => {
    return isPrefill && searchParams ? (searchParams.get("holder") || "") : "";
  });

  const [address, setAddress] = useState(() => {
    return isPrefill && searchParams ? (searchParams.get("address") || "") : "";
  });

  const [phone, setPhone] = useState(() => {
    return isPrefill && searchParams ? (searchParams.get("phone") || "") : "";
  });

  const [oldOwnerName, setOldOwnerName] = useState("");
  const [oldOwnerPhone, setOldOwnerPhone] = useState("");
  const [oldOwnerAddr, setOldOwnerAddr] = useState("");
  const [oldOwnerCustom, setOldOwnerCustom] = useState("");
  const [showExtraPhone, setShowExtraPhone] = useState(false);
  const [showExtraAddr, setShowExtraAddr] = useState(false);
  const [showExtraCustom, setShowExtraCustom] = useState(false);

  /* ── Vehicle specs ── */
  const [make, setMake] = useState("");
  const [year, setYear] = useState("");
  const [model, setModel] = useState("");
  const [engineCC, setEngineCC] = useState("");
  const [cylinders, setCylinders] = useState("4");
  const [engineNo, setEngineNo] = useState("");
  const [chassisNo, setChassisNo] = useState("");
  const [bodyType, setBodyType] = useState("Saloon");
  const [fuelType, setFuelType] = useState("PETROL");
  const [netWeight, setNetWeight] = useState("");
  const [grossWeight, setGrossWeight] = useState("");

  /* ── Database-Backed Vehicle Catalog State ── */
  const chassisInputRef = useRef<HTMLInputElement>(null);
  const vehicleSearchDropdownRef = useRef<HTMLDivElement>(null);
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState("");
  const [selectedCatalogYear, setSelectedCatalogYear] = useState("2024");
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
  const [autoFilledNotice, setAutoFilledNotice] = useState<string | null>(null);

  // Database Vehicles state
  const [dbVehicles, setDbVehicles] = useState<VehicleModel[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [selectedMakeFilter, setSelectedMakeFilter] = useState("All");
  const [isSavingCustomModel, setIsSavingCustomModel] = useState(false);
  const [saveModelSuccess, setSaveModelSuccess] = useState<string | null>(null);

  // Fetch vehicles from central database
  async function fetchDbVehicles() {
    try {
      setIsDbLoading(true);
      const res = await fetch("/api/vehicles");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setDbVehicles(data);
          return;
        }
      }
      // Fallback to static catalog if DB is still warming up
      setDbVehicles(VEHICLE_CATALOG);
    } catch (e) {
      console.error("Failed to load vehicle catalog from DB:", e);
      setDbVehicles(VEHICLE_CATALOG);
    } finally {
      setIsDbLoading(false);
    }
  }

  useEffect(() => {
    fetchDbVehicles();
  }, []);

  // Close vehicle search dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        vehicleSearchDropdownRef.current &&
        !vehicleSearchDropdownRef.current.contains(e.target as Node)
      ) {
        setIsVehicleDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Vehicles filtered strictly by the active tab (used for Quick Pick chips so chips are NEVER hidden by search text)
  const tabVehicles = useMemo(() => {
    const list = dbVehicles.length > 0 ? dbVehicles : VEHICLE_CATALOG;
    if (selectedMakeFilter === "Custom") {
      return list.filter((v: any) => v.isCustom);
    } else if (selectedMakeFilter === "Commercial") {
      return list.filter((v: any) =>
        v.bodyType?.includes("Pickup") || v.bodyType?.includes("Truck") || v.bodyType?.includes("Van") || v.bodyType?.includes("Bus")
      );
    } else if (selectedMakeFilter === "SUV") {
      return list.filter((v: any) => v.bodyType?.includes("SUV"));
    } else if (selectedMakeFilter === "EV") {
      return list.filter((v: any) => v.fuelType === "ELECTRIC");
    } else if (selectedMakeFilter !== "All") {
      return list.filter((v: any) => v.make?.toLowerCase() === selectedMakeFilter.toLowerCase());
    }
    return list;
  }, [dbVehicles, selectedMakeFilter]);

  // Dropdown search results:
  // If search query is empty -> shows tabVehicles
  // If user is typing -> searches across ALL vehicles globally, so any make/model can be searched & overwritten!
  const filteredCatalogVehicles = useMemo(() => {
    const list = dbVehicles.length > 0 ? dbVehicles : VEHICLE_CATALOG;
    const q = vehicleSearchQuery.toLowerCase().trim();

    if (!q) {
      return tabVehicles;
    }

    return list.filter((v: any) => {
      const full = `${v.make} ${v.model}`.toLowerCase();
      const m = (v.make || "").toLowerCase();
      const mdl = (v.model || "").toLowerCase();
      const body = (v.bodyType || "").toLowerCase();
      const category = (v.category || "").toLowerCase();
      return full.includes(q) || m.includes(q) || mdl.includes(q) || body.includes(q) || category.includes(q);
    });
  }, [dbVehicles, tabVehicles, vehicleSearchQuery]);

  // Brand tab click handler:
  // Sets filter, clears search text, and sets Make so the officer can overwrite immediately!
  function handleSelectBrandTab(tabId: string) {
    setSelectedMakeFilter(tabId);
    setVehicleSearchQuery("");
    setIsVehicleDropdownOpen(false);
    if (!["All", "Custom", "Commercial", "SUV", "EV"].includes(tabId)) {
      setMake(tabId);
    }
  }

  // Clear / Reset vehicle selection to start completely fresh and allow instant overwrite
  function handleResetVehicle() {
    setMake("");
    setModel("");
    setYear(selectedCatalogYear || "2024");
    setEngineCC("");
    setCylinders("4");
    setBodyType("Saloon");
    setFuelType("PETROL");
    setNetWeight("");
    setGrossWeight("");
    setTyreFW("");
    setTyreFD("");
    setTyreRW("");
    setTyreRD("");
    setTyreMW("");
    setTyreMD("");
    setEngineNo("");
    setChassisNo("");
    setVehicleSearchQuery("");
    setAutoFilledNotice(null);
    setSelectedMakeFilter("All");
    setIsVehicleDropdownOpen(false);
  }

  // Check if current form make/model is already known in DB
  const isCurrentModelInDb = useMemo(() => {
    if (!make.trim() || !model.trim()) return true;
    const list = dbVehicles.length > 0 ? dbVehicles : VEHICLE_CATALOG;
    return list.some(
      (v) =>
        v.make.toLowerCase() === make.trim().toLowerCase() &&
        v.model.toLowerCase() === model.trim().toLowerCase()
    );
  }, [make, model, dbVehicles]);

  // Save unlisted / custom vehicle model to database catalog
  async function handleSaveCurrentModelToDb() {
    if (!make.trim() || !model.trim()) {
      alert("Please enter both Make and Model before saving to catalog.");
      return;
    }
    try {
      setIsSavingCustomModel(true);
      const payload = {
        make: make.trim(),
        model: model.trim(),
        year: year.trim() || selectedCatalogYear || "2024",
        bodyType: bodyType || "Saloon",
        engineCC: engineCC.trim() || "2000",
        cylinders: cylinders || "4",
        fuelType: fuelType || "PETROL",
        netWeight: netWeight.trim() || "1500",
        grossWeight: grossWeight.trim() || "2000",
        tyreW: tyreFW.trim() || "215",
        tyreDia: tyreFD.trim() || "16",
        userId: sessionUser?.id || undefined,
      };

      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.vehicle) {
          setDbVehicles((prev) => [result.vehicle, ...prev.filter((x) => x.id !== result.vehicle.id)]);
        }
        setSaveModelSuccess(`"${make.trim()} ${model.trim()}" saved to Database Catalog! Available across all desks.`);
        setTimeout(() => setSaveModelSuccess(null), 5000);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save vehicle model to database.");
      }
    } catch (e: any) {
      alert("Error saving vehicle model: " + e.message);
    } finally {
      setIsSavingCustomModel(false);
    }
  }

  function handleSelectVehicle(v: VehicleModel | any, customYear?: string) {
    const yr = customYear || selectedCatalogYear || "2024";
    setMake(v.make);
    setModel(v.model);
    setYear(yr);
    setEngineCC(v.engineCC);
    setCylinders(v.cylinders);
    setBodyType(v.bodyType);
    setFuelType(v.fuelType);
    setNetWeight(v.netWeight);
    setGrossWeight(v.grossWeight);
    setTyreFW(v.tyreW);
    setTyreFD(v.tyreDia);
    setTyreRW(v.tyreW);
    setTyreRD(v.tyreDia);
    setTyreMW("");
    setTyreMD("");

    // Engine number is unique to each individual physical vehicle and is NOT prefilled
    setEngineNo("");

    // Clear search box so it is ready for any next search without blocking
    setVehicleSearchQuery("");
    setIsVehicleDropdownOpen(false);
    setAutoFilledNotice(
      `Specifications auto-filled from Database for ${v.make} ${v.model} (${yr})! Please enter the physical Chassis number below.`
    );

    // Automatically focus the Chassis / VIN Number input field
    setTimeout(() => {
      chassisInputRef.current?.focus();
    }, 150);
  }

  // Quick helper to register from search query
  function handleUseUnlistedFromSearch() {
    if (!vehicleSearchQuery.trim()) return;
    const parts = vehicleSearchQuery.trim().split(/\s+/);
    const newMake = parts[0] || "";
    const newModel = parts.slice(1).join(" ") || "Standard";
    setMake(newMake.charAt(0).toUpperCase() + newMake.slice(1));
    setModel(newModel);
    setYear(selectedCatalogYear || "2024");
    setVehicleSearchQuery("");
    setIsVehicleDropdownOpen(false);
    setAutoFilledNotice(
      `Unlisted vehicle initialized: "${newMake} ${newModel}". Fill in specifications and click "Save to Database Catalog".`
    );
  }

  /* ── Tyres ── */
  const [tyreFW, setTyreFW] = useState("");
  const [tyreFD, setTyreFD] = useState("");
  const [tyreMW, setTyreMW] = useState("");
  const [tyreMD, setTyreMD] = useState("");
  const [tyreRW, setTyreRW] = useState("");
  const [tyreRD, setTyreRD] = useState("");

  /* ── Audit (NO HARDCODED DATES!) ── */
  const [receiptNo, setReceiptNo] = useState("");
  const [customsNo, setCustomsNo] = useState("");
  const [customsDate, setCustomsDate] = useState(""); // Starts empty so worker enters freely
  const [supervisor, setSupervisor] = useState("");
  const regOfficer = "A. Owusu";

  /* ── UI state ── */
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    async function loadReservations() {
      try {
        const res = await fetch("/api/reservations");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setReservations(data);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to load reservations from DB API:", e);
      }
      setReservations(getStoredReservations());
    }
    loadReservations();
  }, []);

  /* ── Dynamic SuperAdmin Services ── */
  interface ServiceOption {
    id: string;
    code: string;
    name: string;
    description: string | null;
    category: string | null;
    isGlobal: boolean;
    requiresPreviousOwner?: boolean;
    prevOwnerRequireName?: boolean;
    prevOwnerRequirePhone?: boolean;
    prevOwnerRequireAddress?: boolean;
    prevOwnerRequireCustom?: boolean;
    prevOwnerCustomLabel?: string | null;
  }
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [sessionUser, setSessionUser] = useState<{ id?: string; name?: string; username?: string; role?: string; branchId?: string; branch?: any } | null>(null);

  useEffect(() => {
    async function loadServiceTypes() {
      try {
        const stored = localStorage.getItem("dvla_session");
        let activeBranchId = "";
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setSessionUser(parsed);
            if (parsed.branchId) {
              activeBranchId = parsed.branchId;
            } else if (parsed.branch?.id) {
              activeBranchId = parsed.branch.id;
            } else if (parsed.branch?.name) {
              const bRes = await fetch("/api/branches");
              if (bRes.ok) {
                const bList = await bRes.json();
                const match = bList.find((b: any) =>
                  b.name?.toLowerCase() === parsed.branch.name.toLowerCase() ||
                  b.code?.toLowerCase() === parsed.branch.code?.toLowerCase()
                );
                if (match) activeBranchId = match.id;
              }
            }
          } catch {}
        }

        const url = activeBranchId
          ? `/api/services?branchId=${activeBranchId}&activeOnly=true`
          : `/api/services?activeOnly=true`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setServiceOptions(data);
            setBookingType((current) => {
              if (!current) return data[0].code;
              const exists = data.some((s: any) => s.code === current);
              return exists ? current : data[0].code;
            });
          }
        }
      } catch (err) {
        console.error("Failed loading database services:", err);
      }
    }

    loadServiceTypes();
    window.addEventListener("dvla_session_change", loadServiceTypes);
    return () => window.removeEventListener("dvla_session_change", loadServiceTypes);
  }, []);

  const displayBookingTypes = useMemo(() => {
    return serviceOptions.map((s) => ({
      id: s.code,
      label: s.name,
      sub: s.description || (s.isGlobal ? "Nationwide standard service" : "Station-specific service"),
      category: s.category,
      isGlobal: s.isGlobal,
      name: s.name,
      requiresPreviousOwner: Boolean(s.requiresPreviousOwner),
      prevOwnerRequireName: s.prevOwnerRequireName !== undefined ? Boolean(s.prevOwnerRequireName) : true,
      prevOwnerRequirePhone: Boolean(s.prevOwnerRequirePhone),
      prevOwnerRequireAddress: s.prevOwnerRequireAddress !== undefined ? Boolean(s.prevOwnerRequireAddress) : true,
      prevOwnerRequireCustom: Boolean(s.prevOwnerRequireCustom),
      prevOwnerCustomLabel: s.prevOwnerCustomLabel || null,
    }));
  }, [serviceOptions]);

  const activeReservation = checkPlateReservation(regNo, reservations);
  const activeServiceDef = displayBookingTypes.find(b => b.id === bookingType);

  // Previous title owner details are strictly driven by the Service Type definition configured in the Services page
  const isTransfer = Boolean(
    activeServiceDef
      ? activeServiceDef.requiresPreviousOwner
      : (bookingType === "REG_TRANSFER" || bookingType === "REG_TRANSFER_SPECIAL")
  );

  useEffect(() => {
    setShowExtraPhone(false);
    setShowExtraAddr(false);
    setShowExtraCustom(false);
    if (!isTransfer) {
      setOldOwnerName("");
      setOldOwnerPhone("");
      setOldOwnerAddr("");
      setOldOwnerCustom("");
    }
  }, [bookingType, isTransfer]);

  const isSpecialOrCustomized =
    bookingType === "REG_SPECIAL" ||
    bookingType === "REG_TRANSFER_SPECIAL" ||
    bookingType.includes("SPECIAL") ||
    bookingType.includes("CUSTOM");

  // Tab completion & required field validation state
  const [attemptedTabs, setAttemptedTabs] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
  });

  const missingFieldsTab1 = useMemo(() => {
    const missing: { id: string; label: string }[] = [];
    if (!bookingType.trim()) missing.push({ id: "input-bookingType", label: "Filing Service Type" });
    if (!classification.trim()) missing.push({ id: "input-classification", label: "Plate Classification" });
    if (!regNo.trim()) missing.push({ id: "input-regNo", label: "Assigned Plate Number" });
    if (!ownerName.trim()) missing.push({ id: "input-ownerName", label: isTransfer ? "New Owner Full Legal Name" : "Owner Full Legal Name" });
    if (isTransfer) {
      if (activeServiceDef?.prevOwnerRequireName !== false && !oldOwnerName.trim()) {
        missing.push({ id: "input-oldOwnerName", label: "Previous Owner Full Name" });
      }
      if (Boolean(activeServiceDef?.prevOwnerRequirePhone) && !oldOwnerPhone.trim()) {
        missing.push({ id: "input-oldOwnerPhone", label: "Previous Owner Phone" });
      }
      if (activeServiceDef?.prevOwnerRequireAddress !== false && !oldOwnerAddr.trim()) {
        missing.push({ id: "input-oldOwnerAddr", label: "Previous Owner Address" });
      }
      if (Boolean(activeServiceDef?.prevOwnerRequireCustom) && !oldOwnerCustom.trim()) {
        missing.push({ id: "input-oldOwnerCustom", label: activeServiceDef?.prevOwnerCustomLabel || "Transfer / Clearance Ref #" });
      }
    }
    return missing;
  }, [bookingType, classification, regNo, ownerName, isTransfer, activeServiceDef, oldOwnerName, oldOwnerPhone, oldOwnerAddr, oldOwnerCustom]);

  const totalFieldsTab1 = useMemo(() => {
    let count = 4;
    if (isTransfer) {
      if (activeServiceDef?.prevOwnerRequireName !== false) count++;
      if (Boolean(activeServiceDef?.prevOwnerRequirePhone)) count++;
      if (activeServiceDef?.prevOwnerRequireAddress !== false) count++;
      if (Boolean(activeServiceDef?.prevOwnerRequireCustom)) count++;
    }
    return count;
  }, [isTransfer, activeServiceDef]);

  const missingFieldsTab2 = useMemo(() => {
    const missing: { id: string; label: string }[] = [];
    if (!make.trim()) missing.push({ id: "input-make", label: "Make" });
    if (!model.trim()) missing.push({ id: "input-model", label: "Model" });
    if (!year.trim()) missing.push({ id: "input-year", label: "Model Year" });
    if (!bodyType.trim()) missing.push({ id: "input-bodyType", label: "Body Type" });
    if (!fuelType.trim()) missing.push({ id: "input-fuelType", label: "Fuel Type" });
    if (!chassisNo.trim()) missing.push({ id: "input-chassisNo", label: "Chassis / VIN Number" });
    if (!engineCC.trim()) missing.push({ id: "input-engineCC", label: "Engine Displacement (CC)" });
    return missing;
  }, [make, model, year, bodyType, fuelType, chassisNo, engineCC]);

  const totalFieldsTab2 = 7;

  const missingFieldsTab3 = useMemo(() => {
    const missing: { id: string; label: string }[] = [];
    if (!tyreFW.trim()) missing.push({ id: "input-tyreFW", label: "Front Tyre Width" });
    if (!tyreFD.trim()) missing.push({ id: "input-tyreFD", label: "Front Tyre Rim" });
    if (!tyreRW.trim()) missing.push({ id: "input-tyreRW", label: "Rear Tyre Width" });
    if (!tyreRD.trim()) missing.push({ id: "input-tyreRD", label: "Rear Tyre Rim" });
    return missing;
  }, [tyreFW, tyreFD, tyreRW, tyreRD]);

  const totalFieldsTab3 = 4;

  const missingFieldsTab4 = useMemo(() => {
    const missing: { id: string; label: string }[] = [];
    if (!receiptNo.trim()) missing.push({ id: "input-receiptNo", label: "Revenue Receipt Number" });
    if (!customsNo.trim()) missing.push({ id: "input-customsNo", label: "Customs Declaration Number" });
    if (!customsDate.trim()) missing.push({ id: "input-customsDate", label: "Customs Clearance Date" });
    if (!supervisor.trim()) missing.push({ id: "input-supervisor", label: "Supervising Certification Officer" });
    return missing;
  }, [receiptNo, customsNo, customsDate, supervisor]);

  const totalFieldsTab4 = 4;

  const isTab1Done = missingFieldsTab1.length === 0;
  const isTab2Done = missingFieldsTab2.length === 0;
  const isTab3Done = missingFieldsTab3.length === 0;
  const isTab4Done = missingFieldsTab4.length === 0;

  const totalRequiredFields = totalFieldsTab1 + totalFieldsTab2 + totalFieldsTab3 + totalFieldsTab4;
  const totalCompletedFields =
    (totalFieldsTab1 - missingFieldsTab1.length) +
    (totalFieldsTab2 - missingFieldsTab2.length) +
    (totalFieldsTab3 - missingFieldsTab3.length) +
    (totalFieldsTab4 - missingFieldsTab4.length);

  const overallCompletionPercent = Math.round((totalCompletedFields / totalRequiredFields) * 100);

  function focusField(id: string, tab: 1 | 2 | 3 | 4) {
    setActiveTab(tab);
    setAttemptedTabs(prev => ({ ...prev, [tab]: true }));
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 120);
  }

  function handleNextTab1() {
    if (missingFieldsTab1.length > 0) {
      setAttemptedTabs(prev => ({ ...prev, 1: true }));
      focusField(missingFieldsTab1[0].id, 1);
      return;
    }
    setActiveTab(2);
  }

  function handleNextTab2(targetTab: 3 | 4) {
    if (missingFieldsTab2.length > 0) {
      setAttemptedTabs(prev => ({ ...prev, 2: true }));
      focusField(missingFieldsTab2[0].id, 2);
      return;
    }
    setActiveTab(targetTab);
  }

  function handleNextTab3() {
    if (missingFieldsTab3.length > 0) {
      setAttemptedTabs(prev => ({ ...prev, 3: true }));
      focusField(missingFieldsTab3[0].id, 3);
      return;
    }
    setActiveTab(4);
  }

  function applyPreset(p: VehiclePreset) {
    setMake(p.make); setYear(p.year); setModel(p.model); setEngineCC(p.engineCC);
    setCylinders(p.cylinders); setBodyType(p.bodyType);
    setNetWeight(p.netWeight); setGrossWeight(p.grossWeight);
    setTyreFW(p.tyreW); setTyreFD(p.tyreDia);
    setTyreRW(p.tyreW); setTyreRD(p.tyreDia);
    setTyreMW(""); setTyreMD("");
    setFuelType(p.fuelType);
  }

  function applyTyre(w: string, d: string) {
    setTyreFW(w); setTyreFD(d);
    setTyreRW(w); setTyreRD(d);
  }

  function generateNewDVLAFormat() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const l1 = letters[Math.floor(Math.random() * letters.length)];
    const l2 = letters[Math.floor(Math.random() * letters.length)];
    const num = String(Math.floor(1000 + Math.random() * 9000)).padStart(4, "0");
    return `${num}-AD${l1}${l2}`;
  }

  function handleAutofillSimulation() {
    setIsSimulating(true);
    setTimeout(() => {
      const p = VEHICLE_PRESETS[14]; // Toyota Land Cruiser
      setOwnerName("Ebenezer Kwabena Boateng");
      setAddress("House No. 12, Frafraha Junction, Adenta, Accra");
      setPhone("+233 24 489 0291");
      setRegNo(generateNewDVLAFormat());
      setEngineNo("SQRF4J20-291823");
      setChassisNo("JTEBU5JR8P2091837");
      setYear("2024");
      setModel("Land Cruiser");
      setReceiptNo("4702604819");
      setCustomsNo("4708912/26");
      setCustomsDate(new Date().toISOString().slice(0, 10));
      setSupervisor("Saviour");
      if (isTransfer) {
        setOldOwnerName("Seth Pascal Kofi");
        setOldOwnerPhone("+233 24 901 8273");
        setOldOwnerAddr("Plot 8, Adentan Municipal Area, Accra");
        setOldOwnerCustom("AFF-2026/0912-GH");
      }
      applyPreset(p);
      setIsSimulating(false);
    }, 400);
  }

  function handleReset() {
    setIsSuccess(false);
    setOwnerName(""); setAddress(""); setPhone("");
    setOldOwnerName(""); setOldOwnerPhone(""); setOldOwnerAddr(""); setOldOwnerCustom("");
    setShowExtraPhone(false); setShowExtraAddr(false); setShowExtraCustom(false);
    setMake(""); setYear(""); setModel(""); setEngineCC(""); setEngineNo(""); setChassisNo("");
    setBodyType("Saloon"); setNetWeight(""); setGrossWeight("");
    setTyreFW(""); setTyreFD(""); setTyreMW(""); setTyreMD(""); setTyreRW(""); setTyreRD("");
    setReceiptNo(""); setCustomsNo(""); setCustomsDate(""); setSupervisor("");
    setCylinders("4"); setFuelType("PETROL");
    setRegNo("");
    setVrsInvoiceNo("");
    setVrsSuccessMessage("");
    setAlreadyBookedError(null);
    setAttemptedTabs({ 1: false, 2: false, 3: false, 4: false });
    setActiveTab(1);
  }

  async function handleFetchVrs(invoiceNoToFetch: string) {
    if (!invoiceNoToFetch) return;
    setIsFetchingVrs(true);
    setVrsSuccessMessage("");
    setAlreadyBookedError(null);

    type VrsInvoice = {
      invoiceNo: string;
      bookingType: string;
      classification: string;
      regNo: string;
      ownerName: string;
      address: string;
      phone: string;
      make: string;
      yearModel: string;
      engineCC: string;
      cylinders: string;
      engineNo: string;
      chassisNo: string;
      bodyType: string;
      fuelType: string;
      netWeight: string;
      grossWeight: string;
      tyreFW: string;
      tyreFD: string;
      tyreMW: string;
      tyreMD: string;
      tyreRW: string;
      tyreRD: string;
    };

    let invoice: VrsInvoice | null = null;

    try {
      const res = await fetch(`/api/vrs?invoiceNo=${encodeURIComponent(invoiceNoToFetch.trim())}`);
      if (res.ok) {
        invoice = await res.json();
      }
    } catch (err) {
      console.error("VRS DB fetch failed:", err);
    }

    if (invoice) {
      let isAlreadyBooked = false;
      try {
        const bkRes = await fetch("/api/bookings");
        if (bkRes.ok) {
          const existingBookings = await bkRes.json();
          if (Array.isArray(existingBookings)) {
            const match = existingBookings.find(
              (b: any) =>
                b.vrsInvoice?.invoiceNo === invoice.invoiceNo ||
                (b.plate && invoice.regNo && b.plate.trim().toUpperCase() === invoice.regNo.trim().toUpperCase())
            );

            if (match) {
              isAlreadyBooked = true;
              setAlreadyBookedError(
                `⚠️ Notice: VRS Invoice #${invoice.invoiceNo} has ALREADY been booked into the system (Booking ID: #${match.id} — Owner: ${match.owner}).`
              );
            }
          }
        }
      } catch (bkErr) {
        console.error("Failed checking existing bookings:", bkErr);
      }

      if (isAlreadyBooked) {
        setIsFetchingVrs(false);
        return;
      }

      setAlreadyBookedError(null);
      setBookingType(invoice.bookingType);
      setClassification(invoice.classification);
      setRegNo(invoice.regNo);
      setOwnerName(invoice.ownerName);
      setAddress(invoice.address);
      setPhone(invoice.phone);

      setMake(invoice.make);
      const yearMatch = invoice.yearModel.match(/(\d{4})$/);
      const extractedYear = yearMatch ? yearMatch[1] : "";
      const extractedModel = yearMatch ? invoice.yearModel.replace(/\s*\d{4}$/, "") : invoice.yearModel;
      setYear(extractedYear);
      setModel(extractedModel);
      setEngineCC(invoice.engineCC);
      setCylinders(invoice.cylinders);
      setEngineNo(invoice.engineNo);
      setChassisNo(invoice.chassisNo);
      setBodyType(invoice.bodyType || "Saloon");
      setFuelType(invoice.fuelType || "PETROL");
      setNetWeight(invoice.netWeight);
      setGrossWeight(invoice.grossWeight);

      setTyreFW(invoice.tyreFW);
      setTyreFD(invoice.tyreFD);
      setTyreMW(invoice.tyreMW);
      setTyreMD(invoice.tyreMD);
      setTyreRW(invoice.tyreRW);
      setTyreRD(invoice.tyreRD);

      setReceiptNo("");
      setCustomsNo("");
      setCustomsDate("");

      setVrsSuccessMessage(`VRS Invoice #${invoice.invoiceNo} imported successfully.`);
      setActiveTab(4); // navigate to customs & review
    } else {
      alert("Invoice not found in VRS. Please check the 14-character invoice number (e.g. 4N92P81C11VR7K).");
    }
    setIsFetchingVrs(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (alreadyBookedError) {
      alert("⚠️ Booking Blocked: This VRS Invoice has already been booked in the system.");
      return;
    }

    // Step-by-step verification: Tab 1 -> Tab 2 -> Tab 3 -> Tab 4
    if (missingFieldsTab1.length > 0) {
      focusField(missingFieldsTab1[0].id, 1);
      alert(`⚠️ Step 1 Incomplete: Please enter "${missingFieldsTab1[0].label}" before certifying.`);
      return;
    }

    if (missingFieldsTab2.length > 0) {
      focusField(missingFieldsTab2[0].id, 2);
      alert(`⚠️ Step 2 Incomplete: Please enter "${missingFieldsTab2[0].label}" before certifying.`);
      return;
    }

    if (missingFieldsTab3.length > 0) {
      focusField(missingFieldsTab3[0].id, 3);
      alert(`⚠️ Step 3 Incomplete: Please enter "${missingFieldsTab3[0].label}" before certifying.`);
      return;
    }

    if (missingFieldsTab4.length > 0) {
      focusField(missingFieldsTab4[0].id, 4);
      alert(`⚠️ Step 4 Incomplete: Please enter "${missingFieldsTab4[0].label}" before certifying.`);
      return;
    }

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

    const fullPlate = regNo.trim();

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: bookingType,
          status: "pending",
          owner: ownerName || "Unknown Owner",
          vehicle: `${make} ${model} (${year})`.trim() || "Vehicle",
          plate: fullPlate || undefined,
          date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
          classification: classification,
          vrsInvoiceNo: vrsInvoiceNo.trim() || undefined,
          make: make.trim() || undefined,
          model: model.trim() || undefined,
          yearModel: year.trim() || undefined,
          bodyType: bodyType || undefined,
          engineCC: engineCC.trim() || undefined,
          cylinders: cylinders || undefined,
          fuelType: fuelType || undefined,
          netWeight: netWeight.trim() || undefined,
          grossWeight: grossWeight.trim() || undefined,
          tyreFW: tyreFW.trim() || undefined,
          tyreFD: tyreFD.trim() || undefined,
          createdById: sessionUser?.id || undefined,
          userId: sessionUser?.id || undefined,
          userName: sessionUser?.name || sessionUser?.username || "Officer",
          branchId: sessionUser?.branchId || sessionUser?.branch?.id || undefined,
          previousOwnerName: isTransfer ? oldOwnerName.trim() || undefined : undefined,
          previousOwnerPhone: isTransfer ? oldOwnerPhone.trim() || undefined : undefined,
          previousOwnerAddress: isTransfer ? oldOwnerAddr.trim() || undefined : undefined,
          previousOwnerCustom: isTransfer ? oldOwnerCustom.trim() || undefined : undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(`⚠️ Booking Error: ${errData.error || "Failed to create booking."}`);
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      console.error("Error creating booking in DB:", err);
      alert("System error creating booking.");
    }
  }

  /* ════════════════ RENDER ════════════════ */
  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-16">

      {/* ── 1. Clean, Compact Top Header Bar ── */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">
              Vehicle Registration Desk
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              VRS Online
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Adenta Station Registry &bull; Enter registration details or import VRS invoice.
          </p>
        </div>

        {/* Compact Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Inline VRS Invoice Search */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
            <input
              type="text"
              value={vrsInvoiceNo}
              onChange={e => setVrsInvoiceNo(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 14))}
              placeholder="VRS Invoice #"
              className="px-2.5 py-1.5 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none w-32 md:w-36"
            />
            <button
              type="button"
              disabled={vrsInvoiceNo.length !== 14 || isFetchingVrs}
              onClick={() => handleFetchVrs(vrsInvoiceNo)}
              className="px-2.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              {isFetchingVrs ? "..." : "Import"}
            </button>
          </div>

          <button
            type="button"
            onClick={handleAutofillSimulation}
            disabled={isSimulating}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            {isSimulating ? "Scanning..." : "Simulate Scan"}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 text-xs font-semibold transition cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Alerts */}
      {vrsSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-800 flex items-center justify-between">
          <span>✓ {vrsSuccessMessage}</span>
          <button type="button" onClick={() => setVrsSuccessMessage("")} className="font-bold cursor-pointer">✕</button>
        </div>
      )}

      {alreadyBookedError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 flex items-center justify-between">
          <span>{alreadyBookedError}</span>
          <button type="button" onClick={() => setAlreadyBookedError(null)} className="font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* ── 2. Success Receipt Slip ── */}
      {isSuccess ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-xl mx-auto space-y-5 shadow-sm">
          <div className="text-center space-y-1">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center font-bold text-lg">
              ✓
            </div>
            <h3 className="font-bold text-base text-slate-900">Registration Successfully Filed</h3>
            <p className="text-xs text-slate-500">Official logbook record entered into DVLA database.</p>
          </div>

          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 font-mono text-xs space-y-2 text-slate-700">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-400">PLATE NUMBER:</span>
              <span className="font-bold text-slate-900">{regNo || "PENDING"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">OWNER:</span>
              <span className="font-semibold text-slate-900">{ownerName}</span>
            </div>
            {isTransfer && oldOwnerName && (
              <div className="flex justify-between border-t border-slate-200/80 pt-1.5">
                <span className="text-amber-700 font-medium">PREV TITLE OWNER:</span>
                <span className="font-semibold text-slate-800 text-right">
                  {oldOwnerName}
                  {oldOwnerPhone ? ` · ${oldOwnerPhone}` : ""}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">VEHICLE:</span>
              <span>{make} {model} {year && `(${year})`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">CHASSIS / VIN:</span>
              <span>{chassisNo || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">RECEIPT NO:</span>
              <span>{receiptNo || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">CUSTOMS NO:</span>
              <span>{customsNo || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">CUSTOMS DATE:</span>
              <span>{customsDate || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">SUPERVISOR:</span>
              <span className="font-semibold text-slate-900">{supervisor || "—"}</span>
            </div>
          </div>

          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Print Receipt
            </button>
            <button
              type="button"
              onClick={() => setIsSuccess(false)}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
            >
              Register Another Vehicle
            </button>
          </div>
        </div>
      ) : (
        /* ── 3. Main Two-Column Workstation ── */
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

          {/* ── Left Column (2/3): Simple, Well-Organized Form Card ── */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">

            {/* Clean Tab Header Strip with Live Requirement Status */}
            <div className="flex border-b border-slate-200 bg-slate-50/50">
              {([
                { id: 1, label: "1. Owner & Filing", total: totalFieldsTab1, missing: missingFieldsTab1.length, attempted: attemptedTabs[1] },
                { id: 2, label: "2. Vehicle Details", total: totalFieldsTab2, missing: missingFieldsTab2.length, attempted: attemptedTabs[2] },
                { id: 3, label: "3. Axle & Tyres", total: totalFieldsTab3, missing: missingFieldsTab3.length, attempted: attemptedTabs[3] },
                { id: 4, label: "4. Customs & Audit", total: totalFieldsTab4, missing: missingFieldsTab4.length, attempted: attemptedTabs[4] },
              ] as const).map(tab => {
                const active = activeTab === tab.id;
                const isDone = tab.missing === 0;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as 1 | 2 | 3 | 4)}
                    className={`flex-1 py-3 px-2 text-center text-xs font-semibold border-b-2 transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                      active
                        ? "border-[#81B71A] text-slate-900 bg-white"
                        : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {isDone ? (
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-0.5 border border-emerald-300">
                        ✓ Done
                      </span>
                    ) : tab.attempted ? (
                      <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold flex items-center gap-0.5 border border-rose-300 animate-pulse">
                        ! {tab.missing} Missing
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({tab.total - tab.missing}/{tab.total})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Form Body with Generous Padding and Clean Layout */}
            <div className="p-5">

              {/* ── TAB 1: OWNER & FILING ── */}
              {activeTab === 1 && (
                <div className="space-y-4">
                  {/* Step 1 Requirements Callout Banner */}
                  <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition ${
                    missingFieldsTab1.length === 0
                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                      : attemptedTabs[1]
                      ? "bg-rose-50 border-rose-300 text-rose-900 shadow-2xs"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        missingFieldsTab1.length === 0 ? "bg-emerald-500" : attemptedTabs[1] ? "bg-rose-500 animate-pulse" : "bg-amber-500"
                      }`} />
                      <div>
                        <p className="font-bold">
                          {missingFieldsTab1.length === 0
                            ? "✓ All required filing details completed"
                            : attemptedTabs[1]
                            ? `⚠️ Action Needed: ${missingFieldsTab1.length} required ${missingFieldsTab1.length === 1 ? "field is" : "fields are"} missing`
                            : `Step 1 Requirements: ${totalFieldsTab1 - missingFieldsTab1.length} of ${totalFieldsTab1} completed`}
                        </p>
                        {missingFieldsTab1.length > 0 && (
                          <p className="text-[11px] text-slate-500 font-normal">
                            Required: {missingFieldsTab1.map(f => f.label).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 shadow-2xs shrink-0 self-start sm:self-auto">
                      {totalFieldsTab1 - missingFieldsTab1.length}/{totalFieldsTab1} Ready
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <Field
                      label="Filing Service Type"
                      required
                      isFilled={Boolean(bookingType.trim())}
                      fieldId="bookingType"
                      hint={displayBookingTypes.find(b => b.id === bookingType)?.sub}
                    >
                      <select
                        id="input-bookingType"
                        value={bookingType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBookingType(val);
                          const matched = displayBookingTypes.find(b => b.id === val);
                          if (matched && matched.category && matched.category !== "ALL") {
                            setClassification(matched.category);
                          }
                        }}
                        className={INPUT}
                      >
                        {displayBookingTypes.length === 0 ? (
                          <option value="">Loading services from DVLA database...</option>
                        ) : (
                          displayBookingTypes.map(b => (
                            <option key={b.id} value={b.id}>
                              {b.label}
                            </option>
                          ))
                        )}
                      </select>
                      {/* Active Service DB Metadata Chip */}
                      {(() => {
                        const currentSvc = displayBookingTypes.find(b => b.id === bookingType);
                        if (!currentSvc) return null;
                        return (
                          <div className="flex items-center justify-between text-[11px] px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-slate-600 mt-1">
                            <span className="flex items-center gap-1.5 font-medium">
                              <span className={`w-1.5 h-1.5 rounded-full ${currentSvc.isGlobal ? "bg-emerald-500" : "bg-purple-500"}`}></span>
                              <span>{currentSvc.isGlobal ? "Nationwide Global Service" : "Station-Specific Service"}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {currentSvc.id}
                            </span>
                          </div>
                        );
                      })()}
                    </Field>

                    <Field
                      label="Plate Classification"
                      required
                      isFilled={Boolean(classification.trim())}
                      fieldId="classification"
                    >
                      <select
                        id="input-classification"
                        value={classification}
                        onChange={(e) => setClassification(e.target.value)}
                        className={INPUT}
                      >
                        {CLASSIFICATIONS.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <Field
                      label="Assigned Plate Number"
                      required
                      isFilled={Boolean(regNo.trim())}
                      hasError={attemptedTabs[1] && !regNo.trim()}
                      errorMessage="Please enter or generate an assigned plate number"
                      fieldId="regNo"
                      hint={isSpecialOrCustomized ? "Custom sequence" : "e.g. 1092-ADXY"}
                    >
                      <input
                        id="input-regNo"
                        value={regNo}
                        onChange={e => setRegNo(e.target.value.toUpperCase())}
                        required
                        placeholder={isSpecialOrCustomized ? "e.g. KX 1111-AD" : "e.g. 1092-ADXY"}
                        className={INPUT + " font-mono font-bold"}
                      />
                      {activeReservation && (
                        <div className="mt-1 px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium">
                          Reserved: {activeReservation.holder} ({activeReservation.authRef})
                        </div>
                      )}
                    </Field>

                    <Field
                      label={isTransfer ? "New Owner Full Legal Name" : "Owner Full Legal Name"}
                      required
                      isFilled={Boolean(ownerName.trim())}
                      hasError={attemptedTabs[1] && !ownerName.trim()}
                      errorMessage="Owner full legal name is required"
                      fieldId="ownerName"
                    >
                      <input
                        id="input-ownerName"
                        value={ownerName}
                        onChange={e => setOwnerName(e.target.value)}
                        required
                        placeholder="Enter owner or corporate name"
                        className={INPUT}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div className="md:col-span-2">
                      <Field
                        label="Residential / Business Address"
                        optional
                        isFilled={Boolean(address.trim())}
                        fieldId="address"
                      >
                        <input
                          id="input-address"
                          value={address}
                          onChange={e => setAddress(e.target.value)}
                          placeholder="Street, Town/Sub-district, Region"
                          className={INPUT}
                        />
                      </Field>
                    </div>
                    <Field
                      label="Contact Phone Number"
                      optional
                      isFilled={Boolean(phone.trim())}
                      fieldId="phone"
                    >
                      <input
                        id="input-phone"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="e.g. 0241234567"
                        className={INPUT}
                      />
                    </Field>
                  </div>

                  {/* Transfer specific fields - Strictly driven by Service Type definition from Service Page */}
                  {isTransfer && (
                    <div className="p-4 bg-gradient-to-r from-amber-50/40 via-slate-50 to-amber-50/20 border border-amber-200/90 rounded-xl space-y-3.5 shadow-2xs animate-in fade-in duration-150">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                            <span>Previous Title Owner &amp; Transfer Details</span>
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wider">
                            ⚡ Auto-Detected: Required by Service
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-medium">
                            Configured Parameters: {[
                              (activeServiceDef?.prevOwnerRequireName !== false) && "Name",
                              activeServiceDef?.prevOwnerRequirePhone && "Phone",
                              (activeServiceDef?.prevOwnerRequireAddress !== false) && "Address",
                              activeServiceDef?.prevOwnerRequireCustom && (activeServiceDef.prevOwnerCustomLabel || "Custom Ref"),
                            ].filter(Boolean).join(" • ")}
                          </span>
                        </div>
                      </div>

                      {/* Configured Parameter Input Fields */}
                      {(() => {
                        const needName = activeServiceDef?.prevOwnerRequireName !== false;
                        const needPhone = Boolean(activeServiceDef?.prevOwnerRequirePhone) || showExtraPhone;
                        const needAddress = (activeServiceDef?.prevOwnerRequireAddress !== false) || showExtraAddr;
                        const needCustom = Boolean(activeServiceDef?.prevOwnerRequireCustom) || showExtraCustom;
                        const customLabel = activeServiceDef?.prevOwnerCustomLabel || "Transfer / Clearance Ref #";

                        return (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                              {needName && (
                                <Field
                                  label="Previous Owner Full Legal Name"
                                  required={activeServiceDef?.prevOwnerRequireName !== false}
                                  optional={activeServiceDef?.prevOwnerRequireName === false}
                                  isFilled={Boolean(oldOwnerName.trim())}
                                  hasError={attemptedTabs[1] && (activeServiceDef?.prevOwnerRequireName !== false) && !oldOwnerName.trim()}
                                  errorMessage="Previous Owner Full Legal Name is required"
                                  fieldId="oldOwnerName"
                                  hint="As shown on existing logbook"
                                >
                                  <input
                                    id="input-oldOwnerName"
                                    value={oldOwnerName}
                                    onChange={e => setOldOwnerName(e.target.value)}
                                    required={activeServiceDef?.prevOwnerRequireName !== false}
                                    placeholder="Full legal name of previous registered owner"
                                    className={INPUT}
                                  />
                                </Field>
                              )}

                              {needPhone && (
                                <Field
                                  label="Previous Owner Contact Phone"
                                  required={Boolean(activeServiceDef?.prevOwnerRequirePhone)}
                                  optional={!Boolean(activeServiceDef?.prevOwnerRequirePhone)}
                                  isFilled={Boolean(oldOwnerPhone.trim())}
                                  hasError={attemptedTabs[1] && Boolean(activeServiceDef?.prevOwnerRequirePhone) && !oldOwnerPhone.trim()}
                                  errorMessage="Previous Owner Contact Phone is required"
                                  fieldId="oldOwnerPhone"
                                  hint="Active contact phone"
                                >
                                  <input
                                    id="input-oldOwnerPhone"
                                    value={oldOwnerPhone}
                                    onChange={e => setOldOwnerPhone(e.target.value)}
                                    required={Boolean(activeServiceDef?.prevOwnerRequirePhone)}
                                    placeholder="e.g. 0241234567 or international"
                                    className={INPUT}
                                  />
                                </Field>
                              )}

                              {needAddress && (
                                <div className={needPhone && needName && !needCustom ? "md:col-span-2" : ""}>
                                  <Field
                                    label="Previous Owner Residential / Registered Address"
                                    required={activeServiceDef?.prevOwnerRequireAddress !== false}
                                    optional={activeServiceDef?.prevOwnerRequireAddress === false}
                                    isFilled={Boolean(oldOwnerAddr.trim())}
                                    hasError={attemptedTabs[1] && (activeServiceDef?.prevOwnerRequireAddress !== false) && !oldOwnerAddr.trim()}
                                    errorMessage="Previous Owner Address is required"
                                    fieldId="oldOwnerAddr"
                                    hint="Title address on record"
                                  >
                                    <input
                                      id="input-oldOwnerAddr"
                                      value={oldOwnerAddr}
                                      onChange={e => setOldOwnerAddr(e.target.value)}
                                      required={activeServiceDef?.prevOwnerRequireAddress !== false}
                                      placeholder="Street, Town/Sub-district, Region"
                                      className={INPUT}
                                    />
                                  </Field>
                                </div>
                              )}

                              {needCustom && (
                                <div className={!needAddress || (!needPhone && !needName) ? "md:col-span-2" : ""}>
                                  <Field
                                    label={customLabel}
                                    required={Boolean(activeServiceDef?.prevOwnerRequireCustom)}
                                    optional={!Boolean(activeServiceDef?.prevOwnerRequireCustom)}
                                    isFilled={Boolean(oldOwnerCustom.trim())}
                                    hasError={attemptedTabs[1] && Boolean(activeServiceDef?.prevOwnerRequireCustom) && !oldOwnerCustom.trim()}
                                    errorMessage={`${customLabel} is required`}
                                    fieldId="oldOwnerCustom"
                                    hint="Transfer authorization reference"
                                  >
                                    <input
                                      id="input-oldOwnerCustom"
                                      value={oldOwnerCustom}
                                      onChange={e => setOldOwnerCustom(e.target.value)}
                                      required={Boolean(activeServiceDef?.prevOwnerRequireCustom)}
                                      placeholder={`Enter ${customLabel}`}
                                      className={INPUT}
                                    />
                                  </Field>
                                </div>
                              )}
                            </div>

                            {/* Optional expansion if some fields were not toggled on the service */}
                            {(!needPhone || !needAddress || !needCustom) && (
                              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                                <span className="text-[10px] text-slate-400 font-medium">
                                  Want to capture additional transfer parameters?
                                </span>
                                <div className="flex items-center gap-2">
                                  {!needPhone && (
                                    <button
                                      type="button"
                                      onClick={() => setShowExtraPhone(true)}
                                      className="text-[10px] text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer underline"
                                    >
                                      + Add Phone
                                    </button>
                                  )}
                                  {!needAddress && (
                                    <button
                                      type="button"
                                      onClick={() => setShowExtraAddr(true)}
                                      className="text-[10px] text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer underline"
                                    >
                                      + Add Address
                                    </button>
                                  )}
                                  {!needCustom && (
                                    <button
                                      type="button"
                                      onClick={() => setShowExtraCustom(true)}
                                      className="text-[10px] text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer underline"
                                    >
                                      + Add Custom Reference
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Quick Vehicle Preset Shortcut on Tab 1 */}
                  <div className="p-3 bg-gradient-to-r from-emerald-50/50 to-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        Fast-Track Vehicle Auto-Fill:
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Select a vehicle model now to prefill all specs and jump directly to chassis number:
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {["Toyota Corolla", "Toyota Camry", "Toyota Hilux", "Hyundai Elantra", "Benz C-Class"].map((name) => {
                        const match = VEHICLE_CATALOG.find((v) => `${v.make} ${v.model}`.toLowerCase().includes(name.toLowerCase()));
                        if (!match) return null;
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => {
                              handleSelectVehicle(match);
                              setActiveTab(2);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-emerald-600 hover:text-white text-slate-700 border border-slate-200 hover:border-emerald-600 rounded text-[11px] font-semibold transition cursor-pointer shadow-2xs"
                          >
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={handleNextTab1}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>Next: Vehicle Details →</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── TAB 2: VEHICLE DETAILS ── */}
              {activeTab === 2 && (
                <div className="space-y-4">
                  {/* Step 2 Requirements Callout Banner */}
                  <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition ${
                    missingFieldsTab2.length === 0
                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                      : attemptedTabs[2]
                      ? "bg-rose-50 border-rose-300 text-rose-900 shadow-2xs"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        missingFieldsTab2.length === 0 ? "bg-emerald-500" : attemptedTabs[2] ? "bg-rose-500 animate-pulse" : "bg-amber-500"
                      }`} />
                      <div>
                        <p className="font-bold">
                          {missingFieldsTab2.length === 0
                            ? "✓ All required vehicle specifications completed"
                            : attemptedTabs[2]
                            ? `⚠️ Action Needed: ${missingFieldsTab2.length} required ${missingFieldsTab2.length === 1 ? "spec is" : "specs are"} missing`
                            : `Step 2 Requirements: ${totalFieldsTab2 - missingFieldsTab2.length} of ${totalFieldsTab2} completed`}
                        </p>
                        {missingFieldsTab2.length > 0 && (
                          <p className="text-[11px] text-slate-500 font-normal">
                            Required: {missingFieldsTab2.map(f => f.label).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 shadow-2xs shrink-0 self-start sm:self-auto">
                      {totalFieldsTab2 - missingFieldsTab2.length}/{totalFieldsTab2} Ready
                    </span>
                  </div>
                  {/* Central Vehicle Database Catalog & Auto-Fill Station */}
                  <div className="p-4 bg-gradient-to-r from-emerald-50/80 via-slate-50 to-emerald-50/50 border border-emerald-300/80 rounded-xl space-y-3.5 shadow-2xs">
                    {/* Header with DB Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                            Central Vehicle Database Catalog
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-700 text-white uppercase tracking-wider shadow-2xs flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                            <span>{isDbLoading ? "Connecting..." : `${dbVehicles.length} Models in DB`}</span>
                          </span>
                          {dbVehicles.some((v: any) => v.isCustom) && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white shadow-2xs">
                              {dbVehicles.filter((v: any) => v.isCustom).length} Station-Added
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 font-normal mt-0.5">
                          Search or select from database specifications to auto-fill technical specs. <strong>Officers only need to fill the physical Chassis Number.</strong> Engine number is optional. Unlisted vehicles are stored in the database automatically.
                        </p>
                      </div>
                    </div>

                    {/* Make & Category Quick Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-medium text-slate-600">
                      {[
                        { id: "All", label: "All Vehicles" },
                        { id: "Toyota", label: "Toyota" },
                        { id: "Hyundai", label: "Hyundai" },
                        { id: "Mercedes-Benz", label: "Mercedes" },
                        { id: "Honda", label: "Honda" },
                        { id: "Kia", label: "Kia" },
                        { id: "Nissan", label: "Nissan" },
                        { id: "SUV", label: "SUV / 4x4" },
                        { id: "Commercial", label: "Pickups & Trucks" },
                        { id: "EV", label: "Electric (EV)" },
                        { id: "Custom", label: "Station Added" },
                      ].map((tab) => {
                        const count =
                          tab.id === "All"
                            ? dbVehicles.length
                            : tab.id === "Custom"
                            ? dbVehicles.filter((v: any) => v.isCustom).length
                            : tab.id === "Commercial"
                            ? dbVehicles.filter((v: any) => v.bodyType?.includes("Pickup") || v.bodyType?.includes("Truck") || v.bodyType?.includes("Van")).length
                            : tab.id === "SUV"
                            ? dbVehicles.filter((v: any) => v.bodyType?.includes("SUV")).length
                            : tab.id === "EV"
                            ? dbVehicles.filter((v: any) => v.fuelType === "ELECTRIC").length
                            : dbVehicles.filter((v: any) => v.make?.toLowerCase() === tab.id.toLowerCase()).length;

                        if (count === 0 && (tab.id === "Custom" || tab.id === "EV")) return null;

                        const isTabActive = selectedMakeFilter === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => handleSelectBrandTab(tab.id)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer whitespace-nowrap border ${
                              isTabActive
                                ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                          >
                            <span>{tab.label}</span>
                            <span className={`ml-1 text-[10px] px-1 rounded ${isTabActive ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-500"}`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Search & Year Selection Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 relative" ref={vehicleSearchDropdownRef}>
                      {/* Search Combobox Input */}
                      <div className="sm:col-span-3 relative">
                        <input
                          type="text"
                          value={vehicleSearchQuery}
                          onChange={(e) => {
                            setVehicleSearchQuery(e.target.value);
                            setIsVehicleDropdownOpen(true);
                          }}
                          onFocus={() => setIsVehicleDropdownOpen(true)}
                          placeholder="Search database vehicles (e.g. Corolla, Camry, Hilux, C300, Tucson, GLE, Tiggo 8, Howo...)"
                          className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs transition"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </span>
                        {vehicleSearchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setVehicleSearchQuery("");
                              setIsVehicleDropdownOpen(false);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 cursor-pointer font-bold"
                            title="Clear search"
                          >
                            ×
                          </button>
                        )}

                        {/* Interactive Dropdown Results from Database */}
                        {isVehicleDropdownOpen && (
                          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100">
                            {filteredCatalogVehicles.length === 0 ? (
                              <div className="p-4 space-y-2 text-center">
                                <p className="text-xs text-slate-600">
                                  No database match found for <strong>&quot;{vehicleSearchQuery}&quot;</strong>.
                                </p>
                                <button
                                  type="button"
                                  onClick={handleUseUnlistedFromSearch}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                                >
                                  <span>Use &quot;{vehicleSearchQuery}&quot; &amp; Save to Database</span>
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                                  <span>Database Models ({filteredCatalogVehicles.length} found)</span>
                                  <span className="text-emerald-700 font-semibold">Select / Overwrite</span>
                                </div>
                                {filteredCatalogVehicles.slice(0, 30).map((v: any) => (
                                  <button
                                    key={v.id || `${v.make}-${v.model}`}
                                    type="button"
                                    onClick={() => handleSelectVehicle(v)}
                                    className="w-full px-3.5 py-2.5 text-left hover:bg-emerald-50/70 transition flex items-center justify-between gap-2 cursor-pointer group"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase shrink-0">
                                        {v.bodyType?.includes("Pickup") ? "Pickup" : v.bodyType?.includes("SUV") ? "SUV" : v.bodyType?.includes("Van") ? "Van" : "Saloon"}
                                      </span>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 truncate">
                                            {v.make} {v.model}
                                          </p>
                                          {v.isCustom && (
                                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 border border-purple-200">
                                              Station Added
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[10px] text-slate-500 truncate">
                                          {v.engineCC}cc &bull; {v.cylinders} Cyl &bull; {v.fuelType} &bull; {v.bodyType}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200 hidden sm:inline-block">
                                        Tyres: {v.tyreW}/{v.tyreDia}
                                      </span>
                                      <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
                                        Select &rarr;
                                      </span>
                                    </div>
                                  </button>
                                ))}
                                {vehicleSearchQuery.trim() && (
                                  <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                                    <button
                                      type="button"
                                      onClick={handleUseUnlistedFromSearch}
                                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                                    >
                                      Not listed? Register &quot;{vehicleSearchQuery}&quot; to Database
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Year Selector */}
                      <div className="relative">
                        <select
                          value={selectedCatalogYear}
                          onChange={(e) => {
                            const newYr = e.target.value;
                            setSelectedCatalogYear(newYr);
                            if (make && model) {
                              setYear(newYr);
                            }
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs transition cursor-pointer"
                        >
                          {YEARS_LIST.map((yr) => (
                            <option key={yr} value={yr}>
                              Year: {yr}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Filtered Quick Fleet Chips & Clear/Overwrite Action */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <span>Quick Pick ({selectedMakeFilter}):</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-normal">Click any model to auto-fill</span>
                          {(make || model) && (
                            <button
                              type="button"
                              onClick={handleResetVehicle}
                              className="text-[10px] text-red-600 hover:text-red-800 font-bold cursor-pointer underline flex items-center gap-0.5"
                            >
                              <span>Clear / Reset</span>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {tabVehicles.slice(0, 14).map((v: any) => {
                          const isSelected = make.toLowerCase() === v.make.toLowerCase() && model.toLowerCase() === v.model.toLowerCase();
                          return (
                            <button
                              key={v.id || `${v.make}-${v.model}`}
                              type="button"
                              onClick={() => handleSelectVehicle(v)}
                              className={`px-2.5 py-1 rounded-md text-[11px] transition cursor-pointer flex items-center gap-1.5 border ${
                                isSelected
                                  ? "bg-emerald-700 text-white border-emerald-800 font-bold shadow-2xs"
                                  : "bg-white hover:bg-emerald-50 text-slate-700 border-slate-200 hover:border-emerald-300 font-medium"
                              }`}
                            >
                              <span className="font-semibold">{v.make}</span>
                              <span>{v.model}</span>
                              {v.isCustom && (
                                <span className={`text-[9px] font-bold px-1 py-0.2 rounded ${isSelected ? "bg-white/20 text-white" : "bg-purple-100 text-purple-700"}`}>
                                  Custom
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Auto-filled banner */}
                    {autoFilledNotice && (
                      <div className="p-2.5 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-between text-xs text-emerald-900 font-medium">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-emerald-700 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{autoFilledNotice}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAutoFilledNotice(null)}
                          className="text-emerald-700 hover:text-emerald-950 text-sm font-bold cursor-pointer ml-2"
                        >
                          ×
                        </button>
                      </div>
                    )}

                    {/* Saved to database success notice */}
                    {saveModelSuccess && (
                      <div className="p-2.5 rounded-lg bg-purple-100 border border-purple-300 flex items-center justify-between text-xs text-purple-950 font-medium">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-purple-700 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{saveModelSuccess}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSaveModelSuccess(null)}
                          className="text-purple-700 hover:text-purple-950 text-sm font-bold cursor-pointer ml-2"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Unlisted Vehicle Database Persistence Action Banner */}
                  {make.trim() && model.trim() && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center gap-2">
                        {isCurrentModelInDb ? (
                          <>
                            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-slate-700 font-medium">
                              <strong>{make} {model}</strong> is registered in the central database catalog.
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                            <span className="text-slate-700">
                              <strong>{make} {model}</strong> is not yet in the central database catalog.
                            </span>
                          </>
                        )}
                      </div>
                      {!isCurrentModelInDb && (
                        <button
                          type="button"
                          disabled={isSavingCustomModel}
                          onClick={handleSaveCurrentModelToDb}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-[11px] font-bold transition cursor-pointer shadow-2xs flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                        >
                          <span>{isSavingCustomModel ? "Saving..." : `Save "${make} ${model}" to Database`}</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* ── SECTION 1: VEHICLE IDENTITY (Inline Row: Make, Model, Year, Body Type, Fuel Type) ── */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        1. Vehicle Identity &amp; Classification
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Auto-fills from catalog or editable
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      <Field
                        label="Make"
                        required
                        isFilled={Boolean(make.trim())}
                        hasError={attemptedTabs[2] && !make.trim()}
                        errorMessage="Vehicle Make is required"
                        fieldId="make"
                      >
                        <input
                          id="input-make"
                          value={make}
                          onChange={e => setMake(e.target.value)}
                          required
                          placeholder="e.g. Toyota"
                          className={INPUT}
                        />
                      </Field>

                      <Field
                        label="Model"
                        required
                        isFilled={Boolean(model.trim())}
                        hasError={attemptedTabs[2] && !model.trim()}
                        errorMessage="Vehicle Model is required"
                        fieldId="model"
                      >
                        <input
                          id="input-model"
                          value={model}
                          onChange={e => setModel(e.target.value)}
                          required
                          placeholder="e.g. Camry"
                          className={INPUT}
                        />
                      </Field>

                      <Field
                        label="Model Year"
                        required
                        isFilled={Boolean(year.trim())}
                        hasError={attemptedTabs[2] && !year.trim()}
                        errorMessage="Model Year is required"
                        fieldId="year"
                      >
                        <input
                          id="input-year"
                          value={year}
                          onChange={e => setYear(e.target.value)}
                          required
                          placeholder="2025"
                          className={INPUT + " font-mono"}
                        />
                      </Field>

                      <Field
                        label="Body Type"
                        required
                        isFilled={Boolean(bodyType.trim())}
                        fieldId="bodyType"
                      >
                        <select
                          id="input-bodyType"
                          value={bodyType}
                          onChange={e => setBodyType(e.target.value)}
                          className={INPUT}
                        >
                          {BODY_TYPES.map(bt => (
                            <option key={bt} value={bt}>{bt}</option>
                          ))}
                        </select>
                      </Field>

                      <Field
                        label="Fuel Type"
                        required
                        isFilled={Boolean(fuelType.trim())}
                        fieldId="fuelType"
                      >
                        <select
                          id="input-fuelType"
                          value={fuelType}
                          onChange={e => setFuelType(e.target.value)}
                          className={INPUT}
                        >
                          {FUEL_TYPES.map(f => (
                            <option key={f.id} value={f.id}>{f.label}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </div>

                  {/* ── SECTION 2: PHYSICAL SERIAL IDENTIFIERS (Inline Row: Chassis & Optional Engine No) ── */}
                  <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        2. Physical Vehicle Identifiers
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        VIN is mandatory &bull; Engine number is optional
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Chassis / VIN: Required, primary field */}
                      <Field 
                        label="Chassis / VIN Number (17 Characters)" 
                        required 
                        isFilled={Boolean(chassisNo.trim())}
                        hasError={attemptedTabs[2] && !chassisNo.trim()}
                        errorMessage="Chassis / VIN Number is required"
                        fieldId="chassisNo"
                        hint="Stamped on vehicle chassis"
                      >
                        <div className="relative">
                          <input
                            id="input-chassisNo"
                            ref={chassisInputRef}
                            value={chassisNo}
                            onChange={e => setChassisNo(e.target.value.toUpperCase())}
                            required
                            placeholder="e.g. JTEBU5JR8P2091837"
                            className={`${INPUT} font-mono font-bold text-sm tracking-wider uppercase ${
                              make && model && !chassisNo
                                ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/20"
                                : ""
                            }`}
                          />
                          {make && model && !chassisNo && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                              Enter VIN
                            </span>
                          )}
                        </div>
                      </Field>

                      {/* Engine Number: OPTIONAL, not required */}
                      <Field 
                        label="Engine Serial Number" 
                        optional
                        isFilled={Boolean(engineNo.trim())}
                        fieldId="engineNo"
                        hint="Optional — Stamped on engine block if available"
                      >
                        <input
                          id="input-engineNo"
                          value={engineNo}
                          onChange={e => setEngineNo(e.target.value.toUpperCase())}
                          placeholder="e.g. 1UR-894012 (Optional)"
                          className={`${INPUT} font-mono uppercase text-sm`}
                        />
                      </Field>
                    </div>
                  </div>

                  {/* ── SECTION 3: TECHNICAL & WEIGHT SPECIFICATIONS (Inline Row: CC, Cylinders, Net, Gross) ── */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        3. Technical &amp; Weight Specifications
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Engine rating and certified weight specs
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <Field
                        label="Engine Displacement (CC)"
                        required
                        isFilled={Boolean(engineCC.trim())}
                        hasError={attemptedTabs[2] && !engineCC.trim()}
                        errorMessage="Engine Displacement is required"
                        fieldId="engineCC"
                      >
                        <input
                          id="input-engineCC"
                          value={engineCC}
                          onChange={e => setEngineCC(e.target.value)}
                          required
                          placeholder="2400"
                          className={INPUT + " font-mono"}
                        />
                      </Field>

                      <Field
                        label="Cylinders"
                        isFilled={Boolean(cylinders.trim())}
                        fieldId="cylinders"
                      >
                        <select
                          id="input-cylinders"
                          value={cylinders}
                          onChange={e => setCylinders(e.target.value)}
                          className={INPUT + " font-mono"}
                        >
                          <option value="3">3 Cylinders</option>
                          <option value="4">4 Cylinders</option>
                          <option value="6">6 Cylinders</option>
                          <option value="8">8 Cylinders</option>
                          <option value="N/A">N/A (Electric / EV)</option>
                        </select>
                      </Field>

                      <Field
                        label="Net Weight (kg)"
                        optional
                        isFilled={Boolean(netWeight.trim())}
                        fieldId="netWeight"
                      >
                        <input
                          id="input-netWeight"
                          value={netWeight}
                          onChange={e => setNetWeight(e.target.value)}
                          placeholder="1650"
                          className={INPUT + " font-mono"}
                        />
                      </Field>

                      <Field
                        label="Gross Weight (kg)"
                        optional
                        isFilled={Boolean(grossWeight.trim())}
                        fieldId="grossWeight"
                      >
                        <input
                          id="input-grossWeight"
                          value={grossWeight}
                          onChange={e => setGrossWeight(e.target.value)}
                          placeholder="2150"
                          className={INPUT + " font-mono"}
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab(1)}
                      className="px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer w-full sm:w-auto"
                    >
                      ← Back to Owner Details
                    </button>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => handleNextTab2(3)}
                        className="px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                      >
                        Axle &amp; Tyres →
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNextTab2(4)}
                        className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Review &amp; Submit (Tyres Auto-Filled) →</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 3: AXLE & TYRES ── */}
              {activeTab === 3 && (
                <div className="space-y-4">
                  {/* Step 3 Requirements Callout Banner */}
                  <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition ${
                    missingFieldsTab3.length === 0
                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                      : attemptedTabs[3]
                      ? "bg-rose-50 border-rose-300 text-rose-900 shadow-2xs"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        missingFieldsTab3.length === 0 ? "bg-emerald-500" : attemptedTabs[3] ? "bg-rose-500 animate-pulse" : "bg-amber-500"
                      }`} />
                      <div>
                        <p className="font-bold">
                          {missingFieldsTab3.length === 0
                            ? "✓ All required axle & tyre dimensions completed"
                            : attemptedTabs[3]
                            ? `⚠️ Action Needed: ${missingFieldsTab3.length} required ${missingFieldsTab3.length === 1 ? "dimension is" : "dimensions are"} missing`
                            : `Step 3 Requirements: ${totalFieldsTab3 - missingFieldsTab3.length} of ${totalFieldsTab3} completed`}
                        </p>
                        {missingFieldsTab3.length > 0 && (
                          <p className="text-[11px] text-slate-500 font-normal">
                            Required: {missingFieldsTab3.map(f => f.label).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 shadow-2xs shrink-0 self-start sm:self-auto">
                      {totalFieldsTab3 - missingFieldsTab3.length}/{totalFieldsTab3} Ready
                    </span>
                  </div>

                  {/* Quick-select common tyre sizes */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <span className="text-xs font-semibold text-slate-700 block">
                      Standard Tyre Presets (Front &amp; Rear):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {TYRE_PRESETS.map(t => (
                        <button
                          key={t.label}
                          type="button"
                          onClick={() => applyTyre(t.w, t.d)}
                          className="px-2.5 py-1 rounded bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium transition cursor-pointer shadow-2xs"
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Axle Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                      <span className="text-xs font-bold text-slate-800 block">Front Axle</span>
                      <div className="grid grid-cols-2 gap-2">
                        <Field
                          label="Width (mm)"
                          required
                          isFilled={Boolean(tyreFW.trim())}
                          hasError={attemptedTabs[3] && !tyreFW.trim()}
                          errorMessage="Width required"
                          fieldId="tyreFW"
                        >
                          <input
                            id="input-tyreFW"
                            value={tyreFW}
                            onChange={e => setTyreFW(e.target.value)}
                            placeholder="235"
                            className={INPUT + " font-mono"}
                          />
                        </Field>
                        <Field
                          label="Rim (in)"
                          required
                          isFilled={Boolean(tyreFD.trim())}
                          hasError={attemptedTabs[3] && !tyreFD.trim()}
                          errorMessage="Rim required"
                          fieldId="tyreFD"
                        >
                          <input
                            id="input-tyreFD"
                            value={tyreFD}
                            onChange={e => setTyreFD(e.target.value)}
                            placeholder="18"
                            className={INPUT + " font-mono"}
                          />
                        </Field>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                      <span className="text-xs font-bold text-slate-800 block">Middle Axle (Opt.)</span>
                      <div className="grid grid-cols-2 gap-2">
                        <Field
                          label="Width (mm)"
                          optional
                          isFilled={Boolean(tyreMW.trim())}
                          fieldId="tyreMW"
                        >
                          <input
                            id="input-tyreMW"
                            value={tyreMW}
                            onChange={e => setTyreMW(e.target.value)}
                            placeholder="—"
                            className={INPUT + " font-mono"}
                          />
                        </Field>
                        <Field
                          label="Rim (in)"
                          optional
                          isFilled={Boolean(tyreMD.trim())}
                          fieldId="tyreMD"
                        >
                          <input
                            id="input-tyreMD"
                            value={tyreMD}
                            onChange={e => setTyreMD(e.target.value)}
                            placeholder="—"
                            className={INPUT + " font-mono"}
                          />
                        </Field>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                      <span className="text-xs font-bold text-slate-800 block">Rear Axle</span>
                      <div className="grid grid-cols-2 gap-2">
                        <Field
                          label="Width (mm)"
                          required
                          isFilled={Boolean(tyreRW.trim())}
                          hasError={attemptedTabs[3] && !tyreRW.trim()}
                          errorMessage="Width required"
                          fieldId="tyreRW"
                        >
                          <input
                            id="input-tyreRW"
                            value={tyreRW}
                            onChange={e => setTyreRW(e.target.value)}
                            placeholder="235"
                            className={INPUT + " font-mono"}
                          />
                        </Field>
                        <Field
                          label="Rim (in)"
                          required
                          isFilled={Boolean(tyreRD.trim())}
                          hasError={attemptedTabs[3] && !tyreRD.trim()}
                          errorMessage="Rim required"
                          fieldId="tyreRD"
                        >
                          <input
                            id="input-tyreRD"
                            value={tyreRD}
                            onChange={e => setTyreRD(e.target.value)}
                            placeholder="18"
                            className={INPUT + " font-mono"}
                          />
                        </Field>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveTab(2)}
                      className="px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNextTab3}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                    >
                      <span>Next: Customs &amp; Audit →</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── TAB 4: CUSTOMS & AUDIT ── */}
              {activeTab === 4 && (
                <div className="space-y-4">
                  {/* Step 4 Requirements Callout Banner */}
                  <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition ${
                    missingFieldsTab4.length === 0
                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                      : attemptedTabs[4]
                      ? "bg-rose-50 border-rose-300 text-rose-900 shadow-2xs"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        missingFieldsTab4.length === 0 ? "bg-emerald-500" : attemptedTabs[4] ? "bg-rose-500 animate-pulse" : "bg-amber-500"
                      }`} />
                      <div>
                        <p className="font-bold">
                          {missingFieldsTab4.length === 0
                            ? "✓ All required customs & certification entries completed"
                            : attemptedTabs[4]
                            ? `⚠️ Action Needed: ${missingFieldsTab4.length} required ${missingFieldsTab4.length === 1 ? "entry is" : "entries are"} missing`
                            : `Step 4 Requirements: ${totalFieldsTab4 - missingFieldsTab4.length} of ${totalFieldsTab4} completed`}
                        </p>
                        {missingFieldsTab4.length > 0 && (
                          <p className="text-[11px] text-slate-500 font-normal">
                            Required: {missingFieldsTab4.map(f => f.label).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 shadow-2xs shrink-0 self-start sm:self-auto">
                      {totalFieldsTab4 - missingFieldsTab4.length}/{totalFieldsTab4} Ready
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <Field
                      label="Official Revenue Receipt Number"
                      required
                      isFilled={Boolean(receiptNo.trim())}
                      hasError={attemptedTabs[4] && !receiptNo.trim()}
                      errorMessage="Revenue Receipt Number is required"
                      fieldId="receiptNo"
                    >
                      <input
                        id="input-receiptNo"
                        value={receiptNo}
                        onChange={e => setReceiptNo(e.target.value)}
                        required
                        placeholder="e.g. 4702604819"
                        className={INPUT + " font-mono font-bold"}
                      />
                    </Field>

                    <Field
                      label="Customs Declaration Number"
                      required
                      isFilled={Boolean(customsNo.trim())}
                      hasError={attemptedTabs[4] && !customsNo.trim()}
                      errorMessage="Customs Declaration Number is required"
                      fieldId="customsNo"
                    >
                      <input
                        id="input-customsNo"
                        value={customsNo}
                        onChange={e => setCustomsNo(e.target.value)}
                        required
                        placeholder="e.g. 4708912/26"
                        className={INPUT + " font-mono font-bold"}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <Field
                      label="Customs Clearance Date"
                      required
                      isFilled={Boolean(customsDate.trim())}
                      hasError={attemptedTabs[4] && !customsDate.trim()}
                      errorMessage="Customs Clearance Date is required"
                      fieldId="customsDate"
                      hint="Empty until verified"
                    >
                      <input
                        id="input-customsDate"
                        type="date"
                        value={customsDate}
                        onChange={e => setCustomsDate(e.target.value)}
                        required
                        className={INPUT}
                      />
                    </Field>

                    <Field
                      label="Supervising Certification Officer"
                      required
                      isFilled={Boolean(supervisor.trim())}
                      hasError={attemptedTabs[4] && !supervisor.trim()}
                      errorMessage="Supervising Certification Officer is required"
                      fieldId="supervisor"
                      hint="Type officer name / badge"
                    >
                      <input
                        id="input-supervisor"
                        value={supervisor}
                        onChange={e => setSupervisor(e.target.value)}
                        required
                        placeholder="e.g. Eric Ansah (Officer ID: DVLA-402)"
                        className={INPUT}
                      />
                    </Field>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      Summary Verification
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Plate:</span>
                        <span className="font-bold text-slate-900 font-mono">{regNo || "Pending"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Owner:</span>
                        <span className="font-semibold text-slate-900 truncate block">{ownerName || "Pending"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Vehicle:</span>
                        <span className="font-semibold text-slate-900 truncate block">{make || "—"} {model}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">VIN:</span>
                        <span className="font-mono text-slate-900 truncate block">{chassisNo || "—"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className={`w-full py-3 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                        overallCompletionPercent === 100
                          ? "bg-[#103014] hover:bg-[#18481e] text-white"
                          : "bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-400/40"
                      }`}
                    >
                      {overallCompletionPercent === 100 ? (
                        <>
                          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>Certify &amp; Submit Registration to Logbook</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                          <span>Certify &amp; Submit ({totalRequiredFields - totalCompletedFields} Required Fields Left)</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-1.5">
                      DVLA Adenta Station Registry &bull; Certified under Road Traffic Act 683
                    </p>
                  </div>

                  <div className="pt-1 flex justify-start">
                    <button
                      type="button"
                      onClick={() => setActiveTab(3)}
                      className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      ← Back to Tyres
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ── Right Column (1/3): Clean Live Plate Inspector & Interactive Filing Checklist ── */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden lg:sticky lg:top-20 space-y-3.5 p-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">
                Plate Inspection
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                {CLASSIFICATIONS.find(c => c.id === classification)?.badge}
              </span>
            </div>

            {/* Ghana Digital Plate */}
            <div className="w-full flex justify-center py-1">
              <div className="w-full max-w-[320px]">
                <DigitalPlate 
                  plateNumber={regNo || "PENDING"} 
                  category={classification as PlateCategory}
                  region="GREATER ACCRA"
                  slogan="GREATER ACCRA"
                  vin={chassisNo || "PENDING"}
                  make={make || "VEHICLE"}
                />
              </div>
            </div>

            {/* Quick Category Preview Buttons */}
            <div className="flex items-center justify-center gap-1 pb-1.5 border-b border-slate-100 flex-wrap">
              {(["PRIVATE", "COMMERCIAL", "ELECTRIC", "GOVERNMENT"] as const).map(catKey => {
                const active = classification === catKey;
                const conf = CLASSIFICATIONS.find(c => c.id === catKey);
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setClassification(catKey)}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition cursor-pointer ${
                      active
                        ? "bg-slate-900 text-white font-bold"
                        : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {conf?.badge}
                  </button>
                );
              })}
            </div>

            {/* ── Live Interactive Filing Checklist ── */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${overallCompletionPercent === 100 ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                  <span className="text-xs font-bold text-slate-800">
                    Filing Requirements
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  overallCompletionPercent === 100
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : "bg-amber-100 text-amber-800 border-amber-300"
                }`}>
                  {totalCompletedFields}/{totalRequiredFields} Complete
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    overallCompletionPercent === 100
                      ? "bg-emerald-600"
                      : overallCompletionPercent >= 50
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                  style={{ width: `${overallCompletionPercent}%` }}
                />
              </div>

              {/* Checklist Sections */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-0.5 text-xs">
                {/* Step 1 Items */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>1. Owner &amp; Filing</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab(1)}
                      className="text-emerald-700 hover:underline cursor-pointer"
                    >
                      Tab 1
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    <ChecklistItem
                      label="Plate Number"
                      value={regNo}
                      isDone={Boolean(regNo.trim())}
                      onClick={() => focusField("input-regNo", 1)}
                    />
                    <ChecklistItem
                      label="Owner Legal Name"
                      value={ownerName}
                      isDone={Boolean(ownerName.trim())}
                      onClick={() => focusField("input-ownerName", 1)}
                    />
                    {isTransfer && activeServiceDef?.prevOwnerRequireName !== false && (
                      <ChecklistItem
                        label="Prev Owner Name"
                        value={oldOwnerName}
                        isDone={Boolean(oldOwnerName.trim())}
                        onClick={() => focusField("input-oldOwnerName", 1)}
                      />
                    )}
                  </div>
                </div>

                {/* Step 2 Items */}
                <div className="space-y-1 pt-1 border-t border-slate-200/60">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>2. Vehicle Details</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab(2)}
                      className="text-emerald-700 hover:underline cursor-pointer"
                    >
                      Tab 2
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    <ChecklistItem
                      label="Make &amp; Model"
                      value={make && model ? `${make} ${model} (${year || "—"})` : ""}
                      isDone={Boolean(make.trim() && model.trim() && year.trim())}
                      onClick={() => focusField("input-make", 2)}
                    />
                    <ChecklistItem
                      label="Chassis / VIN"
                      value={chassisNo}
                      isDone={Boolean(chassisNo.trim())}
                      onClick={() => focusField("input-chassisNo", 2)}
                    />
                    <ChecklistItem
                      label="Engine Displacement"
                      value={engineCC ? `${engineCC} cc` : ""}
                      isDone={Boolean(engineCC.trim())}
                      onClick={() => focusField("input-engineCC", 2)}
                    />
                  </div>
                </div>

                {/* Step 3 Items */}
                <div className="space-y-1 pt-1 border-t border-slate-200/60">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>3. Axle &amp; Tyres</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab(3)}
                      className="text-emerald-700 hover:underline cursor-pointer"
                    >
                      Tab 3
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    <ChecklistItem
                      label="Front Tyres"
                      value={tyreFW && tyreFD ? `${tyreFW}/${tyreFD}` : ""}
                      isDone={Boolean(tyreFW.trim() && tyreFD.trim())}
                      onClick={() => focusField("input-tyreFW", 3)}
                    />
                    <ChecklistItem
                      label="Rear Tyres"
                      value={tyreRW && tyreRD ? `${tyreRW}/${tyreRD}` : ""}
                      isDone={Boolean(tyreRW.trim() && tyreRD.trim())}
                      onClick={() => focusField("input-tyreRW", 3)}
                    />
                  </div>
                </div>

                {/* Step 4 Items */}
                <div className="space-y-1 pt-1 border-t border-slate-200/60">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>4. Customs &amp; Audit</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab(4)}
                      className="text-emerald-700 hover:underline cursor-pointer"
                    >
                      Tab 4
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    <ChecklistItem
                      label="Revenue Receipt"
                      value={receiptNo}
                      isDone={Boolean(receiptNo.trim())}
                      onClick={() => focusField("input-receiptNo", 4)}
                    />
                    <ChecklistItem
                      label="Customs Declaration"
                      value={customsNo}
                      isDone={Boolean(customsNo.trim())}
                      onClick={() => focusField("input-customsNo", 4)}
                    />
                    <ChecklistItem
                      label="Clearance Date"
                      value={customsDate}
                      isDone={Boolean(customsDate.trim())}
                      onClick={() => focusField("input-customsDate", 4)}
                    />
                    <ChecklistItem
                      label="Supervising Officer"
                      value={supervisor}
                      isDone={Boolean(supervisor.trim())}
                      onClick={() => focusField("input-supervisor", 4)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Submit shortcut */}
            <button
              type="submit"
              className={`w-full py-2.5 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer mt-2 flex items-center justify-center gap-1.5 ${
                overallCompletionPercent === 100
                  ? "bg-[#103014] hover:bg-[#18481e] text-white"
                  : "bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30"
              }`}
            >
              {overallCompletionPercent === 100 ? (
                <>
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Submit to Logbook</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Submit ({totalRequiredFields - totalCompletedFields} Required Left)</span>
                </>
              )}
            </button>
          </div>

        </form>
      )}

    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[300px] text-slate-500 font-medium text-xs bg-white rounded-xl border border-slate-200">
        Loading Booking Desk Registry...
      </div>
    }>
      <BookingDeskContent />
    </Suspense>
  );
}
