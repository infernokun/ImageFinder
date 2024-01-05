from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

import concurrent.futures

import io
import requests
import os
import time

from tqdm import tqdm
from PIL import Image, UnidentifiedImageError

from logging import FileHandler, WARNING

from flask import Flask, request, redirect
from flask_restful import Api
from flask_cors import CORS

app = Flask(__name__)
file_handler = FileHandler('errorlog.txt')
file_handler.setLevel(WARNING)
CORS(app)  # This will enable CORS for all routes
api = Api(app)
baseUrl = "/image-finder-rest"


# Function to scroll down to the current height of the page
def scroll_down(wd, delay):
    wd.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(delay)


# Function to scroll up to the top of the page
def scroll_up(wd):
    wd.execute_script("window.scrollTo(0, 0);")
    time.sleep(1)


# Function to scrape images from Google
def selenium_google(query, max_images, delay):
    wd = webdriver.Chrome()
    wd.get("https://www.google.com/imghp?hl=en&ogbl")

    search_box = wd.find_element(By.CLASS_NAME, "gLFyf")
    search_box.send_keys(query)
    search_box.send_keys(Keys.RETURN)

    # Load delay
    time.sleep(2)

    # Tool click to prompt resize
    tools = wd.find_element(By.CLASS_NAME, "PNyWAd")
    tools.click()

    # Size click to prompt sizes
    size = wd.find_element(By.CLASS_NAME, "xFo9P.r9PaP")
    size.click()

    # Clicking large size
    large = wd.find_element(By.CSS_SELECTOR, "[aria-label='Large']")
    large.click()

    # Load delay
    time.sleep(2)

    scroll_down(wd, delay)

    image_urls = set()
    skips = 0

    while len(image_urls) + skips < max_images:
        thumbnails = wd.find_elements(By.CLASS_NAME, "Q4LuWd")

        for img in thumbnails[len(image_urls) + skips:max_images]:
            try:
                img.click()
                time.sleep(delay)
            except Exception:
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
    wd.quit()

    return image_urls


# Function to scrape images from Yahoo
def selenium_yahoo(query: str, max_images, delay):
    wd = webdriver.Chrome()

    wd.get(f"https://images.search.yahoo.com/search/images?p={query.replace(' ', '+').lower()}&imgsz=large")

    # Load delay
    time.sleep(2)
    scroll_down(wd, delay)

    # Load delay
    time.sleep(2)
    scroll_down(wd, delay)

    see_more = wd.find_element(By.CLASS_NAME, "more-res")
    see_more.click()

    scroll_down(wd, delay)

    image_urls = set()
    skips = 0

    while len(image_urls) + skips < max_images:
        thumbnails = wd.find_elements(By.CLASS_NAME, "ld.r0")

        for img in thumbnails[len(image_urls) + skips:max_images]:
            try:
                img.click()
                time.sleep(delay)
            except Exception:
                continue

            images = wd.find_elements(By.ID, "img")
            for image in images:
                if image.get_attribute('src') in image_urls:
                    max_images += 1
                    skips += 1
                    break

                if image.get_attribute('src') and 'http' in image.get_attribute('src'):
                    image_urls.add(image.get_attribute('src'))
                    print(f"Found {len(image_urls)}")

    wd.quit()
    return image_urls


# Function to scrape images from Yandex
def selenium_yandex(query: str, max_images, delay):
    wd = webdriver.Chrome()
    wd.get(f"https://yandex.com/images/search?isize=large&text={query.replace(' ', '+').lower()}")

    # Load delay
    time.sleep(2)
    scroll_down(wd, delay)

    # Load delay
    time.sleep(2)
    scroll_down(wd, delay)

    # Rescroll to the top
    scroll_up(wd)

    image_urls = set()
    skips = 0

    while len(image_urls) + skips < max_images:
        thumbnails = wd.find_elements(By.CLASS_NAME, "SimpleImage-Image_clickable")

        for img in thumbnails[len(image_urls) + skips:max_images]:
            try:
                img.click()
                time.sleep(delay)
            except Exception:
                continue

            has_size_list = False

            try:
                sizes = wd.find_element(By.CLASS_NAME, "OpenImageButton-SizesButton")
                sizes.click()

                has_size_list = True
            except Exception:
                print('Missing Size List')

            max_size = wd.find_elements(By.CLASS_NAME, "OpenImageButton-ListItem")[0] \
                if has_size_list \
                else \
                wd.find_element(By.CLASS_NAME, "MMViewerButtons-OpenImage")

            close = wd.find_element(By.CLASS_NAME, "MMViewerModal-Close")

            if max_size.get_attribute('href') in image_urls:
                max_images += 1
                skips += 1
                close.click()
                continue

            if max_size.get_attribute('href') and 'http' in max_size.get_attribute('href'):
                image_urls.add(max_size.get_attribute('href'))
                close.click()
                print(f"Found {len(image_urls)}")

    wd.quit()
    return image_urls


