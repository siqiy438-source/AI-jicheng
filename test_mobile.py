#!/usr/bin/env python3
"""
移动端全面测试脚本
测试所有页面在移动端的表现
"""

from playwright.sync_api import sync_playwright
import os

OUTPUT_DIR = "/tmp/mobile_test_results"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 移动设备配置
MOBILE_VIEWPORT = {"width": 375, "height": 812}  # iPhone X
TABLET_VIEWPORT = {"width": 768, "height": 1024}  # iPad

def test_page(page, name, url, viewport, device_name):
    """测试单个页面"""
    page.set_viewport_size(viewport)
    print(f"\n{'='*50}")
    print(f"测试: {name} ({device_name})")
    print(f"URL: {url}")
    print(f"视口: {viewport['width']}x{viewport['height']}")

    try:
        page.goto(url, wait_until='networkidle', timeout=30000)
        page.wait_for_timeout(1000)  # 等待动画完成

        issues = []

        # 1. 检查水平溢出
        body_width = page.evaluate("document.body.scrollWidth")
        viewport_width = viewport["width"]
        if body_width > viewport_width + 5:  # 允许5px误差
            issues.append(f"⚠️ 水平溢出: 页面宽度 {body_width}px > 视口 {viewport_width}px")

        # 2. 检查触摸目标大小
        small_buttons = page.evaluate("""
            () => {
                const elements = document.querySelectorAll('button, a, input, [role="button"]');
                const smallOnes = [];
                elements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        if (rect.width < 44 || rect.height < 44) {
                            const text = el.textContent?.trim().slice(0, 30) || el.className.slice(0, 30);
                            smallOnes.push({
                                tag: el.tagName,
                                text: text,
                                width: Math.round(rect.width),
                                height: Math.round(rect.height)
                            });
                        }
                    }
                });
                return smallOnes.slice(0, 10);  // 只返回前10个
            }
        """)
        if small_buttons:
            issues.append(f"⚠️ 触摸目标过小 ({len(small_buttons)}个):")
            for btn in small_buttons[:5]:
                issues.append(f"   - {btn['tag']}: '{btn['text'][:20]}' ({btn['width']}x{btn['height']}px)")

        # 3. 检查字体大小
        small_text = page.evaluate("""
            () => {
                const elements = document.querySelectorAll('p, span, a, button, input, label');
                const smallOnes = [];
                elements.forEach(el => {
                    const style = window.getComputedStyle(el);
                    const fontSize = parseFloat(style.fontSize);
                    if (fontSize < 14 && el.textContent?.trim()) {
                        smallOnes.push({
                            tag: el.tagName,
                            text: el.textContent.trim().slice(0, 30),
                            size: fontSize
                        });
                    }
                });
                return smallOnes.slice(0, 10);
            }
        """)
        if small_text:
            issues.append(f"⚠️ 字体过小 ({len(small_text)}个):")
            for el in small_text[:5]:
                issues.append(f"   - {el['tag']}: '{el['text'][:20]}' ({el['size']}px)")

        # 4. 检查底部导航是否存在（移动端）
        if viewport["width"] < 768:
            mobile_nav = page.locator('[class*="MobileNav"], nav.fixed.bottom-0, [class*="bottom-nav"]').count()
            if mobile_nav == 0:
                # 检查是否有固定在底部的导航
                fixed_bottom = page.evaluate("""
                    () => {
                        const navs = document.querySelectorAll('nav, [role="navigation"]');
                        for (const nav of navs) {
                            const style = window.getComputedStyle(nav);
                            if (style.position === 'fixed' && style.bottom === '0px') {
                                return true;
                            }
                        }
                        return false;
                    }
                """)
                if not fixed_bottom:
                    issues.append("⚠️ 未检测到移动端底部导航")

        # 5. 检查侧边栏是否隐藏（移动端）
        if viewport["width"] < 768:
            visible_sidebar = page.evaluate("""
                () => {
                    const sidebar = document.querySelector('[class*="Sidebar"], aside');
                    if (!sidebar) return false;
                    const style = window.getComputedStyle(sidebar);
                    return style.display !== 'none' && style.visibility !== 'hidden';
                }
            """)
            if visible_sidebar:
                issues.append("⚠️ 侧边栏在移动端仍然可见")

        # 6. 检查图片是否有尺寸
        images_without_size = page.evaluate("""
            () => {
                const imgs = document.querySelectorAll('img');
                const issues = [];
                imgs.forEach(img => {
                    if (!img.width && !img.height && !img.style.width && !img.style.height) {
                        issues.push(img.src?.slice(-50) || 'unknown');
                    }
                });
                return issues.slice(0, 5);
            }
        """)
        if images_without_size:
            issues.append(f"⚠️ 图片缺少尺寸定义 ({len(images_without_size)}个)")

        # 7. 检查 z-index 堆叠问题
        overlapping = page.evaluate("""
            () => {
                const fixed = document.querySelectorAll('[style*="position: fixed"], .fixed');
                const zIndexes = [];
                fixed.forEach(el => {
                    const style = window.getComputedStyle(el);
                    if (style.position === 'fixed') {
                        zIndexes.push({
                            class: el.className.slice(0, 30),
                            zIndex: style.zIndex
                        });
                    }
                });
                return zIndexes;
            }
        """)

        # 截图
        screenshot_path = f"{OUTPUT_DIR}/{name.replace(' ', '_')}_{device_name}.png"
        page.screenshot(path=screenshot_path, full_page=True)
        print(f"📸 截图已保存: {screenshot_path}")

        # 输出结果
        if issues:
            print(f"\n❌ 发现 {len(issues)} 个问题:")
            for issue in issues:
                print(f"   {issue}")
        else:
            print("\n✅ 测试通过，未发现明显问题")

        return issues

    except Exception as e:
        print(f"\n❌ 测试失败: {str(e)}")
        return [f"❌ 测试失败: {str(e)}"]

