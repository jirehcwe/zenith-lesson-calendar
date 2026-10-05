// The year in the page title. The feed decides which year's slots each
// platform shows, so this is text only. Change it at the next rollover.
export const SCHEDULE_YEAR = 2027;

// Class slot ids are "<year>-ClassNNNN".
export function slotYear(classSlotId: string | undefined): number | null {
  const match = /^(\d{4})-/.exec(classSlotId ?? "");
  return match ? Number(match[1]) : null;
}

// JC moves to the new year later than Secondary and Primary. Until it does,
// a JC visitor sees last year's slots under this year's title.
export function showJcNextYearNote(
  stream: string | null,
  slots: { level: string; classSlotId?: string }[]
): boolean {
  if (stream !== "JC") return false;
  return slots.some((slot) => {
    const year = slotYear(slot.classSlotId);
    return slot.level.startsWith("J") && year !== null && year < SCHEDULE_YEAR;
  });
}
