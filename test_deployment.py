"""Test Vercel deployment to verify Supabase configuration is working"""
from playwright.sync_api import sync_playwright
import time

def test_deployment():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Collect console messages
        console_messages = []
        page.on('console', lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))

        print("=" * 60)
        print("Testing deployment at ai.yuansiqiai.com")
        print("=" * 60)

        try:
            # Navigate to the site
            print("\n1. Loading the site...")
            page.goto('https://ai.yuansiqiai.com', timeout=30000)
            page.wait_for_load_state('networkidle')
            print("   ✓ Site loaded successfully")

            # Take screenshot
            page.screenshot(path='/tmp/deployment_check.png', full_page=True)
            print("   ✓ Screenshot saved to /tmp/deployment_check.png")

            # Check for Supabase configuration warnings
            print("\n2. Checking console for Supabase errors...")
            supabase_errors = [msg for msg in console_messages if 'supabase' in msg.lower() or 'not configured' in msg.lower()]

            if supabase_errors:
                print("   ⚠ Found Supabase-related messages:")
                for msg in supabase_errors:
                    print(f"      {msg}")
            else:
                print("   ✓ No Supabase configuration errors found")

            # Check page content for error messages
            print("\n3. Checking page content...")
            page_content = page.content()

            if 'Supabase not configured' in page_content:
                print("   ✗ Found 'Supabase not configured' in page")
            else:
                print("   ✓ No 'Supabase not configured' message in page")

            # Try to find login button and test
            print("\n4. Looking for login functionality...")

            # Look for login button
            login_button = page.locator('text=登录').first
            if login_button.is_visible():
                print("   Found login button, clicking...")
                login_button.click()
                time.sleep(2)

                # Take screenshot of login state
                page.screenshot(path='/tmp/login_check.png', full_page=True)
                print("   ✓ Login dialog screenshot saved to /tmp/login_check.png")

                # Check for any error messages
                error_messages = page.locator('[role="alert"], .error, .text-red-500, .text-destructive').all()
                if error_messages:
                    print("   ⚠ Found error elements on page:")
                    for elem in error_messages[:3]:
                        try:
                            print(f"      - {elem.text_content()}")
                        except:
                            pass
            else:
                print("   No login button visible - user might already be on main page")

            # Print all console messages for debugging
            print("\n5. All console messages:")
            for msg in console_messages[-20:]:  # Last 20 messages
                print(f"   {msg}")

            print("\n" + "=" * 60)
            print("Test completed!")
            print("=" * 60)

        except Exception as e:
            print(f"\n✗ Error during test: {e}")
            page.screenshot(path='/tmp/error_screenshot.png', full_page=True)
            print("   Error screenshot saved to /tmp/error_screenshot.png")

        finally:
            browser.close()

if __name__ == '__main__':
    test_deployment()