# Endpoint to search an engine for images
@app.route(f'{baseUrl}/search', methods=['POST'])
def get_images_from_google(query="", max_images=5, delay=2):
    data = request.get_json()
    query = data.get('query')
    max_images = data.get('size')
    engine = data.get('engine')

    image_urls = []

    match engine:
        case 'google':
            image_urls = selenium_google(query, max_images, delay)
        case 'yahoo':
            image_urls = selenium_yahoo(query, max_images, delay)
        case 'yandex':
            image_urls = selenium_yandex(query, max_images, delay)
        case _:
            image_urls = selenium_google(query, max_images, delay)

    purged_urls = []

    if image_urls:
        for image in image_urls:
            valid = False
            file_type = get_file_type(image)

            if file_type is None:
                continue

            purged_url = f'{image.split(file_type)[0]}{file_type}'

            img_request = requests.get(purged_url)
            img_file = io.BytesIO(img_request.content)

            try:
                img = Image.open(img_file).convert('RGB')
                valid = True
            except UnidentifiedImageError:
                if recheck_image_validity(image):
                    purged_urls.append(image)
                continue

            if valid:
                purged_urls.append(purged_url)
                print(purged_url)

        print(f"Valid: {purged_urls}")

    return {
        'response': 'success',
        'images': purged_urls,
        'images_original': list(image_urls)
    }


# Function to preform download of requested images
@app.route(f'{baseUrl}/download', methods=['POST'])
def request_download():
    data = request.get_json()
    links = data.get('links')
    query = data.get('query') if data.get('query') else "generic_download"

    print(f'starting {len(links)} downloads')
    num_threads = os.cpu_count()
    download_args = list(enumerate(links))

    with concurrent.futures.ThreadPoolExecutor(max_workers=num_threads) as executor:
        results = list(tqdm(executor.map(download_image_with_index, [(query, arg) for arg in download_args]),
                            total=len(download_args)))

    '''for index, link in enumerate(links):
        file_type = get_file_type(link)
        if file_type is None:
            continue
        filename = f"{query.replace(' ', '_')}_{index}"
        result = download_image("images", link, filename)'''

    return {
        'response': 'success',
        'result': results
    }


# Checks if the unpurged link can be used
def recheck_image_validity(url):
    img_request = requests.get(url)
    img_file = io.BytesIO(img_request.content)

    try:
        img = Image.open(img_file).convert('RGB')
        return True
    except UnidentifiedImageError:
        return False


# Returns the file type from the url
def get_file_type(url):
    if ".png" in url:
        return ".png"
    elif ".jpg" in url:
        return ".jpg"
    elif ".jpeg" in url:
        return ".jpeg"
    elif ".webp" in url:
        return ".webp"
    else:
        return None


# Preforms the download by converting the request content to bytes then to png
def download_image(download_path, url, file_name, file_type="png"):
    try:
        img_content = requests.get(url).content
        img_file = io.BytesIO(img_content)
        img = Image.open(img_file).convert('RGB')
        file_path = f'{download_path}/{file_name}.{file_type}'

        with open(file_path, 'wb') as f:
            img.save(f, file_type, quality=100)

        print(f"Successfully downloaded {url} to {file_path}")
        return 'success'
    except:
        print(f"Failed to download {url}")

    return 'failure'


# Keeps try of the index for filename
def download_image_with_index(args):
    query, (index, img) = args
    filename = f"{query}_{index}"
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

    # query = "Clementine The Walking Dead"
    # img_urls = get_images_from_google(query, wd, 10)

    # num_threads = 8
    # download_args = list(enumerate(img_urls))

    # with concurrent.futures.ThreadPoolExecutor(max_workers=num_threads) as executor:
    #    results = list(tqdm(executor.map(download_image_with_index, download_args), total=len(download_args)))

    # for index, img in enumerate(img_urls):
    #    download_image("images", img, query.replace(" ", "_") + "_" + str(index))
    # download_image("images", "https://yt3.ggpht.com/yti/AGOGRCrHRM73hl8c1oZPjaxWtLNgJYfT9GTYQkWW0LzhMQ=s88-c-k-c0x00ffffff-no-rj", "test")

    # query_prompt = "clementine the walking dead"
    # download_images_bing_highres(query_prompt, num_images=5, output_folder='images')
