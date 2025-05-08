"use client";

import { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";

type FiltersProps = {
  subjects: string[];
  topics: string[];
  centres: string[];
  tutors: string[];
  filters: {
    subject: string[];
    topic: string[];
    centre: string[];
    tutor: string[];
  };
  onFilterChange: (filters: FiltersProps["filters"]) => void;
};

function MultiSelect({
  label,
  selected,
  options,
  onChange,
}: {
  label: string;
  selected: string[];
  options: string[];
  onChange: (newSelected: string[]) => void;
}) {
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((o) => o !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="flex flex-col">
      <label className="text-sm font-semibold">{label}</label>
      <Listbox value={selected} onChange={onChange} multiple>
        <div className="relative mt-1">
          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white border p-2 text-left">
            {selected.length > 0 ? selected.join(", ") : `Select ${label}`}
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
  subjects,
  topics,
  centres,
  filters,
  onFilterChange,
}: FiltersProps) {
  const setFilter = (field: keyof FiltersProps["filters"], value: string[]) => {
    const newFilters = { ...filters, [field]: value };
    onFilterChange(newFilters);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <MultiSelect
        label="Subject"
        selected={filters.subject}
        options={subjects}
        onChange={(val) => setFilter("subject", val)}
      />
      <MultiSelect
        label="Topic"
        selected={filters.topic}
        options={topics}
        onChange={(val) => setFilter("topic", val)}
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
  );
}
