"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getStoredReservations, checkPlateReservation, saveStoredReservations, Reservation } from "../../../components/reservationsData";
import { DigitalPlate, PlateCategory } from "@/components/DigitalPlate";
import {
  VehicleModel,
  VEHICLE_CATALOG,
  YEARS_LIST,
} from "@/lib/vehicleCatalog";

/* ─── Baseline Plate Categories (Private, Commercial, Motorcycle, Government, EV, Trailer, TMP, Agri, Diplomatic) ─── */

const DEFAULT_CLASSIFICATIONS = [
  { id: "PRIVATE", label: "Private (White Plate)", badge: "⚪ Private" },
  { id: "COMMERCIAL", label: "Commercial (Yellow Plate)", badge: "🟡 Commercial" },
  { id: "MOTORCYCLE", label: "Motorcycle (Light Blue Plate)", badge: "🔵 Motorcycle" },
  { id: "GOVERNMENT", label: "Government (GV Split Plate)", badge: "🏛️ GV Split" },
  { id: "ELECTRIC", label: "Electric Vehicle (EV Green Plate)", badge: "🟢 EV Green" },
  { id: "TRAILER", label: "Trailer (Yellow T Plate)", badge: "🟡 Trailer" },
  { id: "TEMPORARY", label: "Temporary (TMP Sticker Plate)", badge: "🔷 TMP Sticker" },
  { id: "AGRICULTURAL", label: "Agricultural (Farm Machinery)", badge: "🚜 Agricultural" },
  { id: "DIPLOMATIC", label: "Diplomatic Corps (CD Plate)", badge: "🔴 Diplomatic" },
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

/* ── Design tokens: Locks capital in all inputs ── */
const INPUT =
  "px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#81B71A] focus:border-[#81B71A] transition-all w-full placeholder-slate-400 uppercase tracking-wide";

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
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wider ${hasError
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

      <div className={`transition-all duration-200 rounded-lg ${hasError
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
      className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left transition cursor-pointer border ${isDone
        ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-950 hover:bg-emerald-100/70"
        : "bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50/30 text-slate-700"
        }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${isDone
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

  /* ── Tab navigation state: 3 steps + 4th Review & Inspection ── */
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

  /* ── VRS Quick-Fill states ── */
  const [vrsInvoiceNo, setVrsInvoiceNo] = useState("");
  const [isFetchingVrs, setIsFetchingVrs] = useState(false);
  const [vrsSuccessMessage, setVrsSuccessMessage] = useState("");
  const [alreadyBookedError, setAlreadyBookedError] = useState<string | null>(null);

  /* ── Owner: All text state locked to uppercase ── */
  const [regNo, setRegNo] = useState(() => {
    if (isPrefill && searchParams) {
      const platePattern = searchParams.get("platePattern");
      if (platePattern) return platePattern.toUpperCase();
      const rangeStart = searchParams.get("rangeStart");
      if (rangeStart) {
        const prefix = searchParams.get("prefix") || "KX";
        return `${prefix} ${rangeStart}-AD`.toUpperCase();
      }
    }
    return "";
  });

  const [ownerName, setOwnerName] = useState(() => {
    return isPrefill && searchParams ? (searchParams.get("holder") || "").toUpperCase() : "";
  });

  const [address, setAddress] = useState(() => {
    return isPrefill && searchParams ? (searchParams.get("address") || "").toUpperCase() : "";
  });

  const [phone, setPhone] = useState(() => {
    return isPrefill && searchParams ? (searchParams.get("phone") || "").toUpperCase() : "";
  });

  const [oldOwnerName, setOldOwnerName] = useState("");
  const [oldOwnerPhone, setOldOwnerPhone] = useState("");
  const [oldOwnerAddr, setOldOwnerAddr] = useState("");
  const [oldOwnerCustom, setOldOwnerCustom] = useState("");
  const [showExtraPhone, setShowExtraPhone] = useState(false);
  const [showExtraAddr, setShowExtraAddr] = useState(false);
  const [showExtraCustom, setShowExtraCustom] = useState(false);

  /* ── Vehicle specs: Make, Model, Year, Body, Fuel, VIN, CC, Cylinders ── */
  const [make, setMake] = useState("");
  const [year, setYear] = useState("");
  const [model, setModel] = useState("");
  const [engineCC, setEngineCC] = useState("");
  const [cylinders, setCylinders] = useState("4");
  const [engineNo, setEngineNo] = useState("");
  const [chassisNo, setChassisNo] = useState("");
  const [bodyType, setBodyType] = useState("Saloon");
  const [fuelType, setFuelType] = useState("PETROL");

  /* ── Silent background defaults for tyres/weights (removed from user UI) ── */
  const [netWeight, setNetWeight] = useState("1500");
  const [grossWeight, setGrossWeight] = useState("2000");
  const [tyreFW, setTyreFW] = useState("215");
  const [tyreFD, setTyreFD] = useState("16");
  const [tyreMW, setTyreMW] = useState("");
  const [tyreMD, setTyreMD] = useState("");
  const [tyreRW, setTyreRW] = useState("215");
  const [tyreRD, setTyreRD] = useState("16");

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

  // Dropdown search results across ALL vehicles globally (shows only when typed)
  const filteredCatalogVehicles = useMemo(() => {
    const list = dbVehicles.length > 0 ? dbVehicles : VEHICLE_CATALOG;
    const q = vehicleSearchQuery.toLowerCase().trim();

    if (!q) {
      return [];
    }

    return list.filter((v: any) => {
      const full = `${v.make} ${v.model}`.toLowerCase();
      const m = (v.make || "").toLowerCase();
      const mdl = (v.model || "").toLowerCase();
      const body = (v.bodyType || "").toLowerCase();
      const category = (v.category || "").toLowerCase();
      return full.includes(q) || m.includes(q) || mdl.includes(q) || body.includes(q) || category.includes(q);
    });
  }, [dbVehicles, vehicleSearchQuery]);

  function handleResetVehicle() {
    setMake("");
    setModel("");
    setYear(selectedCatalogYear || "2024");
    setEngineCC("");
    setCylinders("4");
    setBodyType("Saloon");
    setFuelType("PETROL");
    setNetWeight("1500");
    setGrossWeight("2000");
    setTyreFW("215");
    setTyreFD("16");
    setTyreRW("215");
    setTyreRD("16");
    setTyreMW("");
    setTyreMD("");
    setEngineNo("");
    setChassisNo("");
    setVehicleSearchQuery("");
    setAutoFilledNotice(null);
    setIsVehicleDropdownOpen(false);
  }

  function handleSelectVehicle(v: VehicleModel | any, customYear?: string) {
    const yr = customYear || selectedCatalogYear || "2024";
    setMake((v.make || "").toUpperCase());
    setModel((v.model || "").toUpperCase());
    setYear(yr);
    setEngineCC(v.engineCC || "2000");
    setCylinders(v.cylinders || "4");
    setBodyType(v.bodyType || "Saloon");
    setFuelType(v.fuelType || "PETROL");
    setNetWeight(v.netWeight || "1500");
    setGrossWeight(v.grossWeight || "2000");
    setTyreFW(v.tyreW || "215");
    setTyreFD(v.tyreDia || "16");
    setTyreRW(v.tyreW || "215");
    setTyreRD(v.tyreDia || "16");
    setTyreMW("");
    setTyreMD("");
    setEngineNo("");

    setVehicleSearchQuery("");
    setIsVehicleDropdownOpen(false);
    setAutoFilledNotice(
      `Specifications auto-filled for ${v.make.toUpperCase()} ${v.model.toUpperCase()} (${yr}).`
    );

    setTimeout(() => {
      chassisInputRef.current?.focus();
    }, 150);
  }

  function handleUseUnlistedFromSearch() {
    if (!vehicleSearchQuery.trim()) return;
    const parts = vehicleSearchQuery.trim().split(/\s+/);
    const newMake = parts[0] || "";
    const newModel = parts.slice(1).join(" ") || "STANDARD";
    setMake(newMake.toUpperCase());
    setModel(newModel.toUpperCase());
    setYear(selectedCatalogYear || "2024");
    setVehicleSearchQuery("");
    setIsVehicleDropdownOpen(false);
    setAutoFilledNotice(
      `Vehicle initialized: "${newMake.toUpperCase()} ${newModel.toUpperCase()}".`
    );
  }

  /* ── Official Revenue Receipt & Date (Step 1) ── */
  const [receiptNo, setReceiptNo] = useState("");
  const [receiptDate, setReceiptDate] = useState(() => new Date().toISOString().slice(0, 10));

  /* ── Customs & Certification (Step 3) ── */
  const [customsNo, setCustomsNo] = useState("");
  const [customsDate, setCustomsDate] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");

  /* ── Database-Driven Plate Categories & Supervisors ── */
  interface PlateCategoryDbItem {
    id: string;
    code: string;
    name: string;
    badge: string;
    description?: string | null;
    plateColor?: string | null;
    textColor?: string | null;
    isActive: boolean;
  }

  interface SupervisorDbItem {
    id: string;
    name: string;
    badgeNumber?: string | null;
    station?: string | null;
    branch?: {
      id: string;
      name: string;
      code?: string;
    } | null;
    isActive: boolean;
  }

  const [dbPlateCategories, setDbPlateCategories] = useState<PlateCategoryDbItem[]>([]);
  const [dbSupervisors, setDbSupervisors] = useState<SupervisorDbItem[]>([]);
  const [dbBodyTypes, setDbBodyTypes] = useState<{ code: string; name: string; isActive: boolean }[]>([]);
  const [isQuickAddSupervisorOpen, setIsQuickAddSupervisorOpen] = useState(false);
  const [newSupervisorName, setNewSupervisorName] = useState("");
  const [newSupervisorStation, setNewSupervisorStation] = useState("");
  const [isSavingSupervisor, setIsSavingSupervisor] = useState(false);

  async function loadSupervisors() {
    try {
      const res = await fetch("/api/supervisors?activeOnly=true");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const activeOnly = data.filter((s: any) => s.isActive !== false);
          setDbSupervisors(activeOnly);
          return activeOnly;
        }
      }
    } catch (err) {
      console.error("Failed loading supervisors from DB:", err);
    }
    return [];
  }

  async function loadPlateCategories() {
    try {
      const res = await fetch("/api/plates/categories?activeOnly=true");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const activeOnly = data.filter((c: any) => c.isActive !== false);
          setDbPlateCategories(activeOnly);
          return activeOnly;
        }
      }
    } catch (err) {
      console.error("Failed loading plate categories from DB:", err);
    }
    return [];
  }

  async function loadBodyTypes() {
    try {
      const res = await fetch("/api/vehicles/body-types?activeOnly=true");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const activeOnly = data.filter((bt: any) => bt.isActive !== false);
          setDbBodyTypes(activeOnly);
          return activeOnly;
        }
      }
    } catch (err) {
      console.error("Failed loading body types from DB:", err);
    }
    return [];
  }

  useEffect(() => {
    loadPlateCategories();
    loadSupervisors();
    loadBodyTypes();

    const handleSync = () => {
      loadPlateCategories();
      loadSupervisors();
      loadBodyTypes();
    };

    window.addEventListener("focus", handleSync);
    document.addEventListener("visibilitychange", handleSync);
    return () => {
      window.removeEventListener("focus", handleSync);
      document.removeEventListener("visibilitychange", handleSync);
    };
  }, []);

  const activeCategories = useMemo(() => {
    if (dbPlateCategories.length > 0) {
      const active = dbPlateCategories
        .filter(c => c.isActive !== false)
        .map(c => ({
          id: c.code,
          label: c.name,
          badge: c.badge,
        }));
      if (active.length > 0) return active;
    }
    return DEFAULT_CLASSIFICATIONS;
  }, [dbPlateCategories]);

  // Keep classification aligned with active categories
  useEffect(() => {
    if (activeCategories.length > 0 && !activeCategories.some(c => c.id === classification)) {
      setClassification(activeCategories[0].id);
    }
  }, [activeCategories, classification]);

  // Default supervisor if available or align if currently selected supervisor became inactive
  useEffect(() => {
    if (dbSupervisors.length > 0) {
      const isCurrentActive = dbSupervisors.some(s => s.name === supervisor);
      if (!supervisor || !isCurrentActive) {
        setSupervisor(dbSupervisors[0].name);
        setSelectedSupervisorId(dbSupervisors[0].id);
      }
    }
  }, [dbSupervisors, supervisor]);

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
    requiresCustoms?: boolean;
    customFields?: Array<{ fieldKey: string; label: string; type: "text" | "date" | "number"; required: boolean }> | null;
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
          } catch { }
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
      requiresCustoms: s.requiresCustoms !== false,
      customFields: Array.isArray(s.customFields) ? s.customFields : [],
    }));
  }, [serviceOptions]);

  const activeReservation = checkPlateReservation(regNo, reservations);
  const activeServiceDef = displayBookingTypes.find(b => b.id === bookingType);

  const isTransfer = Boolean(
    activeServiceDef
      ? activeServiceDef.requiresPreviousOwner
      : (bookingType === "REG_TRANSFER" || bookingType === "REG_TRANSFER_SPECIAL")
  );

  // Whether the selected service requires customs documentation
  const requiresCustomsStep = activeServiceDef ? activeServiceDef.requiresCustoms !== false : true;

  // Custom fields for the selected service
  const activeCustomFields = activeServiceDef?.customFields || [];

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
    // Reset custom field values when service type changes
    setCustomFieldValues({});
  }, [bookingType, isTransfer]);

  // Custom field values state
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  const isSpecialOrCustomized =
    bookingType === "REG_SPECIAL" ||
    bookingType === "REG_TRANSFER_SPECIAL" ||
    bookingType.includes("SPECIAL") ||
    bookingType.includes("CUSTOM");

  /* ── 3 Streamlined Steps Validation ── */
  const [attemptedTabs, setAttemptedTabs] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
  });

  const missingFieldsTab1 = useMemo(() => {
    const missing: { id: string; label: string }[] = [];
    if (!bookingType.trim()) missing.push({ id: "input-bookingType", label: "Filing Service Type" });
    if (!classification.trim()) missing.push({ id: "input-classification", label: "Plate Classification" });
    if (!regNo.trim()) missing.push({ id: "input-regNo", label: "Assigned Plate Number" });
    if (!ownerName.trim()) missing.push({ id: "input-ownerName", label: isTransfer ? "New Owner Full Legal Name" : "Owner Full Legal Name" });
    if (!receiptNo.trim()) missing.push({ id: "input-receiptNo", label: "Revenue Receipt Number" });
    if (!receiptDate.trim()) missing.push({ id: "input-receiptDate", label: "Receipt Payment Date" });
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
  }, [bookingType, classification, regNo, ownerName, receiptNo, receiptDate, isTransfer, activeServiceDef, oldOwnerName, oldOwnerPhone, oldOwnerAddr, oldOwnerCustom]);

  const totalFieldsTab1 = useMemo(() => {
    let count = 6;
    if (isTransfer) {
      if (activeServiceDef?.prevOwnerRequireName !== false) count++;
      if (Boolean(activeServiceDef?.prevOwnerRequirePhone)) count++;
      if (activeServiceDef?.prevOwnerRequireAddress !== false) count++;
      if (Boolean(activeServiceDef?.prevOwnerRequireCustom)) count++;
    }
    return count;
  }, [isTransfer, activeServiceDef]);

  // Tab 2: Kept CC and Cylinders! Axles and tyres temporarily removed.
  const missingFieldsTab2 = useMemo(() => {
    const missing: { id: string; label: string }[] = [];
    if (!make.trim()) missing.push({ id: "input-make", label: "Make" });
    if (!model.trim()) missing.push({ id: "input-model", label: "Model" });
    if (!year.trim()) missing.push({ id: "input-year", label: "Model Year" });
    if (!bodyType.trim()) missing.push({ id: "input-bodyType", label: "Body Type" });
    if (!fuelType.trim()) missing.push({ id: "input-fuelType", label: "Fuel Type" });
    if (!chassisNo.trim()) missing.push({ id: "input-chassisNo", label: "Chassis / VIN Number" });
    if (!engineCC.trim()) missing.push({ id: "input-engineCC", label: "Engine Displacement (CC)" });
    if (!cylinders.trim()) missing.push({ id: "input-cylinders", label: "Number of Cylinders" });
    return missing;
  }, [make, model, year, bodyType, fuelType, chassisNo, engineCC, cylinders]);

  const totalFieldsTab2 = 8;

  // Step 3: Customs & Certification
  const missingFieldsTab3 = useMemo(() => {
    const missing: { id: string; label: string }[] = [];
    if (requiresCustomsStep) {
      if (!customsNo.trim()) missing.push({ id: "input-customsNo", label: "Customs Declaration Number" });
      if (!customsDate.trim()) missing.push({ id: "input-customsDate", label: "Customs Clearance Date" });
    }
    if (!supervisor.trim()) missing.push({ id: "input-supervisor", label: "Approving Officer" });
    // Required custom fields validation
    activeCustomFields.filter(f => f.required).forEach(f => {
      if (!customFieldValues[f.fieldKey]?.trim()) {
        missing.push({ id: `input-custom-${f.fieldKey}`, label: f.label || f.fieldKey });
      }
    });
    return missing;
  }, [requiresCustomsStep, customsNo, customsDate, supervisor, activeCustomFields, customFieldValues]);

  const totalFieldsTab3 = (requiresCustomsStep ? 2 : 0) + 1 + activeCustomFields.filter(f => f.required).length;

  const totalRequiredFields = totalFieldsTab1 + totalFieldsTab2 + totalFieldsTab3;
  const totalCompletedFields =
    (totalFieldsTab1 - missingFieldsTab1.length) +
    (totalFieldsTab2 - missingFieldsTab2.length) +
    (totalFieldsTab3 - missingFieldsTab3.length);

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

  function handleNextTab2() {
    if (missingFieldsTab2.length > 0) {
      setAttemptedTabs(prev => ({ ...prev, 2: true }));
      focusField(missingFieldsTab2[0].id, 2);
      return;
    }
    setActiveTab(3);
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
    setMake(p.make.toUpperCase());
    setYear(p.year);
    setModel(p.model.toUpperCase());
    setEngineCC(p.engineCC);
    setCylinders(p.cylinders);
    setBodyType(p.bodyType);
    setFuelType(p.fuelType);
    setNetWeight(p.netWeight);
    setGrossWeight(p.grossWeight);
    setTyreFW(p.tyreW);
    setTyreFD(p.tyreDia);
    setTyreRW(p.tyreW);
    setTyreRD(p.tyreDia);
    setTyreMW("");
    setTyreMD("");
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
      setOwnerName("EBENEZER KWABENA BOATENG");
      setAddress("HOUSE NO. 12, FRAFRAHA JUNCTION, ADENTA, ACCRA");
      setPhone("+233 24 489 0291");
      setRegNo(generateNewDVLAFormat());
      setEngineNo("SQRF4J20-291823");
      setChassisNo("JTEBU5JR8P2091837");
      setYear("2024");
      setModel("LAND CRUISER");
      setReceiptNo("4702604819");
      setCustomsNo("4708912/26");
      setCustomsDate(new Date().toISOString().slice(0, 10));
      const matchedSup = dbSupervisors.length > 0 ? dbSupervisors[0] : null;
      if (matchedSup) {
        setSupervisor(matchedSup.name);
        setSelectedSupervisorId(matchedSup.id);
      } else {
        setSupervisor("SAVIOUR ADOM");
      }
      if (isTransfer) {
        setOldOwnerName("SETH PASCAL KOFI");
        setOldOwnerPhone("+233 24 901 8273");
        setOldOwnerAddr("PLOT 8, ADENTAN MUNICIPAL AREA, ACCRA");
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
    setBodyType("Saloon"); setNetWeight("1500"); setGrossWeight("2000");
    setTyreFW("215"); setTyreFD("16"); setTyreMW(""); setTyreMD(""); setTyreRW("215"); setTyreRD("16");
    setReceiptNo(""); setCustomsNo(""); setCustomsDate(""); setSupervisor(""); setSelectedSupervisorId("");
    setCylinders("4"); setFuelType("PETROL");
    setRegNo("");
    setVrsInvoiceNo("");
    setVrsSuccessMessage("");
    setAlreadyBookedError(null);
    setAttemptedTabs({ 1: false, 2: false, 3: false });
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
                `⚠️ Notice: VRS Invoice #${invoice.invoiceNo} has ALREADY been booked in system (Booking #${match.id} — ${match.owner}).`
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
      setRegNo((invoice.regNo || "").toUpperCase());
      setOwnerName((invoice.ownerName || "").toUpperCase());
      setAddress((invoice.address || "").toUpperCase());
      setPhone((invoice.phone || "").toUpperCase());

      setMake((invoice.make || "").toUpperCase());
      const yearMatch = invoice.yearModel.match(/(\d{4})$/);
      const extractedYear = yearMatch ? yearMatch[1] : "";
      const extractedModel = yearMatch ? invoice.yearModel.replace(/\s*\d{4}$/, "") : invoice.yearModel;
      setYear(extractedYear);
      setModel((extractedModel || "").toUpperCase());
      setEngineCC(invoice.engineCC || "2000");
      setCylinders(invoice.cylinders || "4");
      setEngineNo((invoice.engineNo || "").toUpperCase());
      setChassisNo((invoice.chassisNo || "").toUpperCase());
      setBodyType(invoice.bodyType || "Saloon");
      setFuelType(invoice.fuelType || "PETROL");
      setNetWeight(invoice.netWeight || "1500");
      setGrossWeight(invoice.grossWeight || "2000");

      setTyreFW(invoice.tyreFW || "215");
      setTyreFD(invoice.tyreFD || "16");
      setTyreMW(invoice.tyreMW || "");
      setTyreMD(invoice.tyreMD || "");
      setTyreRW(invoice.tyreRW || "215");
      setTyreRD(invoice.tyreRD || "16");

      setReceiptNo("");
      setCustomsNo("");
      setCustomsDate("");

      setVrsSuccessMessage(`VRS Invoice #${invoice.invoiceNo} imported successfully.`);
      setActiveTab(3); // Navigate directly to Customs & Certification
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

    // Step-by-step verification: Step 1 -> Step 2 -> Step 3
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

    const fullPlate = regNo.trim().toUpperCase();

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: bookingType,
          status: "pending",
          owner: ownerName.trim().toUpperCase() || "UNKNOWN OWNER",
          address: address.trim().toUpperCase() || undefined,
          phone: phone.trim().toUpperCase() || undefined,
          vehicle: `${make.trim().toUpperCase()} ${model.trim().toUpperCase()} (${year})`.trim() || "VEHICLE",
          plate: fullPlate || undefined,
          date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
          classification: classification,
          receiptNo: receiptNo.trim().toUpperCase() || undefined,
          receiptDate: receiptDate.trim() || undefined,
          customsNo: customsNo.trim().toUpperCase() || undefined,
          customsDate: customsDate.trim() || undefined,
          supervisor: supervisor.trim().toUpperCase() || undefined,
          supervisorId: selectedSupervisorId || undefined,
          vrsInvoiceNo: vrsInvoiceNo.trim().toUpperCase() || undefined,
          make: make.trim().toUpperCase() || undefined,
          model: model.trim().toUpperCase() || undefined,
          yearModel: year.trim() || undefined,
          bodyType: bodyType || undefined,
          engineCC: engineCC.trim() || undefined,
          cylinders: cylinders || undefined,
          engineNo: engineNo.trim().toUpperCase() || undefined,
          chassisNo: chassisNo.trim().toUpperCase() || undefined,
          fuelType: fuelType || undefined,
          netWeight: (netWeight && netWeight.trim()) || "1500",
          grossWeight: (grossWeight && grossWeight.trim()) || "2000",
          tyreFW: (tyreFW && tyreFW.trim()) || "215",
          tyreFD: (tyreFD && tyreFD.trim()) || "16",
          tyreMW: tyreMW.trim() || undefined,
          tyreMD: tyreMD.trim() || undefined,
          tyreRW: (tyreRW && tyreRW.trim()) || "215",
          tyreRD: (tyreRD && tyreRD.trim()) || "16",
          createdById: sessionUser?.id || undefined,
          userId: sessionUser?.id || undefined,
          userName: sessionUser?.name || sessionUser?.username || "Officer",
          branchId: sessionUser?.branchId || sessionUser?.branch?.id || undefined,
          previousOwnerName: isTransfer ? oldOwnerName.trim().toUpperCase() || undefined : undefined,
          previousOwnerPhone: isTransfer ? oldOwnerPhone.trim().toUpperCase() || undefined : undefined,
          previousOwnerAddress: isTransfer ? oldOwnerAddr.trim().toUpperCase() || undefined : undefined,
          previousOwnerCustom: isTransfer ? oldOwnerCustom.trim().toUpperCase() || undefined : undefined,
          customFieldData: Object.keys(customFieldValues).length > 0 ? customFieldValues : undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(`⚠️ Booking Error: ${errData.error || "Failed to create booking."}`);
        return;
      }

      setIsSuccess(true);
      fetchDbVehicles();
    } catch (err) {
      console.error("Error creating booking in DB:", err);
      alert("System error creating booking.");
    }
  }

  /* ════════════════ RENDER ════════════════ */
  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-32 lg:pb-16">

      {/* ── 1. Top Header Bar ── */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight">
              Vehicle Registration Desk
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              VRS Online
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
              {sessionUser?.branch?.name ? String(sessionUser.branch.name).toUpperCase() : "DVLA ADENTA"}
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
              CAPS LOCKED
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Official Logbook Entry • Follow the 3-step filing procedure and certify in review.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Inline VRS Invoice Search */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
            <input
              type="text"
              value={vrsInvoiceNo}
              onChange={e => setVrsInvoiceNo(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 14))}
              placeholder="VRS INVOICE #"
              className="px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none w-32 md:w-36 uppercase"
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
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
          >
            <span>Demo Auto-Fill</span>
          </button>

          {/* Quick Mobile Review Shortcut */}
          <button
            type="button"
            onClick={() => setActiveTab(4)}
            className="lg:hidden px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold transition cursor-pointer flex items-center gap-1"
            title="Preview plate and review"
          >
            <span>Plate</span>
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
            <h3 className="font-bold text-base text-slate-900 uppercase">Registration Successfully Filed</h3>
            <p className="text-xs text-slate-500">Official logbook record entered into DVLA database.</p>
          </div>

          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 font-mono text-xs space-y-2 text-slate-700 uppercase">
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
              <span className="text-slate-400">ENGINE SPECS:</span>
              <span>{engineCC} CC • {cylinders} CYLINDERS</span>
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
              <span className="text-slate-400">APPROVING OFFICER:</span>
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

          {/* ── Left Column (2/3): Streamlined 3-Step Workstation ── */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">

            {/* Modern 4-Step Stepper Navigation Strip */}
            <div className="flex border-b border-slate-200 bg-slate-50/70">
              {([
                { id: 1, stepNum: 1, label: "1. Owner & Filing", shortLabel: "1. Owner", total: totalFieldsTab1, missing: missingFieldsTab1.length, attempted: attemptedTabs[1] },
                { id: 2, stepNum: 2, label: "2. Vehicle Specs", shortLabel: "2. Vehicle", total: totalFieldsTab2, missing: missingFieldsTab2.length, attempted: attemptedTabs[2] },
                { id: 3, stepNum: 3, label: "3. Customs & Certification", shortLabel: "3. Customs", total: totalFieldsTab3, missing: missingFieldsTab3.length, attempted: attemptedTabs[3] },
                { id: 4, stepNum: 4, label: "4. Review & Inspection", shortLabel: "4. Review", total: totalRequiredFields, missing: totalRequiredFields - totalCompletedFields, attempted: false },
              ] as const).map(tab => {
                const active = activeTab === tab.id;
                const isDone = tab.missing === 0;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as 1 | 2 | 3 | 4)}
                    className={`flex-1 py-3 px-2 text-center text-xs font-semibold border-b-2 transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${active
                      ? "border-[#81B71A] text-slate-900 bg-white font-bold shadow-2xs"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                      }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${active
                      ? "bg-[#103014] text-white"
                      : isDone
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-slate-200 text-slate-600"
                      }`}>
                      {isDone && !active ? "✓" : tab.stepNum}
                    </span>
                    <span className="hidden md:inline">{tab.label}</span>
                    <span className="md:hidden">{tab.shortLabel}</span>
                    {tab.attempted && !isDone && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Form Body with Generous Padding */}
            <div className="p-4 sm:p-5">

              {/* ── STEP 1: OWNER & FILING ── */}
              {activeTab === 1 && (
                <div className="space-y-4">
                  {/* Step 1 Compact Status Bar */}
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition ${missingFieldsTab1.length === 0
                    ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                    : attemptedTabs[1]
                      ? "bg-rose-50 border-rose-300 text-rose-900 shadow-2xs"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${missingFieldsTab1.length === 0 ? "bg-emerald-500" : attemptedTabs[1] ? "bg-rose-500 animate-pulse" : "bg-amber-500"
                        }`} />
                      <span className="font-semibold text-[11px] uppercase">
                        {missingFieldsTab1.length === 0
                          ? "Step 1: All required filing details completed"
                          : attemptedTabs[1]
                            ? `Action Needed: ${missingFieldsTab1.length} required field${missingFieldsTab1.length === 1 ? " is" : "s are"} missing`
                            : `Step 1: Filing & Owner Details (${totalFieldsTab1 - missingFieldsTab1.length}/${totalFieldsTab1} Completed)`}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 shadow-2xs shrink-0">
                      {totalFieldsTab1 - missingFieldsTab1.length}/{totalFieldsTab1} Done
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
                        {activeCategories.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  {/* ── Dynamic Custom Fields (from Service Type config) ── */}
                  {activeCustomFields.length > 0 && (
                    <div className="p-4 bg-violet-50/60 border border-violet-200 rounded-xl space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center gap-2 border-b border-violet-200/60 pb-2">
                        <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                        <span className="text-xs font-bold text-violet-900 uppercase tracking-wide">
                          Additional Field(s)
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeCustomFields.map(f => (
                          <Field
                            key={f.fieldKey}
                            label={f.label || f.fieldKey}
                            required={f.required}
                            optional={!f.required}
                            isFilled={Boolean(customFieldValues[f.fieldKey]?.trim())}
                            hasError={attemptedTabs[1] && f.required && !customFieldValues[f.fieldKey]?.trim()}
                            errorMessage={`${f.label || f.fieldKey} is required`}
                            fieldId={`custom-${f.fieldKey}`}
                          >
                            <input
                              id={`input-custom-${f.fieldKey}`}
                              type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                              value={customFieldValues[f.fieldKey] || ""}
                              onChange={e => setCustomFieldValues(prev => ({ ...prev, [f.fieldKey]: f.type === "text" ? e.target.value.toUpperCase() : e.target.value }))}
                              required={f.required}
                              placeholder={`Enter ${f.label || f.fieldKey}`}
                              className={INPUT + (f.type === "text" ? " uppercase" : "")}
                            />
                          </Field>
                        ))}
                      </div>
                    </div>
                  )}

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
                        placeholder={isSpecialOrCustomized ? "E.G. KX 1111-AD" : "E.G. 1092-ADXY"}
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
                        onChange={e => setOwnerName(e.target.value.toUpperCase())}
                        required
                        placeholder="ENTER OWNER OR CORPORATE NAME"
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
                          onChange={e => setAddress(e.target.value.toUpperCase())}
                          placeholder="STREET, TOWN / SUB-DISTRICT, REGION"
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
                        onChange={e => setPhone(e.target.value.toUpperCase())}
                        placeholder="E.G. 0241234567"
                        className={INPUT}
                      />
                    </Field>
                  </div>

                  {/* Transfer specific fields */}
                  {isTransfer && (
                    <div className="p-4 bg-gradient-to-r from-amber-50/40 via-slate-50 to-amber-50/20 border border-amber-200/90 rounded-xl space-y-3.5 shadow-2xs animate-in fade-in duration-150">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                            <span>Previous Title Owner &amp; Transfer Details</span>
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wider">
                            Required by Service
                          </span>
                        </div>
                      </div>

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
                                    onChange={e => setOldOwnerName(e.target.value.toUpperCase())}
                                    required={activeServiceDef?.prevOwnerRequireName !== false}
                                    placeholder="FULL LEGAL NAME OF PREVIOUS OWNER"
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
                                    onChange={e => setOldOwnerPhone(e.target.value.toUpperCase())}
                                    required={Boolean(activeServiceDef?.prevOwnerRequirePhone)}
                                    placeholder="E.G. 0241234567"
                                    className={INPUT}
                                  />
                                </Field>
                              )}

                              {needAddress && (
                                <div className={needPhone && needName && !needCustom ? "md:col-span-2" : ""}>
                                  <Field
                                    label="Previous Owner Address"
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
                                      onChange={e => setOldOwnerAddr(e.target.value.toUpperCase())}
                                      required={activeServiceDef?.prevOwnerRequireAddress !== false}
                                      placeholder="STREET, TOWN / SUB-DISTRICT, REGION"
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
                                      onChange={e => setOldOwnerCustom(e.target.value.toUpperCase())}
                                      required={Boolean(activeServiceDef?.prevOwnerRequireCustom)}
                                      placeholder={`ENTER ${customLabel.toUpperCase()}`}
                                      className={INPUT}
                                    />
                                  </Field>
                                </div>
                              )}
                            </div>

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

                  {/* ── Official Revenue Receipt & Payment Verification ── */}
                  <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        <span>Official Revenue Receipt Verification</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Bank / Treasury Payment Verification (Filing timestamp recorded automatically)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <Field
                        label="Revenue Receipt Number"
                        required
                        isFilled={Boolean(receiptNo.trim())}
                        hasError={attemptedTabs[1] && !receiptNo.trim()}
                        errorMessage="Revenue Receipt Number is required"
                        fieldId="receiptNo"
                        hint="Official receipt from bank / cash desk"
                      >
                        <input
                          id="input-receiptNo"
                          value={receiptNo}
                          onChange={e => setReceiptNo(e.target.value.toUpperCase())}
                          required
                          placeholder="E.G. 4702604819"
                          className={INPUT + " font-mono font-bold"}
                        />
                      </Field>

                      <Field
                        label="Receipt Payment Date"
                        required
                        isFilled={Boolean(receiptDate.trim())}
                        hasError={attemptedTabs[1] && !receiptDate.trim()}
                        errorMessage="Receipt Payment Date is required"
                        fieldId="receiptDate"
                        hint="Date on official receipt"
                      >
                        <input
                          id="input-receiptDate"
                          type="date"
                          value={receiptDate}
                          onChange={e => setReceiptDate(e.target.value)}
                          required
                          className={INPUT}
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={handleNextTab1}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>Next: Vehicle Details →</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 2: VEHICLE DETAILS (CORPORATE AUTO-FILL SEARCH + SPECS) ── */}
              {activeTab === 2 && (
                <div className="space-y-4">
                  {/* Step 2 Compact Status Bar */}
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition ${missingFieldsTab2.length === 0
                    ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                    : attemptedTabs[2]
                      ? "bg-rose-50 border-rose-300 text-rose-900 shadow-2xs"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${missingFieldsTab2.length === 0 ? "bg-emerald-500" : attemptedTabs[2] ? "bg-rose-500 animate-pulse" : "bg-amber-500"
                        }`} />
                      <span className="font-semibold text-[11px] uppercase">
                        {missingFieldsTab2.length === 0
                          ? "Step 2: All required vehicle specifications completed"
                          : attemptedTabs[2]
                            ? `Action Needed: ${missingFieldsTab2.length} required spec${missingFieldsTab2.length === 1 ? " is" : "s are"} missing`
                            : `Step 2: Vehicle Specifications (${totalFieldsTab2 - missingFieldsTab2.length}/${totalFieldsTab2} Completed)`}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 shadow-2xs shrink-0">
                      {totalFieldsTab2 - missingFieldsTab2.length}/{totalFieldsTab2} Done
                    </span>
                  </div>

                  {/* ══════════════════════════════════════════════════════════════
                      CORPORATE VEHICLE CATALOG SEARCH STATION
                  ══════════════════════════════════════════════════════════════ */}
                  <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Vehicle Catalog Search
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Search by make or model to auto-fill specifications.
                        </p>
                      </div>

                      {/* Year Selector */}
                      <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Year:</span>
                        <select
                          value={selectedCatalogYear}
                          onChange={(e) => {
                            const newYr = e.target.value;
                            setSelectedCatalogYear(newYr);
                            if (make && model) {
                              setYear(newYr);
                            }
                          }}
                          className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#81B71A] shadow-sm transition cursor-pointer"
                        >
                          {YEARS_LIST.map((yr) => (
                            <option key={yr} value={yr}>
                              {yr}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Search Bar with Autocomplete Dropdown */}
                    <div className="relative" ref={vehicleSearchDropdownRef}>
                      <div className="relative">
                        <input
                          type="text"
                          value={vehicleSearchQuery}
                          onChange={(e) => {
                            setVehicleSearchQuery(e.target.value.toUpperCase());
                            setIsVehicleDropdownOpen(true);
                          }}
                          onFocus={() => setIsVehicleDropdownOpen(true)}
                          placeholder="SEARCH VEHICLE CATALOG (E.G. COROLLA, CAMRY, HILUX, TUCSON...)"
                          className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#81B71A] rounded-lg text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#81B71A]/20 transition uppercase"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </span>
                        {vehicleSearchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setVehicleSearchQuery("");
                              setIsVehicleDropdownOpen(false);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 cursor-pointer font-bold"
                            title="Clear search"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Search Results Dropdown - only displays when typing */}
                      {isVehicleDropdownOpen && vehicleSearchQuery.trim().length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100">
                          {filteredCatalogVehicles.length === 0 ? (
                            <div className="p-4 space-y-2 text-center">
                              <p className="text-xs text-slate-600 uppercase">
                                No database match for &quot;{vehicleSearchQuery}&quot;.
                              </p>
                              <button
                                type="button"
                                onClick={handleUseUnlistedFromSearch}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 uppercase"
                              >
                                <span>Use &quot;{vehicleSearchQuery}&quot; &amp; Register specs</span>
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                                <span>Matching Models ({filteredCatalogVehicles.length})</span>
                              </div>
                              {filteredCatalogVehicles.slice(0, 30).map((v: any) => (
                                <button
                                  key={v.id || `${v.make}-${v.model}`}
                                  type="button"
                                  onClick={() => handleSelectVehicle(v)}
                                  className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 transition flex items-center justify-between gap-2 cursor-pointer group"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase shrink-0">
                                      {v.bodyType?.includes("Pickup") ? "Pickup" : v.bodyType?.includes("SUV") ? "SUV" : "Saloon"}
                                    </span>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-slate-900 group-hover:text-[#81B71A] truncate uppercase">
                                        {v.make} {v.model}
                                      </p>
                                      <p className="text-[10px] text-slate-500 truncate uppercase">
                                        {v.engineCC} CC &bull; {v.cylinders} CYLINDERS &bull; {v.fuelType}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-xs font-bold text-[#81B71A] group-hover:translate-x-0.5 transition-transform shrink-0">
                                    Select &rarr;
                                  </span>
                                </button>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Active Selected Vehicle Highlight Banner */}
                    {make.trim() && model.trim() && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                        <div>
                          <p className="text-xs font-bold text-slate-800 uppercase">
                            {make} {model} <span className="text-slate-500 font-mono">({year || selectedCatalogYear})</span>
                          </p>
                          <p className="text-[10px] text-slate-500 uppercase mt-0.5">
                            Engine: {engineCC} CC • {cylinders} Cylinders • {fuelType}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleResetVehicle}
                          className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
                        >
                          Clear Selection
                        </button>
                      </div>
                    )}

                    {/* Auto-filled notice */}
                    {autoFilledNotice && (
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-[11px] text-emerald-800 font-bold uppercase">
                        <span>{autoFilledNotice}</span>
                        <button
                          type="button"
                          onClick={() => setAutoFilledNotice(null)}
                          className="text-emerald-700 hover:text-emerald-950 font-bold cursor-pointer ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ── SECTION 1: VEHICLE IDENTITY (Make, Model, Year, Body Type, Fuel Type) ── */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        1. Vehicle Identity
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
                          onChange={e => setMake(e.target.value.toUpperCase())}
                          required
                          placeholder="E.G. TOYOTA"
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
                          onChange={e => setModel(e.target.value.toUpperCase())}
                          required
                          placeholder="E.G. CAMRY"
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
                          onChange={e => setYear(e.target.value.toUpperCase())}
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
                          {(dbBodyTypes.length > 0
                            ? dbBodyTypes.map(bt => (
                              <option key={bt.code} value={bt.name}>{bt.name.toUpperCase()}</option>
                            ))
                            : BODY_TYPES.map(bt => (
                              <option key={bt} value={bt}>{bt.toUpperCase()}</option>
                            ))
                          )}
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
                            <option key={f.id} value={f.id}>{f.label.toUpperCase()}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </div>

                  {/* ── SECTION 2: PHYSICAL SERIAL IDENTIFIERS (Chassis & Optional Engine No) ── */}
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
                            placeholder="E.G. JTEBU5JR8P2091837"
                            className={`${INPUT} font-mono font-bold text-sm tracking-wider uppercase ${make && model && !chassisNo
                              ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/20"
                              : ""
                              }`}
                          />
                          {make && model && !chassisNo && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                              ENTER VIN
                            </span>
                          )}
                        </div>
                      </Field>

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
                          placeholder="E.G. 1UR-894012 (OPTIONAL)"
                          className={`${INPUT} font-mono uppercase text-sm`}
                        />
                      </Field>
                    </div>
                  </div>

                  {/* ── SECTION 3: TECHNICAL ENGINE SPECS (CC & Cylinders Kept - Axles & Tyres Removed) ── */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        3. Engine Specifications
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field
                        label="Engine Displacement (CC)"
                        required
                        isFilled={Boolean(engineCC.trim())}
                        hasError={attemptedTabs[2] && !engineCC.trim()}
                        errorMessage="Engine Displacement is required"
                        fieldId="engineCC"
                        hint="Engine capacity in cubic centimeters"
                      >
                        <input
                          id="input-engineCC"
                          value={engineCC}
                          onChange={e => setEngineCC(e.target.value.toUpperCase())}
                          required
                          placeholder="2400"
                          className={INPUT + " font-mono font-bold text-sm"}
                        />
                      </Field>

                      <Field
                        label="Number of Cylinders"
                        required
                        isFilled={Boolean(cylinders.trim())}
                        fieldId="cylinders"
                        hint="Select engine configuration"
                      >
                        <select
                          id="input-cylinders"
                          value={cylinders}
                          onChange={e => setCylinders(e.target.value)}
                          className={INPUT + " font-mono font-bold text-sm"}
                        >
                          <option value="3">3 CYLINDERS</option>
                          <option value="4">4 CYLINDERS</option>
                          <option value="6">6 CYLINDERS</option>
                          <option value="8">8 CYLINDERS</option>
                          <option value="N/A">N/A (ELECTRIC / EV)</option>
                        </select>
                      </Field>
                    </div>
                  </div>

                  {/* Step 2 Bottom Navigation */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab(1)}
                      className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer w-full sm:w-auto"
                    >
                      ← Back to Owner Details
                    </button>
                    <button
                      type="button"
                      onClick={handleNextTab2}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer flex items-center gap-1.5 w-full sm:w-auto justify-center"
                    >
                      <span>Next: Customs &amp; Certification →</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: CUSTOMS & CERTIFICATION (Directly after Vehicle Details) ── */}
              {activeTab === 3 && (
                <div className="space-y-4">
                  {/* Step 3 Compact Status Bar */}
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition ${missingFieldsTab3.length === 0
                    ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                    : attemptedTabs[3]
                      ? "bg-rose-50 border-rose-300 text-rose-900 shadow-2xs"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${missingFieldsTab3.length === 0 ? "bg-emerald-500" : attemptedTabs[3] ? "bg-rose-500 animate-pulse" : "bg-amber-500"
                        }`} />
                      <span className="font-semibold text-[11px] uppercase">
                        {missingFieldsTab3.length === 0
                          ? "Step 3: Customs clearance & certifying officer verified"
                          : attemptedTabs[3]
                            ? `Action Needed: ${missingFieldsTab3.length} required field${missingFieldsTab3.length === 1 ? " is" : "s are"} missing`
                            : `Step 3: Customs & Certification (${totalFieldsTab3 - missingFieldsTab3.length}/${totalFieldsTab3} Completed)`}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 shadow-2xs shrink-0">
                      {totalFieldsTab3 - missingFieldsTab3.length}/{totalFieldsTab3} Done
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {requiresCustomsStep && (
                      <>
                        <Field
                          label="Customs Declaration Number"
                          required
                          isFilled={Boolean(customsNo.trim())}
                          hasError={attemptedTabs[3] && !customsNo.trim()}
                          errorMessage="Customs Declaration Number is required"
                          fieldId="customsNo"
                        >
                          <input
                            id="input-customsNo"
                            value={customsNo}
                            onChange={e => setCustomsNo(e.target.value.toUpperCase())}
                            required
                            placeholder="E.G. 4708912/26"
                            className={INPUT + " font-mono font-bold"}
                          />
                        </Field>

                        <Field
                          label="Customs Clearance Date"
                          required
                          isFilled={Boolean(customsDate.trim())}
                          hasError={attemptedTabs[3] && !customsDate.trim()}
                          errorMessage="Customs Clearance Date is required"
                          fieldId="customsDate"
                          hint="Clearance stamp date"
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
                      </>
                    )}
                    {!requiresCustomsStep && (
                      <div className="col-span-2 p-3 rounded-lg bg-sky-50 border border-sky-200 text-xs text-sky-800 font-semibold flex items-center gap-2">
                        <span>ℹ️</span>
                        <span>Customs documentation is not required for <strong>{activeServiceDef?.name || bookingType}</strong>. Customs fields are skipped for this service type.</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3.5">
                    <Field
                      label="Approving Officer"
                      required
                      isFilled={Boolean(supervisor.trim())}
                      hasError={attemptedTabs[3] && !supervisor.trim()}
                      errorMessage="Approving Officer must be selected"
                      fieldId="supervisor"
                      hint="Select certified approving officer from database"
                    >
                      <div className="flex gap-2">
                        <select
                          id="input-supervisor"
                          value={supervisor}
                          onChange={e => {
                            const val = e.target.value;
                            setSupervisor(val);
                            const sObj = dbSupervisors.find(s => s.name === val);
                            setSelectedSupervisorId(sObj ? sObj.id : "");
                          }}
                          required
                          className={`${INPUT} flex-1`}
                        >
                          <option value="">-- SELECT APPROVING OFFICER --</option>
                          {dbSupervisors
                            .filter(s => s.isActive !== false)
                            .map(s => {
                              const branchDisplay = s.station || s.branch?.name || "DVLA HQ";
                              return (
                                <option key={s.id} value={s.name}>
                                  {s.name} — {branchDisplay}
                                </option>
                              );
                            })}
                        </select>
                        <button
                          type="button"
                          onClick={() => setIsQuickAddSupervisorOpen(true)}
                          className="px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg whitespace-nowrap transition cursor-pointer flex items-center gap-1.5"
                          title="Register a new certified approving officer to database"
                        >
                          <span>+ Add</span>
                        </button>
                      </div>
                    </Field>
                  </div>

                  {/* Summary Verification Card */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 uppercase">
                    <span className="text-xs font-bold text-slate-800 tracking-wider block">
                      Summary Verification
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">PLATE:</span>
                        <span className="font-bold text-slate-900 font-mono">{regNo || "PENDING"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">OWNER:</span>
                        <span className="font-semibold text-slate-900 truncate block">{ownerName || "PENDING"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">RECEIPT NO:</span>
                        <span className="font-mono text-slate-900 truncate block">{receiptNo || "PENDING"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">VEHICLE:</span>
                        <span className="font-semibold text-slate-900 truncate block">{make || "—"} {model}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">VIN:</span>
                        <span className="font-mono text-slate-900 truncate block">{chassisNo || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">CUSTOMS:</span>
                        <span className="font-mono text-slate-900 truncate block">{customsNo || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Custom Fields Summary (if any filled) */}
                  {activeCustomFields.length > 0 && (
                    <div className="p-3 rounded-lg bg-violet-50 border border-violet-200 space-y-1.5">
                      <span className="text-[10px] font-bold text-violet-800 uppercase block">Service-Specific Fields</span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        {activeCustomFields.map(f => (
                          <div key={f.fieldKey}>
                            <span className="text-violet-500 block text-[10px]">{f.label.toUpperCase()}:</span>
                            <span className="font-mono text-slate-900 truncate block">{customFieldValues[f.fieldKey] || "—"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab(2)}
                      className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer w-full sm:w-auto"
                    >
                      ← Back to Vehicle Details
                    </button>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={handleNextTab3}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-black uppercase shadow-2xs transition cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto"
                      >
                        <span>Review &amp; Inspect Plate →</span>
                      </button>
                      <button
                        type="submit"
                        className={`hidden lg:flex px-5 py-2.5 rounded-lg text-xs font-black uppercase transition shadow-2xs cursor-pointer items-center justify-center gap-1.5 ${overallCompletionPercent === 100
                          ? "bg-[#103014] hover:bg-[#18481e] text-white"
                          : "bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30"
                          }`}
                      >
                        <span>Certify &amp; Submit</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 4: PLATE INSPECTION & FINAL REVIEW (Dedicated Mobile Review & Full Desk Inspection) ── */}
              {activeTab === 4 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Review Header Banner */}
                  <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase block">
                        Ghana Official Registry &bull; Logbook Verification
                      </span>
                      <h3 className="text-sm font-black uppercase tracking-wide">
                        Plate Inspection &amp; Final Review
                      </h3>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${overallCompletionPercent === 100
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      }`}>
                      {totalCompletedFields}/{totalRequiredFields} Ready ({overallCompletionPercent}%)
                    </span>
                  </div>

                  {/* Ghana Digital Plate Visualizer Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center space-y-3 shadow-2xs">
                    <div className="w-full flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                      <span className="font-bold text-slate-800 uppercase tracking-wide">
                        Official Ghana Digital Plate
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-white border border-slate-200 text-slate-700">
                        {activeCategories.find(c => c.id === classification)?.badge || "⚪ Private"}
                      </span>
                    </div>

                    <div className="w-full max-w-[340px] py-1">
                      <DigitalPlate
                        plateNumber={regNo || "PENDING"}
                        category={classification as PlateCategory}
                        region="GREATER ACCRA"
                        slogan="GREATER ACCRA"
                        vin={chassisNo || "PENDING"}
                        make={make || "VEHICLE"}
                      />
                    </div>

                    {/* Quick Category Preview / Switch Buttons */}
                    <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-slate-200 flex-wrap w-full">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold w-full text-center">Plate Category:</span>
                      {activeCategories.map(cat => {
                        const active = classification === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setClassification(cat.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${active
                              ? "bg-slate-900 text-white font-bold shadow-xs"
                              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                          >
                            {cat.badge}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Full Logbook Filing Summary Verification Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs uppercase">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-800 tracking-wider">
                        Logbook Record Verification
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Act 683 Compliant
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-slate-900">
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-slate-600 font-semibold block text-[10px]">PLATE NUMBER:</span>
                        <span className="font-bold text-slate-950 font-mono text-sm">{regNo || "PENDING"}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-slate-600 font-semibold block text-[10px]">REGISTERED OWNER:</span>
                        <span className="font-bold text-slate-950 truncate block">{ownerName || "PENDING"}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-slate-600 font-semibold block text-[10px]">REVENUE RECEIPT #:</span>
                        <span className="font-mono font-bold text-slate-950 truncate block">{receiptNo || "PENDING"}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-slate-600 font-semibold block text-[10px]">VEHICLE:</span>
                        <span className="font-bold text-slate-950 truncate block">{make || "—"} {model} {year && `(${year})`}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-slate-600 font-semibold block text-[10px]">ENGINE / SPECS:</span>
                        <span className="font-bold text-slate-950 truncate block">{engineCC ? `${engineCC} CC` : "—"} • {cylinders || "—"} CYL</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-slate-600 font-semibold block text-[10px]">CHASSIS / VIN:</span>
                        <span className="font-mono font-bold text-slate-950 truncate block">{chassisNo || "—"}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-slate-600 font-semibold block text-[10px]">CUSTOMS REF:</span>
                        <span className="font-mono font-bold text-slate-950 truncate block">{customsNo || "—"}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 col-span-2 sm:col-span-2">
                        <span className="text-slate-600 font-semibold block text-[10px]">SUPERVISING OFFICER:</span>
                        <span className="font-bold text-slate-950 truncate block">{supervisor || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Submit & Edit Navigation Buttons */}
                  <div className="pt-2 space-y-2.5">
                    <button
                      type="submit"
                      className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md cursor-pointer flex items-center justify-center gap-2 ${overallCompletionPercent === 100
                        ? "bg-[#103014] hover:bg-[#18481e] text-white ring-2 ring-emerald-400/50"
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
                          <span>Certify &amp; Submit ({totalRequiredFields - totalCompletedFields} Missing Entries)</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveTab(3)}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                      >
                        ← Edit Customs &amp; Certification
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab(1)}
                        className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        Edit From Beginning
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ── Right Column (1/3): Plate Inspection & Requirements Checklist (Desktop Only: Hidden on Mobile) ── */}
          <div className="hidden lg:block bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden lg:sticky lg:top-20 space-y-3.5 p-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase">
                Plate Inspection
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                {activeCategories.find(c => c.id === classification)?.badge || "⚪ Private"}
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
              {activeCategories.map(cat => {
                const active = classification === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setClassification(cat.id)}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition cursor-pointer ${active
                      ? "bg-slate-900 text-white font-bold"
                      : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                  >
                    {cat.badge}
                  </button>
                );
              })}
            </div>

            {/* ── Live Interactive Filing Checklist (3 Steps) ── */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${overallCompletionPercent === 100 ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                  <span className="text-xs font-bold text-slate-800 uppercase">
                    Filing Requirements
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${overallCompletionPercent === 100
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : "bg-amber-100 text-amber-800 border-amber-300"
                  }`}>
                  {totalCompletedFields}/{totalRequiredFields} Complete
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${overallCompletionPercent === 100
                    ? "bg-emerald-600"
                    : overallCompletionPercent >= 50
                      ? "bg-amber-500"
                      : "bg-rose-500"
                    }`}
                  style={{ width: `${overallCompletionPercent}%` }}
                />
              </div>

              {/* Checklist Items: Grouped by 3 Steps */}
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
                      Step 1
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
                    <ChecklistItem
                      label="Revenue Receipt #"
                      value={receiptNo}
                      isDone={Boolean(receiptNo.trim())}
                      onClick={() => focusField("input-receiptNo", 1)}
                    />
                    <ChecklistItem
                      label="Payment Date"
                      value={receiptDate}
                      isDone={Boolean(receiptDate.trim())}
                      onClick={() => focusField("input-receiptDate", 1)}
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

                {/* Step 2 Items (Kept CC & Cylinders) */}
                <div className="space-y-1 pt-1 border-t border-slate-200/60">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>2. Vehicle Details</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab(2)}
                      className="text-emerald-700 hover:underline cursor-pointer"
                    >
                      Step 2
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
                      value={engineCC ? `${engineCC} CC` : ""}
                      isDone={Boolean(engineCC.trim())}
                      onClick={() => focusField("input-engineCC", 2)}
                    />
                    <ChecklistItem
                      label="Cylinders"
                      value={cylinders ? `${cylinders} CYL` : ""}
                      isDone={Boolean(cylinders.trim())}
                      onClick={() => focusField("input-cylinders", 2)}
                    />
                  </div>
                </div>

                {/* Step 3 Items */}
                <div className="space-y-1 pt-1 border-t border-slate-200/60">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>3. Customs &amp; Certification</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab(3)}
                      className="text-emerald-700 hover:underline cursor-pointer"
                    >
                      Step 3
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    <ChecklistItem
                      label="Customs Declaration"
                      value={customsNo}
                      isDone={Boolean(customsNo.trim())}
                      onClick={() => focusField("input-customsNo", 3)}
                    />
                    <ChecklistItem
                      label="Clearance Date"
                      value={customsDate}
                      isDone={Boolean(customsDate.trim())}
                      onClick={() => focusField("input-customsDate", 3)}
                    />
                    <ChecklistItem
                      label="Supervising Officer"
                      value={supervisor}
                      isDone={Boolean(supervisor.trim())}
                      onClick={() => focusField("input-supervisor", 3)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop-only secondary submit shortcut (Hidden on mobile to eliminate clumped double-button!) */}
            <button
              type="submit"
              className={`hidden lg:flex w-full py-2.5 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer mt-2 items-center justify-center gap-1.5 uppercase ${overallCompletionPercent === 100
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
                  <span>Submit ({totalRequiredFields - totalCompletedFields} Left)</span>
                </>
              )}
            </button>
          </div>

        </form>
      )}

      {/* ── 4. Mobile Dedicated Sticky Bottom Navigation Bar ── */}
      {!isSuccess && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
          <div className="max-w-md mx-auto flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-extrabold text-slate-900 uppercase">
                {activeTab === 1 && "Step 1 of 4: Owner & Filing"}
                {activeTab === 2 && "Step 2 of 4: Vehicle Specs"}
                {activeTab === 3 && "Step 3 of 4: Customs & Officer"}
                {activeTab === 4 && "Step 4 of 4: Plate & Review"}
              </p>
              <p className="text-[10px] font-semibold text-emerald-700">
                {totalCompletedFields}/{totalRequiredFields} Required Fields Done ({overallCompletionPercent}%)
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeTab > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveTab((activeTab - 1) as 1 | 2 | 3)}
                  className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  ← Back
                </button>
              )}

              {activeTab === 1 && (
                <button
                  type="button"
                  onClick={handleNextTab1}
                  className="px-3.5 py-2 text-xs font-extrabold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition cursor-pointer"
                >
                  Next: Vehicle →
                </button>
              )}

              {activeTab === 2 && (
                <button
                  type="button"
                  onClick={handleNextTab2}
                  className="px-3.5 py-2 text-xs font-extrabold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition cursor-pointer"
                >
                  Next: Customs →
                </button>
              )}

              {activeTab === 3 && (
                <button
                  type="button"
                  onClick={handleNextTab3}
                  className="px-3.5 py-2 text-xs font-black uppercase text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition cursor-pointer"
                >
                  Review Plate →
                </button>
              )}

              {activeTab === 4 && (
                <button
                  type="button"
                  onClick={(e) => {
                    const form = document.querySelector("form");
                    if (form) form.requestSubmit();
                  }}
                  className={`px-3.5 py-2 text-xs font-black uppercase rounded-lg shadow-sm transition cursor-pointer ${overallCompletionPercent === 100
                    ? "bg-[#103014] text-white ring-1 ring-emerald-400"
                    : "bg-slate-900 text-amber-300 border border-amber-500/40"
                    }`}
                >
                  Certify &amp; Submit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Add Supervisor Modal ── */}
      {isQuickAddSupervisorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 uppercase">
                  Register Certified Supervisor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickAddSupervisorOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newSupervisorName.trim()) return;
                setIsSavingSupervisor(true);
                try {
                  const res = await fetch("/api/supervisors", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: newSupervisorName.trim().toUpperCase(),
                      station: newSupervisorStation.trim().toUpperCase() || (sessionUser?.branch?.name ? String(sessionUser.branch.name).toUpperCase() : "DVLA ADENTA"),
                      branchId: sessionUser?.branchId || sessionUser?.branch?.id || undefined,
                    }),
                  });
                  if (res.ok) {
                    const created = await res.json();
                    await loadSupervisors();
                    setSupervisor(created.name);
                    setSelectedSupervisorId(created.id);
                    setIsQuickAddSupervisorOpen(false);
                    setNewSupervisorName("");
                    setNewSupervisorStation("");
                  } else {
                    const err = await res.json();
                    alert(err.error || "Failed to register supervisor");
                  }
                } catch (err) {
                  console.error("Error creating supervisor:", err);
                  alert("Failed to save supervisor to database");
                } finally {
                  setIsSavingSupervisor(false);
                }
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Full Legal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSupervisorName}
                  onChange={e => setNewSupervisorName(e.target.value.toUpperCase())}
                  placeholder="E.G. KWAME MENSAH"
                  className={INPUT}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Station / Branch
                </label>
                <input
                  type="text"
                  value={newSupervisorStation}
                  onChange={e => setNewSupervisorStation(e.target.value.toUpperCase())}
                  placeholder="E.G. DVLA ADENTA"
                  className={INPUT}
                />
              </div>

              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800">
                <span className="font-bold">🛡️ Auto-Assigned Badge:</span> A unique certified supervisor badge (e.g. SUP-XXXX) will be automatically assigned upon creation.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuickAddSupervisorOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSupervisor || !newSupervisorName.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {isSavingSupervisor ? "Registering..." : "Save Supervisor"}
                </button>
              </div>
            </form>
          </div>
        </div>
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