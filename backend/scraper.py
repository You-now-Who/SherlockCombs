import os
from dotenv import load_dotenv
import requests
from requests.models import Response
import json

load_dotenv()

SCRAPINGDOG_API_KEY = os.environ["SCRAPINGDOG_API"]
SCRAPING_ENDPOINT = os.environ["SCRAPING_ENDPOINT"]

def make_shopping_request(query):
    params = {
    "api_key": SCRAPINGDOG_API_KEY,
    "query": query,
    "language": "English",
    "country": "uk"
    }
    
    body = ""
    
    with open('make_life_ez.json') as f:
        body = json.load(f)
        # print(body)
  
    response = requests.get(SCRAPING_ENDPOINT, params=params)
    
    # response = Response()
    # response._content = json.dumps(body).encode('utf-8')
    # response.status_code = 200
    
    if response.status_code == 200:
        # data = response.json()
        return response
    else:
        print(f"Request failed with status code: {response.status_code}")
        return response
    
if __name__ == "__main__":
    res = make_shopping_request("Beige jacket")
    body = res.json()
    # print(body)