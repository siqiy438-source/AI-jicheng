import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi, type Mock } from "vitest";

import AIOneClickOutfit from "./AIOneClickOutfit";
import { generateImage } from "@/lib/ai-image";
import {
  buildGarmentDetailStrip,
  buildHangoutfitReferenceBoard,
  compressImage,
  mergeImagesToGridWithAccessories,
} from "@/lib/image-utils";
import { saveGeneratedImageWork } from "@/lib/repositories/works";

vi.mock("@/lib/ai-image", () => ({
  generateImage: vi.fn(),
}));

vi.mock("@/lib/image-utils", () => ({
  compressImage: vi.fn(),
  buildGarmentDetailStrip: vi.fn(),
  buildHangoutfitReferenceBoard: vi.fn(),
  mergeImagesToGridWithAccessories: vi.fn(),
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
      <AIOneClickOutfit />
    </MemoryRouter>,
  );

describe("AIOneClickOutfit 模板选择", () => {
  beforeEach(() => {
    (compressImage as Mock).mockImplementation(async (_file: File) => {
      const name = _file.name.replace(".png", "");
      return `data:image/png;base64,${name}`;
    });
    (buildGarmentDetailStrip as Mock).mockImplementation(async (src: string) => {
      const name = src.split(",")[1];
      return `data:image/jpeg;base64,detail-${name}`;
    });
    (buildHangoutfitReferenceBoard as Mock).mockResolvedValue("data:image/jpeg;base64,reference-board");
    (mergeImagesToGridWithAccessories as Mock).mockResolvedValue("data:image/jpeg;base64,default-reference");
    (generateImage as Mock).mockResolvedValue({
      success: true,
      imageBase64: "data:image/png;base64,result-image",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("选择买手店模板后会用对应 prompt 和 metadata 生成", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();

    const input = container.querySelector('input[type="file"]');
    expect(input).not.toBeNull();

    await user.upload(input as HTMLInputElement, [
      new File(["look-1"], "look-1.png", { type: "image/png" }),
      new File(["look-2"], "look-2.png", { type: "image/png" }),
    ]);

    await waitFor(() => {
      expect(screen.getByText("2/3")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /秋冬买手店/ }));
    await user.type(
      screen.getByPlaceholderText("补充说明（可选）：如“更偏轻熟通勤”“整体再低饱和一点”"),
      "更偏通勤",
    );
    await user.click(screen.getByRole("button", { name: "生成挂搭图" }));

    await waitFor(() => {
      expect(buildHangoutfitReferenceBoard).toHaveBeenCalledWith({
        garmentImages: [
          "data:image/png;base64,look-1",
          "data:image/png;base64,look-2",
        ],
        sceneReferenceSrc: "/hangoutfit/boutique-olive-template.svg",
        boardMode: "garments-plus-scene-template",
      });
    });

    expect(generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        aspectRatio: "9:16",
        images: [
          "data:image/jpeg;base64,reference-board",
          "data:image/png;base64,look-1",
          "data:image/png;base64,look-2",
          "data:image/jpeg;base64,detail-look-1",
          "data:image/jpeg;base64,detail-look-2",
        ],
        negativePrompt: expect.stringContaining("missing floral styling corner"),
      }),
    );
    expect((generateImage as Mock).mock.calls[0][0].prompt).toContain("refined floral styling corner");
    expect((generateImage as Mock).mock.calls[0][0].prompt).toContain("Images 2-3: the user's original full garment photos");

    await waitFor(() => {
      expect(saveGeneratedImageWork).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            selectedTemplateId: "boutique-olive",
            detailStripCount: 2,
            sentReferenceImageCount: 5,
            fidelityMode: "single-pass-prompt-plus-reference",
          }),
        }),
      );
    });
  });

  test("选择杂志圆台陈列模板并上传 2 张图时会使用参考图同款场景生成", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();

    const input = container.querySelector('input[type="file"]');
    expect(input).not.toBeNull();

    await user.upload(input as HTMLInputElement, [
      new File(["top"], "top.png", { type: "image/png" }),
      new File(["skirt"], "skirt.png", { type: "image/png" }),
    ]);

    await waitFor(() => {
      expect(screen.getByText("2/3")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /杂志圆台陈列/ }));
    await user.click(screen.getByRole("button", { name: "生成挂搭图" }));

    await waitFor(() => {
      expect(buildHangoutfitReferenceBoard).toHaveBeenCalledWith({
        garmentImages: [
          "data:image/png;base64,top",
          "data:image/png;base64,skirt",
        ],
        sceneReferenceSrc: "/hangoutfit/editorial-round-table-template.svg",
        boardMode: "garments-plus-scene-template",
      });
    });

    expect(generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        images: [
          "data:image/jpeg;base64,reference-board",
          "data:image/png;base64,top",
          "data:image/png;base64,skirt",
          "data:image/jpeg;base64,detail-top",
          "data:image/jpeg;base64,detail-skirt",
        ],
        negativePrompt: expect.stringContaining("missing round pedestal table"),
      }),
    );
    expect((generateImage as Mock).mock.calls[0][0].prompt).toContain("One premium handbag anchor hanging directly from the left side of the rod");
    expect((generateImage as Mock).mock.calls[0][0].prompt).toContain("Images 2-3: the user's original full garment photos");

    await waitFor(() => {
      expect(saveGeneratedImageWork).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            selectedTemplateId: "editorial-round-table",
          }),
        }),
      );
    });
  });

  test("选择杂志圆台陈列模板并上传 3 张图时会按上传件数挂出 3 件", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();

    const input = container.querySelector('input[type="file"]');
    expect(input).not.toBeNull();

    await user.upload(input as HTMLInputElement, [
      new File(["look-1"], "look-1.png", { type: "image/png" }),
      new File(["look-2"], "look-2.png", { type: "image/png" }),
      new File(["look-3"], "look-3.png", { type: "image/png" }),
    ]);

    await waitFor(() => {
      expect(screen.getByText("3/3")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /杂志圆台陈列/ }));
    await user.click(screen.getByRole("button", { name: "生成挂搭图" }));

    await waitFor(() => {
      expect(buildHangoutfitReferenceBoard).toHaveBeenCalledWith({
        garmentImages: [
          "data:image/png;base64,look-1",
          "data:image/png;base64,look-2",
          "data:image/png;base64,look-3",
        ],
        sceneReferenceSrc: "/hangoutfit/editorial-round-table-template.svg",
        boardMode: "garments-plus-scene-template",
      });
    });

    expect(generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        images: [
          "data:image/jpeg;base64,reference-board",
          "data:image/png;base64,look-1",
          "data:image/png;base64,look-2",
          "data:image/png;base64,look-3",
          "data:image/jpeg;base64,detail-look-1",
          "data:image/jpeg;base64,detail-look-2",
          "data:image/jpeg;base64,detail-look-3",
        ],
      }),
    );
    expect((generateImage as Mock).mock.calls[0][0].prompt).toContain("If 3 garments are uploaded, show exactly 3 garments hanging on the rod");
    expect((generateImage as Mock).mock.calls[0][0].prompt).toContain("Images 5-7: enlarged detail-strip references");

    await waitFor(() => {
      expect(saveGeneratedImageWork).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            uploadedImageCount: 3,
            selectedTemplateId: "editorial-round-table",
          }),
        }),
      );
    });
  });

  test("切换画幅比例后会用选中的比例生成", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();

    const input = container.querySelector('input[type="file"]');
    expect(input).not.toBeNull();

    await user.upload(input as HTMLInputElement, [
      new File(["look-1"], "look-1.png", { type: "image/png" }),
      new File(["look-2"], "look-2.png", { type: "image/png" }),
    ]);

    await waitFor(() => {
      expect(screen.getByText("2/3")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "画幅比例 9:16" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /3:4/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "画幅比例 9:16" }));
    await user.click(screen.getByRole("menuitem", { name: /3:4/ }));
    await user.click(screen.getByRole("button", { name: "生成挂搭图" }));

    expect(generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        aspectRatio: "3:4",
      }),
    );
  });
});
