"use client";

import { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";

type FiltersProps = {
  streams: string[];
  levels: string[];
  subjects: string[];
  centres: string[];
  tutors: string[];
  filters: {
    subject: string[];
    centre: string[];
    tutor: string[];
    level: string[];
    stream: string | null;
  };
  onFilterChange: (filters: FiltersProps["filters"]) => void;
};

function MultiSelect({
  label,
  selected,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  selected: string[];
  options: string[];
  onChange: (newSelected: string[]) => void;
  disabled?: boolean;
}) {
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
          >
            {selected.length > 0 ? selected.join(", ") : `Select ${label}`}
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
                <Listbox.Option key={option} value={option} as={Fragment}>
                  {({ active }) => (
                    <li
                      onClick={() =>
                        !disabled &&
                        onChange(
                          selected.includes(option)
                            ? selected.filter((s) => s !== option)
                            : [...selected, option]
                        )
                      }
                      className={`cursor-pointer select-none p-2 ${
                        active ? "bg-blue-100" : ""
                      } ${disabled ? "text-gray-400 cursor-not-allowed" : ""}`}
                    >
                      {option}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MultiSelect
            label="Level"
            selected={filters.level}
            options={levels}
            onChange={(val) => setFilter("level", val)}
          />
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
          <MultiSelect
            label="Tutor"
            selected={filters.tutor}
            options={tutors}
            onChange={(val) => setFilter("tutor", val)}
          />
        </div>
      )}
    </div>
  );
}
