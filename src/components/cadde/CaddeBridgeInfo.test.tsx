import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CaddeBridgeInfo, { BRIDGE_AUDIENCES } from "./CaddeBridgeInfo";

describe("CaddeBridgeInfo (workshop m35)", () => {
  it("dört hedef kitleyi metin sözleşmesi olarak tutar", () => {
    expect(BRIDGE_AUDIENCES).toHaveLength(4);
    expect(BRIDGE_AUDIENCES).toContain("Türkiye'ye dönmek isteyenler");
    expect(BRIDGE_AUDIENCES).toContain("Yurt dışına gitmek isteyenler");
  });

  it("kapalıyken balon içeriği DOM'da yoktur", () => {
    render(<CaddeBridgeInfo />);

    expect(screen.getByTestId("cadde-bridge-info-trigger")).toBeInTheDocument();
    expect(screen.queryByTestId("cadde-bridge-info-content")).not.toBeInTheDocument();
  });

  it("dokunuş/tıklama ile açılır ve dört grubu listeler", async () => {
    const user = userEvent.setup();
    render(<CaddeBridgeInfo />);

    await user.click(screen.getByTestId("cadde-bridge-info-trigger"));

    expect(await screen.findByTestId("cadde-bridge-info-content")).toBeInTheDocument();
    for (const audience of BRIDGE_AUDIENCES) {
      expect(screen.getByText(audience)).toBeInTheDocument();
    }
  });

  it("masaüstünde hover ile açılır (Tooltip değil Popover kararının gerekçesi)", async () => {
    const user = userEvent.setup();
    render(<CaddeBridgeInfo />);

    await user.hover(screen.getByTestId("cadde-bridge-info-trigger"));

    expect(await screen.findByTestId("cadde-bridge-info-content")).toBeInTheDocument();
  });
});
