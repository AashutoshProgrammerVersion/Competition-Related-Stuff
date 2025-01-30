import streamlit as st
import requests
from bs4 import BeautifulSoup
import sqlite3
import re
from requests_html import HTMLSession
import asyncio

# Database setup
materials_connect = sqlite3.connect('materials.db')
materials_cursor = materials_connect.cursor()
materials_cursor.execute("CREATE TABLE IF NOT EXISTS materials (material TEXT)")
if not materials_cursor.execute("SELECT * FROM materials").fetchall():
    materials = ["organic", "recycled", "sustainable", "bamboo", "hemp", "linen", "cork", "biodegradable", "plant-based", "upcycled", "reclaimed", "natural", "eco-friendly", "non-toxic", "non-GMO", "fair trade", "vegan", "cruelty-free", "recyclable", "compostable", "reusable", "energy-efficient", "water-efficient", "carbon-neutral", "carbon-negative", "carbon-neutral", "carbon-offset", "carbon-free", "carbon-reduced", "carbon-sequestering", "carbon-capture", "carbon-footprint", "carbon-emission", "carbon-reduction", "carbon-offsetting"]
    materials = [(material,) for material in materials]
    materials_cursor.executemany("INSERT INTO materials VALUES (?)", materials)
    materials_connect.commit()

manufacturing_connect = sqlite3.connect('manufacturing.db')
manufacturing_cursor = manufacturing_connect.cursor()
manufacturing_cursor.execute("CREATE TABLE IF NOT EXISTS manufacturing (manufacturing TEXT)")
if not manufacturing_cursor.execute("SELECT * FROM manufacturing").fetchall():
    manufacturing = ["fair trade", "ethical", "local", "handmade", "low-impact", "renewable energy", "fair labor", "sweatshop-free", "artisan", "small batch", "made in USA", "made in Canada", "made in Europe", "made in Australia", "made in New Zealand", "made in Japan", "made in South Korea", "made in Taiwan", "made in Hong Kong", "made in Singapore", "made in Malaysia", "made in Thailand", "made in Vietnam", "made in Indonesia", "made in India", "made in China", "made in Bangladesh", "made in Pakistan", "made in Turkey", "made in Brazil", "made in Mexico", "made in Peru", "made in Colombia", "made in Chile", "made in Argentina", "made in South Africa", "made in Nigeria", "made in Kenya", "made in Egypt", "made in Morocco"]
    manufacturing = [(manufacturing,) for manufacturing in manufacturing]
    manufacturing_cursor.executemany("INSERT INTO manufacturing VALUES (?)", manufacturing)
    manufacturing_connect.commit()

packaging_connect = sqlite3.connect('packaging.db')
packaging_cursor = packaging_connect.cursor()
packaging_cursor.execute("CREATE TABLE IF NOT EXISTS packaging (packaging TEXT)")
if not packaging_cursor.execute("SELECT * FROM packaging").fetchall():
    packaging = ["minimal packaging", "recyclable", "compostable", "plastic-free", "refillable", "reduced waste"]
    packaging = [(packaging,) for packaging in packaging]
    packaging_cursor.executemany("INSERT INTO packaging VALUES (?)", packaging)
    packaging_connect.commit()

brand_reputation_connect = sqlite3.connect('brand_reputation.db')
brand_reputation_cursor = brand_reputation_connect.cursor()
brand_reputation_cursor.execute("CREATE TABLE IF NOT EXISTS brand_reputation (brand_reputation TEXT)")
if not brand_reputation_cursor.execute("SELECT * FROM brand_reputation").fetchall():
    brand_reputation = ["B Corp", "1% for the Planet", "GOTS", "Fair Trade Certified"]
    brand_reputation = [(brand_reputation,) for brand_reputation in brand_reputation]
    brand_reputation_cursor.executemany("INSERT INTO brand_reputation VALUES (?)", brand_reputation)
    brand_reputation_connect.commit()

# Streamlit app
st.title("Sustainable Product Rater (Only Amazon Products)")

product_url_input = st.text_input("Enter the product's URL you would like to search")

