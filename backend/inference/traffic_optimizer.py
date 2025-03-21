import json
import os
import time
from datetime import datetime
from openai import OpenAI
from typing import Dict, List, Any, Optional
from prompts.prompts import CONTROLLER_PROMPT
from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=True)

class TrafficOptimizer:
    """
    Class to handle traffic optimization using GPT-4o-mini.
    """
    
    def __init__(
        self, 
        api_key=None, 
        traffic_config_path="backend/traffic_rules/traffic_configuration.json",
        memory=None
    ):
        """
        Initialize the Traffic Optimizer with API key and load necessary configurations.
        
        Args:
            api_key: OpenAI API key (will use environment variable if None)
            traffic_config_path: Path to the traffic configuration JSON file
            memory: Initial memory state (empty list if None)
        """
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        self.client = OpenAI(api_key=self.api_key)
        self.traffic_config = self.load_json_file(traffic_config_path)
        # Initialize memory as a property
        self.memory = memory if memory is not None else []
        
    def optimize(
        self,
        configuration_state: Dict[str, Any],
        custom_memory: Optional[List[Dict[str, Any]]] = None,
        max_wait: int = 4
    ) -> Dict[str, Any]:
        """
        Run the traffic optimization inference using GPT-4o-mini.
        
        Args:
            configuration_state: Current traffic volumes
            custom_memory: Optional custom memory to use instead of instance memory
            max_wait: Maximum number of intervals a direction should wait
            
        Returns:
            Dict containing the selected configuration, duration, and updated memory
        """
        # Use custom memory if provided, otherwise use the instance memory
        memory_to_use = custom_memory if custom_memory is not None else self.memory
        
        # Format the prompt with current data
        formatted_prompt = CONTROLLER_PROMPT.format(
            CONFIGURATION_STATE=json.dumps(configuration_state, indent=2),
            TRAFFIC_CONFIGURATION=json.dumps(self.traffic_config, indent=2),
            MEMORY=json.dumps(memory_to_use, indent=2),
            MAX_WAIT=max_wait
        )
        
        # Make the API call to GPT-4o-mini
        response = self.client.chat.completions.create(
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
            
            # Create new memory entry
            new_memory_entry = {
                "configuration": result["selected_configuration"],
                "duration": result["duration_seconds"],
                "timestamp": datetime.now().isoformat()
            }
            
            # Update memory - add the new entry at the beginning, keeping only the 10 most recent entries
            updated_memory = [new_memory_entry]
            if memory_to_use:
                updated_memory.extend(memory_to_use[:min(9, len(memory_to_use))])
            
            # Add the updated memory to the result
            result["updated_memory"] = updated_memory
            
            # Update the instance memory
            self.memory = updated_memory
                
            return result
            
        except json.JSONDecodeError:
            raise ValueError("Failed to parse JSON response from API")
        except Exception as e:
            raise RuntimeError(f"Error processing API response: {str(e)}")
    
    def get_memory(self) -> List[Dict[str, Any]]:
        """
        Get the current memory state.
        
        Returns:
            The current memory list
        """
        return self.memory
    
    def export_memory(self, path: str) -> None:
        """
        Export the current memory to a JSON file.
        
        Args:
            path: Path where to save the memory
        """
        self.save_json_file(path, self.memory)
    
    def import_memory(self, path: str) -> None:
        """
        Import memory from a JSON file.
        
        Args:
            path: Path to the memory JSON file
        """
        self.memory = self.load_json_file(path)
    
    def save_result(self, result: Dict[str, Any], path: str = "backend/inference/last_optimization_result.json") -> None:
        """
        Save the optimization result to a JSON file.
        
        Args:
            result: The optimization result to save
            path: Path where to save the result
        """
        self.save_json_file(path, result)
    
    @staticmethod
    def load_json_file(file_path: str) -> Dict:
        """Load and parse a JSON file."""
        with open(file_path, 'r') as file:
            return json.load(file)

    @staticmethod
    def save_json_file(file_path: str, data: Dict) -> None:
        """Save data to a JSON file."""
        with open(file_path, 'w') as file:
            json.dump(data, file, indent=2)

if __name__ == "__main__":
    # Create optimizer instance with empty memory
    optimizer = TrafficOptimizer()
    
    # Load configuration state
    with open("backend/counter/configuration_state.json", "r") as file:
        configuration_state = json.load(file)

    # Run the optimization
    result = optimizer.optimize(configuration_state=configuration_state)
    
    print(f"Selected configuration: {result['selected_configuration']}")
    print(f"Duration (seconds): {result['duration_seconds']}")
    
    # You could also save the full result for debugging
    optimizer.save_result(result)