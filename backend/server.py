from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from playwright.sync_api import sync_playwright

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScrapeRequest(BaseModel):
    role: str
    location: str

@app.post("/api/scrape/duckduckgo")
def scrape_duckduckgo(req: ScrapeRequest):
    print(f"\n🚀 Received Scrape Request from Dashboard: {req.role} in {req.location}")
    results = []
    
    with sync_playwright() as p:
        # Changed to headless=False so we can see it!
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        print("🔍 Opening DuckDuckGo...")
        page.goto("https://duckduckgo.com")
        page.wait_for_load_state("networkidle")
        
        search_query = f'"{req.role}" intern OR junior {req.location} site:boards.greenhouse.io'
        print(f"⌨️ Typing query: {search_query}")
        page.keyboard.type(search_query, delay=10)
        page.keyboard.press("Enter")
        
        page.wait_for_timeout(4000)
        
        links = page.locator("article h2 a").all()
        print(f"✅ Found {len(links)} links on the page.")
        
        for link in links[:5]:
            title = link.inner_text()
            url = link.get_attribute("href")
            results.append({
                "title": title,
                "url": url,
            })
            print(f"  -> {title}")
            
        browser.close()
        
    print(f"📤 Sending {len(results)} jobs back to the dashboard.\n")
    return {"status": "success", "jobs": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
