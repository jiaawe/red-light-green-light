import os
import json
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from typing import List, Dict, Any, Optional, Tuple

# load environment variables
load_dotenv()
api_key = os.getenv("DEEPSEEK_API_KEY")

if api_key is None:
    raise ValueError("Please set the DEEPSEEK_API_KEY environment variable")

def get_standard_llm():
    """
    Returns a DeepSeek LLM client for simpler tasks
    """
    print(f"Setting up standard LLM with DeepSeek chat model...")
    return ChatOpenAI(
        api_key=api_key,
        base_url="https://api.deepseek.com",
        model="deepseek-chat",
        temperature=0.3,
        max_tokens=2000
    )

def get_reasoning_llm():
    """
    Returns a DeepSeek LLM client with reasoning capabilities
    """
    print(f"Setting up reasoning LLM with DeepSeek reasoner model...")
    # Using DeepSeek's reasoning model
    return ChatOpenAI(
        api_key=api_key,
        base_url="https://api.deepseek.com",
        model="deepseek-reasoner",
        temperature=0.7,
        max_tokens=8000
        # Removed the response_format parameter as it's causing issues
    )
    

# Extract JSON from LLM response
def extract_json_from_response(response_text: str) -> Dict[str, Any]:
    """
    Extracts and parses JSON from LLM response text
    """
    # Clean up response to extract JSON
    if "```json" in response_text:
        json_str = response_text.split("```json")[1].split("```")[0].strip()
    elif "```" in response_text:
        json_str = response_text.split("```")[1].split("```")[0].strip()
    else:
        # Assume the whole response is JSON
        json_str = response_text.strip()
    
    try:
        # Replace any single backslashes with double backslashes to escape them properly
        # This handles cases like \slurp that cause JSON parse errors
        json_str = json_str.replace('\\', '\\\\')
        
        # But fix any cases where we've now double-escaped already properly escaped characters
        json_str = json_str.replace('\\\\n', '\\n')
        json_str = json_str.replace('\\\\r', '\\r')
        json_str = json_str.replace('\\\\t', '\\t')
        json_str = json_str.replace('\\\\"', '\\"')
        json_str = json_str.replace('\\\\/', '\\/')
        
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse JSON response: {str(e)}\nResponse: {response_text}")
    
    

def format_time(seconds: float) -> str:
    """
    Format seconds into MM:SS format
    """
    minutes = int(seconds // 60)
    remaining_seconds = int(seconds % 60)
    return f"{minutes:02}:{remaining_seconds:02}"