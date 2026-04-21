import { MessageCircleQuestion } from "@/components/animate-ui/icons/message-circle-question";
import { cn } from "@/lib/utils";

interface HoverHelpTooltipProps {
  text: string;
  className?: string;
  tooltipClassName?: string;
  align?: "left" | "center" | "right";
  label?: string;
  iconSize?: number;
  buttonClassName?: string;
}

const alignClassMap = {
  left: "left-0",
  center: "left-1/2 -translate-x-1/2",
  right: "right-0",
} as const;

export default function HoverHelpTooltip({
  text,
  className,
  tooltipClassName,
  align = "left",
  label = "",
  iconSize = 16,
  buttonClassName,
}: HoverHelpTooltipProps) {
  return (
    <div className={cn("group relative inline-flex w-fit max-w-full", className)}>
      <button
        type="button"
        className={cn(
          "inline-flex items-center text-sm text-slate-500 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 rounded",
          label ? "gap-1" : "gap-0",
          label
            ? ""
            : "h-6 w-6 justify-center rounded-full border border-slate-300 bg-white/90 hover:border-slate-400",
          buttonClassName,
        )}
        aria-label="Show details"
      >
        <MessageCircleQuestion size={iconSize} animateOnHover />
        {label ? <span>{label}</span> : null}
      </button>
      <div
        role="tooltip"
        className={cn(
          "pointer-events-none absolute top-full mt-2 z-30 w-max max-w-[26rem] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-lg opacity-0 translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0",
          alignClassMap[align],
          tooltipClassName,
        )}
      >
        {text}
      </div>
    </div>
  );
}
