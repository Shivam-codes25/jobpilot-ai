from playwright.sync_api import sync_playwright
import time

def test_automation_agent(role: str, location: str):
    print("🤖 Booting up JobPilot Automation Engine...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()
        
        print(f"🔍 Navigating the web for: {role} in {location}")
        page.goto("https://duckduckgo.com")
        
        # Wait for the page to fully load
        page.wait_for_load_state("networkidle")
        
        print("⌨️ Typing search query like a human...")
        # DuckDuckGo auto-focuses the search bar, so we can just start typing!
        search_query = f'"{role}" intern OR junior {location} site:boards.greenhouse.io'
        page.keyboard.type(search_query, delay=50) # typing with a 50ms delay per keystroke
        page.keyboard.press("Enter")
        
        # Wait for results to load
        page.wait_for_timeout(4000)
        
        print("📸 Taking a snapshot of the results...")
        page.screenshot(path="agent_vision.png")
        
        # Extract the titles using a more resilient CSS selector (finding links inside headings)
        results = page.locator("article h2 a").all_inner_texts()
        
        print("\n✅ AGENT FOUND THE FOLLOWING LINKS:")
        if not results:
            print("No results found. (DuckDuckGo might have changed their layout again!)")
        else:
            for i, title in enumerate(results[:5], 1):
                print(f"{i}. {title}")
            
        print("\nClosing browser in 3 seconds...")
        time.sleep(3)
        browser.close()

if __name__ == "__main__":
    test_automation_agent("Data Analyst", "India")
