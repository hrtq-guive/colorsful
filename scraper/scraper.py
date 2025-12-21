import csv
import json
import time
import requests
import colorsys
import os
from io import BytesIO
from PIL import Image
from collections import Counter
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "colors_videos.csv")
JSON_OUTPUT_PATH = os.path.join(BASE_DIR, "../web-app/src/data/videos.json")

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def get_brightest_color(image_url):
    """
    Downloads image, samples borders, ignores black/white/gray, returns dominant color.
    """
    try:
        image_url = image_url.split('?')[0]
        response = requests.get(image_url, timeout=10)
        img = Image.open(BytesIO(response.content))
        img = img.convert('RGB')
        img = img.resize((50, 50))

        width, height = img.size
        pixels = []

        # Sample border pixels to find background color
        for x in range(width):
            for y in range(0, 5): pixels.append(img.getpixel((x, y)))
            for y in range(height - 5, height): pixels.append(img.getpixel((x, y)))
        for y in range(5, height - 5):
            for x in range(0, 5): pixels.append(img.getpixel((x, y)))
            for x in range(width - 5, width): pixels.append(img.getpixel((x, y)))

        counts = Counter(pixels)
        common = counts.most_common(20)

        valid_colors = []
        for color, count in common:
            r, g, b = color
            h, s, v = colorsys.rgb_to_hsv(r/255.0, g/255.0, b/255.0)
            if v < 0.15: continue
            if v > 0.9 and s < 0.1: continue
            valid_colors.append((color, count, s, v))

        if not valid_colors:
            return '#{:02x}{:02x}{:02x}'.format(*common[0][0]) if common else "#000000"
        
        best_color = valid_colors[0][0]
        return '#{:02x}{:02x}{:02x}'.format(*best_color)

    except Exception as e:
        print(f"Error processing image {image_url}: {e}")
        return None

def main():
    # Load existing data to avoid redundant processing
    existing_data = {}
    if os.path.exists(CSV_PATH):
        with open(CSV_PATH, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                existing_data[row['url']] = row

    options = webdriver.ChromeOptions()
    options.add_argument("--headless") # Headless for automated runs
    options.add_argument("--mute-audio")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36")

    driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()), options=options)
    
    try:
        url = "https://www.youtube.com/@COLORSxSTUDIOS/videos"
        driver.get(url)
        time.sleep(5)

        # Scroll to load videos
        last_height = driver.execute_script("return document.documentElement.scrollHeight")
        while True:
            driver.execute_script("window.scrollTo(0, document.documentElement.scrollHeight);")
            time.sleep(3)
            new_height = driver.execute_script("return document.documentElement.scrollHeight")
            if new_height == last_height: break
            last_height = new_height
            # If we already have some data, we can stop early if we hit existing URLs?
            # For now, let's load most of them to be safe.
            elems = driver.find_elements(By.TAG_NAME, "ytd-rich-item-renderer")
            if len(elems) > 800: break 

        videos = driver.find_elements(By.TAG_NAME, "ytd-rich-item-renderer")
        new_results = []

        for v in videos:
            try:
                title_elem = v.find_element(By.ID, "video-title-link") 
                title = title_elem.get_attribute("title")
                video_url = title_elem.get_attribute("href")
                
                if video_url in existing_data:
                    new_results.append(existing_data[video_url])
                    continue

                img_elem = v.find_element(By.CSS_SELECTOR, "ytd-thumbnail img")
                thumb_url = img_elem.get_attribute("src")
                
                if title and video_url and thumb_url and "http" in thumb_url:
                    print(f"New video found: {title}")
                    color = get_brightest_color(thumb_url)
                    if color:
                        new_results.append({
                            "title": title,
                            "url": video_url,
                            "thumbnail": thumb_url,
                            "color": color
                        })
            except: continue
    finally:
        driver.quit()

    # Save to CSV (Scraper cache)
    keys = ["title", "url", "thumbnail", "color"]
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        writer.writerows(new_results)

    # Convert to JSON for Web App
    json_data = []
    for item in new_results:
        json_data.append({
            **item,
            "rgb": hex_to_rgb(item["color"])
        })
    
    os.makedirs(os.path.dirname(JSON_OUTPUT_PATH), exist_ok=True)
    with open(JSON_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(json_data, f, indent=2)

    print(f"Success! {len(json_data)} videos updated in {JSON_OUTPUT_PATH}")

if __name__ == "__main__":
    main()
