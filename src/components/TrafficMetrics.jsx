import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const TrafficMetrics = ({ currentState }) => {
  if (!currentState) return null;

  const {
    passed_vehicles_count = 0,
    passed_pedestrians_count = 0,
    queue_length = 0,
  } = currentState;

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-base">Traffic Metrics</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Vehicles Passed</span>
              <span className="text-sm">{passed_vehicles_count}</span>
            </div>
            <Progress
              value={Math.min(passed_vehicles_count, 100)}
              max={100}
              className="h-2"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Pedestrians Crossed</span>
              <span className="text-sm">{passed_pedestrians_count}</span>
            </div>
            <Progress
              value={Math.min(passed_pedestrians_count, 100)}
              max={100}
              className="h-2"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Queue Length</span>
              <span className="text-sm">{queue_length}</span>
            </div>
            <Progress
              value={Math.min(queue_length * 10, 100)}
              max={100}
              className="h-2"
            />
          </div>

          {currentState.signal_status?.emergency_preemption &&
            currentState.signal_status.emergency_preemption.active && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <h4 className="text-sm font-medium text-red-800">
                  Emergency Vehicle
                </h4>
                <p className="text-xs text-red-700 mt-1">
                  Time to clear intersection:{" "}
                  {
                    currentState.signal_status.emergency_preemption
                      .estimated_duration_sec
                  }
                  s
                </p>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrafficMetrics;
