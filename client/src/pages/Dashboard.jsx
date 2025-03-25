import { useState, useEffect } from "react";
import {
  Clock,
  AlertCircle,
  TrafficCone,
  Gauge,
  CircleAlert,
  LayoutDashboard,
  Info,
  Settings,
  HelpCircle,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
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
import logo from "../assets/logo.png";

const Dashboard = () => {
  // Available scenarios and strategies
  const scenarios = [
    { id: "scenario1", name: "Scenario 1" },
    { id: "scenario2", name: "Scenario 2" },
    { id: "scenario3", name: "Scenario 3" },
    { id: "scenario4", name: "Scenario 4" },
    { id: "scenario5", name: "Scenario 5" },
  ];

  const strategies = [
    { id: "set_interval", name: "Set Interval" },
    { id: "multi_agent", name: "Multi Agent" },
  ];

  // Add states for scenario selection and API integration
  const [selectedScenario, setSelectedScenario] = useState("scenario1");
  const [selectedStrategy, setSelectedStrategy] = useState("set_interval");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [simulationData, setSimulationData] = useState(null);
  const [persistentData, setPersistentData] = useState(null);
  const [initialState, setInitialState] = useState(null);
  const [states, setStates] = useState([]);

  // States for simulation control
  const [currentTimestamp, setCurrentTimestamp] = useState(null);
  const [currentState, setCurrentState] = useState(null);
  const [previousState, setPreviousState] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [isLastState, setIsLastState] = useState(false);

  // Function to run the simulation
  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    setPlaying(false);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scenario: selectedScenario,
          strategy: selectedStrategy,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setSimulationData(data);

      // Extract scenario data, metrics, and states from the response
      const scenarioData = data.scenario;
      const metricsData = data.metrics;
      const statesData = data.states;

      // Set up persistent data
      const persistent = {
        historical_patterns: scenarioData.historical_patterns,
        context: scenarioData.context,
        traffic_metrics: scenarioData.traffic_metrics,
      };
      setPersistentData(persistent);

      // Create initial state
      const initial = {
        timestamp: scenarioData.signal_status.last_changed,
        signal_status: scenarioData.signal_status,
        vehicles: scenarioData.vehicle_data,
        pedestrians: scenarioData.pedestrians,
        queue_length: 0,
        passed_vehicles_count: 0,
        passed_pedestrians_count: 0,
        ...persistent,
      };
      setInitialState(initial);

      // Create all states with persistent data
      const allStates = [
        initial,
        ...statesData.map((state) => ({
          ...state,
          ...persistent,
        })),
      ];

      setStates(allStates);
      setCurrentTimestamp(initial.timestamp);
      setCurrentState(initial);
      setPreviousState(null);
      setIsLastState(false);
    } catch (err) {
      console.error("Error running simulation:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update current state when timestamp changes
  useEffect(() => {
    if (!states.length || !currentTimestamp) return;

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
    if (!states.length) return;

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
        {/* Scenario Selection Card */}
        <Card className="mb-6 overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-" />
              Simulation Configuration
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              Configure and run traffic simulations to analyze different
              scenarios and strategies
            </p>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="mb-5">
                  <Label
                    htmlFor="scenario"
                    className="text-sm font-medium mb-1.5 flex items-center text-slate-700"
                  >
                    <TrafficCone className="h-4 w-4 mr-2 " />
                    Select Scenario
                  </Label>
                  <Select
                    value={selectedScenario}
                    onValueChange={setSelectedScenario}
                    disabled={loading}
                  >
                    <SelectTrigger id="scenario" className="w-full bg-white">
                      <SelectValue placeholder="Select Scenario" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {scenarios.map((scenario) => (
                        <SelectItem key={scenario.id} value={scenario.id}>
                          {scenario.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Scenario description box */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">
                    Scenario Description
                  </h4>
                  <div className="text-xs text-slate-600 space-y-2">
                    {selectedScenario === "scenario1" && (
                      <p>
                        <span className="font-semibold">
                          Vehicles Waiting with No Opposing Traffic:
                        </span>{" "}
                        This scenario simulates vehicles waiting at a red light
                        with no cross traffic, highlighting inefficiencies in
                        fixed-time signal systems.
                      </p>
                    )}
                    {selectedScenario === "scenario2" && (
                      <p>
                        <span className="font-semibold">
                          Pedestrians Waiting with No Vehicles:
                        </span>{" "}
                        This scenario depicts pedestrians waiting to cross while
                        traffic lights stay green for non-existent vehicles,
                        demonstrating the need for responsive pedestrian
                        detection.
                      </p>
                    )}
                    {selectedScenario === "scenario3" && (
                      <p>
                        <span className="font-semibold">
                          Busy Intersection with Complex Traffic Patterns:
                        </span>{" "}
                        This complex scenario features multiple vehicles and
                        pedestrians from all directions, with optimization
                        metrics showing potential for 20% improvement in traffic
                        flow.
                      </p>
                    )}
                    {selectedScenario === "scenario4" && (
                      <p>
                        <span className="font-semibold">
                          Weather Conditions Affecting Traffic:
                        </span>{" "}
                        This scenario shows how adverse weather conditions
                        (heavy rain) affect traffic flow, vehicle behavior, and
                        signal timing, with historical pattern analysis.
                      </p>
                    )}
                    {selectedScenario === "scenario5" && (
                      <p>
                        <span className="font-semibold">
                          Emergency Vehicle Response:
                        </span>{" "}
                        This scenario demonstrates an emergency vehicle
                        (ambulance) approaching the intersection with signal
                        preemption to prioritize its passage through the
                        intersection.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-5">
                  <Label className="text-sm font-medium mb-1.5 flex items-center text-slate-700">
                    <Gauge className="h-4 w-4 mr-2" />
                    Traffic Control Strategy
                  </Label>
                  <RadioGroup
                    value={selectedStrategy}
                    onValueChange={setSelectedStrategy}
                    disabled={loading}
                    className="space-y-3 mt-3"
                  >
                    {strategies.map((strategy) => (
                      <div
                        key={strategy.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedStrategy === strategy.id
                            ? "border-blue-300 bg-blue-50 shadow-sm"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() =>
                          !loading && setSelectedStrategy(strategy.id)
                        }
                      >
                        <div className="flex items-center mb-1">
                          <div className="relative mr-2">
                            <RadioGroupItem
                              value={strategy.id}
                              id={strategy.id}
                              className={
                                selectedStrategy === strategy.id
                                  ? "text-blue-600 border-blue-600"
                                  : ""
                              }
                            />
                            {selectedStrategy === strategy.id && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                              </div>
                            )}
                          </div>
                          <Label
                            htmlFor={strategy.id}
                            className="font-medium cursor-pointer"
                          >
                            {strategy.name}
                          </Label>
                        </div>
                        <p className="text-xs text-slate-600 ml-6">
                          {strategy.id === "set_interval"
                            ? "Traditional traffic light system with fixed timing intervals regardless of current traffic conditions."
                            : "AI-powered adaptive system that uses real-time data to optimize traffic flow based on current conditions."}
                        </p>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t py-4 bg-slate-50">
            <div className="text-sm">
              {simulationData ? (
                <div className="flex items-center text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Simulation loaded successfully
                </div>
              ) : (
                <div className="text-slate-500 italic">
                  Configure settings and run the simulation
                </div>
              )}
            </div>
            <Button
              onClick={runSimulation}
              disabled={loading}
              className="flex items-center text-white bg-blue-500 hover:bg-blue-200 rounded-full transition-colors duration-300 shadow-md hover:shadow-lg"
              size="lg"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {loading ? "Generating Simulation..." : "Run Simulation"}
            </Button>
          </CardFooter>
        </Card>

        {/* Error message */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load simulation: {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Simulation content - only show if we have data */}
        {states.length > 0 && currentState ? (
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
              {isLastState && simulationData?.metrics && (
                <SimulationMetrics metrics={simulationData.metrics} />
              )}
            </div>
          </div>
        ) : !loading ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <TrafficCone className="h-12 w-12 mx-auto text-amber-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Simulation Data</h3>
            <p className="text-gray-500 mb-4">
              Select a scenario and strategy, then click "Run Simulation" to
              begin.
            </p>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default Dashboard;
