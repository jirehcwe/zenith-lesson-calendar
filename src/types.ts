export type Session = {
  subject: string;
  tutor: string;
  centre: string;
  classroom: string;
  topic: string;
  date: string;
  startTime: string;
  endTime: string;
  level: string;
  prefill: string;
  prefillField: string;
  displaySubject: string;
};

export const END_DATE = new Date("2025-09-14");
