export function TextAnswer({
  label,
  placeholder,
  help,
  long = false,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string | undefined;
  help?: string | undefined;
  long?: boolean | undefined;
  value: string;
  onChange: (value: string) => void;
}) {
  const className =
    "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none";

  return (
    <label className="block">
      <span className="block text-sm font-semibold text-foreground">{label}</span>
      {help ? (
        <span className="mt-1 block text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
          {help}
        </span>
      ) : null}
      {long ? (
        <textarea
          rows={4}
          className={className}
          placeholder={placeholder ?? ""}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type="text"
          className={className}
          placeholder={placeholder ?? ""}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