if product_url_input:
    try:
        response = requests.get(product_url_input)
        response.raise_for_status()  # Check if the request was successful
        soup = BeautifulSoup(response.content, "html.parser")

        # Main product info
        product_name_tag = soup.find('span', class_="a-size-large product-title-word-break")  # Replace with the actual class or id
        product_name = product_name_tag.get_text(strip=True) if product_name_tag else "N/A"

        brand_name_tag = soup.find('a', id="bylineInfo", class_="a-link-normal")  # Replace with the actual class or id
        brand_name = brand_name_tag.get_text(strip=True) if brand_name_tag else "N/A"

        price_tag = soup.find('span', class_="a-offscreen")  # Replace with the actual class or id
        price = price_tag.get_text(strip=True) if price_tag else "N/A"

        description_tag = soup.find('ul', class_="a-unordered-list a-vertical a-spacing-mini")  # Replace with the actual class or id
        description = description_tag.text if description_tag else "N/A"

        customer_reviews_tag = soup.find('span', class_="a-icon-alt")  # Replace with the actual class or id
        customer_reviews = customer_reviews_tag.text if customer_reviews_tag else "N/A"

        number_of_reviews_tag = soup.find('span', class_="a-size-base")  # Replace with the actual class or id
        number_of_reviews = number_of_reviews_tag.text if number_of_reviews_tag else "N/A"

        # Display main product info
        st.subheader("Product Information")
        st.write(f"**Product Name:** {product_name}")
        st.write(f"**Brand Name:** {brand_name}")
        st.write(f"**Price:** {price}")
        st.write(f"**Description:** {description}")
        st.write(f"**Customer Reviews:** {customer_reviews}")
        st.write(f"**Number of Reviews:** {number_of_reviews}")

        def analyze_sustainability(description):
            scores = {
                "materials": 0,
                "manufacturing": 0,
                "packaging": 0,
                "brand_reputation": 0
            }

            materials = []
            materials_cursor.execute("SELECT * FROM materials")
            materials = materials_cursor.fetchall()
            for row in materials:
                materials[materials.index(row)] = row[0]

            manufacturing = []
            manufacturing_cursor.execute("SELECT * FROM manufacturing")
            manufacturing = manufacturing_cursor.fetchall()
            for row in manufacturing:
                manufacturing[manufacturing.index(row)] = row[0]

            packaging = []
            packaging_cursor.execute("SELECT * FROM packaging")
            packaging = packaging_cursor.fetchall()
            for row in packaging:
                packaging[packaging.index(row)] = row[0]

            brand_reputation = []
            brand_reputation_cursor.execute("SELECT * FROM brand_reputation")
            brand_reputation = brand_reputation_cursor.fetchall()
            for row in brand_reputation:
                brand_reputation[brand_reputation.index(row)] = row[0]

            # Check for keywords in the description
            description_lower = description.lower()
            if any(keyword in description_lower for keyword in materials):
                scores["materials"] += 1
            if any(keyword in description_lower for keyword in manufacturing):
                scores["manufacturing"] += 1
            if any(keyword in description_lower for keyword in packaging):
                scores["packaging"] += 1
            if any(keyword in description_lower for keyword in brand_name):
                scores["brand_reputation"] += 1

            return scores

        sustainability_scores = analyze_sustainability(description)
        total_score = sum(sustainability_scores.values())
        st.write(f"**Sustainability Score:** {total_score} out of 4")

        all_product_info = []

        new_url = "https://www.amazon.com/s?k=" + re.sub(r'\W+', '+', product_name)
        async def fetch_recommendations(url):
            session = HTMLSession()
            response = session.get(url)
            await response.html.arender()
            return response
        recommendations_soup = BeautifulSoup(response.content, "html.parser")
        recommendations = recommendations_soup.find_all('a', class_="a-link-normal a-text-normal")
        for recommendation in recommendations:
            link = recommendation.get('href')
            if link:
                link = "https://www.amazon.com" + link
                try:
                    async def fetch_recommendations(url):
                        session = HTMLSession()
                        response = session.get(url)
                        await response.html.arender()
                        return response
                    recommendation_soup = BeautifulSoup(response.content, "html.parser")

                    recommendation_name_tag = recommendation_soup.find('span', class_="a-size-large product-title-word-break")
                    recommendation_brand_name_tag = recommendation_soup.find('a', id="bylineInfo", class_="a-link-normal")
                    recommendation_price_tag = recommendation_soup.find('span', class_="a-offscreen")
                    recommendation_description_tag = recommendation_soup.find('ul', class_="a-unordered-list a-vertical a-spacing-mini")
                    recommendation_customer_reviews_tag = recommendation_soup.find('span', class_="a-icon-alt")

                    recommendation_product_info = {
                        "name": recommendation_name_tag.get_text(strip=True) if recommendation_name_tag else None,
                        "brand": recommendation_brand_name_tag.get_text(strip=True) if recommendation_brand_name_tag else None,
                        "price": recommendation_price_tag.get_text(strip=True) if recommendation_price_tag else None,
                        "description": recommendation_description_tag.text if recommendation_description_tag else None,
                        "customer_reviews": recommendation_customer_reviews_tag.text if recommendation_customer_reviews_tag else None,
                        "link": link
                    }

                    recommendation_scores = analyze_sustainability(recommendation_product_info["description"])
                    recommendation_product_info["sustainability_score"] = sum(recommendation_scores.values())

                    all_product_info.append(recommendation_product_info)

                except requests.exceptions.RequestException as e:
                    print(f"Error fetching recommendation URL: {e}")

        st.subheader("Recommended Products")
        for product in all_product_info:
            st.write(f"**Product Name:** {product['name']}")
            st.write(f"**Brand Name:** {product['brand']}")
            st.write(f"**Price:** {product['price']}")
            st.write(f"**Description:** {product['description']}")
            st.write(f"**Customer Reviews:** {product['customer_reviews']}")
            st.write(f"**Sustainability Score:** {product['sustainability_score']} out of 4")
            st.write(f"**Link:** [Product Link]({product['link']})")
            st.write("---")

    except requests.exceptions.RequestException as e:
        st.error(f"Error fetching URL: {e}")
