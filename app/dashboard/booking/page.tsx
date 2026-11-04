"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  getStoredReservations,
  checkPlateReservation,
  saveStoredReservations,
  Reservation,
} from "../../../components/reservationsData";
import { DigitalPlate, PlateCategory } from "@/components/DigitalPlate";
import { TabAutocompleteInput } from "@/components/TabAutocompleteInput";
import {
  VehicleModel,
  VEHICLE_CATALOG,
  YEARS_LIST,
} from "@/lib/vehicleCatalog";

/* ─── Baseline Plate Categories (Private, Commercial, Motorcycle, Government, EV, Trailer, TMP, Agri, Diplomatic) ─── */

const DEFAULT_CLASSIFICATIONS = [
  { id: "PRIVATE", label: "Private (White Plate)", badge: "⚪ Private" },
  {
    id: "COMMERCIAL",
    label: "Commercial (Yellow Plate)",
    badge: "🟡 Commercial",
  },
  {
    id: "MOTORCYCLE",
    label: "Motorcycle (Light Blue Plate)",
    badge: "🔵 Motorcycle",
  },
  {
    id: "GOVERNMENT",
    label: "Government (GV Split Plate)",
    badge: "🏛️ GV Split",
  },
  {
    id: "ELECTRIC",
    label: "Electric Vehicle (EV Green Plate)",
    badge: "🟢 EV Green",
  },
  { id: "TRAILER", label: "Trailer (Yellow T Plate)", badge: "🟡 Trailer" },
  {
    id: "TEMPORARY",
    label: "Temporary (TMP Sticker Plate)",
    badge: "🔷 TMP Sticker",
  },
  {
    id: "AGRICULTURAL",
    label: "Agricultural (Farm Machinery)",
    badge: "🚜 Agricultural",
  },
  {
    id: "DIPLOMATIC",
    label: "Diplomatic Corps (CD Plate)",
    badge: "🔴 Diplomatic",
  },
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

/* Shared form presentation; booking rules remain in BookingDeskContent. */
const INPUT =
  "h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 uppercase outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 disabled:bg-slate-50 disabled:text-slate-400";

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
  hasError = false,
  errorMessage,
  hint,
  optional = false,
  fieldId,
}: FieldProps) {
  return (
    <div
      className="min-w-0 space-y-1"
      id={fieldId ? `field-container-${fieldId}` : undefined}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-1">
        <label
          htmlFor={fieldId ? `input-${fieldId}` : undefined}
          className="flex items-center gap-1 text-[11px] font-bold text-slate-700 uppercase tracking-wider"
        >
          <span>{label}</span>
          {required && (
            <span className="text-rose-500 font-bold" aria-label="required">
              *
            </span>
          )}
        </label>
        {optional && (
          <span className="text-[10px] font-normal text-slate-400 lowercase">
            (optional)
          </span>
        )}
      </div>
      <div className={hasError ? "rounded-lg ring-1 ring-rose-400" : undefined}>
        {children}
      </div>
      {hasError ? (
        <p role="alert" className="text-[11px] font-medium text-rose-600">
          {errorMessage || `${label} is required`}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-slate-400 leading-normal">{hint}</p>
      ) : null}
    </div>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-3 space-y-0.5 border-b border-slate-100 pb-1.5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
        {title}
      </h3>
      {description && (
        <p className="text-[11px] text-slate-500">{description}</p>
      )}
    </div>
  );
}

function ReviewSection({
  title,
  onEdit,
  rows,
}: {
  title: string;
  onEdit: () => void;
  rows: Array<[string, string | undefined]>;
}) {
  return (
    <section className="border-t border-slate-100 pt-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          {title}
        </h3>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${title}`}
          className="h-7 rounded-md px-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition cursor-pointer"
        >
          Edit →
        </button>
      </div>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="min-w-0 bg-slate-50/50 rounded-lg p-2 border border-slate-100">
            <dt className="text-[10px] font-semibold uppercase text-slate-400">{label}</dt>
            <dd className="mt-0.5 break-words text-xs font-bold text-slate-900">
              {value || "—"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function StepHeading({
  title,
  description,
  missing,
  attempted,
}: {
  title: string;
  description: string;
  missing: number;
  attempted: boolean;
}) {
  return (
    <div className="space-y-1.5 pb-2 border-b border-slate-100">
      <div>
        <h2 className="text-base font-bold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="text-xs text-slate-500">
          {description}
        </p>
      </div>
      {attempted && missing > 0 && (
        <p
          role="alert"
          className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-800"
        >
          Complete {missing} required {missing === 1 ? "field" : "fields"} to continue.
        </p>
      )}
    </div>
  );
}

/* ── Flexible Date Parser & Formatter for Typing & Calendar Selection ── */
function parseFlexibleDate(
  input: string,
): { iso: string; readable: string } | null {
  if (!input) return null;
  const raw = input.trim();
  if (!raw) return null;

  // Strict check: only parse when a complete 8-digit date is provided
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 8) {
    return null;
  }

  let y: number | null = null;
  let m: number | null = null;
  let d: number | null = null;

  // 1. Ghana / British standard: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmy = raw.match(/^(\d{2})[-/.](\d{2})[-/.](\d{4})$/);
  if (dmy) {
    d = parseInt(dmy[1], 10);
    m = parseInt(dmy[2], 10);
    y = parseInt(dmy[3], 10);
  }

  // 2. ISO standard: YYYY-MM-DD or YYYY/MM/DD
  if (!y) {
    const ymd = raw.match(/^(\d{4})[-/.](\d{2})[-/.](\d{2})$/);
    if (ymd) {
      y = parseInt(ymd[1], 10);
      m = parseInt(ymd[2], 10);
      d = parseInt(ymd[3], 10);
    }
  }

  // 3. Fallback: Pure 8 digits DDMMYYYY
  if (!y && !raw.includes("-")) {
    d = parseInt(digits.slice(0, 2), 10);
    m = parseInt(digits.slice(2, 4), 10);
    y = parseInt(digits.slice(4, 8), 10);
  }

  if (y && m && d) {
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1970 && y <= 2050) {
      const testDate = new Date(y, m - 1, d);
      if (
        testDate.getFullYear() === y &&
        testDate.getMonth() === m - 1 &&
        testDate.getDate() === d
      ) {
        const iso = `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const readable = testDate.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        return { iso, readable };
      }
    }
  }

  return null;
}

/* ── Helper: Format YYYY-MM-DD to DD/MM/YYYY for UI display ── */
function isoToDmy(str: string): string {
  if (!str) return "";
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  return str;
}

