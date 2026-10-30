import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect } from "react";
import {
  playCorrect,
  playSelect,
  playWrong,
  unlockSounds,
} from "@noalhub/core/sounds";
import { Button } from "@noalhub/ui/button";
import { Icon, LUCIDE } from "@noalhub/ui/icons";
import { Typography } from "@noalhub/ui/typography";

/**
 * Every quiz sound cue, synthesised with Web Audio (no asset files). Browsers only
 * start audio after a user gesture, so each cue plays on a click.
 */
const CUES = [
  {
    name: "Pick",
    when: "An option is chosen (single choice, or ticked in a multiple-choice question).",
    play: () => playSelect(true),
  },
  {
    name: "Un-pick",
    when: "A multiple-choice option is un-ticked: the same pop, lower and softer.",
    play: () => playSelect(false),
  },
  {
    name: "Correct",
    when: "A right answer: a glockenspiel ding-ding (A6 then D7).",
    play: playCorrect,
  },
  {
    name: "Wrong",
    when: 'A wrong answer: a harsh double "eh-eh" square-wave buzz on C4.',
    play: playWrong,
  },
] as const;

const meta: Meta = {
  title: "UI/Feedback/Sounds",
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj;

export const QuizCues: Story = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-3">
      {CUES.map((cue) => (
        <div
          key={cue.name}
          className="flex items-center gap-4 rounded-lg border border-border bg-surface p-3"
        >
          <Button
            size="icon"
            shape="circle"
            aria-label={`Play ${cue.name}`}
            onClick={() => cue.play()}
          >
            <Icon icon={LUCIDE.play} />
          </Button>
          <div className="min-w-0">
            <Typography variant="title-4">{cue.name}</Typography>
            <Typography variant="body-4" className="text-muted-foreground">
              {cue.when}
            </Typography>
          </div>
        </div>
      ))}
    </div>
  ),
};

/** A whole question: pick, then a right answer, then pick again, then a wrong one. */
export const Sequence: Story = {
  render: () => (
    <Button
      onClick={() => {
        playSelect(true);
        setTimeout(playCorrect, 700);
        setTimeout(() => playSelect(true), 2400);
        setTimeout(playWrong, 3100);
      }}
    >
      <Icon icon={LUCIDE.play} />
      Play a full round
    </Button>
  ),
};

function DelayedVerdict() {
  // What the quiz screen does when it opens.
  useEffect(() => unlockSounds(), []);
  return (
    <div className="flex max-w-xl flex-col gap-3">
      <Button onClick={() => setTimeout(playCorrect, 600)}>
        <Icon icon={LUCIDE.circleCheck} />
        Answer right
      </Button>
      <Button variant="outline" onClick={() => setTimeout(playWrong, 600)}>
        <Icon icon={LUCIDE.circleX} />
        Answer wrong
      </Button>
    </div>
  );
}

/**
 * A verdict as the quiz plays it: the answer goes out on a tap and the cue rings once
 * the server has replied — after the tap is over, with no pick cue before it (a
 * flashcard, a typed answer). Try it on a phone: a browser that starts audio only
 * from inside a tap stays silent here unless the first tap started it, which
 * `unlockSounds()` does.
 */
export const VerdictAfterAnswer: Story = {
  render: () => <DelayedVerdict />,
};
