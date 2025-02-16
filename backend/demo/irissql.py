#!/usr/bin/env python3

"""
IRIS Vector Database Operations for Scotch Reviews
This script demonstrates loading scotch whiskey review data into IRIS,
creating OpenAI embeddings, and performing semantic search.
"""

import pandas as pd
import iris
import time
import os
from dotenv import load_dotenv
from langchain.embeddings.openai import OpenAIEmbeddings

def setup_openai_key():
    """Load environment variables and set up OpenAI API key if not present."""
    load_dotenv(override=True)
    if not os.environ.get("OPENAI_API_KEY"):
        os.environ["OPENAI_API_KEY"] = getpass.getpass("OpenAI API Key:")

def load_and_clean_data(csv_path):
    """Load and clean the scotch review dataset."""
    # Load the CSV file
    df = pd.read_csv(csv_path)
    
    # Clean the data
    df.drop(['currency'], axis=1, inplace=True)
    df.drop(columns=df.columns[0], inplace=True)
    df.dropna(subset=['price'], inplace=True)
    df = df[pd.to_numeric(df['price'], errors='coerce').notna()]
    df.fillna('', inplace=True)
    
    return df

def setup_database_connection():
    """Setup and return IRIS database connection."""
    username = 'demo'
    password = 'demo'
    hostname = os.getenv('IRIS_HOSTNAME', 'localhost')
    port = '1972'
    namespace = 'USER'
    connection_string = f"{hostname}:{port}/{namespace}"
    print(f"Connecting to: {connection_string}")
    
    return iris.connect(connection_string, username, password)

def check_table_exists(cursor, table_name):
    """Check if table exists and has data."""
    try:
        cursor.execute(f"""
            SELECT COUNT(*) as count, 
                   COUNT(description_vector) as vector_count 
            FROM {table_name}
        """)
        result = cursor.fetchone()
        total_rows = result[0] if result else 0
        rows_with_vectors = result[1] if result else 0
        
        if total_rows > 0 and rows_with_vectors == total_rows:
            print(f"Found existing table with {total_rows} rows and embeddings")
            return True
        return False
    except Exception as e:
        print(f"Table check failed: {str(e)}")
        return False

def create_table(cursor, table_name, with_vectors=False):
    """Create table in IRIS database."""
    if not check_table_exists(cursor, table_name):
        try:
            cursor.execute(f"DROP TABLE {table_name}")
        except:
            pass
        
        if with_vectors:
            # Note: OpenAI embeddings are 1536-dimensional
            table_definition = """(
                name VARCHAR(255),
                category VARCHAR(255),
                review_point INT,
                price DOUBLE,
                description VARCHAR(2000),
                description_vector VECTOR(DOUBLE, 1536)
            )"""
        else:
            table_definition = """(
                name VARCHAR(255),
                category VARCHAR(255),
                review_point INT,
                price DOUBLE,
                description VARCHAR(2000)
            )"""
        
        cursor.execute(f"CREATE TABLE {table_name} {table_definition}")
        print(f"Created new table: {table_name}")
        return False
    return True

def batch_insert_data(cursor, table_name, df, with_vectors=False):
    """Insert data in batch into IRIS database."""
    if with_vectors:
        sql = """
            INSERT INTO {} 
            (name, category, review_point, price, description, description_vector)
            VALUES (?, ?, ?, ?, ?, TO_VECTOR(?))
        """.format(table_name)
        
        data = [
            (
                row['name'],
                row['category'],
                row['review.point'],
                row['price'],
                row['description'],
                str(row['description_vector'])
            )
            for index, row in df.iterrows()
        ]
    else:
        sql = """
            INSERT INTO {}
            (name, category, review_point, price, description)
            VALUES (?, ?, ?, ?, ?)
        """.format(table_name)
        
        data = [
            (
                row['name'],
                row['category'],
                row['review.point'],
                row['price'],
                row['description']
            )
            for index, row in df.iterrows()
        ]
    
    start_time = time.time()
    cursor.executemany(sql, data)
    end_time = time.time()
    print(f"Time taken to add {len(df)} entries: {end_time-start_time} seconds")

def create_embeddings(df):
    """Create embeddings for descriptions using OpenAI."""
    print("Initializing OpenAI embeddings...")
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")  # Using cheaper model
    
    print("Creating embeddings for descriptions (this might take a while)...")
    embeddings_list = []
    batch_size = 100  # Process in batches to avoid rate limits
    
    for i in range(0, len(df), batch_size):
        batch = df['description'].iloc[i:i+batch_size].tolist()
        batch_embeddings = embeddings.embed_documents(batch)
        embeddings_list.extend(batch_embeddings)
        print(f"Processed {min(i+batch_size, len(df))}/{len(df)} descriptions")
    
    df['description_vector'] = embeddings_list
    return df, embeddings

def search_whiskeys(cursor, table_name, embeddings_model, search_phrase, max_price=100, num_results=3):
    """Search for whiskeys based on description and price."""
    search_vector = embeddings_model.embed_query(search_phrase)
    
    sql = f"""
        SELECT TOP ? name, category, price, description
        FROM {table_name}
        WHERE price < ?
        ORDER BY VECTOR_DOT_PRODUCT(description_vector, TO_VECTOR(?)) DESC
    """
    
    cursor.execute(sql, [num_results, max_price, str(search_vector)])
    return cursor.fetchall()

def main():
    # Setup OpenAI
    setup_openai_key()
    
    # Setup database connection
    conn = setup_database_connection()
    cursor = conn.cursor()
    
    try:
        # Create and populate table
        table_name = "test.embeddingss"
        print(f"Checking table {table_name}...")
        
        table_exists = check_table_exists(cursor, table_name)
        
        if not table_exists:
            # Load and clean data
            print("Loading and cleaning data...")
            df = load_and_clean_data('../data/scotch_review.csv')
            
            # Create embeddings
            print("Creating embeddings...")
            df, embeddings_model = create_embeddings(df)
            
            # Create table and insert data
            create_table(cursor, table_name, with_vectors=True)
            print("Inserting data...")
            batch_insert_data(cursor, table_name, df, with_vectors=True)
            conn.commit()
        else:
            print("Using existing table with embeddings")
            embeddings_model = OpenAIEmbeddings(model="text-embedding-3-small")
        
        # Perform example searches
        search_phrases = [
            "earthy and creamy taste",
            "smoky and peaty",
            "light and fruity"
        ]
        
        for phrase in search_phrases:
            print(f"\nSearching for: {phrase}")
            print("Price limit: $100")
            print("-" * 80)
            
            results = search_whiskeys(cursor, table_name, embeddings_model, phrase)
            for row in results:
                name, category, price, description = row
                print(f"Name: {name}")
                print(f"Category: {category}")
                print(f"Price: ${price:.2f}")
                print(f"Description: {description}")
                print("-" * 80)
        
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        
    finally:
        cursor.close()
        conn.close()
        print("Database connection closed")

if __name__ == "__main__":
    main()