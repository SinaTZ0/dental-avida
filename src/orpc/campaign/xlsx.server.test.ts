import { inflateRawSync } from "node:zlib";

import { describe, expect, it } from "vitest";

import { buildRtlXlsx } from "#/orpc/campaign/xlsx.server";

/** Reads the entries from a ZIP buffer created with standard local headers. */
function readZipEntries(buf: Uint8Array): Map<string, string> {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const decoder = new TextDecoder();
  const entries = new Map<string, string>();
  let offset = 0;

  while (offset + 30 <= buf.length && view.getUint32(offset, true) === 0x04034b50) {
    const compressedSize = view.getUint32(offset + 18, true);
    const nameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLen + extraLen;
    const name = decoder.decode(buf.subarray(nameStart, nameStart + nameLen));
    const inflated = inflateRawSync(buf.subarray(dataStart, dataStart + compressedSize));
    entries.set(name, decoder.decode(inflated));
    offset = dataStart + compressedSize;
  }

  return entries;
}

describe("RTL xlsx export", () => {
  it("produces a valid RTL OOXML workbook with escaped Persian cells", () => {
    const buffer = buildRtlXlsx({
      sheetName: "لیدهای بلک فرایدی",
      columns: [
        { header: "نام", width: 24 },
        { header: "توضیح", width: 32 },
      ],
      rows: [["سارا احمدی", "ایمپلنت & <لمینیت>"]],
    });

    const entries = readZipEntries(buffer);
    const sheet = entries.get("xl/worksheets/sheet1.xml");
    expect(sheet).toBeDefined();
    expect(sheet).toContain('rightToLeft="1"');
    expect(sheet).toContain("سارا احمدی");
    expect(sheet).toContain("ایمپلنت &amp; &lt;لمینیت&gt;");
    expect(entries.has("xl/workbook.xml")).toBe(true);
    expect(entries.has("[Content_Types].xml")).toBe(true);
  });
});
