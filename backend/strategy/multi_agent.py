import json
import os
import logging
from typing import Dict, List, Any
from inference.traffic_optimizer import TrafficOptimizer

class MultiAgentStrategy:
    """
    A strategy that cycles through available traffic light configurations
    at regular intervals from the traffic_configurations.json file.
    """
    
    def __init__(self, config_path: str = "traffic_rules/traffic_configuration.json"):
        """Initialize with available traffic configurations"""
        self.config_path = config_path
        self.config = self._load_config()
        self.traffic_signals = self.config.get("traffic_rules", {})

        # Initialise LLM Traffic Optimizer
        self.traffic_optimizer = TrafficOptimizer(
            traffic_config_path=self.config_path
        )

    def _load_config(self) -> Dict[str, Any]:
        """Load traffic configurations from JSON file"""
        with open(self.config_path, 'r') as file:
            return json.load(file)
            
    def get_next_signal_status(self, 
                              current_signal: Dict[str, Any], 
                              vehicles: List[Dict[str, Any]],
                              pedestrians: Dict[str, Any],
                              weather: Dict[str, Any] = None,
                              context: Dict[str, Any] = None) -> Dict[str, Any]:
        
        results = self.traffic_optimizer.optimize(
            configuration_state = {
                "vehicles": vehicles,
                "pedestrians": pedestrians,
                "weather" : weather,
                "context" : context
            }
        )
     
        # Get the signal configuration
        next_signal = dict(self.traffic_signals[results["selected_configuration"]])
        
        # Store the configuration duration for use in simulator
        next_signal["duration_seconds"] = results["duration_seconds"]
        
        # Store weather and context data if provided
        if weather:
            next_signal["weather_data"] = weather
        if context:
            next_signal["context_data"] = context
        
        reasoning = 'Placeholder'
        return next_signal, reasoning
    