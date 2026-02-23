import asyncio
from playwright.async_api import async_playwright

async def ensure_no_modal(page):
    # Check for blocking dialog (Login/Onboarding) but NOT the Booking Modal
    # We exclude the booking modal by title
    dialog = page.locator("div[role='dialog']").filter(has_not_text="Private Tour").first
    if await dialog.is_visible():
        print("Found a blocking dialog. Closing it by clicking outside...")
        # Click outside first (top-left corner)
        await page.mouse.click(10, 10)
        await asyncio.sleep(0.5)

        if await dialog.is_visible():
            print("Click outside failed. Trying Escape...")
            await page.keyboard.press("Escape")
            await asyncio.sleep(0.5)

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1920, "height": 1080})
        page = await context.new_page()

        try:
            print("Navigating to demo page...")
            await page.goto("http://127.0.0.1:3000/demo-page")

            await page.wait_for_load_state("domcontentloaded")
            await asyncio.sleep(2)

            await ensure_no_modal(page)

            # --- FIND VISIBLE BUTTON ---
            print("Looking for 'Private Tour' button...")
            tour_btn = page.locator("button:has-text('Private Tour'):visible").first

            max_retries = 3
            for i in range(max_retries):
                try:
                    await ensure_no_modal(page)
                    print(f"Attempting to click (Try {i+1})...")
                    # Try forceful click if standard click fails
                    try:
                        await tour_btn.click(timeout=3000)
                    except:
                        print("Standard click failed/intercepted. Trying force click...")
                        await tour_btn.click(force=True, timeout=3000)

                    print("Click successful!")
                    break
                except Exception as e:
                    print(f"Click failed: {e}")
                    if "intercepts pointer events" in str(e):
                        print("Click intercepted. Trying to clear overlays...")
                        await ensure_no_modal(page)
                        await asyncio.sleep(1)
                    else:
                        raise e

            # --- VERIFY BOOKING MODAL ---
            print("Waiting for Booking Modal...")
            booking_modal_title = page.locator("h2:has-text('Private Tour')")
            await booking_modal_title.wait_for(state="visible", timeout=5000)
            print("Booking Modal OPENED successfully!")

            # --- INTERACT WITH BOOKING MODAL ---
            print("Selecting Date...")
            # Pick the LAST enabled day to ensure it is in the future
            # Using data-day attribute from calendar.tsx
            date_btn = page.locator("button[data-day]:not([disabled])").last

            await date_btn.click()
            print("Date selected.")

            print("Selecting Time...")
            await page.locator("button:has-text('AM')").first.click()
            print("Time selected.")

            print("Clicking Next...")
            await page.locator("button:has-text('Next Step')").click()

            print("Filling Details...")
            await page.locator("textarea").fill("Verification Test")

            print("Clicking Confirm...")
            await page.locator("button:has-text('Confirm')").click()

            print("Waiting for Success...")
            await page.locator("text=Appointment Confirmed").wait_for(state="visible", timeout=10000)

            print("TEST PASSED: Booking flow completed!")

        except Exception as e:
            print(f"TEST FAILED: {e}")
            await page.screenshot(path="verification/final_error.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
