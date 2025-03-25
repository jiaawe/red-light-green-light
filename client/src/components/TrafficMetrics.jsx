import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Car,
  PersonStanding,
  Users,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TrafficMetrics = ({ currentState }) => {
  if (!currentState) return null;

  const {
    passed_vehicles_count = 0,
    passed_pedestrians_count = 0,
    queue_length = 0,
  } = currentState;

  // Helper function to determine color based on value
  const getColorForValue = (value, threshold1, threshold2) => {
    if (value <= threshold1) return "bg-green-500";
    if (value <= threshold2) return "bg-amber-500";
    return "bg-red-500";
  };

  // Helper function to determine badge variant based on value
  const getBadgeVariant = (value, threshold1, threshold2) => {
    if (value <= threshold1) return "success";
    if (value <= threshold2) return "warning";
    return "destructive";
  };

  // Calculate vehicle progress color
  const vehiclesColor = getColorForValue(passed_vehicles_count, 20, 50);
  const pedestriansColor = getColorForValue(passed_pedestrians_count, 10, 25);
  const queueColor = getColorForValue(queue_length, 3, 8);

  // Calculate badge variants
  const vehiclesBadge = getBadgeVariant(passed_vehicles_count, 20, 50);
  const pedestriansBadge = getBadgeVariant(passed_pedestrians_count, 10, 25);
  const queueBadge = getBadgeVariant(queue_length, 3, 8);

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-base flex items-center">
          <BarChart className="h-4 w-4 mr-2" />
          <span>Traffic Flow Metrics</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-5">
          <div className="bg-slate-50 p-3 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <Car className="h-4 w-4 text-slate-600 mr-2" />
                <span className="text-sm font-medium">Vehicles Passed</span>
              </div>
              <Badge variant={vehiclesBadge} className="flex items-center">
                {passed_vehicles_count > 0 && (
                  <TrendingUp className="h-3 w-3 mr-1" />
                )}
                {passed_vehicles_count}
              </Badge>
            </div>
            <Progress
              value={Math.min(passed_vehicles_count, 100)}
              max={100}
              className={`h-2 ${vehiclesColor}`}
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <PersonStanding className="h-4 w-4 text-slate-600 mr-2" />
                <span className="text-sm font-medium">Pedestrians Crossed</span>
              </div>
              <Badge variant={pedestriansBadge} className="flex items-center">
                {passed_pedestrians_count > 0 && (
                  <ArrowRight className="h-3 w-3 mr-1" />
                )}
                {passed_pedestrians_count}
              </Badge>
            </div>
            <Progress
              value={Math.min(passed_pedestrians_count, 100)}
              max={100}
              className={`h-2 ${pedestriansColor}`}
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-slate-600 mr-2" />
                <span className="text-sm font-medium">Queue Length</span>
              </div>
              <Badge variant={queueBadge} className="flex items-center">
                {queue_length > 0 && <Users className="h-3 w-3 mr-1" />}
                {queue_length}
              </Badge>
            </div>
            <Progress
              value={Math.min(queue_length * 10, 100)}
              max={100}
              className={`h-2 ${queueColor}`}
            />
          </div>

          {currentState.signal_status?.emergency_preemption?.active && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">
                  Emergency Vehicle Priority Active
                </h4>
                <div className="flex items-center text-xs text-red-700 mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>
                    Time to clear intersection:{" "}
                    {
                      currentState.signal_status.emergency_preemption
                        .estimated_duration_sec
                    }
                    s
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrafficMetrics;
