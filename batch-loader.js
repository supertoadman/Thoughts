const BATCH_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ITEM_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TOPICS = new Set(['World', 'Life', 'Tech', 'Sports', 'Culture']);

function requiredString(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} must be a nonempty string`);
  return value.trim();
}

function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

export function selectActiveBatches(manifest, now = new Date()) {
  if (manifest?.version !== 1 || !Array.isArray(manifest.batches)) throw new Error('Invalid batch index');
  const ids = new Set();
  return manifest.batches.filter((entry, index) => {
    const id = requiredString(entry?.id, `batches[${index}].id`);
    if (!BATCH_ID.test(id) || ids.has(id)) throw new Error(`Invalid or repeated batch ID: ${id}`);
    ids.add(id);
    if (entry.file !== `${id}.json`) throw new Error(`Batch ${id} must use ${id}.json`);
    if (typeof entry.enabled !== 'boolean') throw new Error(`Batch ${id} needs an enabled flag`);
    if (entry.expectedCount !== undefined && (!Number.isInteger(entry.expectedCount) || entry.expectedCount < 1)) {
      throw new Error(`Batch ${id} has an invalid expectedCount`);
    }
    if (entry.expiresAt !== null &&
      (typeof entry.expiresAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(entry.expiresAt) || Number.isNaN(Date.parse(entry.expiresAt)))) {
      throw new Error(`Batch ${id} has an invalid expiresAt value`);
    }
    return entry.enabled && (entry.expiresAt === null || Date.parse(entry.expiresAt) > now.getTime());
  });
}

export function validateBatch(batch, entry, usedIds = new Set()) {
  if (batch?.id !== entry.id || !Array.isArray(batch.thoughts) || !batch.thoughts.length) {
    throw new Error(`Batch ${entry.id} needs a matching ID and nonempty thoughts array`);
  }
  if (entry.expectedCount !== undefined && batch.thoughts.length !== entry.expectedCount) {
    throw new Error(`Batch ${entry.id} has ${batch.thoughts.length} thoughts; expected ${entry.expectedCount}`);
  }
  const localIds = new Set();
  const thoughts = batch.thoughts.map((item, index) => {
    const label = `${entry.id} thought ${index + 1}`;
    const shortId = requiredString(item?.id, `${label} ID`);
    const id = `${entry.id}:${shortId}`;
    if (!ITEM_ID.test(shortId) || localIds.has(id) || usedIds.has(id)) throw new Error(`Invalid or repeated thought ID: ${id}`);
    localIds.add(id);
    const text = requiredString(item.text, `${label} text`);
    const topic = requiredString(item.topic, `${label} topic`);
    if (!TOPICS.has(topic)) throw new Error(`${label} has an unsupported topic`);
    const url = requiredString(item.url, `${label} URL`);
    let parsed;
    try { parsed = new URL(url); } catch { throw new Error(`${label} has an invalid URL`); }
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(`${label} needs an HTTP source URL`);
    if (!validDate(item.published)) throw new Error(`${label} needs a YYYY-MM-DD published date`);
    return {
      id, text, topic,
      label: requiredString(item.label, `${label} label`),
      story: requiredString(item.story, `${label} story`),
      source: requiredString(item.source, `${label} source`),
      url, published: item.published,
      batchId: entry.id
    };
  });
  for (const id of localIds) usedIds.add(id);
  return thoughts;
}

export async function loadActiveBatches(fetcher = fetch, now = new Date(), baselineIds = []) {
  const response = await fetcher(`./batches/index.json?v=${now.getTime()}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Batch index returned HTTP ${response.status}`);
  const entries = selectActiveBatches(await response.json(), now);
  const fetched = await Promise.allSettled(entries.map(async entry => {
    const result = await fetcher(`./batches/${entry.file}`, { cache: 'no-cache' });
    if (!result.ok) throw new Error(`Batch ${entry.id} returned HTTP ${result.status}`);
    return result.json();
  }));
  const thoughts = [];
  const errors = [];
  const usedIds = new Set(baselineIds);
  let loadedCount = 0;
  fetched.forEach((result, index) => {
    const entry = entries[index];
    if (result.status === 'rejected') { errors.push(`${entry.id}: ${result.reason.message}`); return; }
    try { thoughts.push(...validateBatch(result.value, entry, usedIds)); loadedCount++; }
    catch (error) { errors.push(`${entry.id}: ${error.message}`); }
  });
  return { thoughts, loadedCount, errors };
}
