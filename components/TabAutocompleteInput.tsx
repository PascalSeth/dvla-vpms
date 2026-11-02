"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";

export interface TabAutocompleteInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  onAcceptCompletion?: (completedName: string) => void;
}

export interface TabAutocompleteInputRef {
  focus: () => void;
  blur: () => void;
  input: HTMLInputElement | null;
}

// Client-side cache to make typing/backspacing instant (0ms latency)
const queryCache = new Map<string, { suggestions: string[]; fullNames: string[] }>();

// Built-in instant fallback catalog of top common Ghanaian & English names
const LOCAL_FALLBACK_NAMES = [
  "PATRICK", "PAS", "PASCAL", "PASI", "PASIVAL", "PAUL", "PAULINA", "PETER", "PHILIP", "PRINCE", "PROSPER",
  "KWAME", "KOFI", "KODJO", "KWABENA", "KWAKU", "YAO", "YAW", "KWEKU", "KOBINA", "KOJO",
  "MENSAH", "BOATENG", "ASANTE", "ADDO", "ANSAH", "APPIAH", "BAAH", "BAIDOO", "DANKWAH", "DARKO",
  "FRIMPONG", "GYASI", "KUMI", "LAMPTEY", "LARTEY", "MARFO", "NKRUMAH", "NYARKO", "OPOKU", "QUAYE",
  "SACKEY", "SARPONG", "TAGOE", "YEBOAH", "OWUSU", "AGYEMAN", "MOHAMMED", "IBRAHIM", "ABDUL", "SULEMANA",
  "YUSSIF", "HARUNA", "ABUBAKAR", "IDDRISU", "ALHASSAN", "MUSTAPHA", "OSMAN", "BABA", "SALIFU", "SEIDU",
  "EMMANUEL", "MICHAEL", "DANIEL", "DAVID", "JOSEPH", "JOHN", "JAMES", "SAMUEL", "ISAAC", "GIDEON"
];

