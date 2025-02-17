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

def parse_text_from_timestamps_original(data: str) -> str:
    return re.sub(r'\d{2}:\d{2} - \d{2}:\d{2}: ', '', data).strip().split(": ")


def parse_text_from_timestamps(data: str) -> str:
    """
    Removes timestamps from a given formatted text.
    
    Parameters:
    data (str): The input text with timestamps.
    
    Returns:
    List: The cleaned text without timestamps as a list 
    """

    # This regular expression will capture:
    #   Group 1: the timestamp range, e.g. "HH:MM - HH:MM"
    #   Group 2: all text that follows until the next timestamp or the end of the string
    pattern = r'(\d{2}:\d{2}\s*-\s*\d{2}:\d{2}):\s*(.*?)\s*(?=\d{2}:\d{2}\s*-\s*\d{2}:\d{2}:|$)'

    matches = re.findall(pattern, data, flags=re.DOTALL)

    results = []
    for match in matches:
        timestamp_range = match[0]  # e.g. "00:00 - 00:06"
        text_block = match[1]

        # Split into start and end times
        start_time, end_time = timestamp_range.split('-')
        start_time = start_time.strip()       # e.g. "00:00"
        end_time = end_time.strip()           # e.g. "00:06"

        # Create a dictionary with your desired fields
        results.append({
            "start_time": start_time,
            "end_time": end_time,
            "text": text_block.strip()
        })

    # results is now a list of dicts, each with start_time, end_time, and text.
    return results

def parse_timestamps(chunks: list ) -> list:
    """
    Extracts timestamps from a given formatted text.
    
    Parameters:
    data (str): The input text with timestamps.
    
    Returns:
    list: A list of extracted timestamps in the form of seconds since the start of the video
    """
    timestamps = [chunk["start_time"] for chunk in chunks]
    return [int(mm) * 60 + int(ss) for mm, ss in (ts.split(":") for ts in timestamps)]


def tokenize(text):
    """
    Tokenizes the text into a set of lowercase words.
    Non-alphabetic characters are used as delimiters.
    """
    return set(re.findall(r'\w+', text.lower()))

def jaccard_similarity(tokens_a, tokens_b):
    """
    Computes the Jaccard similarity between two sets of tokens:
    Jaccard = |A ∩ B| / |A ∪ B|
    """
    if not tokens_a and not tokens_b:
        return 0.0
    intersection = tokens_a.intersection(tokens_b)
    union = tokens_a.union(tokens_b)
    return len(intersection) / len(union)

def get_timestamp_from_answer(sentence, chunks):
    """
    Finds the chunk with the maximum word overlap (via Jaccard similarity)
    with the given sentence and returns its timestamp.
    
    Parameters:
    - sentence (str): The sentence to compare.
    - chunks (dict): A dictionary of chunk_name -> chunk_id.
                     Each `chunk_name` is the textual content to compare,
                     and `chunk_id` might be a timestamp or any related info.
    
    Returns:
    - The chunk_id of the entry with the highest word-based overlap.
    """
    best_score = 0.0
    best_chunk = None 
    
    # Tokenize the input sentence
    sentence_tokens = tokenize(sentence)

    for chunk_name, chunk_id in chunks.items():
        chunk_tokens = tokenize(chunk_name)
        similarity = jaccard_similarity(sentence_tokens, chunk_tokens)
        if similarity > best_score:
            best_score = similarity
            best_chunk = chunk_id
    
    return best_chunk

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



def postprocess_generation(generated_content, top_k_urls, top_k_names):
    """
    top_k_urls: firebase artifacts for top k objects (original, not chunks)
    """
    #Add Reference material from top_k_ids 
    final_output = generated_content + "Reference Material" + "\n"

    for doc_url, doc_name in zip(top_k_urls, top_k_names):
        final_output += f"<a href={doc_url}>{doc_name}</a> \n"

    return final_output

if __name__ == "__main__":
    print("Started testing...")

    data = "00:00 - 00:06: Hey, what's up students? Hope you all are doing well. In this video I'm going to do something a little bit differently. 00:06 - 00:12: to do a product review. So thus far on the channel the focus has been teaching sleight of hand technique and card effects. 00:12 - 00:18: With an ordinary pack of cards. Okay. Now there's a whole nother side to the magic world. There's a 00:18 - 00:24: number of various gimmicks accessories and products out there on the market that allow you to perform some 00:24 - 00:30: really powerful tricks, oftentimes with very little to no sleight of hand technique at all. 00:30 - 00:36: product right here, the Cartoon Deck, is a perfect example of that. This is one of my favorite 00:36 - 00:42: decks of cards so I'm going to give you a quick demonstration of what you can do with this and then I'll talk 00:42 - 00:48: about it a little bit and give you my thoughts on this product. 00:48 - 00:54: Okay, so when you open up this pack of cards, what you'll find... 00:54 - 01:00: is that the deck has been specially printed so every card has a drawing. 01:00 - 01:06: on it. 01:06 - 01:12: works is that the deck is a new deck order. Okay so all the cards are sequential and that way when 01:12 - 01:18: You flicker through the cards. When you riffle through, Bob comes to life. He becomes animated. 01:18 - 01:24: Bob is actually a magician, he does only one trick, but it's a very, very good trick. So at this point you would, you know... 01:24 - 01:30: Now you would explain Bob to your spectator, and then you would ask them to name absolutely any card in the deck. It's a completely free. 01:30 - 01:36: choice. So let's say someone named the eight of diamonds. That's perfect. Okay, so at this point 01:36 - 01:42: we would set the 8 aside, let's just place it right here, and while 01:42 - 01:48: Watch Bob in action, okay, this is his moment of truth. 01:48 - 01:54: this out. If we riffle through the cards, watch what happens. 01:54 - 02:00: off his hat. He reaches in. What is that, a card? 02:00 - 02:06: The Eight of Diamonds. Okay so this trick absolutely works. 02:06 - 02:12: kills. It's fun to do, it's kind of light, it's got that kind of humor to it. 02:12 - 02:18: It plays well for younger audiences and older audiences. It was even performed on Britain's Got Talent. 02:18 - 02:24: not too long ago. So I highly recommend this product if you're looking for, you know, just a new fun trick to do. 02:24 - 02:30: It's very easy, there is one move in here and I would hardly consider it a move, to be honest. 02:30 - 02:36: So if you're interested in purchasing this deck of cards, you can get it from 52cards.com. I'll link you on this. 02:36 - 02:42: screen here and in the description box down below. What you get is the deck of cards obviously and then 02:42 - 02:48: it also comes with a set of written instructions on how to do it and has some other tips as well. 02:48 - 02:54: my personal handling the way that I like to do the trick is a little bit differently than mentioned in 02:54 - 03:00: the instructions. So if you purchase this through 52cars.com, I'll also send 03:00 - 03:06: you a private link to a video going over my personal hand link and give you some visual instruction on how to use that. 03:06 - 03:12: this deck. So that's all. If you want to see more product reviews in the future, let me know in the comments. 03:12 - 03:18: section down below, and I hope this was helpful for you, anyone out there who's looking to, you know. 03:18 - 03:24: purchase a few additional tricks for their arsenal. Until next time, take care and have a great day. 03:24 - 03:30: great day! "

    parsed_text = parse_text_from_timestamps(data)
    print(parsed_text)

    timestamps = parse_timestamps(parsed_text)
    print(timestamps)

    clean_text_list = [chunk["text"] for chunk in parsed_text]
    chunk_timestamps = dict(zip(clean_text_list, timestamps))
    print(get_timestamp_from_answer("arsenal", chunk_timestamps))



