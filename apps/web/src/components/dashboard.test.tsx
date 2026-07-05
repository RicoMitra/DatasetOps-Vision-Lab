import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { DatasetOpsDashboard } from "./datasetops-dashboard";

test("renders transparent limitations and rejects invalid report upload", async () => {
  const user = userEvent.setup();
  render(<DatasetOpsDashboard />);

  expect(screen.getByText("No semantic object understanding.")).toBeInTheDocument();
  expect(screen.getByText("No near-duplicate detection in v1.")).toBeInTheDocument();
  expect(screen.getByText("Run Python Audit Engine first")).toBeInTheDocument();
  expect(screen.getByText(/pnpm engine:scan/)).toBeInTheDocument();
  expect(screen.getAllByText("Not checked in Fast Scan").length).toBeGreaterThan(1);
  expect(screen.getByText(/Leakage requires train\/val\/test/)).toBeInTheDocument();

  const input = screen.getByLabelText("Import latest-report.json");
  await user.upload(input, new File([JSON.stringify({ nope: true })], "latest-report.json", { type: "application/json" }));

  expect(await screen.findByText(/Invalid DatasetOps report/)).toBeInTheDocument();
});

describe("dashboard empty state", () => {
  test("shows report import and browser fast scan entry points", () => {
    render(<DatasetOpsDashboard />);

    expect(screen.getAllByText("Import latest-report.json").length).toBeGreaterThan(1);
    expect(screen.getByText("Browser Fast Scan")).toBeInTheDocument();
  });
});
