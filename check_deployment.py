#!/usr/bin/env python3
"""Check deployed website status"""

from playwright.sync_api import sync_playwright

def check_deployment():
    print("=" * 60)
    print("Checking Deployed Website")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console messages
        console_messages = []
        page.on("console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))

        print("\n1. Loading website...")
        try:
            page.goto("https://ai.yuansiqiai.com", timeout=30000)
            page.wait_for_load_state("networkidle", timeout=15000)
            print("   ✅ Website loaded successfully")
        except Exception as e:
            print(f"   ❌ Error loading: {e}")

        print("\n2. Page title:")
        print(f"   {page.title()}")

        print("\n3. Current URL:")
        print(f"   {page.url()}")

        print("\n4. Console messages:")
        for msg in console_messages:
            if "supabase" in msg.lower() or "error" in msg.lower() or "warning" in msg.lower():
                print(f"   {msg}")

        if not any("supabase" in msg.lower() for msg in console_messages):
            print("   (No Supabase-related messages)")

        print("\n5. Taking screenshot...")
        page.screenshot(path="/tmp/deployment_check.png", full_page=True)
        print("   Screenshot saved to /tmp/deployment_check.png")

        print("\n6. Checking for login elements...")
        # Look for login-related elements
        login_button = page.locator("text=登录").first
        if login_button.is_visible():
            print("   ✅ Login button found")
        else:
            print("   ⚠️  No login button visible")

        # Check for error messages on page
        print("\n7. Checking page content for errors...")
        content = page.content()
        if "not configured" in content.lower():
            print("   ⚠️  'not configured' text found in page")
        elif "error" in content.lower():
            print("   ⚠️  'error' text found in page")
        else:
            print("   ✅ No obvious error messages in page content")

        browser.close()

    print("\n" + "=" * 60)
    print("Check Complete - View screenshot at /tmp/deployment_check.png")
    print("=" * 60)

if __name__ == "__main__":
    check_deployment()
