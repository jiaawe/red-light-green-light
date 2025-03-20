import json
import os
from typing import Dict, List, Any

class SetIntervalStrategy:
    """
    A strategy that cycles through available traffic light configurations
    at regular intervals from the traffic_configurations.json file.
    """
    
    def __init__(self, config_path: str = "traffic_rules/traffic_configuration.json"):
        """Initialize with available traffic configurations"""
        self.config_path = config_path
        self.config = self._load_config()
        self.traffic_signals = self.config.get("traffic_rules", {})
        self.configurations = list(self.traffic_signals.keys())
        self.current_index = -1  # Start at -1 so first call will return index 0
        
    def _load_config(self) -> Dict[str, Any]:
        """Load traffic configurations from JSON file"""
        with open(self.config_path, 'r') as file:
            return json.load(file)
            
    def get_next_signal_status(self, 
                              current_signal: Dict[str, Any], 
                              vehicles: List[Dict[str, Any]], 
                              pedestrians: Dict[str, Any]) -> Dict[str, Any]:
        
        # Simply cycle to the next configuration
        self.current_index = (self.current_index + 1) % len(self.configurations)
        next_config = self.configurations[self.current_index]
        
        # Get the signal configuration
        next_signal = dict(self.traffic_signals[next_config])
        
        # Preserve metadata from current signal
        for key, value in current_signal.items():
            if key not in next_signal and key not in ["last_changed", "next_timestamp"]:
                next_signal[key] = value
        
        return next_signal