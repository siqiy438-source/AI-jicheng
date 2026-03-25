import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi, type Mock } from "vitest";

import FashionVirtualTryOn from "./FashionVirtualTryOn";
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
      <FashionVirtualTryOn />
    </MemoryRouter>,
  );

function getFileInputs(container: HTMLElement) {
  return Array.from(container.querySelectorAll('input[type="file"]')) as HTMLInputElement[];
}

async function uploadRequiredImages(
  user: ReturnType<typeof userEvent.setup>,
  inputs: HTMLInputElement[],
) {
  await user.upload(inputs[0], new File(["model"], "model.png", { type: "image/png" }));
  await user.upload(inputs[1], new File(["top"], "top.png", { type: "image/png" }));
  await user.upload(inputs[2], new File(["bottom"], "bottom.png", { type: "image/png" }));
}

describe("FashionVirtualTryOn accessory sync", () => {
  beforeEach(() => {
    (compressImage as Mock).mockImplementation(async (file: File) => {
      const name = file.name.replace(/\.[^.]+$/, "");
      return `data:image/png;base64,${name}`;
    });
    (generateImage as Mock).mockResolvedValue({
      success: true,
      imageBase64: "data:image/png;base64,result-image",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("仅上传服装时保持原有图片顺序", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();
    const inputs = getFileInputs(container);

    await uploadRequiredImages(user, inputs);
    await user.click(screen.getByRole("button", { name: "开始换衣" }));

    await waitFor(() => {
      expect(generateImage).toHaveBeenCalledWith(
        expect.objectContaining({
          images: [
            "data:image/png;base64,model",
            "data:image/png;base64,top",
            "data:image/png;base64,bottom",
          ],
        }),
      );
    });

    await waitFor(() => {
      expect(saveGeneratedImageWork).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            hasShoesImage: false,
            hasBagImage: false,
            sentReferenceImageCount: 3,
          }),
        }),
      );
    });
  });

  test("上传鞋子时会把鞋图追加到请求并注入鞋子规则", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();
    const inputs = getFileInputs(container);

    await uploadRequiredImages(user, inputs);
    await user.upload(inputs[4], new File(["shoes"], "shoes.png", { type: "image/png" }));
    await user.click(screen.getByRole("button", { name: "开始换衣" }));

    await waitFor(() => {
      expect(generateImage).toHaveBeenCalledWith(
        expect.objectContaining({
          images: [
            "data:image/png;base64,model",
            "data:image/png;base64,top",
            "data:image/png;base64,bottom",
            "data:image/png;base64,shoes",
          ],
        }),
      );
    });

    const prompt = (generateImage as Mock).mock.calls[0][0].prompt as string;
    expect(prompt).toContain("Image 4 is the SHOES reference image");
    expect(prompt).toContain("replace only the shoes that are already visible on the model in Image 1");
  });

  test("上传包包时会把包图追加到请求并注入保守替换规则", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();
    const inputs = getFileInputs(container);

    await uploadRequiredImages(user, inputs);
    await user.upload(inputs[5], new File(["bag"], "bag.png", { type: "image/png" }));
    await user.click(screen.getByRole("button", { name: "开始换衣" }));

    await waitFor(() => {
      expect(generateImage).toHaveBeenCalledWith(
        expect.objectContaining({
          images: [
            "data:image/png;base64,model",
            "data:image/png;base64,top",
            "data:image/png;base64,bottom",
            "data:image/png;base64,bag",
          ],
        }),
      );
    });

    const prompt = (generateImage as Mock).mock.calls[0][0].prompt as string;
    expect(prompt).toContain("Image 4 is the BAG reference image");
    expect(prompt).toContain("If Image 1 has no bag and no natural carrying/contact condition, do not invent a new bag.");
  });

  test("同时上传鞋子和包包时会全部进入请求并记录 metadata", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();
    const inputs = getFileInputs(container);

    await uploadRequiredImages(user, inputs);
    await user.upload(inputs[4], new File(["shoes"], "shoes.png", { type: "image/png" }));
    await user.upload(inputs[5], new File(["bag"], "bag.png", { type: "image/png" }));
    await user.click(screen.getByRole("button", { name: "开始换衣" }));

    await waitFor(() => {
      expect(generateImage).toHaveBeenCalledWith(
        expect.objectContaining({
          images: [
            "data:image/png;base64,model",
            "data:image/png;base64,top",
            "data:image/png;base64,bottom",
            "data:image/png;base64,shoes",
            "data:image/png;base64,bag",
          ],
        }),
      );
    });

    const prompt = (generateImage as Mock).mock.calls[0][0].prompt as string;
    expect(prompt).toContain("Image 4 is the SHOES reference image");
    expect(prompt).toContain("Image 5 is the BAG reference image");

    await waitFor(() => {
      expect(saveGeneratedImageWork).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            hasShoesImage: true,
            hasBagImage: true,
            sentReferenceImageCount: 5,
            accessorySyncMode: "conservative",
          }),
        }),
      );
    });
  });
});
