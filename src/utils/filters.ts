import { Session } from "../types";

type Filters = {
  subject: string[];
  topic: string[];
  centre: string[];
  tutor: string[];
};

export function applyFilters(sessions: Session[], filters: Filters): Session[] {
  return sessions.filter((s) => {
    return (
      (filters.subject.length === 0 || filters.subject.includes(s.subject)) &&
      (filters.topic.length === 0 ||
        filters.topic.includes(`[${s.subject}] ${s.topic}`)) &&
      (filters.centre.length === 0 || filters.centre.includes(s.centre)) &&
      (filters.tutor.length === 0 || filters.tutor.includes(s.tutor))
    );
  });
}
