# Import necessary libraries (tools) that we'll use in our program
# streamlit (st) - Creates web interface
# requests - Helps us fetch web pages
# BeautifulSoup - Helps us read and extract information from web pages
# sqlite3 - Helps us store and manage data in databases
# re - Helps us work with text patterns
# HTMLSession - Helps us handle web pages with JavaScript
# asyncio - Helps us run multiple tasks simultaneously
import streamlit as st
import requests
from bs4 import BeautifulSoup
import sqlite3
import re
from requests_html import HTMLSession


# DATABASE SETUP SECTION
# Create and set up different databases to store sustainable product criteria
# Each database stores different aspects of sustainability:
# 1. Materials database - stores sustainable material keywords
# 2. Manufacturing database - stores ethical manufacturing keywords
# 3. Packaging database - stores eco-friendly packaging keywords
# 4. Brand reputation database - stores sustainability certifications
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


# Create the web application title
st.title("Sustainable Product Rater (Only Amazon Products)")

# Create an input box where users can paste Amazon product URLs
product_url_input = st.text_input("Enter the product's you would like to search")

# When a user enters a URL, start the analysis process
if product_url_input:
    # First, check if the URL is from a valid Amazon website
    # We support multiple Amazon domains (com, co.uk, ca, etc.)
    valid_amazon_domains = [
        'amazon.com', 'amazon.co.uk', 'amazon.ca', 'amazon.de', 
        'amazon.fr', 'amazon.it', 'amazon.es', 'amazon.in'
    ]
    is_valid_amazon = any(domain in product_url_input for domain in valid_amazon_domains)
    
    if not is_valid_amazon:
        st.error("Please enter a valid Amazon product URL")
    else:
        try:
            # Set up a web request that looks like it's coming from a real browser
            # This helps prevent Amazon from blocking our requests
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(product_url_input, headers=headers)
            response.raise_for_status()  # Check if the request was successful
            soup = BeautifulSoup(response.content, "html.parser")

            # MAIN PRODUCT ANALYSIS SECTION
            # 1. Fetch the product page
            # 2. Extract important information:
            #    - Product name
            #    - Product image
            #    - Brand name
            #    - Price
            #    - Description
            #    - Customer reviews
            #    - Number of reviews
            # Main product info
            product_name_tag = soup.find('span', class_="a-size-large product-title-word-break")
            if product_name_tag:
                product_name_tag = product_name_tag.get_text(strip=True)

            # Add image extraction for main product
            product_image = soup.find('img', id='landingImage') or soup.find('img', id='imgBlkFront')
            if product_image and 'src' in product_image.attrs:
                st.image(product_image['src'], width=300)

            brand_name_tag = soup.find('a', id="bylineInfo", class_="a-link-normal")
            if brand_name_tag:
                brand_name_tag = brand_name_tag.get_text(strip=True)

            price_tag = soup.find('span', class_="a-offscreen")
            if price_tag:
                price_tag = price_tag.get_text(strip=True)

            description_tag = soup.find('ul', class_="a-unordered-list a-vertical a-spacing-mini")
            if description_tag:
                description_tag = description_tag.text

            customer_reviews_tag = soup.find('span', class_="a-icon-alt")
            customer_reviews = customer_reviews_tag.text if customer_reviews_tag else "No reviews yet"

            number_of_reviews_tag = soup.find('span', class_="a-size-base")
            number_of_reviews = number_of_reviews_tag.text if number_of_reviews_tag else "0"

            # Display product information
            st.header("Original Product Information")
            st.write(f"Product Name: {product_name_tag if product_name_tag else 'Not found'}")
            st.write(f"Brand: {brand_name_tag if brand_name_tag else 'Not found'}")
            st.write(f"Price: {price_tag if price_tag else 'Not found'}")
            st.write(f"Rating: {customer_reviews}")
            st.write(f"Number of Reviews: {number_of_reviews}")

            # SUSTAINABILITY ANALYSIS FUNCTION
            def analyze_sustainability(description):
                """
                This function analyzes product descriptions to determine how sustainable a product is.
                It looks for keywords in four categories:
                1. Sustainable materials (e.g., organic, recycled)
                2. Ethical manufacturing (e.g., fair trade, handmade)
                3. Eco-friendly packaging (e.g., plastic-free, recyclable)
                4. Brand reputation (e.g., B Corp certified)
                
                For each category found in the description, the product gets 1 point
                Maximum possible score is 4 points (1 point per category)
                """

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
                if any(keyword in description_lower for keyword in brand_name_tag):
                    scores["brand_reputation"] += 1

                total_score = scores["materials"] + scores["manufacturing"] + scores["packaging"] + scores["brand_reputation"]
                return total_score, scores

            # Calculate sustainability score for the main product
            # Display the score using a progress bar and detailed breakdown
            sustainability_score, detailed_scores = analyze_sustainability(description_tag)
            st.subheader("Sustainability Score")
            normalized_score = min(sustainability_score / 4.0, 1.0)  # Ensure score is between 0 and 1
            st.progress(normalized_score)
            st.write(f"Overall Score: {sustainability_score}/4")
            st.write("Detailed Scores:")
            for category, score in detailed_scores.items():
                st.write(f"{category.title()}: {score}/1")

            # ALTERNATIVE PRODUCTS SECTION
            # Search for sustainable alternatives to the main product
            # 1. Create a search query adding "sustainable alternatives"
            # 2. Search Amazon for similar sustainable products
            # 3. Analyze top 5 alternative products
            st.header("Sustainable Alternatives")
            search_query = product_name_tag + " sustainable alternatives"
            # Takes the original product url and then extracts the domain name from it (caause it can vary to be amazon.co.uk instead of amazon.com, etc)
            domain = re.search(r'amazon\.[^/]+', product_url_input).group(0)
            search_url = f"https://{domain}/s?k=" + re.sub(r'\W+', '+', search_query)
            
            try:
                search_response = requests.get(search_url, headers=headers)
                search_response.raise_for_status()
                alternatives_soup = BeautifulSoup(search_response.content, "html.parser")
                
                #search for all <div> elements that have a data-asin attribute. It then takes the first 5 of these elements
                product_cards = alternatives_soup.find_all('div', {'data-asin': True})[:5]
                
                if not product_cards:
                    st.warning("No alternatives found. Try modifying the search terms.")
                    
                for card in product_cards:
                    with st.expander("View Alternative Product Details", expanded=True):
                        # IMAGE HANDLING
                        # Try to get product image, with multiple fallback options
                        # Show warning if image can't be loaded
                        # Extract product image with better error handling
                        image = card.find('img', {'class': 's-image'})
                        image_url = None
                        
                        if image and 'src' in image.attrs:
                            image_url = image['src']
                            try:
                                img_response = requests.head(image_url)
                                if img_response.status_code == 200:
                                    st.image(image_url, width=300)
                                else:
                                    st.warning("Image not available")
                            except:
                                st.warning("Could not load image")
                        
                        # PRODUCT INFORMATION EXTRACTION
                        # Get product details using multiple possible HTML locations
                        # This is needed because Amazon's website structure can vary
                        # Rest of product info extraction
                        title = (
                            card.find('h2')
                            or card.find('span', {'class': 'a-size-base-plus'})
                            or card.find('span', {'class': 'a-size-medium'})
                        )
                        
                        if not title:
                            continue  # Skip this product if no title found
                        
                        price = card.find('span', {'class': 'a-offscreen'})
                        rating = card.find('span', {'class': 'a-icon-alt'})
                        reviews_count = card.find('span', {'class': 'a-size-base'})
                        
                        link = (
                            card.find('a', {'class': 'a-link-normal s-underline-text s-underline-link-text s-link-style a-text-normal'})
                            or card.find('a', {'class': 'a-link-normal s-no-outline'})
                            or card.find('a', {'class': 'a-link-normal'})
                        )
                        
                        if title and link:
                            product_url = f"https://{domain}" + link.get('href') if not link.get('href').startswith('http') else link.get('href')
                            
                            # DETAILED ANALYSIS
                            # For each alternative product:
                            # 1. Show basic info in a two-column layout
                            # 2. Get and show detailed product description
                            # 3. Calculate sustainability score
                            # 4. Show detailed sustainability analysis
                            # 5. Provide link to product page
                            # Display basic information
                            st.subheader(title.text.strip())
                            col1, col2 = st.columns(2)
                            
                            with col1:
                                if price:
                                    st.write("💰 Price:", price.text)
                                if rating:
                                    st.write("⭐ Rating:", rating.text)
                                if reviews_count:
                                    st.write("📊 Reviews:", reviews_count.text)
                            
                            # Get detailed product information
                            try:
                                prod_response = requests.get(product_url, headers=headers)
                                prod_soup = BeautifulSoup(prod_response.content, "html.parser")
                                
                                # Try to get higher quality image if first image failed
                                if not image_url:
                                    detailed_image = prod_soup.find('img', id='landingImage') or prod_soup.find('img', id='imgBlkFront')
                                    if detailed_image and 'src' in detailed_image.attrs:
                                        try:
                                            img_response = requests.head(detailed_image['src'])
                                            if img_response.status_code == 200:
                                                st.image(detailed_image['src'], width=300)
                                        except:
                                            st.warning("Could not load detailed image")
                                
                                with col2:
                                    # Try to find brand information
                                    brand = prod_soup.find('a', {'id': 'bylineInfo'})
                                    if brand:
                                        st.write("🏢 Brand:", brand.text.strip())
                                    
                                    # Find availability
                                    availability = prod_soup.find('span', {'class': 'a-size-medium a-color-success'})
                                    if availability:
                                        st.write("📦 Availability:", availability.text.strip())
                                
                                # Product descriptions
                                description_sections = [
                                    ('Features & Details', prod_soup.find('div', {'id': 'feature-bullets'})),
                                    ('Product Description', prod_soup.find('div', {'id': 'productDescription'})),
                                    ('Additional Information', prod_soup.find('div', {'id': 'dpx-feature-bullets'}))
                                ]
                                
                                combined_description = ""
                                for section_title, section in description_sections:
                                    if section:
                                        st.write(f"**{section_title}:**")
                                        section_text = section.text.strip()
                                        st.write(section_text)
                                        combined_description += section_text + " "
                                
                                # Calculate and display sustainability score
                                if combined_description:
                                    alt_score, alt_detailed = analyze_sustainability(combined_description)
                                    st.write("**Sustainability Analysis:**")
                                    normalized_alt_score = min(alt_score / 4.0, 1.0)
                                    st.progress(normalized_alt_score)
                                    st.write(f"Overall Score: {alt_score}/4")
                                    
                                    # Display detailed scores in columns
                                    col3, col4 = st.columns(2)
                                    for i, (category, score) in enumerate(alt_detailed.items()):
                                        with col3 if i < len(alt_detailed)//2 else col4:
                                            st.write(f"{category.title()}: {score}/1")
                                
                                st.write("[View on Amazon]({})".format(product_url))
                                
                            except Exception as e:
                                st.write("Could not fetch detailed product information:", str(e))
                            
                        st.markdown("---")
                
            except Exception as e:
                # If anything goes wrong while finding alternatives,
                # show an error message explaining what happened
                st.error(f"Error finding alternatives: {str(e)}")

        except requests.exceptions.RequestException as e:
            # If anything goes wrong with the initial product URL,
            # show an error message explaining what happened
            st.error(f"Error fetching URL: {str(e)}")