import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Comprehensive built-in catalog of Ghanaian given names, day names, surnames,
// and common English/Biblical names to guarantee instant autocomplete even on fresh DBs.
const COMMON_NAMES: string[] = [
  // Examples requested by user:
  "PATRICK", "PAS", "PASCAL", "PASI", "PASIVAL",
  // Common P names:
  "PAUL", "PAULINA", "PETER", "PHILIP", "PRINCE", "PROSPER", "PATIENCE", "PATRICIA", "PRISCILLA", "PERCY", "PRECIOUS", "PEACE", "PAPA", "PAA", "PADMORE",
  // Common Ghanaian day & given names (Male & Female):
  "KWAME", "KOFI", "KODJO", "KWABENA", "KWAKU", "YAO", "YAW", "KWEKU", "KOBINA", "KOJO", "FIIFI", "ATO", "EKOW", "KABENLA", "NII", "NANA", "OSEI", "OTU",
  "AKUA", "YAALEY", "ABA", "AMA", "ABENA", "AKOSUA", "AFIA", "ADWOA", "AFUA", "ARABA", "EFUA", "MANSA", "BAABA", "ESI", "NAA", "DZIDZOR", "ENAM", "ELIKEM", "MAWUSI", "SENAM", "SEDEM", "MAWUNYO", "KAFUI", "DELA", "AFI", "SENA", "EYRAM",
  // Common Ghanaian Surnames:
  "MENSAH", "BOATENG", "ASANTE", "ADDO", "ANSAH", "APPIAH", "BAAH", "BAIDOO", "DANKWAH", "DARKO", "FRIMPONG", "GYASI", "KUMI", "LAMPTEY", "LARTEY", "MARFO", "NKRUMAH", "NYARKO", "OPOKU", "QUAYE", "SACKEY", "SARPONG", "TAGOE", "YEBOAH", "OWUSU", "AGYEMAN",
  "ACKAH", "ACQUAH", "ADAMS", "ADJEI", "ADJETEY", "ADOMAKO", "AGYAPONG", "AGYEKUM", "AHMED", "AIDOO", "AKOTO", "ALLOTEY", "AMANKWAH", "AMOAH", "AMOAKO", "ANKRAH", "ANSONG", "ANTWI", "ARHIN", "ARTHUR", "ARYEE", "ASAMOAH", "ASARE", "ASHITEI", "ASIEDU", "ATTA", "AWUAH", "AYEH", "AYITEY", "BADU", "BEKOE", "BLAY", "BOADI", "BOAKYE", "BOAMAH", "BONSU", "BOTCHWAY", "DADZIE", "DANSO", "DONKOR", "DZISAH", "FORSON", "FREMPONG", "GYAMFI", "GYAN", "HAYFORD", "KORANTENG", "KORLEY", "KUSI", "KYEI", "MANTE", "NARTEY", "NIMAKO", "NINSON", "NTIAMOAH", "NUNOO", "OBENG", "ODAME", "ODONKOR", "OFFEI", "OFORI", "OKAI", "OKINE", "OKYERE", "OPPONG", "OTENG", "QUARTEY", "SAFO", "SAM", "SARFO", "SARKODIE", "SEFA", "SOWAH", "TACKIE", "TETTEH", "TWUM", "WIREDU", "YANKSON",
  // Common Muslim/Northern Ghanaian names:
  "MOHAMMED", "IBRAHIM", "ABDUL", "SULEMANA", "YUSSIF", "HARUNA", "ABUBAKAR", "IDDRISU", "ALHASSAN", "MUSTAPHA", "OSMAN", "BABA", "SALIFU", "SEIDU", "ISSAH", "YAKUBU", "ADAM", "DAUDA", "FUSEINI", "MUSAH", "AZIZ", "HAMZA", "TAHIRU", "MAHMUD", "SADIK", "HABIB", "ZAKARI",
  // Common Christian / English names:
  "AARON", "ABRAHAM", "ALEXANDER", "ALFRED", "ANDREW", "ANTHONY", "BENJAMIN", "BERNARD", "CHARLES", "CHRISTIAN", "CHRISTOPHER", "DANIEL", "DAVID", "DENNIS", "DOMINIC", "EDWARD", "EMMANUEL", "ERIC", "FELIX", "FRANCIS", "FRANK", "GEORGE", "GIDEON", "GODFRED", "ISAAC", "JAMES", "JOHN", "JOSEPH", "JOSHUA", "KELVIN", "KENNETH", "LAWRENCE", "MARK", "MATTHEW", "MICHAEL", "NATHANIEL", "NICHOLAS", "OLIVER", "RICHARD", "ROBERT", "SAMUEL", "STEPHEN", "SOLOMON", "THOMAS", "TIMOTHY", "VICTOR", "VINCENT", "WILLIAM"
];

