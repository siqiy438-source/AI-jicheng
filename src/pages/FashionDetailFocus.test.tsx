import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi, type Mock } from "vitest";

import FashionDetailFocus from "./FashionDetailFocus";
import { getDetailFocusOptions } from "@/lib/fashion-detail-focus";
import { generateImage } from "@/lib/ai-image";
import { compressImage } from "@/lib/image-utils";
import { saveGeneratedImageWork } from "@/lib/repositories/works";

vi.mock("@/lib/ai-image", () => ({
  generateImage: vi.fn(),
}));

vi.mock("@/lib/fashion-detail-focus", async () => {
  const actual = await vi.importActual("@/lib/fashion-detail-focus");
  return {
    ...actual,
    getDetailFocusOptions: vi.fn(),
  };
});

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

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const detailOptionsResult = {
  itemType: "短款牛仔外套",
  summary: "这件衣服的门襟、口袋、压线和面料纹理都值得单独拍。",
  suggestions: [
    {
      id: "structure-collar",
      category: "structure" as const,
      title: "领口与门襟结构",
      instruction: "拍领口与门襟结构",
      reason: "最能说明版型和结构。",
      priority: 100,
    },
    {
      id: "feature-pocket",
      category: "feature" as const,
      title: "口袋与翻盖元素",
      instruction: "拍口袋与翻盖",
      reason: "这部分最有识别度。",
      priority: 90,
    },
    {
      id: "craft-stitching",
      category: "craft" as const,
      title: "压线与拼接工艺",
      instruction: "拍压线与拼接",
      reason: "适合体现做工。",
      priority: 80,
    },
    {
      id: "fabric-texture",
      category: "fabric" as const,
      title: "面料纹理",
      instruction: "拍面料纹理",
      reason: "适合表现材质感。",
      priority: 70,
    },
  ],
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <FashionDetailFocus />
    </MemoryRouter>,
  );

const uploadReferenceImage = async (user: ReturnType<typeof userEvent.setup>, container: HTMLElement) => {
  const input = container.querySelector('input[type="file"]');
  expect(input).not.toBeNull();
  await user.upload(
    input as HTMLInputElement,
    new File(["denim"], "denim.png", { type: "image/png" }),
  );
};

describe("FashionDetailFocus", () => {
  beforeEach(() => {
    (compressImage as Mock).mockImplementation(async (file: File) => {
      const name = file.name.replace(".png", "");
      return `data:image/png;base64,${name}`;
    });
    (generateImage as Mock).mockResolvedValue({
      success: true,
      imageBase64: "data:image/png;base64,main-image",
    });
    (getDetailFocusOptions as Mock).mockResolvedValue(detailOptionsResult);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("主图生成成功后会拉取细节候选项", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();

    await uploadReferenceImage(user, container);
    await user.click(screen.getByRole("button", { name: "生成主图并分析细节" }));

    await waitFor(() => {
      expect(getDetailFocusOptions).toHaveBeenCalledWith(
        "data:image/png;base64,denim",
        "data:image/png;base64,main-image",
      );
    });

    expect(await screen.findByText("领口与门襟结构")).toBeInTheDocument();
    expect(screen.getByText(/短款牛仔外套/)).toBeInTheDocument();
  });

  test("候选项最多选择 3 个，自定义项占用一个名额", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();

    await uploadReferenceImage(user, container);
    await user.click(screen.getByRole("button", { name: "生成主图并分析细节" }));
    await screen.findByText("领口与门襟结构");

    await user.click(screen.getByRole("button", { name: /领口与门襟结构/ }));
    await user.click(screen.getByRole("button", { name: /口袋与翻盖元素/ }));
    expect(screen.getByText("已选择 2/3")).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText(/例如：想拍纽扣表面质感/),
      "想拍纽扣表面质感",
    );
    await user.click(screen.getByRole("button", { name: "使用自定义选项" }));

    expect(screen.getByText("已选择 3/3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /自定义 · 想拍纽扣表面质感/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /压线与拼接工艺/ }));
    expect(screen.getByText("已选择 3/3")).toBeInTheDocument();
  });

  test("批量生成细节图时会逐张保存，并可重试失败项", async () => {
    const user = userEvent.setup();
    (generateImage as Mock)
      .mockResolvedValueOnce({
        success: true,
        imageBase64: "data:image/png;base64,main-image",
      })
      .mockResolvedValueOnce({
        success: true,
        imageBase64: "data:image/png;base64,detail-1",
      })
      .mockResolvedValueOnce({
        success: false,
        error: "第二张失败",
      })
      .mockResolvedValueOnce({
        success: true,
        imageBase64: "data:image/png;base64,detail-3",
      })
      .mockResolvedValueOnce({
        success: true,
        imageBase64: "data:image/png;base64,detail-2-retry",
      });

    const { container } = renderPage();
    await uploadReferenceImage(user, container);
    await user.click(screen.getByRole("button", { name: "生成主图并分析细节" }));
    await screen.findByText("领口与门襟结构");

    await user.click(screen.getByRole("button", { name: /领口与门襟结构/ }));
    await user.click(screen.getByRole("button", { name: /口袋与翻盖元素/ }));
    await user.click(screen.getByRole("button", { name: /压线与拼接工艺/ }));
    await user.click(screen.getByRole("button", { name: "生成 3 张细节图" }));

    await waitFor(() => {
      expect(screen.getByText("失败")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "重试失败项" })).toBeInTheDocument();
    });

    expect(generateImage).toHaveBeenCalledTimes(4);
    expect(saveGeneratedImageWork).toHaveBeenCalledTimes(3);

    expect(saveGeneratedImageWork).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          stage: "detail",
          selectedOptionId: "structure-collar",
          selectedOptionTitle: "领口与门襟结构",
          sourceSessionId: expect.any(String),
        }),
      }),
    );

    await user.click(screen.getByRole("button", { name: "重试失败项" }));

    await waitFor(() => {
      expect(screen.getByText("成功 3/3")).toBeInTheDocument();
    });

    expect(generateImage).toHaveBeenCalledTimes(5);
    expect(saveGeneratedImageWork).toHaveBeenCalledTimes(4);
  });
});
