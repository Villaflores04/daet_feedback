"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PhotoField } from "@/components/photo-field";
import { SheetFrame } from "@/components/sheet-frame";
import { Button } from "@/components/ui/button";
import { CATEGORIES, type Category } from "@/lib/pulse/types";
import { usePulse } from "@/lib/pulse/store";
import { useCallsign } from "@/lib/pulse/visitor";
import { cn } from "@/lib/utils";

export function WishSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { callsign, setCallsign } = useCallsign();
  const addWish = usePulse((s) => s.addWish);
  const [name, setName] = useState("");
  const [where, setWhere] = useState("");
  const [why, setWhy] = useState("");
  const [category, setCategory] = useState<Category>("Park");
  const [photo, setPhoto] = useState<string | undefined>();
  const [alias, setAlias] = useState(callsign);

  const submit = () => {
    if (name.trim().length < 3) {
      toast("Name the place in at least 3 letters.");
      return;
    }
    const nextName = alias.trim() || callsign || "Visitor";
    setCallsign(nextName);
    addWish({
      name,
      where,
      why,
      category,
      callsign: nextName,
      photo,
    });
    setName("");
    setWhere("");
    setWhy("");
    setPhoto(undefined);
    onClose();
    toast("Wish sent / On the desk");
  };

  return (
    <SheetFrame open={open} onClose={onClose} title="Wish a place">
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            Place name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What's missing?"
            className="h-12 w-full rounded-xl border border-line bg-plate px-3 text-ink outline-none focus:border-teal"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            Where in Daet
          </span>
          <input
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            placeholder="Barangay, street, or landmark"
            className="h-12 w-full rounded-xl border border-line bg-plate px-3 text-ink outline-none focus:border-teal"
          />
        </label>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink">Category</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={cn(
                  "h-10 rounded-full px-3 text-sm",
                  category === item
                    ? "bg-teal text-plate"
                    : "bg-cool text-ink",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            Why it should be on the board
          </span>
          <textarea
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-line bg-plate px-3 py-3 text-ink outline-none focus:border-teal"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            Callsign
          </span>
          <input
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="Your nickname"
            className="h-12 w-full rounded-xl border border-line bg-plate px-3 text-ink outline-none focus:border-teal"
          />
        </label>
        <PhotoField value={photo} onChange={setPhoto} />
        <Button type="button" className="h-12 w-full" onClick={submit}>
          Send wish
        </Button>
      </div>
    </SheetFrame>
  );
}
