from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

import concurrent.futures

import io
import requests
import os
import time
import json
from tqdm import tqdm
from PIL import Image

from logging import FileHandler,WARNING

from flask import Flask, request, send_from_directory, redirect
from flask_restful import Resource, Api
from flask_cors import CORS, cross_origin 

app = Flask(__name__)
file_handler = FileHandler('errorlog.txt')
file_handler.setLevel(WARNING)
CORS(app)  # This will enable CORS for all routes
api = Api(app)
baseUrl = "/image-finder-rest"

@app.route(f'{baseUrl}/search', methods=['POST'])
def get_images_from_google(query="", max_images=5, delay=2):
    
    def scroll_down(wd):
        wd.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(delay)
        
    data = request.get_json()
    print(data)
    query = data.get('query')
    size = data.get('size')
    
    max_images = size
    
    wd = webdriver.Chrome()
    wd.get("https://www.google.com/imghp?hl=en&ogbl")
    
    search_box = wd.find_element(By.CLASS_NAME, "gLFyf")
    search_box.send_keys(query)
    search_box.send_keys(Keys.RETURN)
    
    time.sleep(2)
    
    tools = wd.find_element(By.CLASS_NAME, "PNyWAd")
    tools.click()
    
    size = wd.find_element(By.CLASS_NAME, "xFo9P.r9PaP")
    size.click()
    
    large = wd.find_element(By.CSS_SELECTOR, "[aria-label='Large']")
    large.click()
    
    time.sleep(2)
    
    scroll_down(wd)

    image_urls = set()
    skips = 0

    while len(image_urls) + skips < max_images:
        # Add consistent indentation using spaces
        # Rest of the code...
        #scroll_down(wd)

        thumbnails = wd.find_elements(By.CLASS_NAME, "Q4LuWd")

        for img in thumbnails[len(image_urls) + skips:max_images]:
            try:
                img.click()
                time.sleep(delay)
            except:
                continue

            images = wd.find_elements(By.CLASS_NAME, "sFlh5c.pT0Scc.iPVvYb")
            for image in images:
                if image.get_attribute('src') in image_urls:
                    max_images += 1
                    skips += 1
                    break

                if image.get_attribute('src') and 'http' in image.get_attribute('src'):
                    image_urls.add(image.get_attribute('src'))
                    print(f"Found {len(image_urls)}")
    purged_urls = []
    
    if (image_urls):
        for image in image_urls:
            if ".png" in image:
                purged_urls.append(f'{image.split(".png")[0]}.png')
            elif ".jpg" in image:
                purged_urls.append(f'{image.split(".jpg")[0]}.jpg')
            elif ".jpeg" in image:
                purged_urls.append(f'{image.split(".jpeg")[0]}.jpeg')
            elif ".webp" in image:
                purged_urls.append(f'{image.split(".webp")[0]}.webp')
            else:
                if requests.get(image).status_code == 200 and image not in purged_urls:
                    purged_urls.append(image)
                
    wd.close() 
    wd.quit()                   
    return {
        'response' : 'success', 
        'images' : purged_urls, 
        'images_original' : list(image_urls)
        }
    
def download_image(download_path, url, file_name, file_type="png"):
    try:
        img_content = requests.get(url).content
        img_file = io.BytesIO(img_content)
        img = Image.open(img_file).convert('RGB')
        file_path = f'{download_path}/{file_name}.{file_type}'
        
        with open(file_path, 'wb') as f:
            img.save(f, file_type, quality=100)
            
        print(f"Successfully downloaded {url} to {file_path}")
    except:
        print(f"Failed to download {url}")
        
def download_image_with_index(args):
    index, img = args
    filename = f"{query.replace(' ', '_')}_{index}"
    result = download_image("images", img, filename)
    return result, index

@app.route(f'{baseUrl}/', methods=['GET'])
def homepageRequest():
    return "Welcome to Image Finder Backend!"


@app.route('/')
def redirectTo():
    return redirect(f'{baseUrl}', code=200)

if __name__ == "__main__":
    app.run(debug=True)
    #query = "Clementine The Walking Dead"
    #img_urls = get_images_from_google(query, wd, 10)

    #num_threads = 8
    #download_args = list(enumerate(img_urls))
    
    #with concurrent.futures.ThreadPoolExecutor(max_workers=num_threads) as executor:
    #    results = list(tqdm(executor.map(download_image_with_index, download_args), total=len(download_args)))
    
    #for index, img in enumerate(img_urls):
    #    download_image("images", img, query.replace(" ", "_") + "_" + str(index))
    #download_image("images", "https://yt3.ggpht.com/yti/AGOGRCrHRM73hl8c1oZPjaxWtLNgJYfT9GTYQkWW0LzhMQ=s88-c-k-c0x00ffffff-no-rj", "test")
    
    #query_prompt = "clementine the walking dead"
    #download_images_bing_highres(query_prompt, num_images=5, output_folder='images')