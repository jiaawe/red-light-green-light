import json
from collections import defaultdict

VEHICLE_COUNTER_PATH = "backend/counter/vehicle_count.json" 
PEDESTRAIN_COUNTER_PATH = "backend/counter/pedestrain_count.json"
TRAFFIC_RULES_PATH = "backend/traffic_rules/cleaned_actions.json"
AGGREGATED_DATA_PATH = "backend/counter/aggregated.json"

def calculate_and_save_traffic_counts(
        vehicle_intent_path, 
        pedestrian_intent_path, 
        traffic_rules_path,
        output_file="output.json"
    ):
    """
    Calculate the total number of vehicles and pedestrians for each traffic action
    based on the traffic rules and the intent of vehicles and pedestrians.
    """

    # Read and parse JSON files
    with open(traffic_rules_path, 'r') as file:
        traffic_rules_json = file.read()
    with open(vehicle_intent_path, 'r') as file:
        vehicle_intent_json = file.read()
    with open(pedestrian_intent_path, 'r') as file:
        pedestrian_intent_json = file.read()

    traffic_rules = json.loads(traffic_rules_json)
    vehicle_intent = json.loads(vehicle_intent_json)
    pedestrian_intent = json.loads(pedestrian_intent_json)

    # Dictionary to track total vehicle + pedestrian count per action
    traffic_action_counts = defaultdict(lambda: {"vehicles": 0, "pedestrians": 0})

    # Calculate total vehicles and pedestrians for each traffic action
    for action_id, rule in traffic_rules.items():
        # Count vehicles
        for movement, status in rule.items():
            if status == "green" and movement in vehicle_intent:
                traffic_action_counts[action_id]["vehicles"] += vehicle_intent[movement]
        
        # Count pedestrians
        for crosswalk, status in rule.items():
            if status == "green" and crosswalk in pedestrian_intent:
                traffic_action_counts[action_id]["pedestrians"] += pedestrian_intent[crosswalk]
    
    print(traffic_action_counts)
    # with open(output_path, 'w') as file:
    #     json.dump(traffic_action_counts, file)

    # Return the saved file path
    # return output_path

# Example usage
calculate_and_save_traffic_counts(VEHICLE_COUNTER_PATH, PEDESTRAIN_COUNTER_PATH, TRAFFIC_RULES_PATH, AGGREGATED_DATA_PATH)
