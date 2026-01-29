import { X } from "lucide-react";
import type { Actions, State } from "./types";

type GalleryViewProps = {
  state: State;
  actions: Actions;
};

export function GalleryView({ state, actions }: GalleryViewProps) {
  return (
    <div className="absolute inset-0 bg-black/95 z-40 flex flex-col">
      <div className="flex justify-between p-4 border-b border-white/10">
        <h3 className="text-white font-bold">{state.images.length} Photos</h3>
        <button
          onClick={() => actions.setShowGallery(false)}
          className="app-button h-8 w-8 rounded-full flex items-center justify-center"
        >
          <X />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Responsive Image Grid */}
        <div className="grid grid-cols-2 gap-2">
          {state.images.map((img, i) => (
            <div key={i} className="relative aspect-square bg-white/5 rounded-lg overflow-hidden">
              <img src={img.url} className="object-contain w-full h-full" />
              <button
                onClick={() => actions.deleteImage(i)}
                className="app-button absolute top-1 right-1 h-6 w-6 rounded-full flex items-center justify-center"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
