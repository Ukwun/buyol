import { describe, expect, it } from "vitest";
import { createDocumentConverter } from "@/lib/firebase/converters";

describe("Firestore converters", () => {
  it("removes the local document id when serializing and restores it when reading", () => {
    const converter = createDocumentConverter<{ id: string; value: string }>();
    const data = converter.toFirestore({ id: "document-1", value: "value" });
    expect(data).toEqual({ value: "value" });

    const document = converter.fromFirestore({
      id: "document-1",
      data: () => ({ value: "value" }),
    } as never);
    expect(document).toEqual({ id: "document-1", value: "value" });
  });
});
