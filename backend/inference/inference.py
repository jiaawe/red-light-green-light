import json
import os
import time
from datetime import datetime
from openai import OpenAI
from typing import Dict, List, Any
from backend.prompts.prompts import CONTROLLED_PROMPT
from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=True)

def run_traffic_optimization(
    configuration_state: Dict[str, Any],
    traffic_configuration: Dict[str, Any],
    memory: List[Dict[str, Any]],
    max_wait: int = 3
) -> Dict[str, Any]:
    """
    Run the traffic optimization inference using GPT-4o-mini.
    
    Args:
        configuration_state: Current traffic volumes for each configuration
        traffic_configuration: Available traffic light configurations
        memory: Previous configuration history (most recent first)
        max_wait: Maximum number of intervals a direction should wait
        
    Returns:
        Dict containing the selected configuration, duration, and updated memory
    """
    # Initialize OpenAI client
    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    
    # Format the prompt with current data
    formatted_prompt = CONTROLLED_PROMPT.format(
        CONFIGURATION_STATE=json.dumps(configuration_state, indent=2),
        TRAFFIC_CONFIGURATION=json.dumps(traffic_configuration, indent=2),
        MEMORY=json.dumps(memory, indent=2),
        MAX_WAIT=max_wait
    )
    
    # Make the API call to GPT-4o-mini
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an intelligent traffic management system optimizer."},
            {"role": "user", "content": formatted_prompt}
        ],
        temperature=0.2,  # Lower temperature for more deterministic results
        max_tokens=1024,
        response_format={"type": "json_object"}
    )
    
    # Extract and parse the response
    try:
        result = json.loads(response.choices[0].message.content)
        
        # Validate the response structure
        required_keys = ["selected_configuration", "duration_seconds", "justification"]
        if not all(key in result for key in required_keys):
            raise ValueError(f"Response missing required keys: {required_keys}")
        
        # Update memory ourselves
        updated_memory = [
            {
                "configuration": result["selected_configuration"],
                "duration": result["duration_seconds"],
                "timestamp": datetime.now().isoformat()
            }
        ]
        
        # Add previous entries, keeping only the 9 most recent
        if memory:
            updated_memory.extend(memory[:min(9, len(memory))])
        
        # Add the updated memory to the result
        result["updated_memory"] = updated_memory
            
        return result
        
    except json.JSONDecodeError:
        raise ValueError("Failed to parse JSON response from API")
    except Exception as e:
        raise RuntimeError(f"Error processing API response: {str(e)}")
    
def load_json_file(file_path: str) -> Dict:
    """Load and parse a JSON file."""
    with open(file_path, 'r') as file:
        return json.load(file)

def save_json_file(file_path: str, data: Dict) -> None:
    """Save data to a JSON file."""
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=2)

if __name__ == "__main__":
    # Example usage
    config_state = load_json_file("backend/counter/configuration_state.json")
    traffic_config = load_json_file("backend/traffic_rules/traffic_configuration.json")
    
    # Load memory or initialize if not exists
    try:
        memory_data = load_json_file("backend/memory/memory.json")
    except FileNotFoundError:
        memory_data = []
    
    # Run the optimization
    result = run_traffic_optimization(
        configuration_state=config_state,
        traffic_configuration=traffic_config,
        memory=memory_data,
        max_wait=3
    )
    
    print(f"Selected configuration: {result['selected_configuration']}")
    print(f"Duration (seconds): {result['duration_seconds']}")
    
    # Save the updated memory
    save_json_file("backend/memory/memory.json", result["updated_memory"])
    
    # You could also save the full result for debugging
    save_json_file("backend/inference/last_optimization_result.json", result)