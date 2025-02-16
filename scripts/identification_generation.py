import pandas as pd 
import numpy as np
import os
from openai import OpenAI
from dotenv import load_dotenv
from PyPDF2 import PdfReader
from typing import List 
from tqdm import tqdm
import re
from difflib import SequenceMatcher



def setup_openai_key():
    """
    Load environment variables and set up OpenAI API key if not present.
    Return client object with key    
    """
    load_dotenv(override=True)
    if not os.environ.get("OPENAI_API_KEY"):
        raise ValueError("OpenAI API key not found in environment variables")
    open_ai_key = os.getenv("OPENAI_APIKEY")
    client = OpenAI(
        api_key=open_ai_key,
    )
    return client 


def pdf_to_string(pdf_path):
    """
    Parse pdfs: all text documents will be in pdf format
    """
    # Create a PDF reader object
    pdf_reader = PdfReader(pdf_path)
    
    # Initialize an empty string to store the text
    text = ""
    
    # Iterate through all pages and extract text
    for page in pdf_reader.pages:
        text += page.extract_text()
    
    # Heuristics to fix processing
    processed_text = text.strip()
    processed_text = processed_text.strip().replace("\n", " ").replace("\t", " ").replace(" ", " ")
    processed_text = processed_text.replace("●", "")
    return processed_text.strip()


def read_mp3_transcript(transcript_path):
    """
    Takes in transcript path (txt) and returns string representation of transcript
    """
    with open(transcript_path, 'r') as file:
        content = file.read()
    return content


def chunk_str(input_str, chunk_size=16384):
    """
    Chunk str into pieces of approximately chunk_size words each
    """
    words = input_str.split()
    chunked_strs = []
    for i in range(0, len(words), chunk_size):
        chunk = ' '.join(words[i:i + chunk_size])
        chunked_strs.append(chunk)
    return chunked_strs


# Video transcript parsing
def parse_text_from_timestamps(data: str) -> str:
    """
    Removes timestamps from a given formatted text.
    
    Parameters:
    data (str): The input text with timestamps.
    
    Returns:
    List: The cleaned text without timestamps as a list 
    """
    return re.sub(r'\d{2}:\d{2} - \d{2}:\d{2}: ', '', data).strip().split("\n")

def parse_timestamps(data: str) -> list:
    """
    Extracts timestamps from a given formatted text.
    
    Parameters:
    data (str): The input text with timestamps.
    
    Returns:
    list: A list of extracted timestamps in the form "00:00".
    """
    timestamp_ranges = re.findall(r'\d{2}:\d{2} - \d{2}:\d{2}', data)
    return [range.split("-")[0].strip() for range in timestamp_ranges]


def run_identification(top_k_queries: List[str], top_k_types: List[str], question: str):
    """
    top_k_queries: text over either video transcript or documents (notes, slides, etc.)
    top_k_types: either video, text, or image
    """
    client = setup_openai_key()
    top_k_ids = []
    for idx, chunk_text, chunk_type in tqdm(enumerate(zip(top_k_queries, top_k_types))):
        if chunk_type == "video":
            # Remove whitespace after joining
            chunk_text = "\n".join(parse_text_from_timestamps(chunk_text)).strip()
        context_artifact_chunks = chunk_str(chunk_text)

        ID_MODEL_SYSTEM_PROMPT = """
        You are a helpful assistant specializing in identifying parts of text documents that best correspond to the answer for a query.
        You specialize in thinking deeply about the answer to a given question and then returning the exact sentences word for word that 
        best contain the answer to the question from the given context. The context is preceded by a section header called CONTEXT.
        """

        # Add context - hacky way of just adding the first chunk if context is too long
        context = f"CONTEXT:\n {context_artifact_chunks[0]}"
        INPUT_MSG = question + context

        # Make the API call to o1-mini
        id_response = client.chat.completions.create(
            model="o1-mini",
            messages = [
            {"role": "user", "content": f"instructions {ID_MODEL_SYSTEM_PROMPT}\n, question: {INPUT_MSG}"}],
            reasoning_effort="low"  # Options: "low", "medium", "high"
        )

        id_response_content = id_response.choices[0].message.content
        # Post-processing
        id_response_content = id_response_content.replace("\n", " ").replace('`', "")
        top_k_ids.append(id_response_content)
        print(f"Finished attribution for top {idx} query")
    return top_k_ids



def run_generation(top_k_ids: List[str], question):
    """
    top_k_ids: represent context for each of the top k resources 
    """
    client = setup_openai_key()

    ID_GENERATION_SYSTEM_PROMPT = """
    You are a helpful teaching assistant who generates answers to students questions with a kind and helpful tone.
    The way you answer questions is as follows:
    You should first provide any necessary background on the student's question at the level of a high school or college student.
    Then, you should answer the question directly using your knowledge. Integrate all of the document context that is passed in somewhere in your answer. 
    The context is preceded by a section header called CONTEXT.
    """

    #To correctly reference the document context, you will add an HTML hyperlinks in correspondence of the key concepts discussed. 
    #For example, if you have a document describing XYZ and URL to the document, you would discuss XYZ and you will write important words or expressions of the discussion in the form of HTML hyperlink. 
    #In other words, if WORD is an important word of the summary that describes a document having link URL, you will write <a href=URL>WORD</a> instead of WORD in the summary.

    # Add context
    context = "CONTEXT:\n"
    for id_context in top_k_ids:
        context += f"{id_context}\n"
    INPUT_MSG = question + context

    # Make the API call to o3-mini
    generated_response = client.chat.completions.create(
        model="gpt-4o",
        messages = [
        {"role": "user", "content": f"instructions {ID_GENERATION_SYSTEM_PROMPT}\n, question: {INPUT_MSG}"}],
    )

    generated_response_content = generated_response.choices[0].message.content
    return generated_response_content 


# TO-DO: generate correct URLs based on top_k_ids
def generate_url(top_k_ids):
    # TO-DO: cleanup
    pass 

def postprocess_generation(generated_content, top_k_urls, top_k_names):
    #Add Reference material from top_k_ids 
    final_output = generated_content + "Reference Material" + "\n"

    for doc_url, doc_name in zip(top_k_urls, top_k_names):
        final_output += f"<a href={doc_url}>{doc_name}</a> \n"

    return final_output

if __name__ == "__main__":
    print("Started testing...")

    # Example usage
    data = """
    00:00 - 00:06: Under the eerie glow of full moon, Elias stepped cautiously into the abandoned lighthouse.
    00:06 - 00:12: It's towering frame groaning against the window the villagers spoke of strange lights flickering inside despite the
    """

    clean_text_list = parse_text_from_timestamps(data)
    print(clean_text_list)

    timestamps = parse_timestamps(data)
    print(timestamps)




