from flask import Blueprint, request, jsonify
import os
import json
from simulator import TrafficSimulator

simulator_bp = Blueprint('simulator', __name__, url_prefix='/api')

# Directory for storing scenarios
SCENARIOS_DIR = "scenarios"

@simulator_bp.route('/scenarios', methods=['POST'])
def add_scenario():
    """
    Add a new scenario JSON file
    Expected request format: JSON with 'name' and 'data' fields
    """
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.json
    
    # Validate input
    if 'name' not in data:
        return jsonify({"error": "Scenario name is required"}), 400
    if 'data' not in data:
        return jsonify({"error": "Scenario data is required"}), 400
    
    # Ensure name has proper format
    scenario_name = data['name']
    if not scenario_name.endswith('.json'):
        scenario_name += '.json'
    
    # Ensure scenarios directory exists
    os.makedirs(SCENARIOS_DIR, exist_ok=True)
    
    # Save scenario file
    scenario_path = os.path.join(SCENARIOS_DIR, scenario_name)
    
    try:
        # Validate that the data is proper JSON
        scenario_data = data['data']
        if isinstance(scenario_data, str):
            # If data is provided as a string, parse it
            scenario_data = json.loads(scenario_data)
        
        # Write scenario to file
        with open(scenario_path, 'w') as file:
            json.dump(scenario_data, file, indent=2)
        
        return jsonify({
            "success": True,
            "message": f"Scenario {scenario_name} saved successfully",
            "path": scenario_path
        })
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid JSON data provided"}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to save scenario: {str(e)}"}), 500

@simulator_bp.route('/run', methods=['POST'])
def run_simulation():
    """
    Run a simulation with a stored scenario file and selected strategy
    Expected request format: JSON with 'scenario' and 'strategy' fields
    """
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.json
    
    # Validate input
    if 'scenario' not in data:
        return jsonify({"error": "Scenario name is required"}), 400
    
    # Get scenario name and ensure .json extension
    scenario_name = data['scenario']
    if not scenario_name.endswith('.json'):
        scenario_name += '.json'
    
    # Get strategy, default to set_interval
    strategy = data.get('strategy', 'set_interval')
    if strategy not in ['set_interval', 'multi_agent']:
        return jsonify({"error": "Invalid strategy. Choose 'set_interval' or 'multi_agent'"}), 400
    
    # Construct full scenario path
    scenario_path = os.path.join(SCENARIOS_DIR, scenario_name)
    if not os.path.exists(scenario_path):
        return jsonify({"error": f"Scenario {scenario_name} not found"}), 404
    
    # Get optional parameters
    debug = data.get('debug', False)
    max_steps = data.get('max_steps', 10000)
    
    try:
        # Run simulation
        simulator = TrafficSimulator(scenario_path, strategy=strategy, debug=debug)
        experiment_dir, metrics, states = simulator.run(max_steps=max_steps)
        
        # Extract experiment ID from the full path
        experiment_id = os.path.basename(experiment_dir)
        
        # Return results
        return jsonify({
            "success": True,
            "experiment_id": experiment_id,
            "experiment_dir": experiment_dir,
            "states": states,
            "metrics": metrics
        })
    except Exception as e:
        return jsonify({"error": f"Simulation error: {str(e)}"}), 500