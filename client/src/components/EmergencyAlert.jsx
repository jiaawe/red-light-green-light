import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

const EmergencyAlert = ({ currentState }) => {
  if (
    !currentState ||
    !currentState.signal_status ||
    !currentState.signal_status.emergency_preemption ||
    !currentState.signal_status.emergency_preemption.active
  ) {
    return null;
  }

  const {
    triggered_by,
    preemption_started,
    estimated_duration_sec,
    approach_direction,
  } = currentState.signal_status.emergency_preemption;

  // Calculate remaining time
  const startTime = new Date(preemption_started).getTime();
  const currentTime = new Date().getTime();
  const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
  const remainingSeconds = Math.max(0, estimated_duration_sec - elapsedSeconds);

  return (
    <Card className="border-red-300 bg-red-50 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-red-800 flex items-center text-base">
          <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
          Emergency Vehicle Approaching
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-red-700">Vehicle ID:</span>
            <span className="text-sm font-medium">{triggered_by}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-red-700">Direction:</span>
            <span className="text-sm font-medium">{approach_direction}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-red-700">ETA:</span>
            <span className="text-sm font-medium">
              {remainingSeconds} seconds
            </span>
          </div>
          <div className="mt-3 text-xs text-red-700">
            All conflicting traffic signals have been preempted
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmergencyAlert;