/* ── Live As-You-Type Date Auto-Formatting Mask (One by One) ── */
function applyDateMask(input: string, prev: string): string {
  // 1. If deleting (backspace/cut)
  if (input.length < prev.length) {
    if (input.endsWith("/")) {
      return input.slice(0, -1);
    }
    return input;
  }

  // 2. If user explicitly typed a slash after a 1-digit day e.g. "5/" -> auto-pad to "05/"
  if (input.endsWith("/") && /^\d{1}\/$/.test(input)) {
    return `0${input}`;
  }

  // 3. If user explicitly typed a slash after a 1-digit month e.g. "22/9/" -> auto-pad to "22/09/"
  if (input.endsWith("/") && /^\d{2}\/\d{1}\/$/.test(input)) {
    const parts = input.split("/");
    return `${parts[0]}/0${parts[1]}/`;
  }

  // 4. Extract pure digits only (maximum 8 digits: DDMMYYYY)
  const digits = input.replace(/\D/g, "").slice(0, 8);
  if (!digits) return "";

  // 5. If user is explicitly typing ISO format with dash (e.g. 2026-09-22)
  if (
    input.includes("-") &&
    (digits.startsWith("20") || digits.startsWith("19"))
  ) {
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }

  // 6. Standard Ghana DD/MM/YYYY formatting one by one
  if (digits.length === 1) {
    return digits;
  }
  if (digits.length === 2) {
    return `${digits}/`;
  }
  if (digits.length === 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  if (digits.length === 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}/`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

interface FlexibleDateInputProps {
  id: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

function FlexibleDateInput({
  id,
  value,
  onChange,
  required = false,
  placeholder = "DD / MM / YYYY (e.g. 22092026)",
  className = "",
}: FlexibleDateInputProps) {
  const [typedText, setTypedText] = useState(() => isoToDmy(value || ""));
  const pickerRef = useRef<HTMLInputElement>(null);
  const isTypingRef = useRef(false);

  // Sync external changes (such as Quick Date Today / Yesterday buttons, reset, or draft restore)
  useEffect(() => {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      return;
    }
    if (value) {
      setTypedText(isoToDmy(value));
    } else {
      setTypedText("");
    }
  }, [value]);

  const parsedInfo = parseFlexibleDate(typedText);

  function handleTextChange(rawVal: string) {
    isTypingRef.current = true;
    const formatted = applyDateMask(rawVal, typedText);
    setTypedText(formatted);

    // Only update parent state if full valid date is recognized, or if cleared
    const parsed = parseFlexibleDate(formatted);
    if (parsed) {
      onChange(parsed.iso);
    } else if (!formatted.trim()) {
      onChange("");
    }
  }

  function handleBlur() {
    isTypingRef.current = false;
    if (parsedInfo) {
      const parts = parsedInfo.iso.split("-");
      if (parts.length === 3) {
        setTypedText(`${parts[2]}/${parts[1]}/${parts[0]}`);
      }
      onChange(parsedInfo.iso);
    }
  }

  function openCalendar() {
    if (pickerRef.current) {
      try {
        if (typeof pickerRef.current.showPicker === "function") {
          pickerRef.current.showPicker();
        } else {
          pickerRef.current.focus();
        }
      } catch {
        pickerRef.current.focus();
      }
    }
  }

  function handlePickerChange(e: React.ChangeEvent<HTMLInputElement>) {
    isTypingRef.current = false;
    const val = e.target.value;
    if (val) {
      setTypedText(isoToDmy(val));
      onChange(val);
    }
  }

  return (
    <div className="space-y-1">
      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          value={typedText}
          onChange={(e) => handleTextChange(e.target.value)}
          onBlur={handleBlur}
          required={required}
          placeholder={placeholder}
          className={`${INPUT} font-mono font-bold pr-28 ${className}`}
        />

        {/* Hidden native date input for optional calendar picker */}
        <input
          ref={pickerRef}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          value={parsedInfo ? parsedInfo.iso : ""}
          onChange={handlePickerChange}
          className="sr-only"
        />

        {/* Action buttons embedded on right of input */}
        <div className="absolute right-1.5 flex items-center gap-1">
          {typedText && (
            <button
              type="button"
              onClick={() => {
                isTypingRef.current = false;
                setTypedText("");
                onChange("");
              }}
              aria-label="Clear date"
              title="Clear date"
              className="p-1 text-slate-400 hover:text-slate-600 rounded transition cursor-pointer text-xs"
            >
              ✕
            </button>
          )}

          <button
            type="button"
            onClick={openCalendar}
            aria-label="Open calendar"
            title="Open calendar picker (optional)"
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded border border-slate-200 text-[11px] font-semibold transition cursor-pointer shadow-2xs"
          >
            <svg
              aria-hidden="true"
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 11h18" />
            </svg>
            <span className="hidden sm:inline text-[11px] font-bold">Calendar</span>
          </button>
        </div>
      </div>

      {/* Helpful real-time date feedback */}
      <div className="flex items-center justify-between text-[11px] px-0.5 text-slate-500">
        {parsedInfo ? (
          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>{parsedInfo.readable}</span>
          </span>
        ) : typedText.trim() ? (
          <span className="text-amber-600 font-medium">
            Enter a complete date, e.g. 22/09/2026
          </span>
        ) : (
          <span className="text-slate-400">
            DD/MM/YYYY · calendar available
          </span>
        )}
      </div>
    </div>
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
  const [alreadyBookedError, setAlreadyBookedError] = useState<string | null>(
    null,
  );

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

  /* Regular / Statutory Plate Number for Customized Number Service */
  const [regularPlateNo, setRegularPlateNo] = useState("");

  const [ownerName, setOwnerName] = useState(() => {
    return isPrefill && searchParams
      ? (searchParams.get("holder") || "").toUpperCase()
      : "";
  });

  const [address, setAddress] = useState(() => {
    return isPrefill && searchParams
      ? (searchParams.get("address") || "").toUpperCase()
      : "";
  });

  const [phone, setPhone] = useState(() => {
    return isPrefill && searchParams
      ? (searchParams.get("phone") || "").toUpperCase()
      : "";
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

  /* ── Mobile Usability: Voice Dictation & Draft Auto-Save ── */
  const [activeVoiceField, setActiveVoiceField] = useState<string | null>(null);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);

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
      return (
        full.includes(q) ||
        m.includes(q) ||
        mdl.includes(q) ||
        body.includes(q) ||
        category.includes(q)
      );
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
      `Specifications auto-filled for ${v.make.toUpperCase()} ${v.model.toUpperCase()} (${yr}).`,
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
      `Vehicle initialized: "${newMake.toUpperCase()} ${newModel.toUpperCase()}".`,
    );
  }

  /* ── Official Revenue Receipt & Date (Step 1) ── */
  const [receiptNo, setReceiptNo] = useState("");
  const [receiptDate, setReceiptDate] = useState("");

  /* ── Customs & Certification (Step 3) ── */
  const [customsNo, setCustomsNo] = useState("");
  const [customsDate, setCustomsDate] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");

  /* ── Submission UI State ── */
  const [isSuccess, setIsSuccess] = useState(false);

  /* ── Local Draft Auto-Save (Phone Reload & Call Protection) ── */
  const DRAFT_STORAGE_KEY = "dvla_vpms_booking_draft_v1";

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          if (!isPrefill && !ownerName && !regNo && parsed.ownerName) {
            if (parsed.bookingType) setBookingType(parsed.bookingType);
            if (parsed.classification) setClassification(parsed.classification);
            if (parsed.regNo) setRegNo(parsed.regNo);
            if (parsed.regularPlateNo) setRegularPlateNo(parsed.regularPlateNo);
            if (parsed.ownerName) setOwnerName(parsed.ownerName);
            if (parsed.address) setAddress(parsed.address);
            if (parsed.phone) setPhone(parsed.phone);
            if (parsed.receiptNo) setReceiptNo(parsed.receiptNo);
            if (parsed.receiptDate) setReceiptDate(parsed.receiptDate);
            if (parsed.make) setMake(parsed.make);
            if (parsed.model) setModel(parsed.model);
            if (parsed.year) setYear(parsed.year);
            if (parsed.bodyType) setBodyType(parsed.bodyType);
            if (parsed.fuelType) setFuelType(parsed.fuelType);
            if (parsed.chassisNo) setChassisNo(parsed.chassisNo);
            if (parsed.engineNo) setEngineNo(parsed.engineNo);
            if (parsed.engineCC) setEngineCC(parsed.engineCC);
            if (parsed.cylinders) setCylinders(parsed.cylinders);
            if (parsed.customsNo) setCustomsNo(parsed.customsNo);
            if (parsed.customsDate) setCustomsDate(parsed.customsDate);
            if (parsed.supervisor) setSupervisor(parsed.supervisor);
            if (parsed.oldOwnerName) setOldOwnerName(parsed.oldOwnerName);
            if (parsed.oldOwnerPhone) setOldOwnerPhone(parsed.oldOwnerPhone);
            if (parsed.oldOwnerAddr) setOldOwnerAddr(parsed.oldOwnerAddr);
            if (parsed.oldOwnerCustom) setOldOwnerCustom(parsed.oldOwnerCustom);
            if (parsed.customFieldValues && typeof parsed.customFieldValues === "object") {
              setCustomFieldValues(parsed.customFieldValues);
            }
            setDraftNotice(
              "Restored unsaved booking draft from previous phone session.",
            );
          }
        }
      }
    } catch (e) {
      console.error("Draft restore error:", e);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || isSuccess) return;
    if (ownerName || regNo || chassisNo || receiptNo || make) {
      const timer = setTimeout(() => {
        try {
          localStorage.setItem(
            DRAFT_STORAGE_KEY,
            JSON.stringify({
              bookingType,
              classification,
              regNo,
              regularPlateNo,
              ownerName,
              address,
              phone,
              receiptNo,
              receiptDate,
              make,
              model,
              year,
              bodyType,
              fuelType,
              chassisNo,
              engineNo,
              engineCC,
              cylinders,
              customsNo,
              customsDate,
              supervisor,
              oldOwnerName,
              oldOwnerPhone,
              oldOwnerAddr,
              oldOwnerCustom,
              customFieldValues,
              savedAt: new Date().toISOString(),
            }),
          );
        } catch (e) {
          console.error("Failed to auto-save draft:", e);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [
    bookingType,
    classification,
    regNo,
    ownerName,
    address,
    phone,
    receiptNo,
    receiptDate,
    make,
    model,
    year,
    bodyType,
    fuelType,
    chassisNo,
    engineNo,
    engineCC,
    cylinders,
    customsNo,
    customsDate,
    supervisor,
    oldOwnerName,
    oldOwnerPhone,
    oldOwnerAddr,
    oldOwnerCustom,
    isSuccess,
  ]);

  function handleDiscardDraft() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
    setDraftNotice(null);
    handleReset();
  }

  function startVoiceDictation(
    fieldName: "ownerName" | "address" | "oldOwnerName" | "oldOwnerAddr",
  ) {
    if (typeof window === "undefined") return;
    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert(
        "Voice recognition is not supported in this browser. Please use your phone keyboard microphone.",
      );
      return;
    }
    try {
      const recognition = new SpeechRec();
      recognition.lang = "en-GH";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      setActiveVoiceField(fieldName);

      recognition.onresult = (e: any) => {
        const text = e.results?.[0]?.[0]?.transcript || "";
        if (text) {
          const clean = text.trim().toUpperCase();
          if (fieldName === "ownerName")
            setOwnerName((prev) => (prev ? `${prev} ${clean}` : clean));
          if (fieldName === "address")
            setAddress((prev) => (prev ? `${prev} ${clean}` : clean));
          if (fieldName === "oldOwnerName")
            setOldOwnerName((prev) => (prev ? `${prev} ${clean}` : clean));
          if (fieldName === "oldOwnerAddr")
            setOldOwnerAddr((prev) => (prev ? `${prev} ${clean}` : clean));
        }
        setActiveVoiceField(null);
      };

      recognition.onerror = () => setActiveVoiceField(null);
      recognition.onend = () => setActiveVoiceField(null);
      recognition.start();
    } catch (err) {
      console.error("Voice dictation error:", err);
      setActiveVoiceField(null);
    }
  }

  async function handlePasteCleanVIN() {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          const cleaned = text
            .replace(/[^a-zA-Z0-9-]/g, "")
            .toUpperCase()
            .slice(0, 20);
          setChassisNo(cleaned);
          setAutoFilledNotice(
            `Chassis/VIN pasted & sanitized (${cleaned.length} chars).`,
          );
          return;
        }
      }
    } catch {
      // Fallback
    }
    const manual = prompt("Paste Chassis/VIN Number here:");
    if (manual) {
      setChassisNo(
        manual
          .replace(/[^a-zA-Z0-9-]/g, "")
          .toUpperCase()
          .slice(0, 20),
      );
    }
  }

  function setQuickDate(setter: (d: string) => void, offsetDays: number = 0) {
    const d = new Date(Date.now() - offsetDays * 86400000);
    setter(d.toISOString().slice(0, 10));
  }

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

  const [dbPlateCategories, setDbPlateCategories] = useState<
    PlateCategoryDbItem[]
  >([]);
  const [dbSupervisors, setDbSupervisors] = useState<SupervisorDbItem[]>([]);
  const [dbBodyTypes, setDbBodyTypes] = useState<
    { code: string; name: string; isActive: boolean }[]
  >([]);
  const [isQuickAddSupervisorOpen, setIsQuickAddSupervisorOpen] =
    useState(false);
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
        .filter((c) => c.isActive !== false)
        .map((c) => ({
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
    if (
      activeCategories.length > 0 &&
      !activeCategories.some((c) => c.id === classification)
    ) {
      setClassification(activeCategories[0].id);
    }
  }, [activeCategories, classification]);

  // Default supervisor if available or align if currently selected supervisor became inactive
  useEffect(() => {
    if (dbSupervisors.length > 0) {
      const isCurrentActive = dbSupervisors.some((s) => s.name === supervisor);
      if (!supervisor || !isCurrentActive) {
        setSupervisor(dbSupervisors[0].name);
        setSelectedSupervisorId(dbSupervisors[0].id);
      }
    }
  }, [dbSupervisors, supervisor]);

  /* ── Reservations State ── */
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
    customFields?: Array<{
      fieldKey: string;
      label: string;
      type: "text" | "date" | "number";
      required: boolean;
    }> | null;
  }
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [sessionUser, setSessionUser] = useState<{
    id?: string;
    name?: string;
    username?: string;
    role?: string;
    branchId?: string;
    branch?: any;
  } | null>(null);

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
                const match = bList.find(
                  (b: any) =>
                    b.name?.toLowerCase() ===
                    parsed.branch.name.toLowerCase() ||
                    b.code?.toLowerCase() === parsed.branch.code?.toLowerCase(),
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
    return () =>
      window.removeEventListener("dvla_session_change", loadServiceTypes);
  }, []);

  const displayBookingTypes = useMemo(() => {
    return serviceOptions.map((s) => ({
      id: s.code,
      label: s.name,
      sub:
        s.description ||
        (s.isGlobal
          ? "Nationwide standard service"
          : "Station-specific service"),
      category: s.category,
      isGlobal: s.isGlobal,
      name: s.name,
      requiresPreviousOwner: Boolean(s.requiresPreviousOwner),
      prevOwnerRequireName:
        s.prevOwnerRequireName !== undefined
          ? Boolean(s.prevOwnerRequireName)
          : true,
      prevOwnerRequirePhone: Boolean(s.prevOwnerRequirePhone),
      prevOwnerRequireAddress:
        s.prevOwnerRequireAddress !== undefined
          ? Boolean(s.prevOwnerRequireAddress)
          : true,
      prevOwnerRequireCustom: Boolean(s.prevOwnerRequireCustom),
      prevOwnerCustomLabel: s.prevOwnerCustomLabel || null,
      requiresCustoms: s.requiresCustoms !== false,
      customFields: Array.isArray(s.customFields) ? s.customFields : [],
    }));
  }, [serviceOptions]);

  const activeReservation = checkPlateReservation(regNo, reservations);
  const activeServiceDef = displayBookingTypes.find(
    (b) => b.id === bookingType,
  );

  const isTransfer = Boolean(
    activeServiceDef
      ? activeServiceDef.requiresPreviousOwner
      : bookingType === "REG_TRANSFER" ||
      bookingType === "REG_TRANSFER_SPECIAL",
  );

  // Whether the selected service requires customs documentation
  const requiresCustomsStep = activeServiceDef
    ? activeServiceDef.requiresCustoms !== false
    : true;

  // Custom fields for the selected service
  const activeCustomFields = activeServiceDef?.customFields || [];

  // Custom field values state
  const [customFieldValues, setCustomFieldValues] = useState<
    Record<string, string>
  >({});

  // Identify if the active Service Type explicitly configured a Regular Registration Number custom field
  const regularPlateCustomField = useMemo(() => {
    if (!activeCustomFields || activeCustomFields.length === 0) return null;
    return (
      activeCustomFields.find((f) => {
        const lbl = (f.label || "").trim().toUpperCase();
        const key = (f.fieldKey || "").trim().toUpperCase();
        return (
          lbl.includes("REGULAR") ||
          lbl.includes("REG_NUM") ||
          lbl.includes("STATUTORY") ||
          key.includes("REGULAR") ||
          key === "REG_NUM" ||
          key === "REG_NO" ||
          key.includes("REG_PLATE")
        );
      }) || null
    );
  }, [activeCustomFields]);

  const regularPlateFieldKey = regularPlateCustomField?.fieldKey;
  // Strictly determine if regular plate field is needed based on service type configuration
  const needsRegularPlateField = Boolean(regularPlateCustomField);

  // Exclude the regular plate field from Step 3 so it's not rendered twice
  const step3CustomFields = useMemo(() => {
    if (!regularPlateCustomField) return activeCustomFields;
    return activeCustomFields.filter(
      (f) => f.fieldKey !== regularPlateCustomField.fieldKey,
    );
  }, [activeCustomFields, regularPlateCustomField]);

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
    // Reset custom field values and regular plate when service type changes
    setCustomFieldValues({});
    setRegularPlateNo("");
  }, [bookingType, isTransfer]);

  // Keep regularPlateNo and customFieldValues in sync when regularPlateFieldKey exists
  useEffect(() => {
    if (regularPlateFieldKey) {
      const val = customFieldValues[regularPlateFieldKey];
      if (val !== undefined && val !== regularPlateNo) {
        setRegularPlateNo(val);
      }
    }
  }, [regularPlateFieldKey, customFieldValues, regularPlateNo]);

  /* ── 3 Streamlined Steps Validation ── */
  const [attemptedTabs, setAttemptedTabs] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
  });

  const missingFieldsTab1 = useMemo(() => {
    const missing: { id: string; label: string }[] = [];
    if (!bookingType.trim())
      missing.push({ id: "input-bookingType", label: "Filing Service Type" });
    if (!classification.trim())
      missing.push({
        id: "input-classification",
        label: "Plate Classification",
      });
    if (!regNo.trim())
      missing.push({
        id: "input-regNo",
        label: needsRegularPlateField
          ? "Customized Plate Number"
          : "Assigned Plate Number",
      });
    if (needsRegularPlateField) {
      const isReq = regularPlateCustomField
        ? regularPlateCustomField.required !== false
        : true;
      const currentVal =
        regularPlateNo.trim() ||
        (regularPlateFieldKey
          ? (customFieldValues[regularPlateFieldKey] || "").trim()
          : "");
      if (isReq && !currentVal) {
        missing.push({
          id: "input-regularPlateNo",
          label:
            regularPlateCustomField?.label || "Regular Registration Number",
        });
      }
    }
    if (!ownerName.trim())
      missing.push({
        id: "input-ownerName",
        label: isTransfer
          ? "New Owner Full Legal Name"
          : "Owner Full Legal Name",
      });
    if (!receiptNo.trim())
      missing.push({ id: "input-receiptNo", label: "Revenue Receipt Number" });
    if (!receiptDate.trim())
      missing.push({ id: "input-receiptDate", label: "Receipt Payment Date" });
    if (isTransfer) {
      if (
        activeServiceDef?.prevOwnerRequireName !== false &&
        !oldOwnerName.trim()
      ) {
        missing.push({
          id: "input-oldOwnerName",
          label: "Previous Owner Full Name",
        });
      }
      if (
        Boolean(activeServiceDef?.prevOwnerRequirePhone) &&
        !oldOwnerPhone.trim()
      ) {
        missing.push({
          id: "input-oldOwnerPhone",
          label: "Previous Owner Phone",
        });
      }
      if (
        activeServiceDef?.prevOwnerRequireAddress !== false &&
        !oldOwnerAddr.trim()
      ) {
        missing.push({
          id: "input-oldOwnerAddr",
          label: "Previous Owner Address",
        });
      }
      if (
        Boolean(activeServiceDef?.prevOwnerRequireCustom) &&
        !oldOwnerCustom.trim()
      ) {
        missing.push({
          id: "input-oldOwnerCustom",
          label:
            activeServiceDef?.prevOwnerCustomLabel ||
            "Transfer / Clearance Ref #",
        });
      }
    }
    return missing;
  }, [
    bookingType,
    classification,
    regNo,
    regularPlateNo,
    needsRegularPlateField,
    regularPlateCustomField,
    regularPlateFieldKey,
    customFieldValues,
    ownerName,
    receiptNo,
    receiptDate,
    isTransfer,
    activeServiceDef,
    oldOwnerName,
    oldOwnerPhone,
    oldOwnerAddr,
    oldOwnerCustom,
  ]);

  const totalFieldsTab1 = useMemo(() => {
    let count = 6;
    if (
      needsRegularPlateField &&
      (regularPlateCustomField
        ? regularPlateCustomField.required !== false
        : true)
    ) {
      count++;
    }
    if (isTransfer) {
      if (activeServiceDef?.prevOwnerRequireName !== false) count++;
      if (Boolean(activeServiceDef?.prevOwnerRequirePhone)) count++;
      if (activeServiceDef?.prevOwnerRequireAddress !== false) count++;
      if (Boolean(activeServiceDef?.prevOwnerRequireCustom)) count++;
    }
    return count;
  }, [
    isTransfer,
    activeServiceDef,
    needsRegularPlateField,
    regularPlateCustomField,
  ]);

  // Tab 2: Kept CC and Cylinders! Axles and tyres temporarily removed.
  const missingFieldsTab2 = useMemo(() => {
    const missing: { id: string; label: string }[] = [];
    if (!make.trim()) missing.push({ id: "input-make", label: "Make" });
    if (!model.trim()) missing.push({ id: "input-model", label: "Model" });
    if (!year.trim()) missing.push({ id: "input-year", label: "Model Year" });
    if (!bodyType.trim())
      missing.push({ id: "input-bodyType", label: "Body Type" });
    if (!fuelType.trim())
      missing.push({ id: "input-fuelType", label: "Fuel Type" });
    if (!chassisNo.trim())
      missing.push({ id: "input-chassisNo", label: "Chassis / VIN Number" });
    if (!engineCC.trim())
      missing.push({ id: "input-engineCC", label: "Engine Displacement (CC)" });
    if (!cylinders.trim())
      missing.push({ id: "input-cylinders", label: "Number of Cylinders" });
    return missing;
  }, [make, model, year, bodyType, fuelType, chassisNo, engineCC, cylinders]);

  const totalFieldsTab2 = 8;

  // Step 3: Customs & Certification
  const missingFieldsTab3 = useMemo(() => {
    const missing: { id: string; label: string }[] = [];
    if (requiresCustomsStep) {
      if (!customsNo.trim())
        missing.push({
          id: "input-customsNo",
          label: "Customs Declaration Number",
        });
      if (!customsDate.trim())
        missing.push({
          id: "input-customsDate",
          label: "Customs Clearance Date",
        });
    }
    if (!supervisor.trim())
      missing.push({ id: "input-supervisor", label: "Approving Officer" });
    // Required custom fields validation (excluding regular plate field handled in Step 1)
    step3CustomFields
      .filter((f) => f.required)
      .forEach((f) => {
        if (!customFieldValues[f.fieldKey]?.trim()) {
          missing.push({
            id: `input-custom-${f.fieldKey}`,
            label: f.label || f.fieldKey,
          });
        }
      });
    return missing;
  }, [
    requiresCustomsStep,
    customsNo,
    customsDate,
    supervisor,
    step3CustomFields,
    customFieldValues,
  ]);

  const totalFieldsTab3 =
    (requiresCustomsStep ? 2 : 0) +
    1 +
    step3CustomFields.filter((f) => f.required).length;

  const totalRequiredFields =
    totalFieldsTab1 + totalFieldsTab2 + totalFieldsTab3;
  const totalCompletedFields =
    totalFieldsTab1 -
    missingFieldsTab1.length +
    (totalFieldsTab2 - missingFieldsTab2.length) +
    (totalFieldsTab3 - missingFieldsTab3.length);

  const overallCompletionPercent = Math.round(
    (totalCompletedFields / totalRequiredFields) * 100,
  );

  function focusField(id: string, tab: 1 | 2 | 3 | 4) {
    setActiveTab(tab);
    setAttemptedTabs((prev) => ({ ...prev, [tab]: true }));
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
      setAttemptedTabs((prev) => ({ ...prev, 1: true }));
      focusField(missingFieldsTab1[0].id, 1);
      return;
    }
    setActiveTab(2);
  }

  function handleNextTab2() {
    if (missingFieldsTab2.length > 0) {
      setAttemptedTabs((prev) => ({ ...prev, 2: true }));
      focusField(missingFieldsTab2[0].id, 2);
      return;
    }
    setActiveTab(3);
  }

  function handleNextTab3() {
    if (missingFieldsTab3.length > 0) {
      setAttemptedTabs((prev) => ({ ...prev, 3: true }));
      focusField(missingFieldsTab3[0].id, 3);
      return;
    }
    setActiveTab(4);
  }

  function handleReset() {
    setIsSuccess(false);
    setOwnerName("");
    setAddress("");
    setPhone("");
    setOldOwnerName("");
    setOldOwnerPhone("");
    setOldOwnerAddr("");
    setOldOwnerCustom("");
    setShowExtraPhone(false);
    setShowExtraAddr(false);
    setShowExtraCustom(false);
    setMake("");
    setYear("");
    setModel("");
    setEngineCC("");
    setEngineNo("");
    setChassisNo("");
    setBodyType("Saloon");
    setNetWeight("1500");
    setGrossWeight("2000");
    setTyreFW("215");
    setTyreFD("16");
    setTyreMW("");
    setTyreMD("");
    setTyreRW("215");
    setTyreRD("16");
    setReceiptNo("");
    setReceiptDate("");
    setCustomsNo("");
    setCustomsDate("");
    setSupervisor("");
    setSelectedSupervisorId("");
    setCylinders("4");
    setFuelType("PETROL");
    setRegNo("");
    setRegularPlateNo("");
    setVrsInvoiceNo("");
    setVrsSuccessMessage("");
    setAlreadyBookedError(null);
    setAttemptedTabs({ 1: false, 2: false, 3: false });
    if (typeof window !== "undefined") {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
    setDraftNotice(null);
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
      const res = await fetch(
        `/api/vrs?invoiceNo=${encodeURIComponent(invoiceNoToFetch.trim())}`,
      );
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
                (b.plate &&
                  invoice.regNo &&
                  b.plate.trim().toUpperCase() ===
                  invoice.regNo.trim().toUpperCase()),
            );

            if (match) {
              isAlreadyBooked = true;
              setAlreadyBookedError(
                `⚠️ Notice: VRS Invoice #${invoice.invoiceNo} has ALREADY been booked in system (Booking #${match.id} — ${match.owner}).`,
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
      const extractedModel = yearMatch
        ? invoice.yearModel.replace(/\s*\d{4}$/, "")
        : invoice.yearModel;
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

      setReceiptNo(invoice.invoiceNo);
      setReceiptDate(new Date().toISOString().slice(0, 10));

      setActiveTab(3); // Navigate directly to Customs & Certification
      setVrsSuccessMessage(
        `Auto-filled vehicle & owner specifications from VRS Invoice #${invoice.invoiceNo}.`,
      );
    } else {
      setVrsSuccessMessage("");
      alert(`VRS Invoice #${invoiceNoToFetch} not found.`);
    }

    setIsFetchingVrs(false);
  }

  /* ── 4. Final Form Submission ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (alreadyBookedError) {
      alert(
        "⚠️ Booking Blocked: This VRS Invoice has already been booked in the system.",
      );
      return;
    }

    if (missingFieldsTab1.length > 0) {
      focusField(missingFieldsTab1[0].id, 1);
      alert(
        `⚠️ Step 1 Incomplete: Please enter "${missingFieldsTab1[0].label}" before certifying.`,
      );
      return;
    }

    if (missingFieldsTab2.length > 0) {
      focusField(missingFieldsTab2[0].id, 2);
      alert(
        `⚠️ Step 2 Incomplete: Please enter "${missingFieldsTab2[0].label}" before certifying.`,
      );
      return;
    }

    if (missingFieldsTab3.length > 0) {
      focusField(missingFieldsTab3[0].id, 3);
      alert(
        `⚠️ Step 3 Incomplete: Please enter "${missingFieldsTab3[0].label}" before certifying.`,
      );
      return;
    }

    const activeRes = checkPlateReservation(regNo, reservations);
    if (activeRes) {
      const updated = reservations.map((r) => {
        if (r.id === activeRes.id) {
          return {
            ...r,
            claimedCount: Math.min(r.totalCount, r.claimedCount + 1),
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
          vehicle:
            `${make.trim().toUpperCase()} ${model.trim().toUpperCase()} (${year})`.trim() ||
            "VEHICLE",
          plate: fullPlate || undefined,
          date: new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
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
          branchId:
            sessionUser?.branchId || sessionUser?.branch?.id || undefined,
          previousOwnerName: isTransfer
            ? oldOwnerName.trim().toUpperCase() || undefined
            : undefined,
          previousOwnerPhone: isTransfer
            ? oldOwnerPhone.trim().toUpperCase() || undefined
            : undefined,
          previousOwnerAddress: isTransfer
            ? oldOwnerAddr.trim().toUpperCase() || undefined
            : undefined,
          previousOwnerCustom: isTransfer
            ? oldOwnerCustom.trim().toUpperCase() || undefined
            : undefined,
          regularPlate: (regularPlateNo.trim() || (regularPlateFieldKey ? (customFieldValues[regularPlateFieldKey] || "").trim() : ""))?.toUpperCase() || undefined,
          customFieldData: {
            ...customFieldValues,
            ...(regularPlateFieldKey && regularPlateNo ? { [regularPlateFieldKey]: regularPlateNo.trim().toUpperCase() } : {}),
            ...(regularPlateNo ? { regularPlate: regularPlateNo.trim().toUpperCase() } : {}),
            ...(needsRegularPlateField ? { isCustomized: true, customizedPlate: fullPlate } : {}),
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(
          `⚠️ Booking Error: ${errData.error || "Failed to create booking."}`,
        );
        return;
      }

      setIsSuccess(true);
      if (typeof window !== "undefined") {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
      setDraftNotice(null);
      fetchDbVehicles();
    } catch (err) {
      console.error("Error creating booking in DB:", err);
      alert("System error creating booking.");
    }
  }

  // Keep the current step visible after navigating a long form.
  const previousTabRef = useRef(activeTab);
  useEffect(() => {
    if (previousTabRef.current === activeTab) return;
    previousTabRef.current = activeTab;
    const panel = document.getElementById("booking-step-panel");
    panel?.focus({ preventScroll: true });
    panel?.scrollIntoView({ block: "start", behavior: "auto" });
  }, [activeTab]);

  /* ════════════════ RENDER ════════════════ */
  return (
    <div className="mx-auto max-w-7xl space-y-4 px-1 pb-8 text-slate-900 sm:px-2 [&_button]:focus-visible:outline-none [&_button]:focus-visible:ring-2 [&_button]:focus-visible:ring-emerald-700 [&_button]:focus-visible:ring-offset-2">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-0.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            {sessionUser?.branch?.name
              ? String(sessionUser.branch.name).toUpperCase()
              : "DVLA ADENTA"}{" "}
            / VEHICLE REGISTRATION
          </p>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            New booking
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Enter the registration details, then review and submit.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-[11px] font-medium text-slate-400 hidden md:inline"
            title="VRS auto-sync is disabled pending DVLA clearance."
          >
            Manual entry · VRS sync pending
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="h-8 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
          >
            Reset form
          </button>
        </div>
      </header>
      {/* Draft Notification Banner */}
      {draftNotice && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3.5 py-2 text-xs text-blue-900 flex items-center justify-between shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 font-bold">💾</span>
            <span>{draftNotice}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="text-sm font-bold text-rose-700 hover:text-rose-900 underline cursor-pointer"
            >
              Discard Draft
            </button>
            <button
              type="button"
              onClick={() => setDraftNotice(null)}
              className="text-slate-400 hover:text-slate-700 font-bold ml-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Alerts */}
      {vrsSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-800 flex items-center justify-between">
          <span>✓ {vrsSuccessMessage}</span>
          <button
            type="button"
            onClick={() => setVrsSuccessMessage("")}
            className="font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {alreadyBookedError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 flex items-center justify-between">
          <span>{alreadyBookedError}</span>
          <button
            type="button"
            onClick={() => setAlreadyBookedError(null)}
            className="font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── 2. Success Receipt Slip ── */}
      {isSuccess ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-xl mx-auto space-y-5 shadow-sm">
          <div className="text-center space-y-1">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center font-bold text-lg">
              ✓
            </div>
            <h3 className="font-bold text-base text-slate-900 uppercase">
              Registration Successfully Filed
            </h3>
            <p className="text-xs text-slate-500">
              Official logbook record entered into DVLA database.
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 font-mono text-xs space-y-2 text-slate-700 uppercase">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-400">
                {needsRegularPlateField ? "CUSTOMIZED PLATE:" : "PLATE NUMBER:"}
              </span>
              <span className="font-bold text-slate-900">
                {regNo || "PENDING"}
              </span>
            </div>
            {needsRegularPlateField && (regularPlateNo || (regularPlateFieldKey && customFieldValues[regularPlateFieldKey])) && (
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-400">
                  {regularPlateCustomField?.label ? `${regularPlateCustomField.label.toUpperCase()}:` : "REGULAR NUMBER:"}
                </span>
                <span className="font-bold text-slate-900 font-mono">
                  {regularPlateNo || (regularPlateFieldKey ? customFieldValues[regularPlateFieldKey] : "")}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">OWNER:</span>
              <span className="font-semibold text-slate-900">{ownerName}</span>
            </div>
            {isTransfer && oldOwnerName && (
              <div className="flex justify-between border-t border-slate-200/80 pt-1.5">
                <span className="text-amber-700 font-medium">
                  PREV TITLE OWNER:
                </span>
                <span className="font-semibold text-slate-800 text-right">
                  {oldOwnerName}
                  {oldOwnerPhone ? ` · ${oldOwnerPhone}` : ""}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">VEHICLE:</span>
              <span>
                {make} {model} {year && `(${year})`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ENGINE SPECS:</span>
              <span>
                {engineCC} CC • {cylinders} CYLINDERS
              </span>
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
              <span className="font-semibold text-slate-900">
                {supervisor || "—"}
              </span>
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
        <form
          id="booking-form"
          onSubmit={handleSubmit}
          className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_290px]"
        >
          <div className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <nav
              aria-label="Booking steps"
              className="grid grid-cols-4 gap-1 border-b border-slate-200 bg-slate-50/80 p-1 sm:p-1.5"
            >
              {(
                [
                  {
                    id: 1,
                    label: "Owner & Filing",
                    short: "Owner",
                    missing: missingFieldsTab1.length,
                  },
                  {
                    id: 2,
                    label: "Vehicle Specs",
                    short: "Vehicle",
                    missing: missingFieldsTab2.length,
                  },
                  {
                    id: 3,
                    label: "Documents",
                    short: "Docs",
                    missing: missingFieldsTab3.length,
                  },
                  {
                    id: 4,
                    label: "Review",
                    short: "Review",
                    missing: totalRequiredFields - totalCompletedFields,
                  },
                ] as const
              ).map((step) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveTab(step.id)}
                  aria-current={activeTab === step.id ? "step" : undefined}
                  className={`flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition cursor-pointer select-none ${activeTab === step.id
                      ? "bg-white text-emerald-900 shadow-2xs border border-slate-200 font-bold"
                      : "text-slate-500 hover:bg-white/60 hover:text-slate-800"
                    }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${activeTab === step.id
                        ? "bg-emerald-800 text-white"
                        : step.missing === 0
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-600"
                      }`}
                  >
                    {step.missing === 0 && activeTab !== step.id
                      ? "✓"
                      : step.id}
                  </span>
                  <span className="hidden sm:inline truncate">{step.label}</span>
                  <span className="sm:hidden">{step.short}</span>
                </button>
              ))}
            </nav>
            <div
              id="booking-step-panel"
              tabIndex={-1}
              className="scroll-mt-6 p-4 outline-none sm:p-5"
            >
              {activeTab === 1 && (
                <div className="space-y-5">
                  <StepHeading
                    title="Owner & Filing"
                    description="Start with the service and plate, then add the owner and payment details. Fields marked * are required."
                    missing={missingFieldsTab1.length}
                    attempted={attemptedTabs[1]}
                  />
                  <section>
                    <SectionHeading title="Registration details" />
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                      <Field
                        label="Filing Service Type"
                        required
                        isFilled={Boolean(bookingType.trim())}
                        fieldId="bookingType"
                        hint={
                          displayBookingTypes.find((b) => b.id === bookingType)
                            ?.sub
                        }
                      >
                        <select
                          id="input-bookingType"
                          value={bookingType}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBookingType(val);
                            const matched = displayBookingTypes.find(
                              (b) => b.id === val,
                            );
                            if (
                              matched &&
                              matched.category &&
                              matched.category !== "ALL"
                            ) {
                              setClassification(matched.category);
                            }
                          }}
                          className={INPUT}
                        >
                          {displayBookingTypes.length === 0 ? (
                            <option value="">
                              Loading services from DVLA database...
                            </option>
                          ) : (
                            displayBookingTypes.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.label}
                              </option>
                            ))
                          )}
                        </select>
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
                          {activeCategories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <div className="mt-3.5">
                      {needsRegularPlateField ? (
                        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                          <Field
                            label="Customized Plate Number"
                            required
                            isFilled={Boolean(regNo.trim())}
                            hasError={attemptedTabs[1] && !regNo.trim()}
                            errorMessage="Customized plate number is required"
                            fieldId="regNo"
                            hint="Requested custom sequence / vanity name"
                          >
                            <input
                              id="input-regNo"
                              value={regNo}
                              onChange={(e) =>
                                setRegNo(e.target.value.toUpperCase())
                              }
                              required
                              autoCapitalize="characters"
                              autoCorrect="off"
                              spellCheck={false}
                              placeholder="E.G. CHIEF 1-26 OR KX 1111-AD"
                              className={INPUT + " font-mono font-bold"}
                            />
                            {activeReservation && (
                              <div className="mt-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium">
                                Reserved: {activeReservation.holder} ({activeReservation.authRef})
                              </div>
                            )}
                          </Field>

                          <Field
                            label={regularPlateCustomField?.label || "Regular Registration Number"}
                            required={regularPlateCustomField ? regularPlateCustomField.required !== false : true}
                            optional={regularPlateCustomField ? regularPlateCustomField.required === false : false}
                            isFilled={Boolean(regularPlateNo.trim() || (regularPlateFieldKey && customFieldValues[regularPlateFieldKey]?.trim()))}
                            hasError={
                              attemptedTabs[1] &&
                              (regularPlateCustomField ? regularPlateCustomField.required !== false : true) &&
                              !regularPlateNo.trim() &&
                              !(regularPlateFieldKey && customFieldValues[regularPlateFieldKey]?.trim())
                            }
                            errorMessage={`${regularPlateCustomField?.label || "Regular registration number"} is required`}
                            fieldId="regularPlateNo"
                            hint="Official statutory regular number behind plate"
                          >
                            <input
                              id="input-regularPlateNo"
                              value={regularPlateNo}
                              onChange={(e) => {
                                const val = e.target.value.toUpperCase();
                                setRegularPlateNo(val);
                                if (regularPlateFieldKey) {
                                  setCustomFieldValues((prev) => ({
                                    ...prev,
                                    [regularPlateFieldKey]: val,
                                  }));
                                }
                              }}
                              required={regularPlateCustomField ? regularPlateCustomField.required !== false : true}
                              autoCapitalize="characters"
                              autoCorrect="off"
                              spellCheck={false}
                              placeholder="E.G. GX 4521-26 OR 1092-ADXY"
                              className={INPUT + " font-mono font-bold"}
                            />
                          </Field>
                        </div>
                      ) : (
                        <div className="max-w-md">
                          <Field
                            label="Assigned Plate Number"
                            required
                            isFilled={Boolean(regNo.trim())}
                            hasError={attemptedTabs[1] && !regNo.trim()}
                            errorMessage="Please enter the assigned plate number"
                            fieldId="regNo"
                            hint="Official statutory registration plate (e.g. 1092-ADXY)"
                          >
                            <input
                              id="input-regNo"
                              value={regNo}
                              onChange={(e) =>
                                setRegNo(e.target.value.toUpperCase())
                              }
                              required
                              autoCapitalize="characters"
                              autoCorrect="off"
                              spellCheck={false}
                              placeholder="E.G. 1092-ADXY OR GX 4521-26"
                              className={INPUT + " font-mono font-bold"}
                            />
                            {activeReservation && (
                              <div className="mt-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium">
                                Reserved: {activeReservation.holder} ({activeReservation.authRef})
                              </div>
                            )}
                          </Field>
                        </div>
                      )}
                    </div>
                  </section>
                  <section className="border-t border-slate-100 pt-7">
                    <SectionHeading
                      title={isTransfer ? "New owner details" : "Owner details"}
                    />
                    <Field
                      label={
                        isTransfer
                          ? "New Owner Full Legal Name"
                          : "Owner Full Legal Name"
                      }
                      required
                      isFilled={Boolean(ownerName.trim())}
                      hasError={attemptedTabs[1] && !ownerName.trim()}
                      errorMessage="Owner full legal name is required"
                      fieldId="ownerName"
                    >
                      <div className="space-y-2">
                        <TabAutocompleteInput
                          id="input-ownerName"
                          value={ownerName}
                          onChange={(val) => setOwnerName(val)}
                          required
                          placeholder="FULL NAME OR COMPANY"
                          className={INPUT}
                        />
                        <details className="pt-1">
                          <summary className="w-fit cursor-pointer text-xs font-medium text-slate-500 hover:text-emerald-800">
                            Title & voice entry
                          </summary>
                          <div className="pt-3">
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-xs font-bold text-slate-400 uppercase">
                                  Title:
                                </span>
                                {[
                                  "MR.",
                                  "MRS.",
                                  "MS.",
                                  "DR.",
                                  "ALHAJI",
                                  "HON.",
                                ].map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() =>
                                      setOwnerName((prev) =>
                                        prev
                                          ? `${t} ${prev.replace(/^(MR\.|MRS\.|MS\.|DR\.|ALHAJI|HON\.)\s*/i, "")}`
                                          : `${t} `,
                                      )
                                    }
                                    className="min-h-9 px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded border border-slate-200 transition cursor-pointer"
                                  >
                                    {t}
                                  </button>
                                ))}
                              </div>
                              <button
                                type="button"
                                onClick={() => startVoiceDictation("ownerName")}
                                className={`min-h-9 px-2.5 py-1.5 text-xs font-bold rounded border transition cursor-pointer flex items-center gap-1 ${activeVoiceField === "ownerName"
                                  ? "bg-rose-50 text-rose-700 border-rose-300 "
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                                  }`}
                                title="Speak name into microphone"
                              >
                                <span>
                                  🎙️{" "}
                                  {activeVoiceField === "ownerName"
                                    ? "Listening..."
                                    : "Dictate"}
                                </span>
                              </button>
                            </div>
                          </div>
                        </details>
                      </div>
                    </Field>
                    <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Field
                          label="Residential / Business Address"
                          optional
                          isFilled={Boolean(address.trim())}
                          fieldId="address"
                        >
                          <div className="space-y-2">
                            <input
                              id="input-address"
                              value={address}
                              onChange={(e) =>
                                setAddress(e.target.value.toUpperCase())
                              }
                              autoCapitalize="words"
                              autoCorrect="off"
                              placeholder="STREET, TOWN / SUB-DISTRICT, REGION"
                              className={INPUT}
                            />
                            <details className="pt-1">
                              <summary className="w-fit cursor-pointer text-xs font-medium text-slate-500 hover:text-emerald-800">
                                City shortcuts & voice entry
                              </summary>
                              <div className="pt-3">
                                <div className="flex items-center justify-between gap-1 flex-wrap">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className="text-xs font-bold text-slate-400 uppercase">
                                      Quick City:
                                    </span>
                                    {[
                                      "ACCRA",
                                      "ADENTA",
                                      "MADINA",
                                      "TEMA",
                                      "KUMASI",
                                      "TAKORADI",
                                      "EAST LEGON",
                                    ].map((c) => (
                                      <button
                                        key={c}
                                        type="button"
                                        onClick={() =>
                                          setAddress((prev) =>
                                            prev ? `${prev}, ${c}` : c,
                                          )
                                        }
                                        className="min-h-9 px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded border border-slate-200 transition cursor-pointer"
                                      >
                                        {c}
                                      </button>
                                    ))}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      startVoiceDictation("address")
                                    }
                                    className={`min-h-9 px-2.5 py-1.5 text-xs font-bold rounded border transition cursor-pointer flex items-center gap-1 ${activeVoiceField === "address"
                                      ? "bg-rose-50 text-rose-700 border-rose-300 "
                                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                                      }`}
                                    title="Speak address into microphone"
                                  >
                                    <span>
                                      🎙️{" "}
                                      {activeVoiceField === "address"
                                        ? "Listening..."
                                        : "Dictate"}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </details>
                          </div>
                        </Field>
                      </div>
                      <Field
                        label="Contact Phone Number"
                        optional
                        isFilled={Boolean(phone.trim())}
                        fieldId="phone"
                      >
                        <div className="space-y-2">
                          <input
                            id="input-phone"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            value={phone}
                            onChange={(e) =>
                              setPhone(e.target.value.toUpperCase())
                            }
                            placeholder="E.G. 0241234567"
                            className={INPUT}
                          />
                          <details className="pt-1">
                            <summary className="w-fit cursor-pointer text-xs font-medium text-slate-500 hover:text-emerald-800">
                              Phone prefixes
                            </summary>
                            <div className="pt-3">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-xs font-bold text-slate-400 uppercase">
                                  Network:
                                </span>
                                {[
                                  "024",
                                  "054",
                                  "055",
                                  "020",
                                  "027",
                                  "+233",
                                ].map((pfx) => (
                                  <button
                                    key={pfx}
                                    type="button"
                                    onClick={() => setPhone(pfx)}
                                    className="min-h-9 px-2.5 py-1.5 text-xs font-bold font-mono bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded border border-slate-200 transition cursor-pointer"
                                  >
                                    {pfx}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </details>
                        </div>
                      </Field>
                    </div>
                  </section>
                  {/* Transfer specific fields */}
                  {isTransfer && (
                    <div className="border-t border-slate-100 pt-7 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 "></span>
                            <span>
                              Previous Title Owner &amp; Transfer Details
                            </span>
                          </span>
                        </div>
                      </div>

                      {(() => {
                        const needName =
                          activeServiceDef?.prevOwnerRequireName !== false;
                        const needPhone =
                          Boolean(activeServiceDef?.prevOwnerRequirePhone) ||
                          showExtraPhone;
                        const needAddress =
                          activeServiceDef?.prevOwnerRequireAddress !== false ||
                          showExtraAddr;
                        const needCustom =
                          Boolean(activeServiceDef?.prevOwnerRequireCustom) ||
                          showExtraCustom;
                        const customLabel =
                          activeServiceDef?.prevOwnerCustomLabel ||
                          "Transfer / Clearance Ref #";

                        return (
                          <>
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                              {needName && (
                                <Field
                                  label="Previous Owner Full Legal Name"
                                  required={
                                    activeServiceDef?.prevOwnerRequireName !==
                                    false
                                  }
                                  optional={
                                    activeServiceDef?.prevOwnerRequireName ===
                                    false
                                  }
                                  isFilled={Boolean(oldOwnerName.trim())}
                                  hasError={
                                    attemptedTabs[1] &&
                                    activeServiceDef?.prevOwnerRequireName !==
                                    false &&
                                    !oldOwnerName.trim()
                                  }
                                  errorMessage="Previous Owner Full Legal Name is required"
                                  fieldId="oldOwnerName"
                                  hint="As shown on existing logbook"
                                >
                                  <div className="space-y-2">
                                    <TabAutocompleteInput
                                      id="input-oldOwnerName"
                                      value={oldOwnerName}
                                      onChange={(val) => setOldOwnerName(val)}
                                      required={
                                        activeServiceDef?.prevOwnerRequireName !==
                                        false
                                      }
                                      placeholder="FULL LEGAL NAME OF PREVIOUS OWNER"
                                      className={INPUT}
                                    />
                                    <div className="flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          startVoiceDictation("oldOwnerName")
                                        }
                                        className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                                      >
                                        <span>
                                          🎙️{" "}
                                          {activeVoiceField === "oldOwnerName"
                                            ? "Listening..."
                                            : "Dictate"}
                                        </span>
                                      </button>
                                    </div>
                                  </div>
                                </Field>
                              )}

                              {needPhone && (
                                <Field
                                  label="Previous Owner Contact Phone"
                                  required={Boolean(
                                    activeServiceDef?.prevOwnerRequirePhone,
                                  )}
                                  optional={
                                    !Boolean(
                                      activeServiceDef?.prevOwnerRequirePhone,
                                    )
                                  }
                                  isFilled={Boolean(oldOwnerPhone.trim())}
                                  hasError={
                                    attemptedTabs[1] &&
                                    Boolean(
                                      activeServiceDef?.prevOwnerRequirePhone,
                                    ) &&
                                    !oldOwnerPhone.trim()
                                  }
                                  errorMessage="Previous Owner Contact Phone is required"
                                  fieldId="oldOwnerPhone"
                                  hint="Active contact phone"
                                >
                                  <input
                                    id="input-oldOwnerPhone"
                                    type="tel"
                                    inputMode="tel"
                                    autoComplete="tel"
                                    value={oldOwnerPhone}
                                    onChange={(e) =>
                                      setOldOwnerPhone(
                                        e.target.value.toUpperCase(),
                                      )
                                    }
                                    required={Boolean(
                                      activeServiceDef?.prevOwnerRequirePhone,
                                    )}
                                    placeholder="E.G. 0241234567"
                                    className={INPUT}
                                  />
                                </Field>
                              )}

                              {needAddress && (
                                <div
                                  className={
                                    needPhone && needName && !needCustom
                                      ? "sm:col-span-2"
                                      : ""
                                  }
                                >
                                  <Field
                                    label="Previous Owner Address"
                                    required={
                                      activeServiceDef?.prevOwnerRequireAddress !==
                                      false
                                    }
                                    optional={
                                      activeServiceDef?.prevOwnerRequireAddress ===
                                      false
                                    }
                                    isFilled={Boolean(oldOwnerAddr.trim())}
                                    hasError={
                                      attemptedTabs[1] &&
                                      activeServiceDef?.prevOwnerRequireAddress !==
                                      false &&
                                      !oldOwnerAddr.trim()
                                    }
                                    errorMessage="Previous Owner Address is required"
                                    fieldId="oldOwnerAddr"
                                    hint="Title address on record"
                                  >
                                    <div className="space-y-2">
                                      <input
                                        id="input-oldOwnerAddr"
                                        value={oldOwnerAddr}
                                        onChange={(e) =>
                                          setOldOwnerAddr(
                                            e.target.value.toUpperCase(),
                                          )
                                        }
                                        required={
                                          activeServiceDef?.prevOwnerRequireAddress !==
                                          false
                                        }
                                        autoCapitalize="words"
                                        autoCorrect="off"
                                        placeholder="STREET, TOWN / SUB-DISTRICT, REGION"
                                        className={INPUT}
                                      />
                                      <div className="flex justify-end">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            startVoiceDictation("oldOwnerAddr")
                                          }
                                          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                                        >
                                          <span>
                                            🎙️{" "}
                                            {activeVoiceField === "oldOwnerAddr"
                                              ? "Listening..."
                                              : "Dictate"}
                                          </span>
                                        </button>
                                      </div>
                                    </div>
                                  </Field>
                                </div>
                              )}

                              {needCustom && (
                                <div
                                  className={
                                    !needAddress || (!needPhone && !needName)
                                      ? "sm:col-span-2"
                                      : ""
                                  }
                                >
                                  <Field
                                    label={customLabel}
                                    required={Boolean(
                                      activeServiceDef?.prevOwnerRequireCustom,
                                    )}
                                    optional={
                                      !Boolean(
                                        activeServiceDef?.prevOwnerRequireCustom,
                                      )
                                    }
                                    isFilled={Boolean(oldOwnerCustom.trim())}
                                    hasError={
                                      attemptedTabs[1] &&
                                      Boolean(
                                        activeServiceDef?.prevOwnerRequireCustom,
                                      ) &&
                                      !oldOwnerCustom.trim()
                                    }
                                    errorMessage={`${customLabel} is required`}
                                    fieldId="oldOwnerCustom"
                                    hint="Transfer authorization reference"
                                  >
                                    <input
                                      id="input-oldOwnerCustom"
                                      value={oldOwnerCustom}
                                      onChange={(e) =>
                                        setOldOwnerCustom(
                                          e.target.value.toUpperCase(),
                                        )
                                      }
                                      required={Boolean(
                                        activeServiceDef?.prevOwnerRequireCustom,
                                      )}
                                      autoCapitalize="characters"
                                      autoCorrect="off"
                                      placeholder={`ENTER ${customLabel.toUpperCase()}`}
                                      className={INPUT}
                                    />
                                  </Field>
                                </div>
                              )}
                            </div>

                            {(!needPhone || !needAddress || !needCustom) && (
                              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                                <span className="text-xs text-slate-400 font-medium">
                                  Want to capture additional transfer
                                  parameters?
                                </span>
                                <div className="flex items-center gap-2">
                                  {!needPhone && (
                                    <button
                                      type="button"
                                      onClick={() => setShowExtraPhone(true)}
                                      className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer underline"
                                    >
                                      + Add Phone
                                    </button>
                                  )}
                                  {!needAddress && (
                                    <button
                                      type="button"
                                      onClick={() => setShowExtraAddr(true)}
                                      className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer underline"
                                    >
                                      + Add Address
                                    </button>
                                  )}
                                  {!needCustom && (
                                    <button
                                      type="button"
                                      onClick={() => setShowExtraCustom(true)}
                                      className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer underline"
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
                  <div className="border-t border-slate-100 pt-7 space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-slate-200/60">
                      <span className="text-base font-semibold text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        <span>Payment receipt</span>
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        Use the details on the payment receipt.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                          inputMode="numeric"
                          autoCapitalize="characters"
                          autoCorrect="off"
                          spellCheck={false}
                          onChange={(e) =>
                            setReceiptNo(e.target.value.toUpperCase())
                          }
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
                        <div className="space-y-2">
                          <FlexibleDateInput
                            id="input-receiptDate"
                            value={receiptDate}
                            onChange={setReceiptDate}
                            required
                            placeholder="DD/MM/YYYY"
                          />
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-400 uppercase">
                              Quick Date:
                            </span>
                            <button
                              type="button"
                              onClick={() => setQuickDate(setReceiptDate, 0)}
                              className="min-h-9 px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded border border-slate-200 transition cursor-pointer"
                            >
                              Today
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickDate(setReceiptDate, 1)}
                              className="min-h-9 px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded border border-slate-200 transition cursor-pointer"
                            >
                              Yesterday
                            </button>
                          </div>
                        </div>
                      </Field>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 2 && (
                <div className="space-y-5">
                  <StepHeading
                    title="Vehicle Specs"
                    description="Find a vehicle to fill its specifications, or enter the details below."
                    missing={missingFieldsTab2.length}
                    attempted={attemptedTabs[2]}
                  />
                  {/* ══════════════════════════════════════════════════════════════
                      CORPORATE VEHICLE CATALOG SEARCH STATION (YEAR-FIRST FLOW)
                  ══════════════════════════════════════════════════════════════ */}
                  <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          Find a vehicle
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Search by make or model to look up specifications, or enter manually below.
                        </p>
                      </div>

                      {/* Year Selector */}
                      <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">
                          Year:
                        </span>
                        <select
                          value={selectedCatalogYear}
                          onChange={(e) => {
                            const newYr = e.target.value;
                            setSelectedCatalogYear(newYr);
                            if (make && model) {
                              setYear(newYr);
                            }
                          }}
                          className="h-8 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 shadow-2xs transition cursor-pointer"
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
                          aria-label="Search vehicle catalog"
                          placeholder="SEARCH MAKE OR MODEL (E.G. TOYOTA COROLLA)"
                          className="w-full h-9 pl-9 pr-9 py-1.5 bg-white border border-slate-200 focus:border-emerald-600 rounded-lg text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/15 transition uppercase"
                        />
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
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
                      {isVehicleDropdownOpen &&
                        vehicleSearchQuery.trim().length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100">
                            {filteredCatalogVehicles.length === 0 ? (
                              <div className="p-4 space-y-2 text-center">
                                <p className="text-xs text-slate-600 uppercase">
                                  No database match for &quot;
                                  {vehicleSearchQuery}&quot;.
                                </p>
                                <button
                                  type="button"
                                  onClick={handleUseUnlistedFromSearch}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 uppercase"
                                >
                                  <span>
                                    Use &quot;{vehicleSearchQuery}&quot; &amp;
                                    Register specs
                                  </span>
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="px-3 py-1.5 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                                  <span>
                                    Matching Models (
                                    {filteredCatalogVehicles.length})
                                  </span>
                                </div>
                                {filteredCatalogVehicles
                                  .slice(0, 30)
                                  .map((v: any) => (
                                    <button
                                      key={v.id || `${v.make}-${v.model}`}
                                      type="button"
                                      onClick={() => handleSelectVehicle(v)}
                                      className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 transition flex items-center justify-between gap-2 cursor-pointer group"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase shrink-0">
                                          {v.bodyType?.includes("Pickup")
                                            ? "Pickup"
                                            : v.bodyType?.includes("SUV")
                                              ? "SUV"
                                              : "Saloon"}
                                        </span>
                                        <div className="min-w-0">
                                          <p className="text-sm font-semibold text-slate-900 group-hover:text-[#81B71A] truncate uppercase">
                                            {v.make} {v.model}
                                          </p>
                                          <p className="text-xs text-slate-500 truncate uppercase">
                                            {v.engineCC} CC &bull; {v.cylinders}{" "}
                                            CYLINDERS &bull; {v.fuelType}
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
                            {make} {model}{" "}
                            <span className="text-slate-500 font-mono">
                              ({year || selectedCatalogYear})
                            </span>
                          </p>
                          <p className="text-xs text-slate-500 uppercase mt-0.5">
                            Engine: {engineCC} CC • {cylinders} Cylinders •{" "}
                            {fuelType}
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
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-sm text-emerald-800 font-bold uppercase">
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
                  <div className="border-t border-slate-100 pt-7 space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-slate-100">
                      <span className="text-base font-semibold text-slate-900">
                        Vehicle identity
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        Auto-fills from catalog or editable
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                          onChange={(e) =>
                            setMake(e.target.value.toUpperCase())
                          }
                          required
                          autoCapitalize="characters"
                          autoCorrect="off"
                          spellCheck={false}
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
                          onChange={(e) =>
                            setModel(e.target.value.toUpperCase())
                          }
                          required
                          autoCapitalize="characters"
                          autoCorrect="off"
                          spellCheck={false}
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
                          inputMode="numeric"
                          maxLength={4}
                          onChange={(e) =>
                            setYear(e.target.value.toUpperCase())
                          }
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
                          onChange={(e) => setBodyType(e.target.value)}
                          className={INPUT}
                        >
                          {dbBodyTypes.length > 0
                            ? dbBodyTypes.map((bt) => (
                              <option key={bt.code} value={bt.name}>
                                {bt.name.toUpperCase()}
                              </option>
                            ))
                            : BODY_TYPES.map((bt) => (
                              <option key={bt} value={bt}>
                                {bt.toUpperCase()}
                              </option>
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
                          onChange={(e) => setFuelType(e.target.value)}
                          className={INPUT}
                        >
                          {FUEL_TYPES.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.label.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </div>

                  {/* ── SECTION 2: PHYSICAL SERIAL IDENTIFIERS (Chassis & Optional Engine No) ── */}
                  <div className="border-t border-slate-100 pt-7 space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-slate-200/60">
                      <span className="text-base font-semibold text-slate-900">
                        Vehicle identifiers
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Chassis / VIN is mandatory &bull; Engine number is
                        optional
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field
                        label="Chassis / VIN Number"
                        required
                        isFilled={Boolean(chassisNo.trim())}
                        hasError={attemptedTabs[2] && !chassisNo.trim()}
                        errorMessage="Chassis / VIN Number is required"
                        fieldId="chassisNo"
                        hint="Standard 17-digit VIN or JDM Frame Number"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              {chassisNo.length === 17 &&
                                !chassisNo.includes("-") ? (
                                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  ✓ Standard 17-Digit VIN
                                </span>
                              ) : (chassisNo.length >= 8 &&
                                chassisNo.length <= 16) ||
                                (chassisNo.includes("-") &&
                                  chassisNo.length >= 8 &&
                                  chassisNo.length <= 20) ? (
                                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-sky-100 text-sky-800 border border-sky-300">
                                  ✓ JDM / Frame No. ({chassisNo.length} chars)
                                </span>
                              ) : chassisNo.length > 20 ? (
                                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                  ⚠️ {chassisNo.length} chars (Too long)
                                </span>
                              ) : chassisNo.length > 0 ? (
                                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  {chassisNo.length} chars (Typing...)
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400 font-mono">
                                  17-digit VIN or JDM Frame No.
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={handlePasteCleanVIN}
                              className="min-h-9 px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 transition cursor-pointer flex items-center gap-1"
                              title="Paste VIN or JDM Frame No. from clipboard"
                            >
                              <span>📋 Paste &amp; Clean</span>
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              id="input-chassisNo"
                              ref={chassisInputRef}
                              value={chassisNo}
                              onChange={(e) =>
                                setChassisNo(
                                  e.target.value
                                    .replace(/[^a-zA-Z0-9-]/g, "")
                                    .toUpperCase()
                                    .slice(0, 20),
                                )
                              }
                              required
                              autoCapitalize="characters"
                              autoCorrect="off"
                              spellCheck={false}
                              autoComplete="off"
                              maxLength={20}
                              placeholder="VIN or JDM frame number"
                              className={`${INPUT} font-mono font-bold text-sm tracking-wider uppercase ${make && model && !chassisNo
                                ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/20"
                                : ""
                                }`}
                            />
                            {make && model && !chassisNo && (
                              <span className="mt-2 block text-xs text-emerald-700">
                                ENTER CHASSIS
                              </span>
                            )}
                          </div>
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
                          onChange={(e) =>
                            setEngineNo(e.target.value.toUpperCase())
                          }
                          autoCapitalize="characters"
                          autoCorrect="off"
                          spellCheck={false}
                          placeholder="E.G. 1UR-894012 (OPTIONAL)"
                          className={`${INPUT} font-mono uppercase text-sm`}
                        />
                      </Field>
                    </div>
                  </div>

                  {/* ── SECTION 3: TECHNICAL ENGINE SPECS (CC & Cylinders Kept - Axles & Tyres Removed) ── */}
                  <div className="border-t border-slate-100 pt-7 space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-slate-100">
                      <span className="text-base font-semibold text-slate-900">
                        Engine specifications
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
                        <div className="space-y-2">
                          <input
                            id="input-engineCC"
                            inputMode="numeric"
                            value={engineCC}
                            onChange={(e) =>
                              setEngineCC(e.target.value.toUpperCase())
                            }
                            required
                            placeholder="2400"
                            className={INPUT + " font-mono font-bold text-sm"}
                          />
                          <details className="pt-1">
                            <summary className="w-fit cursor-pointer text-xs font-medium text-slate-500 hover:text-emerald-800">
                              Common engine sizes
                            </summary>
                            <div className="pt-3">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-xs font-bold text-slate-400 uppercase">
                                  Quick CC:
                                </span>
                                {[
                                  "1500",
                                  "1800",
                                  "2000",
                                  "2400",
                                  "2700",
                                  "3000",
                                  "3500",
                                ].map((cc) => (
                                  <button
                                    key={cc}
                                    type="button"
                                    onClick={() => setEngineCC(cc)}
                                    className="min-h-9 px-2.5 py-1.5 text-xs font-mono font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded border border-slate-200 transition cursor-pointer"
                                  >
                                    {cc}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </details>
                        </div>
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
                          onChange={(e) => setCylinders(e.target.value)}
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
                </div>
              )}
              {activeTab === 3 && (
                <div className="space-y-5">
                  <StepHeading
                    title="Documents & Clearance"
                    description="Add the required clearance details and choose the approving officer."
                    missing={missingFieldsTab3.length}
                    attempted={attemptedTabs[3]}
                  />
                  <section>
                    <SectionHeading title="Customs clearance" />
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
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
                              onChange={(e) =>
                                setCustomsNo(e.target.value.toUpperCase())
                              }
                              required
                              autoCapitalize="characters"
                              autoCorrect="off"
                              spellCheck={false}
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
                            <div className="space-y-2">
                              <FlexibleDateInput
                                id="input-customsDate"
                                value={customsDate}
                                onChange={setCustomsDate}
                                required
                                placeholder="DD/MM/YYYY"
                              />
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-400 uppercase">
                                  Quick Date:
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setQuickDate(setCustomsDate, 0)
                                  }
                                  className="min-h-9 px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded border border-slate-200 transition cursor-pointer"
                                >
                                  Today
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setQuickDate(setCustomsDate, 1)
                                  }
                                  className="min-h-9 px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded border border-slate-200 transition cursor-pointer"
                                >
                                  Yesterday
                                </button>
                              </div>
                            </div>
                          </Field>
                        </>
                      )}
                      {!requiresCustomsStep && (
                        <div className="sm:col-span-2 p-3 rounded-lg bg-sky-50 border border-sky-200 text-xs text-sky-800 font-semibold flex items-center gap-2">
                          <span>ℹ️</span>
                          <span>
                            Customs documentation is not required for{" "}
                            <strong>
                              {activeServiceDef?.name || bookingType}
                            </strong>
                            . Customs fields are skipped for this service type.
                          </span>
                        </div>
                      )}
                    </div>
                  </section>
                  {/* ── Dynamic Custom Fields (from Service Type config) ── */}
                  {step3CustomFields.length > 0 && (
                    <div className="border-t border-slate-100 pt-7 space-y-5">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                        <span className="text-sm font-semibold text-slate-900">
                          Additional service details
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        {step3CustomFields.map((f) => (
                          <Field
                            key={f.fieldKey}
                            label={f.label || f.fieldKey}
                            required={f.required}
                            optional={!f.required}
                            isFilled={Boolean(
                              customFieldValues[f.fieldKey]?.trim(),
                            )}
                            hasError={
                              attemptedTabs[3] &&
                              f.required &&
                              !customFieldValues[f.fieldKey]?.trim()
                            }
                            errorMessage={`${f.label || f.fieldKey} is required`}
                            fieldId={`custom-${f.fieldKey}`}
                          >
                            {f.type === "date" ? (
                              <FlexibleDateInput
                                id={`input-custom-${f.fieldKey}`}
                                value={customFieldValues[f.fieldKey] || ""}
                                onChange={(val) =>
                                  setCustomFieldValues((prev) => ({
                                    ...prev,
                                    [f.fieldKey]: val,
                                  }))
                                }
                                required={f.required}
                                placeholder="DD/MM/YYYY"
                              />
                            ) : (
                              <input
                                id={`input-custom-${f.fieldKey}`}
                                type={f.type === "number" ? "number" : "text"}
                                value={customFieldValues[f.fieldKey] || ""}
                                onChange={(e) =>
                                  setCustomFieldValues((prev) => ({
                                    ...prev,
                                    [f.fieldKey]:
                                      f.type === "text"
                                        ? e.target.value.toUpperCase()
                                        : e.target.value,
                                  }))
                                }
                                required={f.required}
                                placeholder={`Enter ${f.label || f.fieldKey}`}
                                className={
                                  INPUT +
                                  (f.type === "text" ? " uppercase" : "")
                                }
                              />
                            )}
                          </Field>
                        ))}
                      </div>
                    </div>
                  )}
                  <section className="border-t border-slate-100 pt-7">
                    <SectionHeading title="Approval" />
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
                            onChange={(e) => {
                              const val = e.target.value;
                              setSupervisor(val);
                              const sObj = dbSupervisors.find(
                                (s) => s.name === val,
                              );
                              setSelectedSupervisorId(sObj ? sObj.id : "");
                            }}
                            required
                            className={`${INPUT} flex-1`}
                          >
                            <option value="">
                              -- SELECT APPROVING OFFICER --
                            </option>
                            {dbSupervisors
                              .filter((s) => s.isActive !== false)
                              .map((s) => {
                                const branchDisplay =
                                  s.station || s.branch?.name || "DVLA HQ";
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
                  </section>
                </div>
              )}
              {activeTab === 4 && (
                <div className="space-y-8">
                  <StepHeading
                    title="Review booking"
                    description="Check the plate and registration details before submitting to the logbook."
                    missing={totalRequiredFields - totalCompletedFields}
                    attempted={false}
                  />
                  {/* Ghana Digital Plate Visualizer Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center space-y-3 shadow-2xs">
                    <div className="w-full flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                      <span className="font-bold text-slate-800 uppercase tracking-wide">
                        Official Ghana Digital Plate
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded font-semibold bg-white border border-slate-200 text-slate-700">
                        {activeCategories.find((c) => c.id === classification)
                          ?.badge || "⚪ Private"}
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
                    <div className="w-full max-w-sm">
                      <label
                        htmlFor="review-classification"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Plate category
                      </label>
                      <select
                        id="review-classification"
                        value={classification}
                        onChange={(e) => setClassification(e.target.value)}
                        className={INPUT}
                      >
                        {activeCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <ReviewSection
                    title="Owner & filing"
                    onEdit={() => setActiveTab(1)}
                    rows={[
                      ["Service", activeServiceDef?.label || bookingType],
                      [
                        needsRegularPlateField
                          ? "Customized Plate"
                          : "Plate number",
                        regNo,
                      ],
                      ...(needsRegularPlateField && (regularPlateNo || (regularPlateFieldKey && customFieldValues[regularPlateFieldKey]))
                        ? [
                            [
                              regularPlateCustomField?.label || "Regular Statutory Number",
                              regularPlateNo || (regularPlateFieldKey ? customFieldValues[regularPlateFieldKey] : ""),
                            ] as [string, string],
                          ]
                        : []),
                      ["Owner", ownerName],
                      ["Phone", phone],
                      ["Address", address],
                      ["Receipt number", receiptNo],
                      ["Payment date", isoToDmy(receiptDate)],
                    ]}
                  />
                  {isTransfer && (
                    <ReviewSection
                      title="Previous owner"
                      onEdit={() => setActiveTab(1)}
                      rows={[
                        ["Name", oldOwnerName],
                        ["Phone", oldOwnerPhone],
                        ["Address", oldOwnerAddr],
                        [
                          activeServiceDef?.prevOwnerCustomLabel ||
                          "Transfer reference",
                          oldOwnerCustom,
                        ],
                      ]}
                    />
                  )}
                  <ReviewSection
                    title="Vehicle details"
                    onEdit={() => setActiveTab(2)}
                    rows={[
                      ["Make & model", [make, model].filter(Boolean).join(" ")],
                      ["Model year", year],
                      ["Body type", bodyType],
                      ["Fuel type", fuelType],
                      ["Chassis / VIN", chassisNo],
                      ["Engine number", engineNo],
                      ["Engine capacity", engineCC ? `${engineCC} CC` : ""],
                      ["Cylinders", cylinders],
                    ]}
                  />
                  <ReviewSection
                    title="Documents & approval"
                    onEdit={() => setActiveTab(3)}
                    rows={[
                      ...(requiresCustomsStep
                        ? ([
                          ["Customs reference", customsNo],
                          ["Clearance date", isoToDmy(customsDate)],
                        ] as Array<[string, string]>)
                        : ([
                          [
                            "Customs clearance",
                            "Not required for this service",
                          ],
                        ] as Array<[string, string]>)),
                      ["Approving officer", supervisor],
                      ...step3CustomFields.map(
                        (f) =>
                          [
                            f.label || f.fieldKey,
                            f.type === "date"
                              ? isoToDmy(customFieldValues[f.fieldKey] || "")
                              : customFieldValues[f.fieldKey],
                          ] as [string, string | undefined],
                      ),
                    ]}
                  />
                </div>
              )}
            </div>

            {/* Step Action Bar (Embedded in card, sleek, cute, compact - NO floating bottom pill!) */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 sm:px-5">
              <div className="flex items-center gap-2">
                {activeTab > 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab((activeTab - 1) as 1 | 2 | 3)}
                    className="inline-flex items-center gap-1 h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 transition cursor-pointer"
                  >
                    <span>←</span>
                    <span>Back</span>
                  </button>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Step 1 of 4
                  </span>
                )}
                <span className="hidden sm:inline-block text-[11px] text-slate-400">
                  · {totalCompletedFields} of {totalRequiredFields} required complete
                </span>
              </div>
              <div className="flex items-center gap-2">
                {activeTab < 4 ? (
                  <button
                    key="continue"
                    type="button"
                    onClick={
                      activeTab === 1
                        ? handleNextTab1
                        : activeTab === 2
                          ? handleNextTab2
                          : handleNextTab3
                    }
                    className="inline-flex items-center gap-1.5 h-8 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:scale-95 px-3.5 text-xs font-bold text-white shadow-2xs transition cursor-pointer"
                  >
                    <span>
                      {activeTab === 1
                        ? "Next: Vehicle Specs"
                        : activeTab === 2
                          ? "Next: Documents & Filing"
                          : "Review Booking"}
                    </span>
                    <span>→</span>
                  </button>
                ) : (
                  <button
                    key="submit"
                    type="submit"
                    className="inline-flex items-center gap-1.5 h-8 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:scale-95 px-4 text-xs font-bold text-white shadow-2xs transition cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
                    <span>Certify & Submit</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <aside
            className="hidden min-w-0 space-y-3.5 xl:sticky xl:top-6 xl:block"
            aria-label="Booking summary"
          >
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3 shadow-2xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Booking summary
              </h2>
              <div className="my-2 w-full">
                <DigitalPlate
                  plateNumber={regNo || "PENDING"}
                  category={classification as PlateCategory}
                  region="GREATER ACCRA"
                  slogan="GREATER ACCRA"
                  vin={chassisNo || "PENDING"}
                  make={make || "VEHICLE"}
                />
              </div>
              <dl className="space-y-2 text-xs">
                <div>
                  <dt className="text-[10px] uppercase font-semibold text-slate-400">
                    {needsRegularPlateField ? "Custom Plate" : "Plate"}
                  </dt>
                  <dd className="mt-0.5 break-words font-semibold text-slate-900 font-mono">
                    {regNo || "Not entered"}
                  </dd>
                </div>
                {needsRegularPlateField && (regularPlateNo || (regularPlateFieldKey && customFieldValues[regularPlateFieldKey])) && (
                  <div>
                    <dt className="text-[10px] uppercase font-semibold text-slate-400">
                      {regularPlateCustomField?.label || "Regular Plate"}
                    </dt>
                    <dd className="mt-0.5 break-words font-semibold text-slate-900 font-mono">
                      {regularPlateNo || (regularPlateFieldKey ? customFieldValues[regularPlateFieldKey] : "")}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-[10px] uppercase font-semibold text-slate-400">Owner</dt>
                  <dd className="mt-0.5 break-words font-semibold text-slate-900">
                    {ownerName || "Not entered"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase font-semibold text-slate-400">Vehicle</dt>
                  <dd className="mt-0.5 break-words font-semibold text-slate-900">
                    {make || model ? `${make} ${model} ${year}` : "Not entered"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase font-semibold text-slate-400">Service</dt>
                  <dd className="mt-0.5 break-words text-slate-700">
                    {activeServiceDef?.label || bookingType}
                  </dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => setActiveTab(4)}
                className="mt-2 h-8 w-full rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
              >
                Preview & review →
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Progress</span>
                <span className="text-emerald-700 font-mono">
                  {overallCompletionPercent}%
                </span>
              </div>
              <div
                role="progressbar"
                aria-label="Required fields completed"
                aria-valuenow={overallCompletionPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-1.5 overflow-hidden rounded-full bg-slate-100"
              >
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all"
                  style={{ width: `${overallCompletionPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                {totalCompletedFields} of {totalRequiredFields} required fields complete
              </p>
              <div className="mt-2 space-y-1">
                {(
                  [
                    {
                      id: 1,
                      label: "Owner & filing",
                      missing: missingFieldsTab1,
                    },
                    { id: 2, label: "Vehicle", missing: missingFieldsTab2 },
                    { id: 3, label: "Documents", missing: missingFieldsTab3 },
                  ] as const
                ).map((step) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveTab(step.id)}
                    className="flex h-7 w-full items-center justify-between gap-2 rounded-md px-1.5 text-left text-xs hover:bg-slate-50 transition cursor-pointer"
                  >
                    <span className="text-slate-700">{step.label}</span>
                    <span
                      className={
                        step.missing.length
                          ? "text-[11px] font-medium text-slate-400"
                          : "text-[11px] font-semibold text-emerald-700"
                      }
                    >
                      {step.missing.length
                        ? `${step.missing.length} left`
                        : "✓ Complete"}
                    </span>
                  </button>
                ))}
              </div>
              <details className="mt-2 border-t border-slate-100 pt-2">
                <summary className="cursor-pointer text-[11px] font-semibold text-slate-500 hover:text-slate-700">
                  View missing fields
                </summary>
                <div className="mt-1.5 space-y-0.5">
                  {(
                    [
                      { id: 1, fields: missingFieldsTab1 },
                      { id: 2, fields: missingFieldsTab2 },
                      { id: 3, fields: missingFieldsTab3 },
                    ] as const
                  ).flatMap((step) =>
                    step.fields.map((field) => (
                      <button
                        key={field.id}
                        type="button"
                        onClick={() => focusField(field.id, step.id)}
                        className="block h-6 w-full rounded px-1.5 py-0.5 text-left text-[11px] text-slate-600 hover:bg-slate-50 transition cursor-pointer truncate"
                      >
                        {field.label} →
                      </button>
                    )),
                  )}
                  {overallCompletionPercent === 100 && (
                    <p className="text-[11px] font-semibold text-emerald-700">
                      All required fields complete.
                    </p>
                  )}
                </div>
              </details>
            </div>
          </aside>
        </form>
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
                      station:
                        newSupervisorStation.trim().toUpperCase() ||
                        (sessionUser?.branch?.name
                          ? String(sessionUser.branch.name).toUpperCase()
                          : "DVLA ADENTA"),
                      branchId:
                        sessionUser?.branchId ||
                        sessionUser?.branch?.id ||
                        undefined,
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
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Full Legal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSupervisorName}
                  onChange={(e) =>
                    setNewSupervisorName(e.target.value.toUpperCase())
                  }
                  placeholder="E.G. KWAME MENSAH"
                  className={INPUT}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Station / Branch
                </label>
                <input
                  type="text"
                  value={newSupervisorStation}
                  onChange={(e) =>
                    setNewSupervisorStation(e.target.value.toUpperCase())
                  }
                  placeholder="E.G. DVLA ADENTA"
                  className={INPUT}
                />
              </div>

              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                <span className="font-bold">🛡️ Auto-Assigned Badge:</span> A
                unique certified supervisor badge (e.g. SUP-XXXX) will be
                automatically assigned upon creation.
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
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[300px] text-slate-500 font-medium text-xs bg-white rounded-xl border border-slate-200">
          Loading Booking Desk Registry...
        </div>
      }
    >
      <BookingDeskContent />
    </Suspense>
  );
}