def main():
    print("🚀 开始移动端测试...")
    print(f"📁 结果保存目录: {OUTPUT_DIR}")

    all_issues = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15"
        )
        page = context.new_page()

        # 启用控制台日志捕获
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        # 测试页面列表
        pages_to_test = [
            ("首页", "http://localhost:8080/"),
            ("AI海报", "http://localhost:8080/ai-poster"),
            ("朋友圈文案", "http://localhost:8080/copywriting-moments"),
            ("AI绘图", "http://localhost:8080/ai-drawing"),
            ("我的作品", "http://localhost:8080/my-works"),
            ("我的素材", "http://localhost:8080/my-materials"),
        ]

        # 移动端测试
        print("\n" + "="*60)
        print("📱 移动端测试 (375x812 - iPhone X)")
        print("="*60)
        for name, url in pages_to_test:
            issues = test_page(page, name, url, MOBILE_VIEWPORT, "mobile")
            all_issues[f"{name}_mobile"] = issues

        # 平板测试
        print("\n" + "="*60)
        print("📱 平板测试 (768x1024 - iPad)")
        print("="*60)
        for name, url in pages_to_test:
            issues = test_page(page, name, url, TABLET_VIEWPORT, "tablet")
            all_issues[f"{name}_tablet"] = issues

        # 输出控制台错误
        if console_errors:
            print("\n" + "="*60)
            print("🔴 控制台错误:")
            print("="*60)
            for err in set(console_errors):
                print(f"   - {err[:100]}")

        browser.close()

    # 汇总报告
    print("\n" + "="*60)
    print("📊 测试汇总报告")
    print("="*60)

    total_issues = 0
    for page_name, issues in all_issues.items():
        if issues:
            total_issues += len(issues)

    if total_issues == 0:
        print("✅ 所有测试通过！")
    else:
        print(f"⚠️ 共发现 {total_issues} 个问题需要关注")
        print(f"\n📸 截图已保存至: {OUTPUT_DIR}")
        print("   可以查看截图了解具体视觉效果")

if __name__ == "__main__":
    main()
