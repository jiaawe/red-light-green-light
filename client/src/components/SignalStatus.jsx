import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrafficCone,
  Clock,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Navigation,
  PersonStanding,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SignalStatus = ({ currentState }) => {
  const { signal_status } = currentState;

  if (!signal_status) return null;

  const directions = [
    "Southbound",
    "Eastbound",
    "Northbound",
    "Westbound",
    "Crosswalk",
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "green":
        return "bg-green-500";
      case "yellow":
        return "bg-yellow-500";
      case "red":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  const getDirectionIcon = (direction) => {
    switch (direction) {
      case "Southbound":
        return <ArrowUp className="h-4 w-4" />;
      case "Eastbound":
        return <ArrowRight className="h-4 w-4" />;
      case "Northbound":
        return <ArrowDown className="h-4 w-4" />;
      case "Westbound":
        return <ArrowLeft className="h-4 w-4" />;
      case "Crosswalk":
        return <PersonStanding className="h-4 w-4" />;
      default:
        return <Navigation className="h-4 w-4" />;
    }
  };

  const getTimeUntilNextChange = () => {
    if (!signal_status.next_timestamp) return null;

    const nextTime = new Date(signal_status.next_timestamp);
    const currentTime = Date.now();
    const diffSeconds = Math.max(
      0,
      Math.floor((nextTime - currentTime) / 1000)
    );

    return diffSeconds < 60
      ? `${diffSeconds}s`
      : `${Math.floor(diffSeconds / 60)}m ${diffSeconds % 60}s`;
  };

  const timeUntilNext = getTimeUntilNextChange();

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center">
            <TrafficCone className="h-4 w-4 mr-2" />
            <span>Traffic Signals</span>
          </div>
          {timeUntilNext && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeUntilNext}
            </Badge>
          )}
        </CardTitle>
        {signal_status.emergency_preemption?.active && (
          <div className="text-xs font-medium text-red-600 mt-1 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1 animate-pulse" />
            <span className="animate-pulse">Emergency Preemption Active</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {directions.map((direction) => {
            const signals = Object.entries(signal_status).filter(([key]) =>
              key.startsWith(direction)
            );

            if (signals.length === 0) return null;

            return (
              <div
                key={direction}
                className="border rounded-md shadow-sm overflow-hidden"
              >
                <div className="bg-slate-50 p-2 border-b flex items-center">
                  {getDirectionIcon(direction)}
                  <h4 className="text-sm font-medium ml-2">{direction}</h4>
                </div>
                <div className="p-2">
                  <div className="flex flex-wrap gap-2">
                    {signals.map(([key, value]) => (
                      <div key={key} className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full ${getStatusColor(
                            value
                          )}`}
                        />
                        <span className="text-xs ml-1 capitalize">
                          {key.replace(`${direction}_`, "")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-700 flex justify-between items-center">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>
              Last: {new Date(signal_status.last_changed).toLocaleTimeString()}
            </span>
          </div>
          {signal_status.next_timestamp && (
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>
                Next:{" "}
                {new Date(signal_status.next_timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SignalStatus;
