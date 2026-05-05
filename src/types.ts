export type Session = {
  // Free-text label from the source CSV's "Purpose" column. Used as the
  // discriminator for variants like mock exams (e.g. "Pri Mock Exam" vs
  // "Pri JunCC"). Compared against config.mockExam.purposeMatch when set.
  purpose: string;
  subject: string;
  tutor: string;
  centre: string;
  topic: string;
  date: string;
  startTime: string;
  endTime: string;
  level: string;
  prefill: string;
  prefillField: string;
  displaySubject: string;
};
