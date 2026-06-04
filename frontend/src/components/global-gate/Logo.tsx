import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "mark" | "full";
  className?: string;
}

/**
 * Layover logo component.
 *
 * Renders inline SVG using `currentColor` so the parent controls color via CSS/Tailwind.
 *
 * @example
 *   <Logo variant="mark" className="h-8 text-[#0F4C5C] dark:text-[#5BC4D6]" />
 *   <Logo variant="full" className="h-10 text-[#0F4C5C] dark:text-[#5BC4D6]" />
 */
export function Logo({ variant = "full", className }: LogoProps) {
  if (variant === "mark") {
    return (
      <svg
        viewBox="0 0 100 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("inline-block", className)}
        role="img"
        aria-label="Layover"
      >
        <title>Layover</title>
        <path
          d="M 5 50 C 5 -3 95 -3 95 50"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="50" cy="10" r="6" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 200 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("inline-block", className)}
      role="img"
      aria-label="Layover"
    >
      <title>Layover</title>
      <path
        d="M 60 60 C 60 -10 140 -10 140 60"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="100" cy="8" r="5.5" fill="currentColor" />
      <text
        x="100"
        y="98"
        textAnchor="middle"
        fontFamily="inherit"
        fontSize="28"
        fontWeight="500"
        fill="currentColor"
        letterSpacing="-1.2"
      >
        layover
      </text>
    </svg>
  );
}
