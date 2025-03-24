// Dashboard.jsx
import { useState, useEffect, useRef } from "react";
import IntersectionView from "../components/IntersectionView";
import VehicleList from "../components/VehicleList";
import SignalStatus from "../components/SignalStatus";
import TrafficMetrics from "../components/TrafficMetrics";
import TimeControl from "../components/TimeControl";
import EmergencyAlert from "../components/EmergencyAlert";
import PedestrianView from "../components/PedestrianView";
import SimulationMetrics from "../components/SimulationMetrics";
import scenarioData from "../data/scenario.json";
import statesData from "../data/states.json";
import metricsData from "../data/metrics.json";

const Dashboard = () => {
  // Create the initial state from scenario.json
  const initialState = {
    timestamp: scenarioData.signal_status.last_changed,
    signal_status: scenarioData.signal_status,
    vehicles: scenarioData.vehicle_data,
    pedestrians: scenarioData.pedestrians,
    queue_length: 0,
    passed_vehicles_count: 0,
    passed_pedestrians_count: 0,
  };

  // Combine initial state with subsequent states
  const allStates = [initialState, ...statesData];

  const [states] = useState(allStates);
  const [currentTimestamp, setCurrentTimestamp] = useState(
    initialState.timestamp
  );
  const [currentState, setCurrentState] = useState(initialState);
  const [previousState, setPreviousState] = useState(null);
  const [playing, setPlaying] = useState(false);

  // Update current state when timestamp changes
  useEffect(() => {
    const currentIndex = states.findIndex(
      (s) => s.timestamp === currentTimestamp
    );
    if (currentIndex >= 0) {
      // Store previous state before updating current
      setPreviousState(currentState);
      setCurrentState(states[currentIndex]);
    }
  }, [currentTimestamp, states]);

  // Handle auto-play
  useEffect(() => {
    let timerId;

    if (playing) {
      timerId = setTimeout(() => {
        const currentIndex = states.findIndex(
          (s) => s.timestamp === currentTimestamp
        );
        if (currentIndex < states.length - 1) {
          setCurrentTimestamp(states[currentIndex + 1].timestamp);
        } else {
          setPlaying(false);
        }
      }, 1000);
    }

    return () => clearTimeout(timerId);
  }, [playing, currentTimestamp, states]);

  const handleTimestampChange = (timestamp) => {
    setCurrentTimestamp(timestamp);
  };

  const handlePlayToggle = () => {
    setPlaying((prev) => !prev);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Traffic Intersection Simulator</h1>
        <div className="text-sm text-gray-500">
          {currentState?.context?.weather &&
            `Weather: ${currentState.context.weather}`}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left column - Main view and controls */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Intersection view */}
          <IntersectionView
            currentState={currentState}
            previousState={previousState}
          />

          {/* Time controls - directly under intersection */}
          <TimeControl
            states={states}
            currentTimestamp={currentTimestamp}
            onTimestampChange={handleTimestampChange}
            playing={playing}
            onPlayToggle={handlePlayToggle}
          />

          {/* Vehicle list */}
          <VehicleList currentState={currentState} />
        </div>

        {/* Right column - Status and metrics */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Emergency alert (if active) - at the top of sidebar */}
          {currentState?.signal_status?.emergency_preemption?.active && (
            <EmergencyAlert currentState={currentState} />
          )}

          {/* Signal status */}
          <SignalStatus currentState={currentState} />

          {/* Traffic metrics */}
          <TrafficMetrics currentState={currentState} />

          {/* Simulation Metrics */}
          <SimulationMetrics metrics={metricsData} />

          {/* Pedestrian view */}
          <PedestrianView currentState={currentState} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
