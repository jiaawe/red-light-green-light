import requests
import json

# URL for the API endpoints
base_url = "http://localhost:8000/api"

# 1. Add a scenario
scenario_data = {
    "name": "test_scenario",
    "data": {
      "vehicle_data": [
        {
          "vehicle_id": "V1001",
          "lane_id": "Southbound_Straight",
          "speed_kmh": 4,
          "distance_to_intersection_m": 5.2,
          "destination": "Southbound_Straight",
          "vehicle_type": "car",
          "estimated_arrival_time": "2025-03-19T08:00:05",
          "emergency_vehicle": False
        }
      ],
      "traffic_metrics": {
        "congestion_level": "low",
        "historical_comparison": {
          "typical_congestion_level": "low",
          "percent_difference": 5,
          "timestamp": "2025-03-19T08:00:00"
        }
      },
      "pedestrians": {
        "crosswalk_north_south": 0,
        "crosswalk_east_west": 0,
        "timestamp": "2025-03-19T08:00:00"
      },
      "signal_status": {
        "Northbound_Straight": "green",
        "Northbound_Left": "green",
        "Northbound_Right": "red",
        "Southbound_Straight": "green",
        "Southbound_Left": "green",
        "Southbound_Right": "red",
        "Eastbound_Straight": "red",
        "Eastbound_Left": "red",
        "Eastbound_Right": "red",
        "Westbound_Straight": "red",
        "Westbound_Left": "red",
        "Westbound_Right": "red",
        "Crosswalk_North_South": "green",
        "Crosswalk_East_West": "red",
        "last_changed": "2025-03-19T07:59:30",
        "next_timestamp": "2025-03-19T08:00:00"
      },
      "context": {
        "weather": "Clear",
        "peak_period": False,
        "incident_reported": False
      }
    }
}

response = requests.post(f"{base_url}/scenarios", json=scenario_data)
print(response.json())

# 2. Run a simulation
simulation_request = {
    "scenario": "scenario5",
    "strategy": "multi_agent"
}
response = requests.post(f"{base_url}/run", json=simulation_request)

print(response.json())