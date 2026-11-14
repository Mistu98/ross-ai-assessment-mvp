import {
  activeGroups,
  allFactors,
  reviseMethod,
  validIdentifier,
  CATEGORIES,
} from "./method.js";
import { validateMethod, validateWorkspace } from "./storage.js";
import { parseConcepts } from "./concepts.js";

const FORMAT = "ross-assessment-method";
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const criterion = (f) => [
  f.name,
  f.question,
  f.action,
  f.guidance,
  f.rule,
  [...f.conceptIds].sort(),
  f.archived,
];
const conceptDefinition = (c) =>
  c
    ? [c.title, c.description, c.source, [...c.groupIds].sort(), c.archived]
    : null;

// A method-only export contains definitions and literature, never activity evidence.
export function exportMethodDefinition(workspace, library) {
  return JSON.stringify(
    {
      format: FORMAT,
      schemaVersion: 1,
      version: `local-revision-${workspace.method.revision}`,
      source:
        "Browser-exported working method. Research approval must be documented separately.",
      basedOn: workspace.method.release?.version || null,
      groups: workspace.method.groups,
      concepts: library.items.map((c) => c.raw),
    },
    null,
    2,
  );
}

// Preview before application. Removed definitions are archived, not discarded.
// Revisions are computed locally; imported counters never make an old judgement current.
export function prepareMethodImport(workspace, raw, library) {
  if (
    raw?.format !== FORMAT ||
    raw.schemaVersion !== 1 ||
    typeof raw.version !== "string" ||
    !raw.version.trim() ||
    raw.version.length > 200
  )
    throw new Error(
      "Expected a ross-assessment-method file, schema 1, with a version label.",
    );
  if (!Array.isArray(raw.groups))
    throw new Error("The method file needs a groups array.");
  for (const g of raw.groups) {
    if (!CATEGORIES.includes(g?.category))
      throw new Error(
        "Each grouping needs a supported recommendation category.",
      );
    if (g.archived !== undefined && typeof g.archived !== "boolean")
      throw new Error("Grouping archive flags must be true or false.");
    for (const f of Array.isArray(g.factors) ? g.factors : []) {
      if (f?.archived !== undefined && typeof f.archived !== "boolean")
        throw new Error("Factor archive flags must be true or false.");
      if (
        f?.conceptIds !== undefined &&
        (!Array.isArray(f.conceptIds) ||
          f.conceptIds.some((id) => !validIdentifier(id)))
      )
        throw new Error(
          "Factor conceptIds must be an array of stable concept IDs.",
        );
    }
  }
  const incoming = validateMethod({
    revision: 1,
    groups: raw.groups.map((g) => ({
      ...g,
      factors: Array.isArray(g.factors)
        ? g.factors.map((f) => ({ ...f, revision: 1 }))
        : g.factors,
    })),
  });
  const groupIds = new Set(
    [...workspace.method.groups, ...incoming.groups].map((g) => g.id),
  );
  let nextLibrary = library;
  if (raw.concepts !== undefined) {
    if (!Array.isArray(raw.concepts) || raw.concepts.length > 1000)
      throw new Error(
        "The method file supports up to 1000 literature concepts.",
      );
    for (const c of raw.concepts) {
      if (!validIdentifier(c?.id))
        throw new Error(
          "Method literature records need explicit stable concept IDs.",
        );
      if (c.archived !== undefined && typeof c.archived !== "boolean")
        throw new Error("Concept archive flags must be true or false.");
      if (
        c.groupingIds !== undefined &&
        (!Array.isArray(c.groupingIds) ||
          c.groupingIds.some((id) => !validIdentifier(id)))
      )
        throw new Error(
          "Concept groupingIds must be an array of stable grouping IDs.",
        );
    }
    const supplied = parseConcepts({ concepts: raw.concepts });
    const ids = new Set();
    for (const c of supplied.items) {
      if (!validIdentifier(c.id) || ids.has(c.id.toLowerCase()))
        throw new Error("Concept IDs must be unique, stable identifiers.");
      if (c.groupIds.some((id) => !groupIds.has(id)))
        throw new Error(`Concept ${c.id} refers to an unknown grouping.`);
      ids.add(c.id.toLowerCase());
    }
    // Retain retired literature records so archived factors keep their sources.
    const retained = library.items
      .filter((c) => !ids.has(c.id.toLowerCase()))
      .map((c) => ({ ...c.raw, archived: true }));
    nextLibrary = parseConcepts({
      version: raw.version,
      concepts: [...raw.concepts, ...retained],
    });
    if (nextLibrary.items.length > 1000)
      throw new Error(
        "The combined library exceeds 1000 concepts, including archived records.",
      );
  }
  const conceptIds = new Set(nextLibrary.items.map((c) => c.id));
  const beforeConcepts = new Map(library.items.map((c) => [c.id, c]));
  const afterConcepts = new Map(nextLibrary.items.map((c) => [c.id, c]));
  const oldFactors = new Map(
    allFactors(workspace.method, true).map((f) => [f.id, f]),
  );
  const incomingIds = new Set(allFactors(incoming, true).map((f) => f.id));
  const beforeGroups = new Map(workspace.method.groups.map((g) => [g.id, g]));
  const changedIds = new Set();
  let addedFactors = 0;
  const groups = incoming.groups.map((g) => {
    const previous = beforeGroups.get(g.id);
    const factors = g.factors.map((f) => {
      if (f.conceptIds.some((id) => !conceptIds.has(id)))
        throw new Error(
          `Factor ${f.id} refers to a missing literature concept.`,
        );
      const old = oldFactors.get(f.id);
      const oldGroup = old && beforeGroups.get(old.groupId);
      const sourceChanged = f.conceptIds.some(
        (id) =>
          !same(
            conceptDefinition(beforeConcepts.get(id)),
            conceptDefinition(afterConcepts.get(id)),
          ),
      );
      const changed =
        old &&
        (!same(criterion(old), criterion(f)) ||
          old.groupId !== g.id ||
          oldGroup.prompt !== g.prompt ||
          oldGroup.category !== g.category ||
          Boolean(oldGroup.archived) !== g.archived ||
          sourceChanged);
      if (!old) addedFactors++;
      if (changed) changedIds.add(f.id);
      return { ...f, revision: old ? old.revision + (changed ? 1 : 0) : 1 };
    });
    // A factor moved to another grouping is represented once, under the new grouping.
    const retired = (previous?.factors || [])
      .filter((f) => !incomingIds.has(f.id))
      .map((f) => ({ ...f, archived: true }));
    return { ...g, factors: [...factors, ...retired] };
  });
  const newGroupIds = new Set(groups.map((g) => g.id));
  for (const g of workspace.method.groups) {
    if (!newGroupIds.has(g.id))
      groups.push({
        ...g,
        archived: true,
        factors: g.factors.filter((f) => !incomingIds.has(f.id)),
      });
  }
  // Also checks combined archive limits, duplicate IDs, and a nonempty active method.
  validateMethod({ revision: workspace.method.revision + 1, groups });
  const activeFactorIds = new Set(allFactors({ groups }).map((f) => f.id));
  const affectedAssessments = workspace.activities.reduce(
    (sum, a) =>
      sum +
      [...changedIds].filter(
        (id) => activeFactorIds.has(id) && a.assessments[id]?.recorded,
      ).length,
    0,
  );
  let next = reviseMethod(
    workspace,
    groups,
    `Loaded method ${raw.version.trim()}: ${activeGroups({ groups }).length} active groupings`,
  );
  next.method.release = {
    version: raw.version.trim(),
    source: typeof raw.source === "string" ? raw.source.slice(0, 500) : "",
    importedAt: new Date().toISOString(),
  };
  if (raw.concepts !== undefined)
    next.conceptSource = {
      raw: nextLibrary.raw,
      name: `Method ${raw.version.trim()}`,
      loadedAt: next.method.release.importedAt,
    };
  next = validateWorkspace(next);
  return {
    workspace: next,
    summary: {
      version: raw.version.trim(),
      source: next.method.release.source,
      before: activeGroups(workspace.method).length,
      after: activeGroups(next.method).length,
      addedGroups: incoming.groups.filter((g) => !beforeGroups.has(g.id))
        .length,
      archivedGroups: activeGroups(workspace.method).filter(
        (g) => !activeGroups(next.method).some((n) => n.id === g.id),
      ).length,
      addedFactors,
      changedFactors: changedIds.size,
      archivedFactors: allFactors(workspace.method).filter(
        (f) => !allFactors(next.method).some((n) => n.id === f.id),
      ).length,
      affectedAssessments,
      changedCriteria: [...changedIds].map((id) => {
        const f = allFactors(next.method, true).find((item) => item.id === id);
        return { id, name: f.name, question: f.question };
      }),
    },
  };
}
