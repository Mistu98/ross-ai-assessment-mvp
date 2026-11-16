import report from "./reportBaseline.json" with { type: "json" };
// Curated report findings; raw report and engineering screenshots remain outside GitHub.
export const PREPARED_PROFILES = Object.fromEntries(
  report.activities.map((a) => [
    a.code.toLowerCase(),
    Object.fromEntries(
      ["title", "owner", "tool", "description"].map((key) => [key, a[key]]),
    ),
  ]),
);
export const A1_PROFILE = PREPARED_PROFILES.a1;
export const A2_PROFILE = PREPARED_PROFILES.a2;
export const A3_PROFILE = PREPARED_PROFILES.a3;
export const hasPreparedProfile = (activity) =>
  Boolean(
    PREPARED_PROFILES[activity.id] &&
    Object.entries(PREPARED_PROFILES[activity.id]).every(
      ([key, value]) => activity[key] === value,
    ),
  );
export const hasPreparedA1Profile = (activity) =>
  activity.id === "a1" && hasPreparedProfile(activity);
