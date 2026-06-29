export function SimpleCards({ items }: { items: { id: string; title: string; text: string }[] }) {
  return (
    <section className="px-5 py-20 lg:px-10">
      <div className="mx-auto grid max-w-[1320px] gap-px bg-slate-200 md:grid-cols-2">
        {items.length ? items.map((item) => (
          <article key={item.id} className="bg-[#fbfaf7] p-8 sm:p-10">
            <h2 className="font-display text-2xl text-[#17234c]">{item.title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{item.text}</p>
          </article>
        )) : (
          <p className="bg-[#fbfaf7] p-10 text-slate-500">La información se actualizará próximamente.</p>
        )}
      </div>
    </section>
  );
}
