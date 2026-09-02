import Image from "next/image";

import { SiteFooter } from "@/components/layout/site-footer";
import { Typography } from "@noalhub/ui/typography";

export default function Home() {
  return (
    // The outer column keeps the footer pinned to the bottom; the content
    // centering moves to the inner layer, or the footer gets pulled into the
    // middle of the screen too.
    <div className="flex flex-1 flex-col bg-background font-sans">
      <div className="flex flex-1 flex-col items-center justify-center">
        <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-surface text-surface-foreground sm:items-start">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={100}
            height={20}
            priority
          />
          <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
            <Typography
              variant="h2"
              as="h1"
              className="max-w-xs leading-10 tracking-tight text-foreground"
            >
              To get started, edit the page.tsx file.
            </Typography>
            <Typography
              variant="body-1"
              className="max-w-md leading-8 text-muted-foreground"
            >
              Looking for a starting point or more instructions? Head over to{" "}
              <a
                href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                className="font-medium text-accent hover:underline"
              >
                Templates
              </a>{" "}
              or the{" "}
              <a
                href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                className="font-medium text-accent hover:underline"
              >
                Learning
              </a>{" "}
              center.
            </Typography>
          </div>
          <div className="text-title-3 flex flex-col gap-4 sm:flex-row">
            <a
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-primary-foreground transition-colors hover:bg-primary-hover md:w-[158px]"
              href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                className="dark:invert"
                src="/vercel.svg"
                alt="Vercel logomark"
                width={16}
                height={16}
              />
              Deploy Now
            </a>
            <a
              className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-border px-5 transition-colors hover:bg-muted md:w-[158px]"
              href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Documentation
            </a>
          </div>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