// Titles to strip when tokenizing words
const TITLE_REGEX = /^(MR\.|MRS\.|MS\.|DR\.|HON\.|ALHAJI|ING\.|REV\.|PASTOR|PROF\.)\s*/gi;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get("q") || "";
    const cleanQuery = rawQuery.trim().toUpperCase().replace(/[^A-Z]/g, "");

    if (!cleanQuery || cleanQuery.length < 1) {
      return NextResponse.json({ suggestions: [], fullNames: [] });
    }

    const matchesSet = new Set<string>();
    const fullNamesSet = new Set<string>();

    // 1. First, search live database records if DB is online
    try {
      const [bookings, invoices, reservations] = await Promise.all([
        prisma.booking.findMany({
          where: {
            OR: [
              { owner: { contains: cleanQuery, mode: "insensitive" } },
              { previousOwnerName: { contains: cleanQuery, mode: "insensitive" } },
            ],
          },
          select: { owner: true, previousOwnerName: true },
          take: 40,
        }).catch(() => []),
        prisma.vrsInvoice.findMany({
          where: { ownerName: { contains: cleanQuery, mode: "insensitive" } },
          select: { ownerName: true },
          take: 40,
        }).catch(() => []),
        prisma.reservation.findMany({
          where: { holder: { contains: cleanQuery, mode: "insensitive" } },
          select: { holder: true },
          take: 40,
        }).catch(() => []),
      ]);

      const rawDbStrings: string[] = [];
      bookings.forEach(b => {
        if (b.owner) rawDbStrings.push(b.owner);
        if (b.previousOwnerName) rawDbStrings.push(b.previousOwnerName);
      });
      invoices.forEach(i => {
        if (i.ownerName) rawDbStrings.push(i.ownerName);
      });
      reservations.forEach(r => {
        if (r.holder) rawDbStrings.push(r.holder);
      });

      // Extract full names that start with query
      rawDbStrings.forEach(raw => {
        const cleaned = raw.replace(TITLE_REGEX, "").trim().toUpperCase();
        if (cleaned.startsWith(cleanQuery) && cleaned !== cleanQuery) {
          fullNamesSet.add(cleaned);
        }
        // Extract individual words that start with query
        const words = cleaned.split(/[\s,/-]+/).map(w => w.replace(/[^A-Z]/g, "").trim());
        words.forEach(w => {
          if (w.startsWith(cleanQuery) && w.length >= cleanQuery.length) {
            matchesSet.add(w);
          }
        });
      });
    } catch (dbErr) {
      // Graceful fallback to static catalog if DB is momentarily unreachable
      console.warn("DB suggest lookup bypassed, using catalog fallback:", dbErr);
    }

    // 2. Add matches from comprehensive built-in catalog in priority order
    const priorityOrderMap = new Map<string, number>();
    COMMON_NAMES.forEach((name, index) => {
      priorityOrderMap.set(name, index);
    });

    for (const name of COMMON_NAMES) {
      if (name.startsWith(cleanQuery)) {
        matchesSet.add(name);
      }
    }

    // 3. Sort words: known catalog priority first, then alphabetical
    const sortedWords = Array.from(matchesSet).sort((a, b) => {
      const pA = priorityOrderMap.has(a) ? priorityOrderMap.get(a)! : 10000;
      const pB = priorityOrderMap.has(b) ? priorityOrderMap.get(b)! : 10000;
      if (pA !== pB) return pA - pB;
      return a.localeCompare(b);
    });

    const sortedFullNames = Array.from(fullNamesSet).slice(0, 5);

    return NextResponse.json({
      query: cleanQuery,
      suggestions: sortedWords.slice(0, 10),
      fullNames: sortedFullNames,
    });
  } catch (error) {
    console.error("Error in /api/names/suggest:", error);
    return NextResponse.json({ suggestions: [], fullNames: [] }, { status: 500 });
  }
}
