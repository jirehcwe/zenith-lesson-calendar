"use client";

import { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";

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
};

// Helper function to truncate text
function truncateText(text: string, maxLength: number = 25): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
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
  const displayText =
    selected.length > 0
      ? selected.map((s) => truncateText(s, 20)).join(", ")
      : `Select ${label}`;

  return (
    <div className="flex flex-col">
      <label className="text-sm font-semibold">{label}</label>
      <Listbox
        value={selected}
        onChange={onChange}
        multiple
        disabled={disabled}
      >
        <div className="relative mt-1">
          <Listbox.Button
            className={`relative w-full cursor-default rounded-lg bg-white border p-2 text-left pr-8 ${
              disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""
            }`}
            disabled={disabled}
            title={selected.length > 0 ? selected.join(", ") : undefined}
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
            <Listbox.Options className="absolute z-10 mt-1 w-full rounded-md bg-white border shadow-lg list-none max-h-80 overflow-y-auto">
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
                      } ${active && option.count > 0 ? "bg-blue-100" : ""} ${
                        disabled ? "text-gray-400 cursor-not-allowed" : ""
                      } ${option.selected ? "bg-blue-50 font-medium" : ""}`}
                      title={option.value}
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
}: FiltersProps) {
  const setFilter = (
    field: keyof FiltersProps["filters"],
    value: string[] | string | null
  ) => {
    const newFilters = { ...filters, [field]: value };
    onFilterChange(newFilters);
  };

  const isStreamSelected = filters.stream !== null;

  return (
    <div className="space-y-4 mb-6">
      {/* Stream Filter - Button Style */}
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-semibold text-gray-700">
          Select Stream
        </label>
        <div className="flex flex-wrap gap-2">
          {streams.map((stream) => (
            <button
              key={stream}
              onClick={() => setFilter("stream", stream)}
              className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 font-medium ${
                filters.stream === stream
                  ? "bg-blue-600 text-white border-blue-600 shadow-md"
                  : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
              }`}
            >
              {stream}
            </button>
          ))}
        </div>
      </div>

      {/* Other Filters - Dropdown Style (Only show when stream is selected) */}
      {isStreamSelected && (
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

          {/* Subject, Centre, Tutor - Only show when level is selected */}
          {filters.level.length > 0 && (
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
          )}
        </div>
      )}
    </div>
  );
}
