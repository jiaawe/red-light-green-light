import json
import os
import logging
from typing import Dict, List, Any
from traffic_optimizer.traffic_optimizer import TrafficOptimizer

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
                "vehicles": self.aggregate_vehicles(vehicles),
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
        
        justification = results["justification"]
        return next_signal, justification
    
    def aggregate_vehicles(self, vehicles: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Aggregate vehicle data to provide a summary for the traffic optimizer.
        
        Args:
            vehicles: List of vehicle data
        
        Returns:
            Dict containing aggregated vehicle data
        """
       
        aggregated_data = {
            "total_count": len(vehicles),
            "by_lane": {},
            "by_destination": {},
            "emergency_vehicles": []
        }
        
        for vehicle in vehicles:
            # Aggregate by lane
            lane_id = vehicle.get("lane_id", "unknown")
            if lane_id not in aggregated_data["by_lane"]:
                aggregated_data["by_lane"][lane_id] = 0
            aggregated_data["by_lane"][lane_id] += 1
            
            # Aggregate by destination
            destination = vehicle.get("destination", "unknown")
            if destination not in aggregated_data["by_destination"]:
                aggregated_data["by_destination"][destination] = 0
            aggregated_data["by_destination"][destination] += 1
            
            # Track emergency vehicles
            if vehicle.get("emergency_vehicle", False):
                aggregated_data["emergency_vehicles"].append({
                    "vehicle_id": vehicle.get("vehicle_id"),
                    "lane_id": lane_id,
                    "destination": destination,
                    "priority_level": vehicle.get("emergency_status", {}).get("priority_level", "medium"),
                    "lights_active": vehicle.get("emergency_status", {}).get("lights_active", False),
                    "siren_active": vehicle.get("emergency_status", {}).get("siren_active", False)
                })

        return aggregated_data
    