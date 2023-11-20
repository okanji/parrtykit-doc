import type * as Party from "partykit/server";

// These funtions can help implement a sharding strategy to split a single document
// accross multiple keys: https://docs.partykit.io/guides/persisting-state-into-storage/
// an example in the y-partykit storage adapter: https://github.com/partykit/partykit/blob/7f307216f33dbef8fb61963cac7ce88ce8e8f769/packages/y-partykit/src/storage.ts#L79C1-L97C2

type DocumentStateVectorKey = ["v1_sv", string];
type DocumentUpdateKey = ["v1", string, "update", number];

type StorageKey = DocumentStateVectorKey | DocumentUpdateKey;

/**
 * Keys are arrays of strings + numbers, so we keep a
 * couple of helpers to encode/decode them.
 */
const keyEncoding = {
  encode(arr: StorageKey) {
    const resultArr = [];
    for (const item of arr) {
      resultArr.push(
        // TODO: This is a bit hacky, but it works
        typeof item === "string" ? `"${item}"` : `${item}`.padStart(9, "0"),
      );
    }
    return resultArr.join("#");
  },
  decode(str: string): StorageKey {
    return str
      .split("#")
      .map((el) =>
        el.startsWith('"') ? (JSON.parse(el) as StorageKey) : parseInt(el, 10),
      ) as StorageKey;
  },
};

/**
 * This helper method returns `null` if the key is not found.
 */
export async function levelGet(
  db: Party.Storage,
  key: StorageKey,
): Promise<Uint8Array | null> {
  const prefix = keyEncoding.encode(key);

  const res = await db.list<Uint8Array>({
    start: prefix,
    end: `${prefix}#zzzzz`,
  });

  if (res.size === 0) {
    return null;
  }

  // combine all the values into one
  const finalArrayLength = Array.from(res.values()).reduce(
    (acc, val) => acc + val.length,
    0,
  );

  const finalArray = new Uint8Array(finalArrayLength);
  let offset = 0;
  for (const val of res.values()) {
    finalArray.set(val, offset);
    offset += val.length;
  }

  return finalArray;
}

/**
 * Set a key + value in storage
 */
export async function levelPut(
  db: Party.Storage,
  key: StorageKey,
  val: Uint8Array,
): Promise<void> {
  // split the val into 128kb chunks
  const chunks = [];
  for (let i = 0; i < val.length; i += 128 * 1024) {
    chunks.push(val.slice(i, i + 128 * 1024));
  }

  const keyPrefix = keyEncoding.encode(key);
  for (let i = 0; i < chunks.length; i++) {
    await db.put(`${keyPrefix}#${i.toString().padStart(3, "0")}`, chunks[i]);
  }
}
