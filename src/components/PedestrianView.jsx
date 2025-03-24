import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PersonStanding, AlertTriangle, Infinity, Clock } from "lucide-react";

const PedestrianView = ({ currentState }) => {
  if (!currentState || !currentState.pedestrians) return null;

  const { pedestrians, signal_status } = currentState;

  const totalPedestrians =
    pedestrians.crosswalk_north_south + pedestrians.crosswalk_east_west;

  // Determine if crosswalk is active (signal is green)
  const northSouthActive = signal_status?.Crosswalk_North_South === "green";
  const eastWestActive = signal_status?.Crosswalk_East_West === "green";

  // Helper function to determine pedestrian density
  const getPedestrianDensity = (count) => {
    if (count === 0) return "None";
    if (count <= 2) return "Low";
    if (count <= 5) return "Moderate";
    return "High";
  };

  // Get insights based on pedestrian count and signal status
  const getNorthSouthInsight = () => {
    if (pedestrians.crosswalk_north_south === 0)
      return "No pedestrians present";
    if (northSouthActive) return "Pedestrians currently crossing";
    if (pedestrians.crosswalk_north_south > 3)
      return "Multiple pedestrians waiting to cross";
    return "Pedestrians waiting for signal";
  };

  const getEastWestInsight = () => {
    if (pedestrians.crosswalk_east_west === 0) return "No pedestrians present";
    if (eastWestActive) return "Pedestrians currently crossing";
    if (pedestrians.crosswalk_east_west > 3)
      return "Multiple pedestrians waiting to cross";
    return "Pedestrians waiting for signal";
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center">
            <PersonStanding className="h-4 w-4 mr-2" />
            <span>Pedestrian Activity</span>
          </div>
          <Badge variant="outline">{totalPedestrians} total</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {/* North-South Crosswalk Panel */}
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">North-South Crosswalk</span>
              <Badge variant={northSouthActive ? "success" : "outline"}>
                {pedestrians.crosswalk_north_south}
              </Badge>
            </div>

            <div className="flex items-center mt-1 mb-2">
              <div
                className={`w-3 h-3 rounded-full mr-2 ${
                  northSouthActive ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span className="text-xs capitalize">
                Signal: {signal_status?.Crosswalk_North_South || "unknown"}
              </span>
            </div>

            <div className="text-xs text-gray-600">
              <div className="flex items-center mb-1">
                <Clock className="h-3 w-3 mr-1" />
                <span>
                  Density:{" "}
                  {getPedestrianDensity(pedestrians.crosswalk_north_south)}
                </span>
              </div>
              <div className="flex items-start">
                <AlertTriangle
                  className={`h-3 w-3 mr-1 mt-0.5 ${
                    northSouthActive && pedestrians.crosswalk_north_south > 0
                      ? "text-amber-500"
                      : "text-gray-400"
                  }`}
                />
                <span>{getNorthSouthInsight()}</span>
              </div>
            </div>
          </div>

          {/* East-West Crosswalk Panel */}
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">East-West Crosswalk</span>
              <Badge variant={eastWestActive ? "success" : "outline"}>
                {pedestrians.crosswalk_east_west}
              </Badge>
            </div>

            <div className="flex items-center mt-1 mb-2">
              <div
                className={`w-3 h-3 rounded-full mr-2 ${
                  eastWestActive ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span className="text-xs capitalize">
                Signal: {signal_status?.Crosswalk_East_West || "unknown"}
              </span>
            </div>

            <div className="text-xs text-gray-600">
              <div className="flex items-center mb-1">
                <Clock className="h-3 w-3 mr-1" />
                <span>
                  Density:{" "}
                  {getPedestrianDensity(pedestrians.crosswalk_east_west)}
                </span>
              </div>
              <div className="flex items-start">
                <AlertTriangle
                  className={`h-3 w-3 mr-1 mt-0.5 ${
                    eastWestActive && pedestrians.crosswalk_east_west > 0
                      ? "text-amber-500"
                      : "text-gray-400"
                  }`}
                />
                <span>{getEastWestInsight()}</span>
              </div>
            </div>
          </div>

          {/* Overall pedestrian insight */}
          {totalPedestrians > 0 && (
            <div className="text-xs text-gray-600 border-t pt-2 mt-2">
              <div className="flex items-start">
                <Infinity className="h-3 w-3 mr-1 mt-0.5" />
                <span>
                  {totalPedestrians > 8
                    ? "High pedestrian volume may impact traffic flow"
                    : totalPedestrians > 4
                    ? "Moderate pedestrian activity in the intersection"
                    : "Light pedestrian presence with minimal impact"}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PedestrianView;
