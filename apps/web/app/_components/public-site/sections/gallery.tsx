import type { PublicGalleryImage } from '../types';
import { galleryClass, mediaUrl } from '../utils';
import { SectionLabel } from '../ui/section-label';

export function GallerySection({ gallery }: { gallery: PublicGalleryImage[] }) {
  return (
    <section id="instalaciones" className="scroll-mt-24 px-5 py-20 sm:py-28 lg:px-10">
      <div className="mx-auto max-w-[1320px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <SectionLabel>Instalaciones</SectionLabel>
            <h2 className="font-display mt-5 text-4xl font-medium tracking-[-0.025em] text-[#17234c] sm:text-6xl">Espacios pensados para su bienestar.</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-slate-500">Ambientes organizados, cómodos y preparados para brindar atención médica con privacidad.</p>
        </div>
        <div className="mt-14 grid auto-rows-[230px] gap-3 sm:grid-cols-2 sm:auto-rows-[300px] lg:grid-cols-12">
          {gallery.map((image, index) => (
            <figure key={image.id} className={`group relative overflow-hidden bg-slate-200 ${galleryClass(index)}`}>
              <img src={mediaUrl(image.imageUrl)} alt={image.altText} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-5 pb-5 pt-16 text-white">
                <p className="text-sm font-medium">{image.title}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
