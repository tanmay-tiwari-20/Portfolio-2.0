import { cache } from "react";
import snapshot from "@/data/github-contributions.json";
import { parseContributionData } from "./github-contributions";

/** Read the generated snapshot only. Public page requests never contact GitHub. */
export const getGithubContributions = cache(async () => {
  try {
    // Bundled with the server build, including deployments with a /data volume.
    return parseContributionData(snapshot);
  } catch {
    console.warn(
      "GitHub city: snapshot missing or invalid. Run npm run fetch:github.",
    );
    return null;
  }
});
