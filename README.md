# red-light-green-light

```python
python -m venv env 
env\Scripts\activate
source env/bin/activate
pip install -r requirements.txt
```

# Smart Traffic Management System

## Overview

This repository contains a comprehensive data model and sample scenarios for a Smart Traffic Management System. The project aims to optimize traffic flow at intersections using real-time data analysis and smart signal control algorithms. This data has been prepared for use in hackathons and prototype development of intelligent transportation systems.

## Data Structure

All scenarios follow a standardized JSON format with the following key components:

### Vehicle Data
```json
{
  "vehicle_id": "string",
  "lane_id": "string",
  "speed_kmh": 0.0,
  "distance_to_intersection_m": 0.0,
  "destination": "string",
  "vehicle_type": "string",
  "estimated_arrival_time": "ISO timestamp",
  "emergency_vehicle": true / false
}
```

### Traffic Metrics
```json
{
  "congestion_level": "string",
  "historical_comparison": {
    "typical_congestion_level": "string",
    "percent_difference": 0.0,
    "timestamp": "ISO timestamp"
  },
  "average_throughput_sec": {
    "Direction_Lane": 0  // e.g., "Northbound_Straight": 120
  }
}
```

### Pedestrians
```json
{
  "crosswalk_north": 0,
  "crosswalk_east": 0,
  "crosswalk_south": 0,
  "crosswalk_west": 0,
  "waiting_for_signal": 0,
  "timestamp": "ISO timestamp"
}
```

### Signal Status
```json
{
  "Northbound_Straight": "string",
  "Northbound_Left": "string",
  "Northbound_Right": "string",
  "Eastbound_Straight": "string",
  "Eastbound_Left": "string",
  "Eastbound_Right": "string",
  "Southbound_Straight": "string",
  "Southbound_Left": "string",
  "Southbound_Right": "string",
  "Westbound_Straight": "string",
  "Westbound_Left": "string",
  "Westbound_Right": "string",
  "Crosswalk_North": "string",
  "Crosswalk_West": "string",
  "last_changed": "ISO timestamp",
  "timestamp": "ISO timestamp"
}
```

## Scenarios

### Scenario 1: Vehicles Waiting with No Opposing Traffic
This scenario simulates vehicles waiting at a red light with no cross traffic, highlighting inefficiencies in fixed-time signal systems.

### Scenario 2: Pedestrians Waiting with No Vehicles
This scenario depicts pedestrians waiting to cross while traffic lights stay green for non-existent vehicles, demonstrating the need for responsive pedestrian detection.

### Scenario 3: Busy Intersection with Complex Traffic Patterns
This complex scenario features multiple vehicles and pedestrians from all directions, with optimization metrics showing potential for 20% improvement in traffic flow.

### Scenario 4: Weather Conditions Affecting Traffic
This scenario shows how adverse weather conditions (heavy rain) affect traffic flow, vehicle behavior, and signal timing, with historical pattern analysis.

### Scenario 5: Emergency Vehicle Response
This scenario demonstrates an emergency vehicle (ambulance) approaching the intersection with signal preemption to prioritize its passage through the intersection.