export const TabAutocompleteInput = forwardRef<TabAutocompleteInputRef, TabAutocompleteInputProps>(
  (
    {
      value,
      onChange,
      placeholder = "ENTER FULL NAME",
      className = "",
      id,
      onAcceptCompletion,
      onKeyDown,
      onFocus,
      onBlur,
      ...rest
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const ghostRef = useRef<HTMLDivElement | null>(null);

    const [isFocused, setIsFocused] = useState(false);
    const [cursorPos, setCursorPos] = useState<number>(value.length);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [fullNames, setFullNames] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      input: inputRef.current,
    }));

    // Calculate current active token/word being typed at cursor position
    const textBeforeCursor = value.slice(0, cursorPos);
    const textAfterCursor = value.slice(cursorPos);

    // Match word characters right before cursor (e.g., "MR. PA" -> currentWord = "PA")
    const match = textBeforeCursor.match(/([A-Z0-9]+)$/i);
    const currentWord = match ? match[1].toUpperCase() : "";
    const prefixBeforeWord = match
      ? textBeforeCursor.slice(0, match.index)
      : textBeforeCursor;

    // Fetch or cache suggestions whenever currentWord changes
    useEffect(() => {
      if (!currentWord || currentWord.length < 1) {
        setSuggestions([]);
        setFullNames([]);
        setSelectedIndex(0);
        return;
      }

      // Check instant client cache
      if (queryCache.has(currentWord)) {
        const cached = queryCache.get(currentWord)!;
        setSuggestions(cached.suggestions);
        setFullNames(cached.fullNames);
        setSelectedIndex(0);
        return;
      }

      // Instant local fallback while fetching
      const instantMatches = LOCAL_FALLBACK_NAMES.filter((n) =>
        n.startsWith(currentWord)
      ).slice(0, 8);
      if (instantMatches.length > 0) {
        setSuggestions(instantMatches);
        setSelectedIndex(0);
      }

      // Debounced API fetch to query DB + server catalog
      let isCancelled = false;
      const timeoutId = setTimeout(async () => {
        try {
          const res = await fetch(`/api/names/suggest?q=${encodeURIComponent(currentWord)}`);
          if (!res.ok) return;
          const data = await res.json();
          if (isCancelled) return;

          const fetchedSuggestions: string[] = data.suggestions || [];
          const fetchedFullNames: string[] = data.fullNames || [];

          queryCache.set(currentWord, {
            suggestions: fetchedSuggestions,
            fullNames: fetchedFullNames,
          });

          setSuggestions(fetchedSuggestions);
          setFullNames(fetchedFullNames);
          setSelectedIndex(0);
        } catch {
          // If network / DB error, retain instantMatches
        }
      }, 120);

      return () => {
        isCancelled = true;
        clearTimeout(timeoutId);
      };
    }, [currentWord]);

    // Determine current ghost suffix for the active suggestion
    const activeSuggestion =
      suggestions.length > 0 && selectedIndex < suggestions.length
        ? suggestions[selectedIndex]
        : null;

    let ghostSuffix = "";
    if (activeSuggestion && currentWord && activeSuggestion.startsWith(currentWord)) {
      // Append a trailing space so user is immediately ready to type the 2nd name!
      ghostSuffix = activeSuggestion.slice(currentWord.length) + " ";
    }

    // Apply completion helper
    const applySuggestion = (completionWord: string) => {
      const completed = prefixBeforeWord + completionWord + " " + textAfterCursor;
      const newCursor = (prefixBeforeWord + completionWord + " ").length;
      onChange(completed.toUpperCase());
      setSuggestions([]);
      setFullNames([]);
      setCursorPos(newCursor);

      // Re-position cursor inside input on next tick
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(newCursor, newCursor);
        }
      }, 10);

      if (onAcceptCompletion) {
        onAcceptCompletion(completed.trim());
      }
    };

    // Apply full name completion helper (for entire customer names from past records)
    const applyFullName = (fullName: string) => {
      onChange(fullName.toUpperCase());
      setSuggestions([]);
      setFullNames([]);
      const newCursor = fullName.length;
      setCursorPos(newCursor);

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(newCursor, newCursor);
        }
      }, 10);

      if (onAcceptCompletion) {
        onAcceptCompletion(fullName);
      }
    };

    // Keydown handler: Tab, ArrowDown, ArrowUp, ArrowRight, Escape
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (onKeyDown) onKeyDown(e);
      if (e.defaultPrevented) return;

      // 1. TAB key or ARROW RIGHT (at end of current word): Accept completion
      if (e.key === "Tab" || (e.key === "ArrowRight" && cursorPos === textBeforeCursor.length)) {
        if (ghostSuffix && activeSuggestion) {
          e.preventDefault();
          applySuggestion(activeSuggestion);
          return;
        }
        // If no ghost suffix, allow normal Tab behavior (jumping to next field)
      }

      // 2. ARROW DOWN: Cycle to next suggestion
      if (e.key === "ArrowDown" && suggestions.length > 0) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }

      // 3. ARROW UP: Cycle to previous suggestion
      if (e.key === "ArrowUp" && suggestions.length > 0) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }

      // 4. ENTER: If suggestions are active, accept selection without submitting the form
      if (e.key === "Enter" && ghostSuffix && activeSuggestion) {
        e.preventDefault();
        applySuggestion(activeSuggestion);
        return;
      }

      // 5. ESCAPE: Dismiss suggestions
      if (e.key === "Escape") {
        setSuggestions([]);
        setFullNames([]);
        return;
      }
    };

    // Sync input selection and cursor position
    const handleSelectOrChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
      const pos = (e.target as HTMLInputElement).selectionStart ?? value.length;
      setCursorPos(pos);
    };

    return (
      <div className="relative w-full">
        {/* Main Input Wrapper with aligned Ghost Text overlay */}
        <div className="relative w-full">
          <input
            ref={inputRef}
            id={id}
            value={value}
            onChange={(e) => {
              onChange(e.target.value.toUpperCase());
              const pos = e.target.selectionStart ?? e.target.value.length;
              setCursorPos(pos);
            }}
            onKeyDown={handleKeyDown}
            onSelect={handleSelectOrChange}
            onClick={handleSelectOrChange}
            onKeyUp={handleSelectOrChange}
            onFocus={(e) => {
              setIsFocused(true);
              setCursorPos(e.target.selectionStart ?? value.length);
              if (onFocus) onFocus(e);
            }}
            onBlur={(e) => {
              // Delay hiding slightly to allow clicking suggestion pills
              setTimeout(() => {
                setIsFocused(false);
              }, 200);
              if (onBlur) onBlur(e);
            }}
            onScroll={(e) => {
              if (ghostRef.current) {
                ghostRef.current.scrollLeft = e.currentTarget.scrollLeft;
              }
            }}
            placeholder={placeholder}
            autoCapitalize="words"
            autoCorrect="off"
            spellCheck={false}
            className={className}
            {...rest}
          />

          {/* Ghost Text Overlay: renders pixel-perfect behind/over cursor */}
          {isFocused && ghostSuffix && (
            <div
              ref={ghostRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 px-3 py-2 text-xs font-medium uppercase tracking-wide flex items-center overflow-hidden whitespace-pre select-none text-transparent"
            >
              <span className="invisible">{textBeforeCursor}</span>
              <span className="text-slate-400 font-semibold tracking-wide">
                {ghostSuffix}
              </span>
            </div>
          )}
        </div>

        {/* Interactive Suggestion Pills Bar */}
        {isFocused && (suggestions.length > 0 || fullNames.length > 0) && currentWord.length >= 1 && (
          <div className="mt-1.5 p-2 bg-slate-50/90 border border-slate-200/80 rounded-lg shadow-xs space-y-1.5 transition-all">
            {/* Word completions */}
            {suggestions.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px] font-mono font-bold shadow-xs">
                    TAB ⇥
                  </kbd>
                  to complete:
                </span>
                {suggestions.map((s, idx) => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault(); // Don't steal focus from input
                      applySuggestion(s);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide transition cursor-pointer border ${
                      idx === selectedIndex
                        ? "bg-[#81B71A]/20 text-[#4c6f0d] border-[#81B71A]/60 ring-1 ring-[#81B71A]/40 font-extrabold"
                        : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Full customer record suggestions (from past bookings / invoices) */}
            {fullNames.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200/60">
                <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">
                  Past Clients:
                </span>
                {fullNames.map((fn) => (
                  <button
                    key={fn}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyFullName(fn);
                    }}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition cursor-pointer"
                    title="Click to fill entire customer name"
                  >
                    👤 {fn}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

TabAutocompleteInput.displayName = "TabAutocompleteInput";
export default TabAutocompleteInput;

