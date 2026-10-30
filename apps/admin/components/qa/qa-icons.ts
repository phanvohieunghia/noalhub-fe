import {LUCIDE} from '@noalhub/ui/icons'

/** One icon per answer shape, the same everywhere a shape is picked or shown. */
export const SHAPE_ICONS = {
  multiple_choice: LUCIDE.listChecks,
  single_choice: LUCIDE.circleDot,
  true_false: LUCIDE.toggleLeft,
  short_answer: LUCIDE.messageSquareText,
  fill_blank: LUCIDE.textCursorInput,
  flashcard: LUCIDE.layers,
} as const

/** One icon per question kind. */
export const KIND_ICONS = {
  theory: LUCIDE.bookOpen,
  practice: LUCIDE.wrench,
  recall: LUCIDE.brain,
  analysis: LUCIDE.microscope,
} as const
