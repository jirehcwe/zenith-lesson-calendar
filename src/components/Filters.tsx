"use client";

type FiltersProps = {
  subjects: string[];
  centres: string[];
  tutors: string[];
  levels: string[];
  filters: {
    subject: string;
    centre: string;
    tutor: string;
    level: string;
  };
  onFilterChange: (filters: FiltersProps["filters"]) => void;
};

export default function Filters({
  subjects,
  centres,
  tutors,
  levels,
  filters,
  onFilterChange,
}: FiltersProps) {
  const renderSelect = (label: string, field: keyof FiltersProps["filters"], options: string[]) => (
    <div className="flex flex-col">
      <label className="text-sm font-semibold">{label}</label>
      <select
        className="border p-2 rounded"
        value={filters[field]}
        onChange={(e) => onFilterChange({ ...filters, [field]: e.target.value })}
      >
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {renderSelect("Subject", "subject", subjects)}
      {renderSelect("Centre", "centre", centres)}
      {renderSelect("Tutor", "tutor", tutors)}
      {renderSelect("Level", "level", levels)}
    </div>
  );
}
