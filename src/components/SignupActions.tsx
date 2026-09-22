"use client";

import type { WeeklyClassSlot } from "./WeeklyClassCalendar";
import { canBookTrial, canRegister, isSlotClosed, isSlotFull } from "@/utils/slotStatus";
import { replaceCampaignInUrl, replacePromocodeInUrl } from "@/utils/campaign";
import { getFallbackRegistrationLinkByLevel } from "@/utils/prefillRegistration";

// The trial and register buttons for one class, shared by the calendar popup
// and the list card so both follow the same gate rule (see slotStatus.ts).
// A closed form greys out its own button. A full class, or a class with both
// forms closed, shows one message instead of the buttons.
const STYLES = {
  popup: {
    row: "flex gap-2.5",
    trial:
      "flex-1 flex items-center justify-center bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold text-sm py-2.5 px-4 rounded-lg text-center transition-all duration-200",
    register:
      "flex-1 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 px-4 rounded-lg text-center transition-all duration-200",
    closed:
      "flex-1 flex items-center justify-center bg-gray-100 text-gray-500 font-medium text-sm py-2.5 px-4 rounded-lg text-center cursor-not-allowed",
    full: "w-full bg-gray-100 text-gray-500 font-medium py-2.5 px-4 rounded-lg text-sm cursor-not-allowed",
    fullLabel: "This class is currently full",
    closedLabel: "This class is currently closed",
  },
  card: {
    row: "flex gap-2",
    trial:
      "flex-1 block bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold text-xs py-2 px-3 rounded-lg text-center transition-all duration-200",
    register:
      "flex-1 block bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-3 rounded-lg text-center transition-all duration-200",
    closed:
      "flex-1 block bg-gray-200 text-gray-500 font-medium text-xs py-2 px-3 rounded-lg text-center cursor-not-allowed",
    full: "w-full bg-gray-200 text-gray-500 font-medium py-2.5 px-4 rounded-lg text-sm cursor-not-allowed",
    fullLabel: "Class Full",
    closedLabel: "Class Closed",
  },
} as const;

export default function SignupActions({
  slot,
  variant,
}: {
  slot: WeeklyClassSlot;
  variant: keyof typeof STYLES;
}) {
  const styles = STYLES[variant];

  if (isSlotFull(slot)) {
    return (
      <button disabled className={styles.full}>
        {styles.fullLabel}
      </button>
    );
  }

  if (isSlotClosed(slot)) {
    return (
      <button disabled className={styles.full}>
        {styles.closedLabel}
      </button>
    );
  }

  const trialOpen = canBookTrial(slot);
  const registrationOpen = canRegister(slot);

  return (
    <div className={styles.row}>
      {trialOpen && slot.prefillTrialLink && (
        <a
          href={replacePromocodeInUrl(replaceCampaignInUrl(slot.prefillTrialLink))}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.trial}
        >
          Sign up for FREE Trial
        </a>
      )}
      {!trialOpen && (
        <button disabled className={styles.closed}>
          Trial closed
        </button>
      )}
      {registrationOpen ? (
        <a
          href={replacePromocodeInUrl(
            replaceCampaignInUrl(
              slot.prefillRegistrationLink ?? getFallbackRegistrationLinkByLevel(slot.level ?? "Unknown")
            )
          )}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.register}
        >
          Register now
        </a>
      ) : (
        <button disabled className={styles.closed}>
          Registration closed
        </button>
      )}
    </div>
  );
}
