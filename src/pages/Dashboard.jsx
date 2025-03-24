import { useState, useEffect } from "react";
import {
  Clock,
  AlertTriangle,
  TrafficCone,
  Gauge,
  CircleAlert,
  LayoutDashboard,
  Info,
  Settings,
  HelpCircle,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import IntersectionView from "../components/IntersectionView";
import VehicleList from "../components/VehicleList";
import SignalStatus from "../components/SignalStatus";
import TrafficMetrics from "../components/TrafficMetrics";
import TimeControl from "../components/TimeControl";
import EmergencyAlert from "../components/EmergencyAlert";
import PedestrianView from "../components/PedestrianView";
import SimulationMetrics from "../components/SimulationMetrics";
import HistoricalPatterns from "../components/HistoricalPatterns";
import ContextInfo from "../components/ContextInfo";
import TrafficMetricsDetail from "../components/TrafficMetricsDetail";
import scenarioData from "../data/scenario.json";
import statesData from "../data/states.json";
import metricsData from "../data/metrics.json";
import logo from "../assets/logo.png";

const Dashboard = () => {
  // Store the persistent data that should be available across all states
  const persistentData = {
    historical_patterns: scenarioData.historical_patterns,
    context: scenarioData.context,
    traffic_metrics: scenarioData.traffic_metrics,
  };

  // Create the initial state from scenario.json
  const initialState = {
    timestamp: scenarioData.signal_status.last_changed,
    signal_status: scenarioData.signal_status,
    vehicles: scenarioData.vehicle_data,
    pedestrians: scenarioData.pedestrians,
    queue_length: 0,
    passed_vehicles_count: 0,
    passed_pedestrians_count: 0,
    ...persistentData, // Include persistent data
  };

  // Combine initial state with subsequent states, ensuring persistent data is included
  const allStates = [
    initialState,
    ...statesData.map((state) => ({
      ...state,
      ...persistentData, // Add persistent data to each state
    })),
  ];

  const [states] = useState(allStates);
  const [currentTimestamp, setCurrentTimestamp] = useState(
    initialState.timestamp
  );
  const [currentState, setCurrentState] = useState(initialState);
  const [previousState, setPreviousState] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [isLastState, setIsLastState] = useState(false);

  // Update current state when timestamp changes
  useEffect(() => {
    const currentIndex = states.findIndex(
      (s) => s.timestamp === currentTimestamp
    );
    if (currentIndex >= 0) {
      // Store previous state before updating current
      setPreviousState(currentState);
      setCurrentState(states[currentIndex]);

      // Check if this is the last state
      setIsLastState(currentIndex === states.length - 1);
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center">
            <img
              src={logo}
              alt="Traffic Intersection Simulator"
              className="h-20 w-auto mr-4"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4">
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
              currentState={currentState}
            />

            {/* Vehicle list */}
            <VehicleList currentState={currentState} />

            {/* Historical patterns and Traffic metrics detail - shown in every step */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Context information - shown in every step */}
              <ContextInfo context={currentState?.context} />
              <HistoricalPatterns
                patterns={currentState?.historical_patterns}
              />
              <TrafficMetricsDetail metrics={currentState?.traffic_metrics} />
            </div>
          </div>

          {/* Right column - Status and metrics */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Emergency alert (if active) - at the top of sidebar */}
            {currentState?.signal_status?.emergency_preemption?.active && (
              <EmergencyAlert currentState={currentState} />
            )}

            {/* Pedestrian view */}
            <PedestrianView currentState={currentState} />
            {/* Signal status */}
            <SignalStatus currentState={currentState} />

            {/* Traffic metrics */}
            <TrafficMetrics currentState={currentState} />

            {/* Simulation Metrics - only shown in the last state */}
            {isLastState && <SimulationMetrics metrics={metricsData} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
