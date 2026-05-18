"use client";

import { Fragment, useRef, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { ViewType } from "./ViewSelector";

type OptionWithCount = {
  value: string;
  count: number;
  selected: boolean;
};

type FiltersProps = {
  streams: OptionWithCount[];
  levels: OptionWithCount[];
  subjects: OptionWithCount[];
  centres: OptionWithCount[];
  tutors: OptionWithCount[];
  filters: {
    subject: string[];
    centre: string[];
    tutor: string[];
    level: string[];
    stream: string | null;
  };
  onFilterChange: (filters: FiltersProps["filters"]) => void;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  totalCount: number;
  showViewToggle?: boolean;
  openUpward?: boolean;
};

function truncateText(text: string, maxLength: number = 25): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

function streamLabel(stream: string): string {
  if (stream === "Secondary (Express)") return "Sec Express";
  if (stream === "Secondary (IP)") return "Sec IP";
  return stream;
}

function MultiSelect({
  label,
  selected,
  options,
  onChange,
  disabled = false,
  compact = false,
  openUpward = false,
}: {
  label: string;
  selected: string[];
  options: OptionWithCount[];
  onChange: (newSelected: string[]) => void;
  disabled?: boolean;
  compact?: boolean;
  openUpward?: boolean;
}) {
  const [filterDropdownMaxHeight, setFilterDropdownMaxHeight] = useState<string>("320px");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayText =
    selected.length > 0
      ? selected.map((s) => truncateText(s, 20)).join(", ")
      : label;

  const recalcHeight = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const available = openUpward
        ? rect.top - 20
        : window.innerHeight - rect.bottom - 20;
      setFilterDropdownMaxHeight(`${Math.max(100, available)}px`);
    }
  };

  return (
    <div className={compact ? "relative" : "flex flex-col gap-2"} ref={dropdownRef}>
      {!compact && (
        <label className="text-sm font-semibold text-gray-700">{label}</label>
      )}
      <Listbox value={selected} onChange={onChange} multiple disabled={disabled}>
        {() => {
          return (
            <div className={compact ? "" : "relative mt-1"}>
              <Listbox.Button
                className={`relative cursor-default rounded-xl text-left transition-all duration-200 focus:outline-none focus:ring-0 ${
                  compact
                    ? "flex items-center justify-between gap-2 pl-3.5 pr-2.5 py-2 text-sm min-w-[90px] max-w-[190px]"
                    : "w-full flex items-center gap-2 p-3 pr-3"
                } ${
                  disabled
                    ? "bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-100"
                    : selected.length > 0
                    ? "bg-blue-50 border border-blue-400 text-blue-700"
                    : "bg-white border border-gray-200 hover:border-gray-400"
                }`}
                disabled={disabled}
                title={selected.length > 0 ? selected.join(", ") : undefined}
                onMouseDown={recalcHeight}
              >
                <span className={`truncate flex-1 ${selected.length > 0 ? "text-gray-800" : "text-gray-400"}`}>
                  {displayText}
                </span>
                {selected.length > 0 && !disabled ? (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); onChange([]); }}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onChange([]); } }}
                    className="text-gray-400 hover:text-gray-600 text-lg leading-none flex-shrink-0 cursor-pointer"
                    aria-label="Clear selection"
                  >
                    ×
                  </span>
                ) : (
                  <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </Listbox.Button>
              <Transition as={Fragment}>
                <Listbox.Options
                  style={{ maxHeight: filterDropdownMaxHeight }}
                  className={`absolute z-50 w-full min-w-[160px] rounded-xl bg-white border border-gray-200 shadow-xl list-none overflow-y-auto focus:outline-none text-sm ${
                    openUpward ? "bottom-full mb-2" : "mt-2"
                  }`}
                >
                  {options.map((option) => (
                    <Listbox.Option key={option.value} value={option.value} as={Fragment} disabled={option.count === 0}>
                      {({ active }) => (
                        <li
                          onClick={(e) => {
                            if (option.count === 0 || disabled) { e.preventDefault(); e.stopPropagation(); return; }
                            onChange(
                              selected.includes(option.value)
                                ? selected.filter((s) => s !== option.value)
                                : [...selected, option.value]
                            );
                          }}
                          className={`select-none p-2 flex items-center gap-2 ${
                            option.count === 0 ? "text-gray-400 cursor-not-allowed" : "cursor-pointer"
                          } ${active && option.count > 0 ? "bg-blue-100" : ""} ${
                            disabled ? "text-gray-400 cursor-not-allowed" : ""
                          } ${option.selected ? "bg-blue-50 font-medium" : ""}`}
                          title={option.value}
                        >
                          <div className="flex-shrink-0 w-4 h-4 border border-gray-300 rounded flex items-center justify-center bg-white">
                            {option.selected && (
                              <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 flex justify-between items-center min-w-0">
                            <span className={`truncate ${option.count === 0 ? "line-through" : ""}`}>
                              {option.value}
                            </span>
                          </div>
                        </li>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          );
        }}
      </Listbox>
    </div>
  );
}

export default function Filters({
  streams,
  levels,
  subjects,
  centres,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  tutors,
  filters,
  onFilterChange,
  currentView,
  onViewChange,
  totalCount,
  showViewToggle = true,
  openUpward = false,
}: FiltersProps) {
  const setFilter = (field: keyof FiltersProps["filters"], value: string[] | string | null) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const hasActiveFilters =
    filters.stream !== null ||
    filters.level.length > 0 ||
    filters.subject.length > 0 ||
    filters.centre.length > 0;

  return (
    <div className={`flex flex-col ${openUpward ? "gap-5" : "gap-4"}`}>
      {/* Stream pills */}
      <div className={openUpward ? "flex flex-col gap-2.5" : "flex items-center gap-2 flex-wrap"}>
        <span className="text-xs font-bold uppercase tracking-widest text-gray-600 flex-shrink-0">
          Stream
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {streams.map((stream) => (
            <button
              key={stream.value}
              onClick={() => setFilter("stream", filters.stream === stream.value ? null : stream.value)}
              className={`inline-flex items-center gap-2 rounded-full border font-semibold transition-all duration-150 flex-shrink-0 ${
                openUpward ? "px-4 py-2 text-sm" : "px-3.5 py-2 text-sm"
              } ${
                filters.stream === stream.value
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {streamLabel(stream.value)}
              <span className={`font-bold tabular-nums px-1 py-px rounded-full ${
                openUpward ? "text-xs" : "text-xs"
              } ${
                filters.stream === stream.value
                  ? "bg-white/20 text-white"
                  : "bg-black/5 text-gray-500"
              }`}>
                {stream.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Dropdowns */}
      {openUpward ? (
        // Mobile: each filter on its own labelled row, full width
        <div className="flex flex-col gap-4">
          <MultiSelect label="Level" selected={filters.level} options={levels} onChange={(val) => setFilter("level", val)} openUpward={openUpward} />
          <MultiSelect label="Subject" selected={filters.subject} options={subjects} onChange={(val) => setFilter("subject", val)} openUpward={openUpward} />
          <MultiSelect label="Centre" selected={filters.centre} options={centres} onChange={(val) => setFilter("centre", val)} openUpward={openUpward} />
        </div>
      ) : (
        // Desktop: compact pills in one row + optional view toggle
        <div className="flex items-center gap-2 flex-wrap">
          <MultiSelect compact label="Level" selected={filters.level} options={levels} onChange={(val) => setFilter("level", val)} openUpward={openUpward} />
          <MultiSelect compact label="Subject" selected={filters.subject} options={subjects} onChange={(val) => setFilter("subject", val)} openUpward={openUpward} />
          <MultiSelect compact label="Centre" selected={filters.centre} options={centres} onChange={(val) => setFilter("centre", val)} openUpward={openUpward} />

          {showViewToggle && (
            <div className="ml-auto flex bg-white border border-gray-200 rounded-xl p-0.5 gap-0.5 flex-shrink-0">
              <button
                onClick={() => onViewChange("calendar")}
                className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                  currentView === "calendar" ? "bg-blue-50 text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Calendar
              </button>
              <button
                onClick={() => onViewChange("list")}
                className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                  currentView === "list" ? "bg-blue-50 text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                List
              </button>
            </div>
          )}
        </div>
      )}

      {/* Summary row — visible when any filter is active */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-gray-500">
            <span className="font-bold text-blue-600">{totalCount}</span> classes
          </span>

          {filters.stream && (
            <button
              onClick={() => setFilter("stream", null)}
              className="bg-white border border-gray-200 rounded-full px-2.5 py-0.5 text-xs font-medium flex items-center gap-1 hover:border-red-300 transition-colors"
            >
              {streamLabel(filters.stream)} <span className="text-gray-400 ml-0.5">×</span>
            </button>
          )}
          {filters.level.map((l) => (
            <button key={l} onClick={() => setFilter("level", filters.level.filter((x) => x !== l))}
              className="bg-white border border-gray-200 rounded-full px-2.5 py-0.5 text-xs font-medium flex items-center gap-1 hover:border-red-300 transition-colors">
              {l} <span className="text-gray-400 ml-0.5">×</span>
            </button>
          ))}
          {filters.subject.map((s) => (
            <button key={s} onClick={() => setFilter("subject", filters.subject.filter((x) => x !== s))}
              className="bg-white border border-gray-200 rounded-full px-2.5 py-0.5 text-xs font-medium flex items-center gap-1 hover:border-red-300 transition-colors">
              {s} <span className="text-gray-400 ml-0.5">×</span>
            </button>
          ))}
          {filters.centre.map((c) => (
            <button key={c} onClick={() => setFilter("centre", filters.centre.filter((x) => x !== c))}
              className="bg-white border border-gray-200 rounded-full px-2.5 py-0.5 text-xs font-medium flex items-center gap-1 hover:border-red-300 transition-colors">
              {c} <span className="text-gray-400 ml-0.5">×</span>
            </button>
          ))}

          <button
            onClick={() => onFilterChange({ subject: [], centre: [], tutor: [], level: [], stream: null })}
            className="text-xs text-gray-400 hover:text-red-500 font-medium ml-1 transition-colors underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
