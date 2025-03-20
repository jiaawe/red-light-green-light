import json
import os
from typing import Dict, List, Any
from datetime import datetime
import statistics

def calculate_metrics(states: List[Dict[str, Any]], 
                      passed_vehicles: List[Dict[str, Any]],
                      passed_pedestrians: int,
                      queue_lengths: List[int],
                      output_dir: str) -> Dict[str, Any]:
    """
    Calculate traffic metrics based on simulation results
    """
    # Initialize metrics dict
    metrics = {
        "throughput_per_hour": {
            "vehicles": 0,
            "pedestrians": 0,
            "total": 0
        },
        "average_delay_per_vehicle": 0,
        "total_stops": 0,
        "max_queue_length": 0,
        "average_queue_length": 0,
        "carbon_emissions": {
            "CO2_kg": 0,
            "NOx_g": 0,
            "particulates_g": 0
        },
        "energy_efficiency": 0
    }
    
    # Simulation duration in hours
    if len(states) > 1:
        start_time = datetime.fromisoformat(states[0]["timestamp"])
        end_time = datetime.fromisoformat(states[-1]["timestamp"])
        duration_seconds = (end_time - start_time).total_seconds()
        duration_hours = duration_seconds / 3600
    else:
        duration_hours = 0.01  # Prevent division by zero
    
    # Calculate throughput
    vehicle_count = len(passed_vehicles)
    metrics["throughput_per_hour"]["vehicles"] = vehicle_count / duration_hours
    metrics["throughput_per_hour"]["pedestrians"] = passed_pedestrians / duration_hours
    metrics["throughput_per_hour"]["total"] = (vehicle_count + passed_pedestrians) / duration_hours
    
    # Calculate delay and stops
    if passed_vehicles:
        total_wait_time = sum(v["wait_time"] for v in passed_vehicles)
        total_stops = sum(v["stops"] for v in passed_vehicles)
        
        metrics["average_delay_per_vehicle"] = total_wait_time / vehicle_count
        metrics["total_stops"] = total_stops
    
    # Calculate queue lengths
    if queue_lengths:
        metrics["max_queue_length"] = max(queue_lengths)
        metrics["average_queue_length"] = sum(queue_lengths) / len(queue_lengths)
    
    # Calculate emissions and energy efficiency
    # Use approximate emission factors based on vehicle type
    emission_factors = {
        "car": {"CO2_kg_per_km": 0.120, "NOx_g_per_km": 0.040, "particulates_g_per_km": 0.002},
        "suv": {"CO2_kg_per_km": 0.180, "NOx_g_per_km": 0.060, "particulates_g_per_km": 0.003}, 
        "sedan": {"CO2_kg_per_km": 0.130, "NOx_g_per_km": 0.045, "particulates_g_per_km": 0.002},
        "truck": {"CO2_kg_per_km": 0.500, "NOx_g_per_km": 0.200, "particulates_g_per_km": 0.010},
        "bus": {"CO2_kg_per_km": 0.800, "NOx_g_per_km": 0.300, "particulates_g_per_km": 0.015},
        "van": {"CO2_kg_per_km": 0.200, "NOx_g_per_km": 0.080, "particulates_g_per_km": 0.004},
        "motorcycle": {"CO2_kg_per_km": 0.080, "NOx_g_per_km": 0.020, "particulates_g_per_km": 0.001},
        "ambulance": {"CO2_kg_per_km": 0.250, "NOx_g_per_km": 0.100, "particulates_g_per_km": 0.005},
        "default": {"CO2_kg_per_km": 0.150, "NOx_g_per_km": 0.050, "particulates_g_per_km": 0.002}
    }
    
    energy_factors = {
        "car": 0.20,  # kWh per km
        "suv": 0.30,
        "sedan": 0.22,
        "truck": 0.80,
        "bus": 1.20,
        "van": 0.35,
        "motorcycle": 0.10,
        "ambulance": 0.40,
        "default": 0.25
    }
    
    # Assume each vehicle travels approximately 0.3 km through the intersection
    distance_km = 0.3
    
    # Calculate total emissions and energy use
    total_co2 = 0
    total_nox = 0
    total_particulates = 0
    total_energy = 0
    
    for vehicle in passed_vehicles:
        vehicle_type = vehicle.get("vehicle_type", "default")
        emission = emission_factors.get(vehicle_type, emission_factors["default"])
        energy = energy_factors.get(vehicle_type, energy_factors["default"])
        
        # Adjust for stop-and-go traffic which increases emissions
        stops_factor = 1.0 + (0.1 * vehicle["stops"])
        wait_factor = 1.0 + (0.01 * vehicle["wait_time"])
        
        # Calculate emissions
        co2 = emission["CO2_kg_per_km"] * distance_km * stops_factor * wait_factor
        nox = emission["NOx_g_per_km"] * distance_km * stops_factor * wait_factor
        particulates = emission["particulates_g_per_km"] * distance_km * stops_factor * wait_factor
        
        total_co2 += co2
        total_nox += nox
        total_particulates += particulates
        
        # Calculate energy
        energy_use = energy * distance_km * stops_factor
        total_energy += energy_use
    
    metrics["carbon_emissions"]["CO2_kg"] = total_co2
    metrics["carbon_emissions"]["NOx_g"] = total_nox
    metrics["carbon_emissions"]["particulates_g"] = total_particulates
    
    # Energy efficiency lower is better, normalized by vehicle throughput for fair comparison
    if vehicle_count > 0:
        metrics["energy_efficiency"] = total_energy / vehicle_count
    
    # Save metrics to output directory
    with open(f"{output_dir}/metrics.json", "w") as file:
        json.dump(metrics, file, indent=2)
    
    return metrics