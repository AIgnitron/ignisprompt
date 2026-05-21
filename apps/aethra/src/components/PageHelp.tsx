type PageHelpProps = {
  title?: string;
  items: string[];
};

export function PageHelp({
  title = "What this page shows",
  items,
}: PageHelpProps) {
  return (
    <section className="page-help" aria-label={title}>
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
