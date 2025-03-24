import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Cloud,
  Clock,
  AlertTriangle,
  Calendar,
  Users,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ContextInfo = ({ context }) => {
  if (!context) return null;

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-base flex items-center">
          <MapPin className="h-4 w-4 mr-2" />
          Context Information
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Weather</span>
            </div>
            <Badge variant="outline" className="capitalize">
              {context.weather}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-sm">Peak Period</span>
            </div>
            <Badge variant={context.peak_period ? "default" : "outline"}>
              {context.peak_period ? "Yes" : "No"}
            </Badge>
          </div>

          {context.incident_reported && (
            <div className="flex items-center justify-between bg-red-50 p-2 rounded">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-600">
                  Incident Reported
                </span>
              </div>
              <Badge variant="destructive">Alert</Badge>
            </div>
          )}

          {context.special_events && context.special_events.length > 0 && (
            <div className="mt-4 bg-amber-50 p-3 rounded">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                  Special Events
                </span>
              </div>
              <div className="space-y-3">
                {context.special_events.map((event, index) => (
                  <div
                    key={index}
                    className="bg-white p-2 rounded shadow-sm text-xs"
                  >
                    <div className="font-medium text-amber-800 mb-1">
                      {event.event_name}
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-gray-700">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-gray-500" />
                        {new Date(event.start_time).toLocaleTimeString()}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1 text-gray-500" />
                        {event.expected_attendance.toLocaleString()}
                      </div>
                      <div className="flex items-center col-span-2">
                        <TrendingUp className="h-3 w-3 mr-1 text-gray-500" />
                        <span className="capitalize">
                          Impact: {event.impact_level}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ContextInfo;
