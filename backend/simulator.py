import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any
import copy

# Import strategies and metrics
from strategy.set_interval import SetIntervalStrategy
from strategy.multi_agent import MultiAgentStrategy
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
        self.reasoning = "Initial signal status"
        self.vehicles = copy.deepcopy(self.scenario["vehicle_data"])
        self.pedestrians = copy.deepcopy(self.scenario["pedestrians"])
        
        # Get weather and context data if available
        self.weather = self.scenario.get("context", {}).get("weather", None)
        self.context = self.scenario.get("context", None)
        
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
            return SetIntervalStrategy(config_path="traffic_rules/traffic_configuration.json")
        elif self.strategy_name == "multi_agent":
            return MultiAgentStrategy(config_path="traffic_rules/traffic_configuration.json")
        else:
            raise ValueError(f"Unknown strategy: {self.strategy_name}")
            
    def _save_state(self):
        """Save the current state of the simulation"""
        state = {
            "timestamp": self.timestamp.isoformat(),
            "signal_status": copy.deepcopy(self.current_signal_status),
            "reasoning": self.reasoning,
            "vehicles": copy.deepcopy(self.passed_vehicles) + copy.deepcopy(self.vehicles),
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
            destination = vehicle["destination"]
            
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
            new_distance = max(0, vehicle["distance_to_intersection_m"] - speed_ms * delta_time)
            
            # Check if vehicle can proceed through intersection
            can_proceed = False
            
            if new_distance <= 0:
                # Check if estimated arrival time has been reached
                if "estimated_arrival_time" in vehicle:
                    estimated_arrival = datetime.fromisoformat(vehicle["estimated_arrival_time"])
                    if self.timestamp < estimated_arrival:
                        # Vehicle hasn't reached its estimated arrival time yet
                        vehicle["distance_to_intersection_m"] = new_distance
                        updated_vehicles.append(vehicle)
                        continue
                
                # Match destination to signal configuration key
                if destination in self.current_signal_status:
                    can_proceed = self.current_signal_status[destination] == "green"
                    
                    # Special handling for left turns (yield to pedestrians)
                    if can_proceed and "_Left" in destination:
                        # Determine which crosswalk this left turn crosses
                        # In Singapore right-hand drive context: North/South Left turns cross East/West pedestrians, East/West Left turns cross North/South pedestrians
                        relevant_crosswalk = None
                        relevant_signal = None
                        
                        if "Northbound" in destination or "Southbound" in destination:
                            relevant_crosswalk = "crosswalk_east_west"
                            relevant_signal = "Crosswalk_East_West"
                        elif "Eastbound" in destination or "Westbound" in destination:
                            relevant_crosswalk = "crosswalk_north_south"
                            relevant_signal = "Crosswalk_North_South"
                        
                        # Check if pedestrians are present AND have green signal
                        if (relevant_crosswalk and relevant_signal and
                            self.pedestrians.get(relevant_crosswalk, 0) > 0 and
                            self.current_signal_status.get(relevant_signal) == "green"):
                            can_proceed = False  # Yield to pedestrians
                            if self.debug:
                                print(f"Vehicle {vehicle_id} yielding to pedestrians at {relevant_crosswalk}")
                
                if can_proceed:
                    # Vehicle passes through intersection
                    
                    self.passed_vehicles.append({
                        "vehicle_id": vehicle_id,
                        "vehicle_type": vehicle["vehicle_type"],
                        "lane_id": vehicle["lane_id"],
                        "destination": destination,
                        "distance_to_intersection_m": -10,
                        "timestamp": self.timestamp.isoformat(),
                        "estimated_arrival_time": self.timestamp.isoformat(),
                        "emergency_vehicle": vehicle["emergency_vehicle"],
                        "speed_kmh": 33.9,
                        "wait_time": self.vehicle_stats[vehicle_id]["wait_time"],
                        "speed": vehicle["speed_kmh"],
                        "stops": self.vehicle_stats[vehicle_id]["stops"]
                    })
                    if self.debug:
                        print(f"Vehicle {vehicle_id} passed through intersection via {destination} at speed {vehicle['speed_kmh']} km/h")
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
    
    def _update_passed_vehicles(self, delta_time: int):
        """Update passed vehicles based on signal status"""
        for vehicle in self.passed_vehicles:
            vehicle["distance_to_intersection_m"] -= vehicle["speed_kmh"] / 3.6 * delta_time
        
    def _update_pedestrians(self, delta_time: int):
        """Update pedestrian counts based on crosswalk signals"""
        # For Singapore context - right-hand drive with protected right turns
        ns_crosswalk = "crosswalk_north_south"
        ew_crosswalk = "crosswalk_east_west"
        
        # Pedestrians cross when walk signal is active
        if ns_crosswalk in self.pedestrians and self.current_signal_status.get("Crosswalk_North_South") == "green":
            crossing_rate = min(1, self.pedestrians[ns_crosswalk])  # 1 pedestrian per time step
            self.pedestrians[ns_crosswalk] = max(0, self.pedestrians[ns_crosswalk] - crossing_rate)
            self.passed_pedestrians += crossing_rate
            if self.debug and crossing_rate > 0:
                print(f"{crossing_rate} pedestrians crossed N-S")
            
        if ew_crosswalk in self.pedestrians and self.current_signal_status.get("Crosswalk_East_West") == "green":
            crossing_rate = min(1, self.pedestrians[ew_crosswalk])  # 1 pedestrian per time step
            self.pedestrians[ew_crosswalk] = max(0, self.pedestrians[ew_crosswalk] - crossing_rate)
            self.passed_pedestrians += crossing_rate
            if self.debug and crossing_rate > 0:
                print(f"{crossing_rate} pedestrians crossed E-W")
        
    def _change_signal(self):
        """Change the traffic signal using the strategy"""
        self.current_signal_status, self.reasoning = self.strategy.get_next_signal_status(
            self.current_signal_status,
            self.vehicles,
            self.pedestrians,
            self.weather,
            self.context
        )
        
        # Update timestamps
        self.timestamp = self.signal_change_timestamp
        self.current_signal_status["last_changed"] = self.timestamp.isoformat()
        
        # Get duration from signal status or use default of 60 seconds
        duration_seconds = self.current_signal_status.get("duration_seconds", 60)
        
        # Set next timestamp based on duration
        self.next_timestamp = self.timestamp + timedelta(seconds=duration_seconds)
        self.signal_change_timestamp = self.next_timestamp
        self.current_signal_status["next_timestamp"] = self.next_timestamp.isoformat()
        
        if self.debug:
            print(f"Signal changed at {self.timestamp.isoformat()}")
            print(f"Duration: {duration_seconds} seconds")
            # Print which lanes have green lights
            green_lanes = [lane for lane, status in self.current_signal_status.items() 
                          if status == "green" and not lane.startswith("Crosswalk")]
            print(f"Green lanes: {', '.join(green_lanes)}")
        
    def _is_simulation_complete(self) -> bool:
        """Check if simulation is complete (no vehicles or pedestrians)"""
        return (
            len(self.vehicles) == 0 and
            sum(self.pedestrians.get(k, 0) for k in ["crosswalk_north_south", "crosswalk_east_west"]) == 0
        )
                
    def run(self, max_steps: int = 10000):
        """Run the simulation for a maximum number of steps"""
        step = 0
        delta_time = 5  # 5 seconds per step
        if self.debug:
            print(f'Starting simulation with traffic signal configuration:')
            for lane, status in self.current_signal_status.items():
                if status == "green":
                    print(f'  {lane}: {status}')
        
        while step < max_steps and not self._is_simulation_complete():
            step += 1
            self.timestamp += timedelta(seconds=delta_time)
            
            # Check if it's time to change the signal
            if self.timestamp >= self.signal_change_timestamp:
                self._change_signal()
                
            # Update pedestrian states first, then vehicle states
            # This ensures pedestrians are cleared before allowing vehicles to turn left
            self._update_pedestrians(delta_time)
            self._update_vehicles(delta_time)
            self._update_passed_vehicles(delta_time)
            
            # Save current state
            self._save_state()
            
            # Track queue length
            self.queue_lengths.append(self._calculate_queue_length())
            
            if self.debug and step % 10 == 0:
                print(f"Step {step}: {len(self.vehicles)} vehicles, " +
                      f"{sum(self.pedestrians.get(k, 0) for k in ['crosswalk_north_south', 'crosswalk_east_west'])} pedestrians")
                
            # Safety check - break if no changes in last x steps (vehicles might be stuck)
            if step > 1000 and len(self.vehicles) > 0:
                if len(set(self.queue_lengths[-20:])) == 1:
                    if self.debug:
                        print("Warning: Possible deadlock detected. Breaking simulation.")
                        for vehicle in self.vehicles:
                            print(f"Stuck vehicle: {vehicle['vehicle_id']} at lane {vehicle['lane_id']} to {vehicle['destination']}")
                            print(f"Signal status for lane: {self.current_signal_status.get(vehicle['lane_id'], 'unknown')}")
                    
                    # Force process all remaining vehicles
                    for vehicle in self.vehicles:
                        self.passed_vehicles.append({
                            "vehicle_id": vehicle["vehicle_id"],
                            "vehicle_type": vehicle["vehicle_type"],
                            "lane_id": vehicle["lane_id"],
                            "destination": vehicle["destination"],
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
        
        return self.experiment_dir, metrics, self.states
        
    def _save_results(self):
        """Save simulation results to the experiment directory"""
        # Save states
        with open(f"{self.experiment_dir}/states.json", "w") as file:
            json.dump(self.states, file, indent=2)
            
        # Save passed vehicles
        with open(f"{self.experiment_dir}/passed_vehicles.json", "w") as file:
            json.dump(self.passed_vehicles, file, indent=2)
            
        # Save passed pedestrian
        with open(f"{self.experiment_dir}/passed_pedestrians.json", "w") as file:
            json.dump(self.passed_pedestrians, file, indent=2)
            
        # Save original scenario
        with open(f"{self.experiment_dir}/scenario.json", "w") as file:
            json.dump(self.scenario, file, indent=2)
            
        # Save strategy info
        with open(f"{self.experiment_dir}/strategy.json", "w") as file:
            json.dump({"name": self.strategy_name}, file, indent=2)
            
if __name__ == "__main__":
    # Example usage
    simulator = TrafficSimulator("scenarios/scenario1.json", strategy="multi_agent", debug=True)
    experiment_dir, metrics, _ = simulator.run()
    
    print(f"Simulation complete. Results saved to {experiment_dir}")
    print("Metrics:")
    for key, value in metrics.items():
        print(f"{key}: {value}")