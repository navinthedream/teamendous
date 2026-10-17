const API_KEY = process.env.NEXT_PUBLIC_CAL_API_KEY;
if (!API_KEY) {
  console.error("NEXT_PUBLIC_CAL_API_KEY is not set");
  process.exit(1);
}

const BASE = "https://api.cal.com/v2";
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  "cal-api-version": "2024-06-14",
};

const FULL_DETAIL_SLUGS = new Set(["sunday-morning-qigong", "tea-gathering"]);

async function get(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return res.json();
}

const listData = await get(`${BASE}/event-types?username=navin-pandey-scvuvp`);
const eventTypes = listData?.data?.eventTypeGroups?.flatMap(g => g.eventTypes) ?? listData?.data ?? [];

console.log(`\n${"─".repeat(60)}`);
console.log(`Found ${eventTypes.length} event type(s)`);
console.log(`${"─".repeat(60)}\n`);

for (const et of eventTypes) {
  const detailData = await get(`${BASE}/event-types/${et.id}`);
  const detail = detailData?.data ?? detailData;

  console.log(`id:               ${et.id}`);
  console.log(`slug:             ${et.slug}`);
  console.log(`title:            ${et.title}`);
  console.log(`lengthInMinutes:  ${et.lengthInMinutes}`);
  console.log(`hidden:           ${et.hidden}`);
  console.log(`detail top-level keys: ${Object.keys(detail).join(", ")}`);

  if (FULL_DETAIL_SLUGS.has(et.slug)) {
    console.log(`\n>>> Full detail JSON for "${et.slug}":`);
    console.log(JSON.stringify(detail, null, 2));
  }

  console.log();
}
