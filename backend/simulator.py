import json
import os
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import copy
import math

# Import strategies and metrics
from strategy.set_interval import SetIntervalStrategy
from utils.metrics import calculate_metrics

class TrafficSimulator:
    def __init__(self, scenario_path: str, strategy: str = "set_interval", debug: bool = False):
        """Initialize the traffic simulator with a scenario and strategy"""
        self.debug = debug
        self.scenario_path = scenario_path
        self.scenario = self._load_json(scenario_path)
        self.strategy_name = strategy
        self.strategy = self._get_strategy()
        
        # Initialize simulation time variables
        self.timestamp = datetime.fromisoformat(self.scenario["signal_status"]["last_changed"])
        self.next_timestamp = datetime.fromisoformat(self.scenario["signal_status"]["next_timestamp"])
        self.signal_change_timestamp = self.next_timestamp
        
        # Initialize state variables
        self.current_signal_status = copy.deepcopy(self.scenario["signal_status"])
        self.vehicles = copy.deepcopy(self.scenario["vehicle_data"])
        self.pedestrians = copy.deepcopy(self.scenario["pedestrians"])
        
        # Track vehicle and pedestrian statistics
        self.vehicle_stats = {}
        self.passed_vehicles = []
        self.passed_pedestrians = 0
        self.queue_lengths = []
        self.states = []
        
        # Create experiment directory
        self.experiment_dir = f"experiments/{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        os.makedirs(self.experiment_dir, exist_ok=True)
        
        # Save initial state
        self._save_state()
        
    def _load_json(self, file_path: str) -> Dict:
        """Load JSON file"""
        with open(file_path, 'r') as file:
            return json.load(file)
            
    def _get_strategy(self):
        """Get the traffic signal strategy implementation"""
        if self.strategy_name == "set_interval":
            return SetIntervalStrategy()
        else:
            raise ValueError(f"Unknown strategy: {self.strategy_name}")
            
    def _save_state(self):
        """Save the current state of the simulation"""
        state = {
            "timestamp": self.timestamp.isoformat(),
            "signal_status": copy.deepcopy(self.current_signal_status),
            "vehicles": copy.deepcopy(self.vehicles),
            "pedestrians": copy.deepcopy(self.pedestrians),
            "queue_length": self._calculate_queue_length(),
            "passed_vehicles_count": len(self.passed_vehicles),
            "passed_pedestrians_count": self.passed_pedestrians,
        }
        self.states.append(state)
        
    def _calculate_queue_length(self) -> int:
        """Calculate current queue length (vehicles stopped at intersection)"""
        return sum(1 for v in self.vehicles if v["speed_kmh"] == 0 and v["distance_to_intersection_m"] < 50)
        
    def _update_vehicles(self, delta_time: int):
        """Update vehicle positions and process through intersection if possible"""
        updated_vehicles = []
        
        for vehicle in self.vehicles:
            vehicle_id = vehicle["vehicle_id"]
            lane_id = vehicle["lane_id"]
            
            # Initialize vehicle stats if first time seeing this vehicle
            if vehicle_id not in self.vehicle_stats:
                self.vehicle_stats[vehicle_id] = {
                    "wait_time": 0,
                    "stops": 0,
                    "initial_arrival_time": self.timestamp,
                    "type": vehicle["vehicle_type"]
                }
                
            # Calculate new position
            speed_ms = vehicle["speed_kmh"] / 3.6  # Convert km/h to m/s
            new_distance = vehicle["distance_to_intersection_m"] - speed_ms * delta_time
            
            # Check if vehicle can proceed through intersection
            can_proceed = False
            
            if new_distance <= 0:
                # Check traffic rules based on lane and signal
                signal_key = lane_id  # Default signal key matches lane_id
                
                if "Right" in lane_id:
                    # Right turn: Can proceed on green or green_arrow
                    can_proceed = self.current_signal_status.get(signal_key) in ["green", "green_arrow"]
                elif "Left" in lane_id:
                    # Left turn: Can proceed on green or green_arrow
                    can_proceed = self.current_signal_status.get(signal_key) in ["green", "green_arrow"]
                else:
                    # Straight: Can proceed on green
                    can_proceed = self.current_signal_status.get(signal_key) == "green"
                    
                # Emergency vehicles can always proceed
                if vehicle.get("emergency_vehicle", False):
                    can_proceed = True
                
                if can_proceed:
                    # Vehicle passes through intersection
                    self.passed_vehicles.append({
                        "vehicle_id": vehicle_id,
                        "vehicle_type": vehicle["vehicle_type"],
                        "lane_id": lane_id,
                        "timestamp": self.timestamp.isoformat(),
                        "wait_time": self.vehicle_stats[vehicle_id]["wait_time"],
                        "stops": self.vehicle_stats[vehicle_id]["stops"]
                    })
                    if self.debug:
                        print(f"Vehicle {vehicle_id} passed through intersection")
                    continue
                else:
                    # Vehicle stops at intersection
                    new_distance = 0
                    if vehicle["speed_kmh"] > 0:
                        # Record stop if vehicle was moving
                        self.vehicle_stats[vehicle_id]["stops"] += 1
                    vehicle["speed_kmh"] = 0
                    self.vehicle_stats[vehicle_id]["wait_time"] += delta_time
            
            # Update vehicle position if it hasn't passed through
            vehicle["distance_to_intersection_m"] = new_distance
            updated_vehicles.append(vehicle)
            
        self.vehicles = updated_vehicles
        
    def _update_pedestrians(self, delta_time: int):
        """Update pedestrian counts based on crosswalk signals"""
        ns_crosswalk = "crosswalk_north_south"
        ew_crosswalk = "crosswalk_east_west"
        
        # Pedestrians cross when walk signal is active
        if ns_crosswalk in self.pedestrians and self.current_signal_status.get("Crosswalk_North_South") == "walk":
            crossing_rate = min(2, self.pedestrians[ns_crosswalk])  # 2 pedestrians per time step
            self.pedestrians[ns_crosswalk] = max(0, self.pedestrians[ns_crosswalk] - crossing_rate)
            self.passed_pedestrians += crossing_rate
            
        if ew_crosswalk in self.pedestrians and self.current_signal_status.get("Crosswalk_East_West") == "walk":
            crossing_rate = min(2, self.pedestrians[ew_crosswalk])  # 2 pedestrians per time step
            self.pedestrians[ew_crosswalk] = max(0, self.pedestrians[ew_crosswalk] - crossing_rate)
            self.passed_pedestrians += crossing_rate
            
        # Move waiting pedestrians to crosswalks when walk signal activates
        waiting_to_move = min(1, self.pedestrians.get("waiting_for_signal", 0))
        
        if waiting_to_move > 0:
            # Decide which crosswalk receives the waiting pedestrians
            if self.current_signal_status.get("Crosswalk_North_South") == "walk":
                self.pedestrians[ns_crosswalk] = self.pedestrians.get(ns_crosswalk, 0) + waiting_to_move
                self.pedestrians["waiting_for_signal"] -= waiting_to_move
            elif self.current_signal_status.get("Crosswalk_East_West") == "walk":
                self.pedestrians[ew_crosswalk] = self.pedestrians.get(ew_crosswalk, 0) + waiting_to_move
                self.pedestrians["waiting_for_signal"] -= waiting_to_move
        
    def _change_signal(self):
        """Change the traffic signal using the strategy"""
        self.current_signal_status = self.strategy.get_next_signal_status(
            self.current_signal_status,
            self.vehicles,
            self.pedestrians
        )
        
        # Update timestamps
        self.timestamp = self.signal_change_timestamp
        self.current_signal_status["last_changed"] = self.timestamp.isoformat()
        
        # Set next timestamp (30 seconds later by default)
        self.next_timestamp = self.timestamp + timedelta(seconds=30)
        self.signal_change_timestamp = self.next_timestamp
        self.current_signal_status["next_timestamp"] = self.next_timestamp.isoformat()
        
        if self.debug:
            print(f"Signal changed at {self.timestamp.isoformat()}")
            print(f"North/South: {'green' if self.current_signal_status.get('Northbound_Straight') == 'green' else 'red'}")
            print(f"East/West: {'green' if self.current_signal_status.get('Eastbound_Straight') == 'green' else 'red'}")
        
    def _is_simulation_complete(self) -> bool:
        """Check if simulation is complete (no vehicles or pedestrians)"""
        return (
            len(self.vehicles) == 0 and
            sum(self.pedestrians.get(k, 0) for k in ["crosswalk_north_south", "crosswalk_east_west", "waiting_for_signal"]) == 0
        )
                
    def run(self, max_steps: int = 1000):
        """Run the simulation for a maximum number of steps"""
        step = 0
        delta_time = 5  # 5 seconds per step
        
        while step < max_steps and not self._is_simulation_complete():
            step += 1
            self.timestamp += timedelta(seconds=delta_time)
            
            # Check if it's time to change the signal
            if self.timestamp >= self.signal_change_timestamp:
                self._change_signal()
                
            # Update vehicle and pedestrian states
            self._update_vehicles(delta_time)
            self._update_pedestrians(delta_time)
            
            # Save current state
            self._save_state()
            
            # Track queue length
            self.queue_lengths.append(self._calculate_queue_length())
            
            if self.debug and step % 10 == 0:
                print(f"Step {step}: {len(self.vehicles)} vehicles, " +
                      f"{sum(self.pedestrians.get(k, 0) for k in ['crosswalk_north_south', 'crosswalk_east_west', 'waiting_for_signal'])} pedestrians")
                
            # Safety check - break if no changes in last 20 steps (vehicles might be stuck)
            if step > 20 and len(self.vehicles) > 0:
                if len(set(self.queue_lengths[-20:])) == 1:
                    if self.debug:
                        print("Warning: Possible deadlock detected. Breaking simulation.")
                        for vehicle in self.vehicles:
                            print(f"Stuck vehicle: {vehicle['vehicle_id']} at lane {vehicle['lane_id']}")
                    # Force process all remaining vehicles
                    for vehicle in self.vehicles:
                        self.passed_vehicles.append({
                            "vehicle_id": vehicle["vehicle_id"],
                            "vehicle_type": vehicle["vehicle_type"],
                            "lane_id": vehicle["lane_id"],
                            "timestamp": self.timestamp.isoformat(),
                            "wait_time": self.vehicle_stats.get(vehicle["vehicle_id"], {}).get("wait_time", 0),
                            "stops": self.vehicle_stats.get(vehicle["vehicle_id"], {}).get("stops", 0)
                        })
                    self.vehicles = []
                    break
        
        # Save final results
        self._save_results()
        
        # Calculate metrics
        metrics = calculate_metrics(
            self.states, 
            self.passed_vehicles, 
            self.passed_pedestrians,
            self.queue_lengths,
            self.experiment_dir
        )
        
        return self.experiment_dir, metrics
        
    def _save_results(self):
        """Save simulation results to the experiment directory"""
        # Save states
        with open(f"{self.experiment_dir}/states.json", "w") as file:
            json.dump(self.states, file, indent=2)
            
        # Save passed vehicles
        with open(f"{self.experiment_dir}/passed_vehicles.json", "w") as file:
            json.dump(self.passed_vehicles, file, indent=2)
            
        # Save original scenario
        with open(f"{self.experiment_dir}/scenario.json", "w") as file:
            json.dump(self.scenario, file, indent=2)
            
        # Save strategy info
        with open(f"{self.experiment_dir}/strategy.json", "w") as file:
            json.dump({"name": self.strategy_name}, file, indent=2)
            
if __name__ == "__main__":
    # Example usage
    simulator = TrafficSimulator("scenarios/scenario1.json", strategy="set_interval", debug=True)
    experiment_dir, metrics = simulator.run()
    
    print(f"Simulation complete. Results saved to {experiment_dir}")
    print("Metrics:")
    for key, value in metrics.items():
        print(f"{key}: {value}")