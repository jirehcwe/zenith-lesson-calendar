"use client";

import { Fragment, useRef, useEffect, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { ViewType } from "./ViewSelector";

type OptionWithCount = {
  value: string;
  count: number;
  selected: boolean;
};

type FiltersProps = {
  streams: string[];
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
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
};

// Helper function to truncate text
function truncateText(text: string, maxLength: number = 25): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

// Helper function to format location display text
function formatLocationDisplay(location: string): string {
  return location;
}

function MultiSelect({
  label,
  selected,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  selected: string[];
  options: OptionWithCount[];
  onChange: (newSelected: string[]) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterDropdownMaxHeight, setFilterDropdownMaxHeight] = useState<string>("320px");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLUListElement>(null);

  const displayText =
    selected.length > 0
      ? selected
          .map((s) => truncateText(formatLocationDisplay(s), 20))
          .join(", ")
      : `Select ${label}`;

  // Calculate max height based on available space from dropdown to bottom of screen
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const dropdown = dropdownRef.current;
      const dropdownRect = dropdown.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Calculate available space from dropdown bottom to viewport bottom
      // Leave some padding (e.g., 20px) for spacing
      const availableHeight = viewportHeight - dropdownRect.bottom - 20;
      
      // Set max height to available space, with a minimum of 100px
      const calculatedMaxHeight = Math.max(100, availableHeight);
      setFilterDropdownMaxHeight(`${calculatedMaxHeight}px`);
    }
  }, [isOpen]);

  return (
    <div className="flex flex-col space-y-2" ref={dropdownRef}>
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <Listbox
        value={selected}
        onChange={onChange}
        multiple
        disabled={disabled}
      >
        {({ open }) => {
          // Track open state
          if (open !== isOpen) {
            setIsOpen(open);
          }

          return (
            <div className="relative mt-1">
              <Listbox.Button
                className={`relative w-full cursor-default rounded-xl bg-white border-2 border-gray-200 p-3 text-left pr-10 transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-0 focus:border-gray-200 ${
                  disabled
                    ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100"
                    : "hover:border-blue-300"
                }`}
                disabled={disabled}
                title={
                  selected.length > 0
                    ? selected.map(formatLocationDisplay).join(", ")
                    : undefined
                }
              >
                <span className="block truncate">{displayText}</span>
                {selected.length > 0 && !disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange([]);
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
                    aria-label="Clear selection"
                  >
                    ×
                  </button>
                )}
              </Listbox.Button>
              <Transition as={Fragment}>
                <Listbox.Options
                  ref={optionsRef}
                  style={{ maxHeight: filterDropdownMaxHeight }}
                  className="absolute z-10 mt-2 w-full rounded-xl bg-white border-2 border-gray-200 shadow-xl list-none overflow-y-auto focus:outline-none"
                >
                  {options.map((option) => (
                    <Listbox.Option
                      key={option.value}
                      value={option.value}
                      as={Fragment}
                      disabled={option.count === 0}
                    >
                      {({ active }) => (
                        <li
                          onClick={(e) => {
                            if (option.count === 0 || disabled) {
                              e.preventDefault();
                              e.stopPropagation();
                              return;
                            }
                            onChange(
                              selected.includes(option.value)
                                ? selected.filter((s) => s !== option.value)
                                : [...selected, option.value]
                            );
                          }}
                          className={`select-none p-2 flex items-center gap-2 ${
                            option.count === 0
                              ? "text-gray-400 cursor-not-allowed"
                              : "cursor-pointer"
                          } ${
                            active && option.count > 0 ? "bg-blue-100" : ""
                          } ${
                            disabled ? "text-gray-400 cursor-not-allowed" : ""
                          } ${option.selected ? "bg-blue-50 font-medium" : ""}`}
                          title={formatLocationDisplay(option.value)}
                        >
                          {/* Checkbox indicator */}
                          <div className="flex-shrink-0 w-4 h-4 border border-gray-300 rounded flex items-center justify-center bg-white">
                            {option.selected && (
                              <svg
                                className="w-3 h-3 text-blue-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>

                          {/* Text content */}
                          <div className="flex-1 flex justify-between items-center min-w-0">
                            <span
                              className={`truncate ${
                                option.count === 0 ? "line-through" : ""
                              }`}
                            >
                              {formatLocationDisplay(option.value)}
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
  searchQuery,
  onSearchChange,
  currentView,
  onViewChange,
}: FiltersProps) {
  const setFilter = (
    field: keyof FiltersProps["filters"],
    value: string[] | string | null
  ) => {
    const newFilters = { ...filters, [field]: value };
    onFilterChange(newFilters);
  };

  return (
    <div className="space-y-4">
      {/* Search + view toggle row */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search subject or centre…"
            aria-label="Search subject or centre"
            className="rounded-xl border-2 border-gray-200 pl-9 pr-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none w-full max-w-xs"
          />
        </div>

        <div className="ml-auto flex bg-gray-100 rounded-xl p-1 gap-0.5">
          <button
            onClick={() => onViewChange("calendar")}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
              currentView === "calendar"
                ? "bg-blue-50 text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Calendar
          </button>
          <button
            onClick={() => onViewChange("list")}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
              currentView === "list"
                ? "bg-blue-50 text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            List
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col space-y-3">
          <label className="text-sm font-semibold text-gray-700">
            Select Stream
          </label>
          <div className="flex flex-wrap gap-3">
            {streams.map((stream) => (
              <button
                key={stream}
                onClick={() => setFilter("stream", stream)}
                className={`px-6 py-3 rounded-xl border-2 transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md transform hover:-translate-y-0.5 ${
                  filters.stream === stream
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-600 shadow-lg"
                    : "bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                }`}
              >
                {stream}
              </button>
            ))}
            {filters.stream && (
              <button
                type="button"
                onClick={() => setFilter("stream", null)}
                className="px-3 py-2 rounded-lg border-2 border-gray-200 bg-white text-gray-700 hover:border-red-400 hover:bg-red-50 transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md"
                aria-label="Clear stream selection"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Level Filter - Always show when stream is selected */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <MultiSelect
            label="Level"
            selected={filters.level}
            options={levels}
            onChange={(val) => setFilter("level", val)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MultiSelect
            label="Subject"
            selected={filters.subject}
            options={subjects}
            onChange={(val) => setFilter("subject", val)}
          />
          <MultiSelect
            label="Centre"
            selected={filters.centre}
            options={centres}
            onChange={(val) => setFilter("centre", val)}
          />
          {/* <MultiSelect
                label="Tutor"
                selected={filters.tutor}
                options={tutors}
                onChange={(val) => setFilter("tutor", val)}
              /> */}
        </div>
      </div>
    </div>
  );
}
