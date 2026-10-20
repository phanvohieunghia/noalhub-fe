import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Button } from "@noalhub/ui/button";
import { Icon, ICONS, LUCIDE } from "@noalhub/ui/icons";
import { MorphIcon, type SpringPreset } from "@noalhub/ui/morph-icon";

const meta: Meta<typeof MorphIcon> = {
  title: "UI/Data Display/MorphIcon",
  component: MorphIcon,
  parameters: { layout: "padded" },
  argTypes: {
    size: { control: { type: "range", min: 16, max: 160, step: 4 }, description: "Kích thước icon (px)" },
    strokeWidth: { control: { type: "range", min: 0.5, max: 4, step: 0.25 }, description: "Độ dày nét" },
    spring: {
      control: "select",
      options: ["snappy", "smooth", "bouncy"],
      description: "Kiểu lò xo: snappy (mặc định), smooth (không nảy), bouncy (nảy)",
    },
    reducedMotion: {
      control: "select",
      options: ["never", "user", "always"],
      description: "user = theo cài đặt giảm chuyển động của hệ điều hành",
    },
    icon: { control: false },
    from: { control: false },
    to: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof MorphIcon>;

const SPRINGS: SpringPreset[] = ["snappy", "smooth", "bouncy"];

const PAIRS: Array<{ name: string; a: string; b: string }> = [
  { name: "menu ↔ x", a: LUCIDE.menu, b: LUCIDE.x },
  { name: "plus ↔ x (cùng hình, xoay)", a: LUCIDE.plus, b: LUCIDE.x },
  { name: "play ↔ pause", a: LUCIDE.play, b: LUCIDE.pause },
  { name: "sun ↔ moon", a: LUCIDE.sun, b: LUCIDE.moon },
  { name: "eye ↔ eye-off", a: LUCIDE.eye, b: LUCIDE.eyeOff },
  { name: "lock ↔ lock-open", a: LUCIDE.lock, b: LUCIDE.lockOpen },
  { name: "volume ↔ muted", a: LUCIDE.volume2, b: LUCIDE.volumeX },
  { name: "mic ↔ mic-off", a: LUCIDE.mic, b: LUCIDE.micOff },
  { name: "copy ↔ check", a: LUCIDE.copy, b: LUCIDE.check },
  { name: "chevron-down ↔ minus", a: LUCIDE.chevronDown, b: LUCIDE.minus },
];

const GALLERY = [
  LUCIDE.menu,
  LUCIDE.x,
  LUCIDE.play,
  LUCIDE.pause,
  LUCIDE.sun,
  LUCIDE.moon,
  LUCIDE.heart,
  LUCIDE.bell,
  LUCIDE.search,
  LUCIDE.house,
  LUCIDE.settings,
  LUCIDE.user,
  LUCIDE.check,
  LUCIDE.copy,
  LUCIDE.plus,
  LUCIDE.arrowRight,
];

const fieldClass =
  "h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Click a pair to flip it. Every pair is morphing between two real lucide icons. */
export const Toggles: Story = {
  render: (args) => {
    const [state, setState] = useState<Record<string, boolean>>({});
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {PAIRS.map(({ name, a, b }) => {
          const flipped = state[name] ?? false;
          return (
            <button
              key={name}
              type="button"
              onClick={() => setState((s) => ({ ...s, [name]: !flipped }))}
              className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-5 text-foreground transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MorphIcon {...args} icon={flipped ? b : a} label={name} />
              <span className="text-xs text-muted-foreground">{name}</span>
            </button>
          );
        })}
      </div>
    );
  },
  args: { size: 48, spring: "snappy" },
};

/** Pick any two icons, then compare spring presets. Re-click quickly to see a mid-flight retarget. */
export const Playground: Story = {
  render: (args) => {
    const names = Object.entries(LUCIDE);
    const [icon, setIcon] = useState<string>(LUCIDE.menu);
    const [target, setTarget] = useState<string>(LUCIDE.x);
    const [spring, setSpring] = useState<SpringPreset>("snappy");
    return (
      <div className="flex max-w-xl flex-col gap-6">
        <div className="flex h-56 items-center justify-center rounded-lg border border-border bg-surface text-foreground">
          <MorphIcon {...args} icon={icon} spring={spring} size={args.size ?? 120} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Target icon"
            className={fieldClass}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          >
            {names.map(([key, value]) => (
              <option key={key} value={value}>
                {key}
              </option>
            ))}
          </select>
          <select
            aria-label="Spring"
            className={fieldClass}
            value={spring}
            onChange={(e) => setSpring(e.target.value as SpringPreset)}
          >
            {SPRINGS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Button onClick={() => setIcon(target)}>Morph</Button>
        </div>
      </div>
    );
  },
  args: { size: 120, strokeWidth: 1.5 },
};

/** Click a tile to morph the big icon into it. */
export const Gallery: Story = {
  render: (args) => {
    const [icon, setIcon] = useState<string>(GALLERY[0] as string);
    return (
      <div className="flex flex-col items-start gap-6 sm:flex-row">
        <div className="flex size-56 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-foreground">
          <MorphIcon {...args} icon={icon} />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {GALLERY.map((name) => (
            <button
              key={name}
              type="button"
              aria-label={name}
              aria-pressed={icon === name}
              onClick={() => setIcon(name)}
              className="flex size-14 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-neutral-100 aria-pressed:border-primary aria-pressed:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MorphIcon icon={name} size={22} reducedMotion="always" />
            </button>
          ))}
        </div>
      </div>
    );
  },
  args: { size: 120, strokeWidth: 1.5, spring: "bouncy" },
};

/** Controlled mode: you own the progress. Drag past the ends to see extrapolation. */
export const Scrub: Story = {
  render: (args) => {
    const [progress, setProgress] = useState(0.5);
    return (
      <div className="flex max-w-md flex-col gap-4">
        <div className="flex h-56 items-center justify-center rounded-lg border border-border bg-surface text-foreground">
          <MorphIcon {...args} from={LUCIDE.menu} to={LUCIDE.x} progress={progress} />
        </div>
        <label className="flex items-center gap-3 text-sm text-foreground">
          <span className="w-20 text-muted-foreground">{progress.toFixed(2)}</span>
          <input
            type="range"
            min={-0.2}
            max={1.2}
            step={0.01}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full accent-primary"
            aria-label="Progress"
          />
        </label>
      </div>
    );
  },
  args: { size: 120, strokeWidth: 1.5 },
};

/**
 * `<Icon animate="…" />`: the project's Icon with morphing switched on. "none" (the default)
 * swaps instantly; a spring preset morphs, and then strokeWidth / stiffness / damping /
 * reducedMotion become available.
 */
export const IconAnimateProp: Story = {
  render: () => {
    const [animate, setAnimate] = useState<"none" | SpringPreset>("snappy");
    const [on, setOn] = useState(false);
    const iconProps = (on: boolean) => ({ icon: on ? ICONS.close : ICONS.menu, className: "size-12" });
    return (
      <div className="flex max-w-md flex-col gap-6">
        <div className="flex gap-2">
          {(["none", ...SPRINGS] as const).map((a) => (
            <Button key={a} variant={animate === a ? "primary" : "outline"} onClick={() => setAnimate(a)}>
              {a}
            </Button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOn((v) => !v)}
          className="flex h-40 items-center justify-center rounded-lg border border-border bg-surface text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {animate === "none" ? (
            <Icon {...iconProps(on)} />
          ) : (
            <Icon {...iconProps(on)} animate={animate} strokeWidth={1.5} />
          )}
        </button>
      </div>
    );
  },
};
