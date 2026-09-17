import { FACES, FACE_COPY, type FaceId } from "@/lib/pulse/faces";
import { cn } from "@/lib/utils";

export function FacePicker({
  value,
  onChange,
  caption = true,
}: {
  value?: FaceId | null;
  onChange: (id: FaceId) => void;
  caption?: boolean;
}) {
  return (
    <fieldset>
      {caption ? (
        <legend className="mb-3 text-sm font-medium text-ink">
          {FACE_COPY}
        </legend>
      ) : (
        <legend className="sr-only">{FACE_COPY}</legend>
      )}
      <div className="grid grid-cols-4 gap-2">
        {FACES.map((face) => {
          const selected = value === face.id;
          const moodClass =
            face.mood === "POS"
              ? "border-pos bg-pos/10"
              : face.mood === "MIX"
                ? "border-mix bg-mix/10"
                : "border-neg bg-neg/10";
          return (
            <button
              key={face.id}
              type="button"
              onClick={() => onChange(face.id)}
              aria-pressed={selected}
              className={cn(
                "flex min-h-24 flex-col items-center justify-center gap-1 rounded-lg bg-plate px-1 py-2 shadow-plate transition-[transform,box-shadow,background-color,border-color] duration-150 active:scale-[0.96]",
                selected
                  ? `border-2 ${moodClass}`
                  : "border border-transparent",
              )}
            >
              <span className="text-[2rem] leading-none" aria-hidden>
                {face.glyph}
              </span>
              <span className="text-[0.7rem] font-medium text-muted">
                {face.label}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
