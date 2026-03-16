interface AnnouncementCardProps {
  authorName: string;
  authorImage: string;
  content: string;
  postedAt: string;
  onClick: () => void;
}

export default function AnnouncementCard({
  authorName,
  authorImage,
  content,
  postedAt,
  onClick,
}: AnnouncementCardProps) {
  return (
    <div
      onClick={() => onClick()}
      className="group cursor-pointer relative rounded-xl border p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 h-full overflow-hidden"
      style={{
        backgroundColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 5%, white 95%)",
        borderColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 18%, white 82%)",
      }}
    >
      {/* Accent bar — org primary color */}
      <div
        className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
        style={{ background: "linear-gradient(to bottom, var(--color-primary, #60a5fa), color-mix(in srgb, var(--color-primary, #3b82f6) 70%, black 30%))" }}
      />

      <div className="pl-3 flex flex-col gap-2.5">
        <div className="flex items-center gap-2.5">
          <img
            src={authorImage}
            alt={authorName}
            className="w-7 h-7 rounded-full object-cover ring-2 ring-gray-100"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-800 truncate">
              {authorName}
            </h3>
          </div>
          <span className="text-[11px] text-gray-400 font-medium shrink-0">
            {postedAt}
          </span>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
          {content}
        </p>
      </div>
    </div>
  );
}
