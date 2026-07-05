import { describe, expect, test } from "vitest";

import { runBrowserFastScan } from "./fast-scan";

function file(path: string, size = 1200): File {
  const blob = new Blob(["x".repeat(size)], { type: "image/jpeg" });
  return new File([blob], path.split("/").at(-1) ?? "image.jpg", {
    type: "image/jpeg",
  });
}

describe("browser fast scan", () => {
  test("parses split labels and class distribution from webkitRelativePath", () => {
    const trainOrganic = file("a.jpg") as File & { webkitRelativePath: string };
    trainOrganic.webkitRelativePath = "waste/train/organic/a.jpg";
    const valRecyclable = file("b.jpg") as File & { webkitRelativePath: string };
    valRecyclable.webkitRelativePath = "waste/val/recyclable/b.jpg";

    const result = runBrowserFastScan([trainOrganic, valRecyclable]);

    expect(result.totalImages).toBe(2);
    expect(result.splits.train).toBe(1);
    expect(result.splits.val).toBe(1);
    expect(result.classes.organic.count).toBe(1);
    expect(result.classes.recyclable.count).toBe(1);
    expect(result.recommendations[0]).toHaveProperty("problem");
    expect(result.recommendations[0]).toHaveProperty("evidence");
    expect(result.recommendations[0]).toHaveProperty("action");
  });

  test("warns above 5000 images and recommends Fast Scan first", () => {
    const files = Array.from({ length: 5001 }, (_, index) => {
      const next = file(`${index}.jpg`) as File & { webkitRelativePath: string };
      next.webkitRelativePath = `dataset/class-a/${index}.jpg`;
      return next;
    });

    const result = runBrowserFastScan(files);

    expect(result.warnings[0]).toContain("5,001 images");
    expect(result.recommendations.some((rec) => rec.action.includes("Fast Scan"))).toBe(true);
  });
});
