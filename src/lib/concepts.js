// Conservative adapter: preserve raw source and never infer concepts or mappings.
export function parseConcepts(raw) {
  const rows = Array.isArray(raw) ? raw : raw?.concepts;
  if (!Array.isArray(rows))
    throw new Error(
      "Unrecognized schema. Expected a JSON array or an object with a concepts array. The repository uses an object with a concepts array; the imported source must use a supported envelope.",
    );
  const items = rows.map((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row))
      throw new Error(`Concept ${index + 1} must be an object.`);
    const title = row.name ?? row.title ?? row.concept;
    if (typeof title !== "string" || !title.trim())
      throw new Error(
        `Concept ${index + 1} needs a name, title, or concept field. No source values have been inferred.`,
      );
    const printable = (value) =>
      typeof value === "string"
        ? value
        : value == null
          ? ""
          : JSON.stringify(value);
    return {
      id: printable(row.id ?? row.code ?? `source-row-${index + 1}`),
      title,
      description: printable(row.description ?? row.definition),
      group: printable(row.grouping ?? row.group ?? row.category),
      source: printable(row.source ?? row.reference ?? row.citation),
      raw: row,
    };
  });
  return {
    items,
    version: typeof raw?.version === "string" ? raw.version : null,
  };
}
