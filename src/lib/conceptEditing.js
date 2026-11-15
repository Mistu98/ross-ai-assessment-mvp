import { reviseMethod } from "./method.js";
import { parseConcepts } from "./concepts.js";
export function saveConcept(workspace, library, input, originalId = null) {
  const id = input.id?.trim(),
    title = input.title?.trim();
  if (
    !id ||
    id.length > 100 ||
    ["__proto__", "constructor", "prototype"].includes(id) ||
    !title
  )
    throw new Error("Enter a unique concept ID and concept name.");
  if (
    library.items.some(
      (c) => c.id.toLowerCase() === id.toLowerCase() && c.id !== originalId,
    )
  )
    throw new Error("This concept ID is already in the library.");
  if (!originalId && library.items.length >= 1000)
    throw new Error("The local library supports up to 1000 concepts.");
  if (originalId && id !== originalId)
    throw new Error(
      "Keep the existing concept ID stable so factor links remain traceable.",
    );
  const groupIds = input.groupIds || [];
  if (
    groupIds.some(
      (value) => !workspace.method.groups.some((g) => g.id === value),
    )
  )
    throw new Error("Choose an existing method grouping.");
  const original = library.items.find((c) => c.id === originalId);
  const record = {
    ...original?.raw,
    id,
    name: title,
    description: input.description?.trim() || "",
    source: input.source?.trim() || "",
    groupingIds: groupIds,
    archived: Boolean(input.archived),
  };
  const rows = originalId
    ? library.items.map((c) => (c.id === originalId ? record : c.raw))
    : [...library.items.map((c) => c.raw), record];
  const envelope = Array.isArray(library.raw)
    ? { concepts: rows }
    : { ...library.raw, concepts: rows };
  parseConcepts(envelope);
  const groups = workspace.method.groups.map((g) => ({
    ...g,
    factors: g.factors.map((f) =>
      originalId && f.conceptIds.includes(originalId)
        ? { ...f, revision: f.revision + 1 }
        : f,
    ),
  }));
  const next = reviseMethod(
    workspace,
    groups,
    `${input.archived ? "Archived" : originalId ? "Updated" : "Added"} concept: ${title}`,
  );
  return {
    ...next,
    conceptSource: {
      raw: envelope,
      name: "Local concept library",
      loadedAt: new Date().toISOString(),
    },
  };
}
