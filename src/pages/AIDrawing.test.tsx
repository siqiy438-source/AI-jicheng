import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi, type Mock } from "vitest";

import AIDrawing from "./AIDrawing";
import { generateImage } from "@/lib/ai-image";

const queryBuilder = {
  data: [],
  error: null,
  select: () => queryBuilder,
  eq: () => queryBuilder,
};

vi.mock("@/lib/ai-image", () => ({
  generateImage: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => queryBuilder,
  },
}));

vi.mock("@/components/PageLayout", () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <AIDrawing />
    </MemoryRouter>,
  );

describe("AIDrawing 线路选择", () => {
  beforeEach(() => {
    (generateImage as Mock).mockResolvedValue({
      success: true,
      imageBase64: "data:image/png;base64,abc",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("默认走普通线路并传给后端", async () => {
    renderPage();

    await userEvent.type(
      screen.getByPlaceholderText("输入你想要可视化的内容..."),
      "测试提示词",
    );

    await userEvent.click(screen.getByRole("button", { name: "开始生成" }));

    expect(generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        line: "standard",
        prompt: "测试提示词",
      }),
    );
  });

  test("切换到优质线路后传给后端", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("radio", { name: "优质线路" }));
    await userEvent.type(
      screen.getByPlaceholderText("输入你想要可视化的内容..."),
      "测试提示词",
    );
    await userEvent.click(screen.getByRole("button", { name: "开始生成" }));

    expect(generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        line: "premium",
      }),
    );
  });
});
