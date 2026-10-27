import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Button } from "@noalhub/ui/button";
import { Icon, ICONS, LUCIDE } from "@noalhub/ui/icons";
import { MorphIcon, type SpringPreset } from "@noalhub/ui/morph-icon";
import { Select } from "@noalhub/ui/select";

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

const SPRING_OPTIONS = SPRINGS.map((value) => ({ value, label: value }));

/** Click a pair to flip it. Every pair is morphing between two real lucide icons. */
export const Toggles: Story = {
  render: (args) => {
    const [state, setState] = useState<Record<string, boolean>>({});
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {PAIRS.map(({ name, a, b }) => {
          const flipped = state[name] ?? false;
          return (
            <Button
              key={name}
              variant="outline"
              className="h-auto flex-col gap-3 p-5"
              aria-pressed={flipped}
              onClick={() => setState((s) => ({ ...s, [name]: !flipped }))}
            >
              <MorphIcon {...args} icon={flipped ? b : a} label={name} />
              <span className="text-xs text-muted-foreground">{name}</span>
            </Button>
          );
        })}
      </div>
    );
  },
  args: { size: 48, spring: "snappy" },
};

/**
 * Pick icon A and icon B, then flip between them. The stage shows the live morph; the two
 * tiles under it are the static endpoints, so you can judge the in-between against both.
 * Click again mid-flight to see a retarget, or use Swap to exchange A and B.
 */
export const Playground: Story = {
  render: (args) => {
    const names = Object.entries(LUCIDE);
    const [a, setA] = useState<string>(LUCIDE.menu);
    const [b, setB] = useState<string>(LUCIDE.x);
    const [showB, setShowB] = useState(false);
    const [spring, setSpring] = useState<SpringPreset>("snappy");
    const options = names.map(([key, value]) => ({ value, label: key }));
    const picker = (label: string, value: string, onChange: (value: string) => void) => (
      <div className="min-w-44 flex-1">
        <Select
          label={label}
          size="sm"
          options={options}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
    const endpoint = (label: string, icon: string, active: boolean) => (
      <div
        className={`flex flex-1 flex-col items-center gap-2 rounded-lg border p-3 text-foreground ${
          active ? "border-primary" : "border-border"
        }`}
      >
        <MorphIcon icon={icon} size={40} strokeWidth={args.strokeWidth} reducedMotion="always" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    );
    return (
      <div className="flex max-w-xl flex-col gap-6">
        <button
          type="button"
          aria-label="Morph between A and B"
          onClick={() => setShowB((v) => !v)}
          className="flex h-56 items-center justify-center rounded-lg border border-border bg-surface text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MorphIcon {...args} icon={showB ? b : a} spring={spring} size={args.size ?? 120} />
        </button>
        <div className="flex gap-3">
          {endpoint("A", a, !showB)}
          {endpoint("B", b, showB)}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {picker("Icon A", a, setA)}
          {picker("Icon B", b, setB)}
          <div className="w-32">
            <Select
              label="Spring"
              size="sm"
              options={SPRING_OPTIONS}
              value={spring}
              onChange={(e) => setSpring(e.target.value as SpringPreset)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowB((v) => !v)}>Morph to {showB ? "A" : "B"}</Button>
          <Button
            variant="outline"
            onClick={() => {
              setA(b);
              setB(a);
            }}
          >
            Swap A ↔ B
          </Button>
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
            <Button
              key={name}
              variant={icon === name ? "primary" : "outline"}
              size="icon-lg"
              aria-label={name}
              aria-pressed={icon === name}
              onClick={() => setIcon(name)}
            >
              <MorphIcon icon={name} size={22} reducedMotion="always" />
            </Button>
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
          aria-label="Toggle icon"
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
