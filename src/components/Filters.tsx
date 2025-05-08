type FiltersProps = {
    subjects: string[];
    topics: string[];
    centres: string[];
    tutors: string[];
    levels: string[];
    filters: {
      subject: string;
      topic: string;
      centre: string;
      tutor: string;
      level: string;
    };
    onFilterChange: (filters: FiltersProps["filters"]) => void;
  };
  
  export default function Filters({
    subjects,
    topics,
    centres,
    tutors,
    levels,
    filters,
    onFilterChange,
  }: FiltersProps) {
  
    const renderSelect = (
      label: string,
      field: keyof FiltersProps["filters"],
      options: string[],
      disabled = false,
    ) => (
      <div className="flex flex-col">
        <label className="text-sm font-semibold">{label}</label>
        <select
          className="border p-2 rounded disabled:bg-gray-100"
          value={filters[field]}
          onChange={(e) => onFilterChange({ ...filters, [field]: e.target.value })}
          disabled={disabled}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  
    const subjectSelected = !!filters.subject;
  
    // Topic options
    const topicOptions = subjectSelected ? ["All", ...topics] : ["-"];
  
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        
        {/* SUBJECT → special logic */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold">Subject</label>
          <select
            className="border p-2 rounded disabled:bg-gray-100"
            value={filters.subject}
            onChange={(e) => {
              const value = e.target.value;
              const newFilters = { ...filters, subject: value };
  
              // Reset topic when subject is cleared
              if (!value) {
                newFilters.topic = "-";
              } else if (filters.topic === "-") {
                newFilters.topic = "";
              }
  
              onFilterChange(newFilters);
            }}
          >
            <option value="">All</option>
            {subjects.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
  
        {/* Other filters */}
        {renderSelect("Topic", "topic", topicOptions, !subjectSelected)}
        {renderSelect("Centre", "centre", ["All", ...centres])}
        {renderSelect("Tutor", "tutor", ["All", ...tutors])}
        {renderSelect("Level", "level", ["All", ...levels])}
      </div>
    );
  }
  