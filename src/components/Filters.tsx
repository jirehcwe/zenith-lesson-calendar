"use client";

import { Fragment, useEffect, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";

type FiltersProps = {
  subjects: string[];
  topics: string[];
  centres: string[];
  tutors: string[];
  // Optional. When non-empty, renders a Type filter pill (e.g. "Crash Course"
  // vs "Exam Simulation"). Slugs without variants pass [] / omit it and the
  // pill is hidden.
  types?: string[];
  filters: {
    subject: string[];
    topic: string[];
    centre: string[];
    tutor: string[];
    type: string[];
  };
  onFilterChange: (filters: FiltersProps["filters"]) => void;
  // Transform applied to subject option values for display in the UI.
  // Filter state keeps the raw value; only the rendered label differs.
  subjectLabel?: (code: string) => string;
};

function MultiSelect({
  label,
  selected,
  options,
  onChange,
  optionLabel,
}: {
  label: string;
  selected: string[];
  options: string[];
  onChange: (newSelected: string[]) => void;
  optionLabel?: (value: string) => string;
}) {
  const displayOf = (v: string) => optionLabel?.(v) ?? v;
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((o) => o !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="flex flex-col">
      <label className="text-sm font-semibold">{label}</label>
      <Listbox value={selected} onChange={onChange} multiple>
        <div className="relative mt-1">
          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all p-2 text-left flex items-center justify-between">
            <span className="truncate">
              {selected.length > 0
                ? selected.map(displayOf).join(", ")
                : `Select ${label}`}
            </span>
            {selected.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
                className="ml-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                title={`Clear all ${label.toLowerCase()} filters`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </Listbox.Button>
          <Transition as={Fragment}>
            <Listbox.Options
              className={`absolute z-10 mt-1 w-full rounded-md bg-white border shadow-lg list-none ${
                label === "Centre" &&
                typeof window !== "undefined" &&
                window.innerWidth < 768
                  ? ""
                  : "max-h-60 overflow-auto"
              }`}
            >
              {options.map((option) => (
                <Listbox.Option key={option} value={option} as={Fragment}>
                  {({ active }) => (
                    <li
                      onClick={() => toggleOption(option)}
                      className={`cursor-pointer select-none p-2 ${
                        active ? "bg-blue-100" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(option)}
                        readOnly
                        className="mr-2"
                      />
                      {displayOf(option)}
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

const FILTERS_COLLAPSED_STORAGE_KEY = "crashCourseFiltersCollapsed";

export default function Filters({
  subjects,
  topics,
  centres,
  types,
  filters,
  onFilterChange,
  subjectLabel,
}: FiltersProps) {
  const hasTypeFilter = (types?.length ?? 0) > 0;
  const hasTopicFilter = topics.length > 0;
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(FILTERS_COLLAPSED_STORAGE_KEY);
    if (stored !== null) setCollapsed(stored === "true");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(FILTERS_COLLAPSED_STORAGE_KEY, String(collapsed));
    }
  }, [collapsed, hydrated]);

  const setFilter = (field: keyof FiltersProps["filters"], value: string[]) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const activeCount =
    filters.subject.length +
    (hasTopicFilter ? filters.topic.length : 0) +
    filters.centre.length +
    (hasTypeFilter ? filters.type.length : 0);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 border-b pb-2">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
          aria-expanded={!collapsed}
        >
          <span>{collapsed ? "▶" : "▼"}</span>
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
              {activeCount} active
            </span>
          )}
        </button>
      </div>
      {!collapsed && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {hasTypeFilter && (
            <MultiSelect
              label="Type"
              selected={filters.type}
              options={types ?? []}
              onChange={(val) => setFilter("type", val)}
            />
          )}
          <MultiSelect
            label="Subject"
            selected={filters.subject}
            options={subjects}
            onChange={(val) => setFilter("subject", val)}
            optionLabel={subjectLabel}
          />
          {hasTopicFilter && (
            <MultiSelect
              label="Topic"
              selected={filters.topic}
              options={topics}
              onChange={(val) => setFilter("topic", val)}
            />
          )}
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
  );
}
