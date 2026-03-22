import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi, type Mock } from "vitest";

import FashionBreakdown from "./FashionBreakdown";
import { generateImage } from "@/lib/ai-image";
import { compressImage } from "@/lib/image-utils";
import { saveGeneratedImageWork } from "@/lib/repositories/works";

vi.mock("@/lib/ai-image", () => ({
  generateImage: vi.fn(),
}));

vi.mock("@/lib/image-utils", () => ({
  compressImage: vi.fn(),
  downloadGeneratedImage: vi.fn(),
  preloadDownloadImage: vi.fn(),
}));

vi.mock("@/lib/repositories/works", () => ({
  saveGeneratedImageWork: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/components/PageLayout", () => ({
  PageLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/GeneratingLoader", () => ({
  GeneratingLoader: ({ message }: { message: string }) => <div>{message}</div>,
}));

vi.mock("@/components/CreditCostHint", () => ({
  CreditCostHint: ({ featureCode }: { featureCode: string }) => <div>{featureCode}</div>,
}));

vi.mock("@/components/InsufficientBalanceDialog", () => ({
  InsufficientBalanceDialog: () => null,
}));

vi.mock("@/components/LineStatusSelector", () => ({
  LineStatusSelector: ({
    lineOptions,
    selectedLine,
    onSelect,
  }: {
    lineOptions: Array<{ id: string; name: string }>;
    selectedLine: string;
    onSelect: (lineId: string) => void;
  }) => (
    <div>
      {lineOptions.map((option) => (
        <button key={option.id} type="button" onClick={() => onSelect(option.id)}>
          {option.name}
          {selectedLine === option.id ? " 已选" : ""}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("@/hooks/use-credit-check", () => ({
  useCreditCheck: () => ({
    checkCredits: () => true,
    showInsufficientDialog: false,
    requiredAmount: 0,
    featureName: "",
    currentBalance: 0,
    goToRecharge: vi.fn(),
    dismissDialog: vi.fn(),
    refreshBalance: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-line-status", () => ({
  useLineStatus: () => ({
    statuses: {},
  }),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <FashionBreakdown />
    </MemoryRouter>,
  );

describe("FashionBreakdown", () => {
  beforeEach(() => {
    (compressImage as Mock).mockImplementation(async (file: File) => {
      const name = file.name.replace(".png", "");
      return `data:image/png;base64,${name}`;
    });
    (generateImage as Mock).mockResolvedValue({
      success: true,
      imageBase64: "data:image/png;base64,breakdown-result",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("默认只展示 3:4 和 4:3 两种比例，并默认选中 3:4", async () => {
    renderPage();

    expect(screen.getByRole("button", { name: "画幅比例 3:4" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /4:3/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /1:1/ })).not.toBeInTheDocument();
    expect(screen.getByText("ai_fashion_breakdown_standard")).toBeInTheDocument();
  });

  test("生成时会带上正确比例、新 feature code 和固定 prompt 规则", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();

    const input = container.querySelector('input[type="file"]');
    expect(input).not.toBeNull();

    await user.upload(
      input as HTMLInputElement,
      new File(["look"], "look.png", { type: "image/png" }),
    );

    await user.type(
      screen.getByPlaceholderText("补充说明（可选），例如：右侧更工整一点、整体更像杂志穿搭拆解页"),
      "右侧更工整一点",
    );
    await user.click(screen.getByRole("button", { name: "画幅比例 3:4" }));
    await user.click(screen.getByRole("menuitem", { name: /4:3/ }));
    await user.click(screen.getByRole("button", { name: /灵犀 Pro/ }));
    await user.click(screen.getByRole("button", { name: "生成拆解图" }));

    await waitFor(() => {
      expect(generateImage).toHaveBeenCalledWith(
        expect.objectContaining({
          aspectRatio: "4:3",
          featureCode: "ai_fashion_breakdown_premium",
          images: ["data:image/png;base64,look"],
          prompt: expect.stringContaining("Do not switch to a top-bottom layout"),
        }),
      );
    });

    expect(generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("absolutely no text"),
      }),
    );

    await waitFor(() => {
      expect(saveGeneratedImageWork).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            aspectRatio: "4:3",
            line: "premium",
            hasAdditionalNotes: true,
            referenceImageCount: 1,
            toolVariant: "fashion-breakdown",
          }),
        }),
      );
    });
  });
});
