type PageHelpProps = {
  title?: string;
  items: string[];
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export function PageHelp({
  title = "What this page shows",
  items,
  collapsible = false,
  defaultOpen = false,
}: PageHelpProps) {
  if (collapsible) {
    return (
      <details
        className="page-help page-help-collapsible"
        aria-label={title}
        open={defaultOpen}
      >
        <summary>
          <span>{title}</span>
          <span className="page-help-summary-note">
            {defaultOpen ? "Expanded by default" : "Collapsed by default"}
          </span>
        </summary>
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </details>
    );
  }

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
