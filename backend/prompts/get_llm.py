import os
import json
from pydantic_models import *
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
    
    
def format_educational_script_for_display(script: EducationalScript, parent_input: ParentInput, timeline: Dict) -> str:

    timeline_data = timeline
    formatted_content = []
    
    # Title and introduction
    formatted_content.append(f"# {script.topic}: {script.subtopic}")
    formatted_content.append(f"For ages: {script.age_group}")
    formatted_content.append(f"Duration: {script.total_duration_minutes} minutes\n")
    
    # Character introduction
    formatted_content.append(f"## Meet {parent_input.character_name}!")
    formatted_content.append(f"{parent_input.character_name} is {parent_input.character_description}.")
    formatted_content.append("")
    
    # Introduction
    formatted_content.append("## Introduction")
    formatted_content.append(script.introduction)
    formatted_content.append("")
    
    # Scenes
    for i, scene in enumerate(script.scenes, 1):
        formatted_content.append(f"## Scene {i}: {scene.title}")
        formatted_content.append(scene.content)
        formatted_content.append("")
        
        # Timeline for this scene
        scene_timeline = timeline_data.get(scene.title, [])
        if scene_timeline:
            formatted_content.append("### Timeline")
            formatted_content.append("| Time | Speech | Emotion | Action | Duration |")
            formatted_content.append("|------|--------|---------|--------|----------|")
            
            for event in scene_timeline:
                start_time = format_time(event["start_time"])
                speech = event["speech"]["text"]
                # Truncate long speech for better display
                if len(speech) > 50:
                    speech = speech[:47] + "..."
                
                emotion = event["speech"]["emotion"]
                
                # Format action if present
                action = "None"
                if "action" in event:
                    action = event["action"]["type"]
                
                duration = f"{event['duration']:.1f}s"
                
                formatted_content.append(f"| {start_time} | {speech} | {emotion} | {action} | {duration} |")
            
            formatted_content.append("")
        
        # Quiz
        formatted_content.append(f"### Quiz: {scene.quiz.question}")
        for j, option in enumerate(scene.quiz.options):
            formatted_content.append(f"{chr(65+j)}. {option}")
        formatted_content.append(f"\nCorrect Answer: {chr(65+scene.quiz.correct_answer)}")
        formatted_content.append("Explanations:")
        for j, explanation in enumerate(scene.quiz.explanations):
            formatted_content.append(f"- Option {chr(65+j)}: {explanation}")
        formatted_content.append("")
        
        # Visual
        formatted_content.append("### Visual Aid")
        formatted_content.append(f"Description: {scene.visual_prompt.description}")
        formatted_content.append("Elements:")
        for element in scene.visual_prompt.elements:
            formatted_content.append(f"- {element}")
        formatted_content.append("")
        
        # Artifact
        formatted_content.append("### Artifact")
        formatted_content.append(f"Description: {scene.artifact.description}")
        formatted_content.append("")
    
    # Conclusion
    formatted_content.append("## Conclusion")
    formatted_content.append(script.conclusion)
    
    return "\n".join(formatted_content)

def format_time(seconds: float) -> str:
    """
    Format seconds into MM:SS format
    """
    minutes = int(seconds // 60)
    remaining_seconds = int(seconds % 60)
    return f"{minutes:02}:{remaining_seconds:02}"