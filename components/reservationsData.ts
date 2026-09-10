export interface Reservation {
  id: string;
  type: "Single" | "Range";
  platePattern?: string; // For single plate, e.g., "AB 1111-AD"
  rangeStart?: number;   // For range block, e.g., 9000
  rangeEnd?: number;     // For range block, e.g., 9099
  prefix: string;        // e.g., "AD"
  year: string;          // e.g., "26"
  holder: string;
  authRef: string;
  expiryDate: string;
  status: "Active" | "Alert" | "Expired";
  claimedCount: number;
  totalCount: number;
}

export const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: "res-gaf-01",
    type: "Range",
    rangeStart: 9000,
    rangeEnd: 9099,
    prefix: "AD",
    year: "26",
    holder: "Ghana Armed Forces (GAF HQ)",
    authRef: "MOD-GAF-SEC-2026-01",
    expiryDate: "2028-12-31",
    status: "Active",
    claimedCount: 24,
    totalCount: 100,
  },
  {
    id: "res-pres-02",
    type: "Range",
    rangeStart: 8500,
    rangeEnd: 8550,
    prefix: "AD",
    year: "26",
    holder: "Office of the President (Fleet)",
    authRef: "OP-GOV-ALLOC-2026-04",
    expiryDate: "2028-06-30",
    status: "Active",
    claimedCount: 18,
    totalCount: 51,
  },
  {
    id: "res-dip-03",
    type: "Range",
    rangeStart: 1000,
    rangeEnd: 1099,
    prefix: "CD",
    year: "26",
    holder: "Diplomatic Corps (CD Mission)",
    authRef: "MFA-DIP-2026-08",
    expiryDate: "2027-12-31",
    status: "Active",
    claimedCount: 42,
    totalCount: 100,
  },
  {
    id: "res-pol-04",
    type: "Single",
    platePattern: "AD 1000-26",
    prefix: "AD",
    year: "26",
    holder: "Inspector General of Police (IGP)",
    authRef: "GPS-HQ-VIP-01",
    expiryDate: "2029-01-01",
    status: "Active",
    claimedCount: 1,
    totalCount: 1,
  }
];

/**
 * Fetches reservations from the Prisma database API.
 */
export async function fetchReservationsFromDB(): Promise<Reservation[]> {
  try {
    const res = await fetch("/api/reservations");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveStoredReservations(data);
        return data;
      }
    }
  } catch (e) {
    console.error("Failed to fetch reservations from DB API:", e);
  }
  return getStoredReservations();
}

/**
 * Creates a new reservation in the database via API.
 */
export async function createReservationInDB(reservation: Partial<Reservation>): Promise<Reservation | null> {
  try {
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reservation),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("Failed to create reservation in DB:", e);
  }
  return null;
}

/**
 * Gets reservations from localStorage on client-side, falling back to INITIAL_RESERVATIONS
 */
export function getStoredReservations(): Reservation[] {
  if (typeof window === "undefined") return INITIAL_RESERVATIONS;
  const stored = localStorage.getItem("dvla_reservations");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return INITIAL_RESERVATIONS;
    }
  }
  localStorage.setItem("dvla_reservations", JSON.stringify(INITIAL_RESERVATIONS));
  return INITIAL_RESERVATIONS;
}

/**
 * Saves reservations to localStorage
 */
export function saveStoredReservations(reservations: Reservation[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("dvla_reservations", JSON.stringify(reservations));
  }
}

/**
 * Checks if a given plate ID is reserved under any active single reservation or range block.
 * Returns the matching reservation record, or null if none matches.
 */
export function checkPlateReservation(plateId: string, reservations: Reservation[]): Reservation | null {
  if (!plateId) return null;
  
  const cleanPlate = plateId.trim().toUpperCase();
  
  // Parse partial plate input progressively as the user types
  const digitMatch = cleanPlate.match(/(\d+)/);
  if (!digitMatch) {
    // If no digits are typed yet, don't trigger match
    return null;
  }
  
  const numberIndex = digitMatch.index || 0;
  const numberPart = digitMatch[1];
  
  // Require at least 2 digits to prevent premature matching on a single digit
  if (numberPart.length < 2) {
    return null;
  }
  
  const prefixPart = cleanPlate.slice(0, numberIndex).replace(/[^A-Z]/g, "");
  const rest = cleanPlate.slice(numberIndex + numberPart.length);
  const yearMatch = rest.match(/(\d+)/);
  const yearPart = yearMatch ? yearMatch[1] : "";
  
  // Helper for progressive number matching inside a range
  const isPartialNumberMatch = (numStr: string, start: number, end: number): boolean => {
    const len = numStr.length;
    if (len === 0) return false;
    const num = parseInt(numStr, 10);
    if (isNaN(num)) return false;
    
    // Check possible multipliers to expand the typed digits to match the range bounds
    for (let k = 0; k <= 4; k++) {
      const mult = Math.pow(10, k);
      const minVal = num * mult;
      const maxVal = (num + 1) * mult - 1;
      
      if (minVal <= end && maxVal >= start) {
        return true;
      }
    }
    return false;
  };
  
  // Helper to parse pattern in a single reservation
  const parseSinglePattern = (pattern: string) => {
    const cleanPattern = pattern.trim().toUpperCase();
    const dMatch = cleanPattern.match(/(\d+)/);
    if (!dMatch) return null;
    const nIndex = dMatch.index || 0;
    const nPart = dMatch[1];
    const pPart = cleanPattern.slice(0, nIndex).replace(/[^A-Z]/g, "");
    const rPart = cleanPattern.slice(nIndex + nPart.length);
    const yMatch = rPart.match(/(\d+)/);
    const yPart = yMatch ? yMatch[1] : "";
    return { prefix: pPart, number: nPart, year: yPart };
  };

  for (const res of reservations) {
    if (res.status === "Expired") continue;
    
    // Check prefix compatibility: if user typed a prefix, it must progressively match
    if (prefixPart && !res.prefix.toUpperCase().startsWith(prefixPart)) {
      continue;
    }
    
    // Check year compatibility: if user typed a year, it must progressively match
    if (yearPart && !res.year.startsWith(yearPart)) {
      continue;
    }
    
    // 1. Check Single plate reservation
    if (res.type === "Single" && res.platePattern) {
      const parsedRes = parseSinglePattern(res.platePattern);
      if (parsedRes) {
        if (parsedRes.number.startsWith(numberPart)) {
          return res;
        }
      }
    }
    
    // 2. Check Range block reservation
    if (
      res.type === "Range" && 
      res.rangeStart !== undefined && 
      res.rangeEnd !== undefined
    ) {
      if (isPartialNumberMatch(numberPart, res.rangeStart, res.rangeEnd)) {
        return res;
      }
    }
  }
  
  return null;
}
