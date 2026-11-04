import { ArrowUpRight } from "lucide-react";
import { getGithubContributions } from "@/lib/get-github-contributions";
import {
  CITY_GROUND,
  CITY_LEADER,
  createCityLayout,
  getBuildingGeometry,
  getPeakAnnotation,
} from "@/lib/contribution-city";
import type { ContributionData } from "@/lib/github-contributions";
import ContributionCityCanvas from "./contribution-city-canvas";
import styles from "./contribution-city.module.css";

const date = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));

function StaticCity({
  data,
  mobile = false,
}: {
  data: ContributionData;
  mobile?: boolean;
}) {
  const layout = createCityLayout(
    data,
    mobile ? 350 : 1280,
    mobile ? 560 : 390,
  );
  const annotation = getPeakAnnotation(layout, Infinity);
  const points = (vertices: { x: number; y: number }[]) =>
    vertices.map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  return (
    <svg
      className={mobile ? styles.staticMobile : styles.staticDesktop}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {layout.districts.map((district) => (
        <polygon
          key={district.index}
          points={points(district.ground)}
          fill={CITY_GROUND.fill}
          stroke={CITY_GROUND.stroke}
          strokeWidth="0.6"
        />
      ))}
      {layout.buildings.map((building) => {
        const geometry = getBuildingGeometry(building, Infinity);
        return (
          <g key={building.day.date}>
            <polygon
              points={points(geometry.front)}
              fill={building.palette.front}
            />
            <polygon
              points={points(geometry.side)}
              fill={building.palette.side}
            />
            <polygon
              points={points(geometry.top)}
              fill={building.palette.top}
              stroke={building.palette.edge}
              strokeWidth="0.4"
            />
          </g>
        );
      })}
      {annotation && data.maxDay && (
        <g fill={CITY_LEADER}>
          <polyline
            points={points([
              annotation.anchor,
              { x: annotation.anchor.x, y: annotation.end.y },
              annotation.end,
            ])}
            fill="none"
            stroke={CITY_LEADER}
            strokeWidth="1"
          />
          <circle cx={annotation.anchor.x} cy={annotation.anchor.y} r="2.5" />
          <text x={annotation.end.x} y={annotation.end.y - 32} fontSize="9">
            MOST ACTIVE DAY
          </text>
          <text x={annotation.end.x} y={annotation.end.y - 17} fontSize="13">
            {data.maxDay.contributionCount} contributions
          </text>
          <text x={annotation.end.x} y={annotation.end.y - 4} fontSize="9">
            {date(data.maxDay.date)}
          </text>
        </g>
      )}
    </svg>
  );
}

export default async function ContributionCity() {
  const data = await getGithubContributions();
  return (
    <section
      className={styles.section}
      aria-labelledby="contribution-city-title"
      data-contribution-city
    >
      <div className={styles.inner}>
        <div className={styles.eyebrow}>
          <span>
            <i aria-hidden="true" /> GitHub activity
          </span>
          <a
            href="https://github.com/tanmay-tiwari-20"
            target="_blank"
            rel="noopener noreferrer"
          >
            @tanmay-tiwari-20 <ArrowUpRight size={13} aria-hidden="true" />
            <span className={styles.srOnly}> (opens in a new tab)</span>
          </a>
        </div>
        <header className={styles.heading}>
          <div>
            <h2 id="contribution-city-title">
              A year in <em>commits.</em>
            </h2>
            <p id="contribution-city-description">
              The work between the projects. Each day, a building.
              <br className={styles.desktopBreak} /> Each contribution, a little
              more height.
            </p>
          </div>
          {data && (
            <div className={styles.total}>
              <strong>{data.totalContributions.toLocaleString("en-US")}</strong>
              <span>contributions in this calendar</span>
              <span className={styles.period}>
                {date(data.startDate)} — {date(data.endDate)}
              </span>
            </div>
          )}
        </header>
        {data ? (
          <>
            <ContributionCityCanvas data={data}>
              <StaticCity data={data} />
              <StaticCity data={data} mobile />
            </ContributionCityCanvas>
            <details className={styles.records}>
              <summary>
                Explore the daily record <span aria-hidden="true">+</span>
              </summary>
              <p>
                GitHub’s reported total is{" "}
                {data.totalContributions.toLocaleString("en-US")}.
                {data.maxDay
                  ? ` The most active day was ${date(data.maxDay.date)}, with ${data.maxDay.contributionCount} contributions.`
                  : " No contributions were recorded in this calendar."}{" "}
                Equal peaks use the earliest date. Updated{" "}
                {date(data.generatedAt.slice(0, 10))}.
              </p>
              <div
                className={styles.tableScroll}
                tabIndex={0}
                role="region"
                aria-label="Daily contribution records"
                data-lenis-prevent
              >
                <table>
                  <caption className={styles.srOnly}>
                    Exact contribution counts for every day shown in the city
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Contributions</th>
                      <th scope="col">GitHub level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.days.map((day) => (
                      <tr key={day.date}>
                        <th scope="row">
                          <time dateTime={day.date}>{date(day.date)}</time>
                        </th>
                        <td>{day.contributionCount}</td>
                        <td>
                          {day.contributionLevel
                            .toLowerCase()
                            .replaceAll("_", " ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        ) : (
          <div className={styles.unavailable} role="status">
            <p>The city is waiting for its first contribution snapshot.</p>
            <a href="https://github.com/tanmay-tiwari-20">
              View activity on GitHub{" "}
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
