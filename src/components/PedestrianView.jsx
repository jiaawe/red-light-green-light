import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PedestrianView = ({ currentState }) => {
  if (!currentState || !currentState.pedestrians) return null;

  const { pedestrians, signal_status } = currentState;

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Pedestrians</span>
          <Badge variant="outline">
            {pedestrians.crosswalk_north_south +
              pedestrians.crosswalk_east_west}{" "}
            total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">North-South Crosswalk</span>
              <div className="flex items-center mt-1">
                <div
                  className={`w-3 h-3 rounded-full mr-2 ${
                    signal_status?.Crosswalk_North_South === "green"
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                ></div>
                <span className="text-xs capitalize">
                  {signal_status?.Crosswalk_North_South || "unknown"}
                </span>
              </div>
            </div>
            <Badge>{pedestrians.crosswalk_north_south}</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">East-West Crosswalk</span>
              <div className="flex items-center mt-1">
                <div
                  className={`w-3 h-3 rounded-full mr-2 ${
                    signal_status?.Crosswalk_East_West === "green"
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                ></div>
                <span className="text-xs capitalize">
                  {signal_status?.Crosswalk_East_West || "unknown"}
                </span>
              </div>
            </div>
            <Badge>{pedestrians.crosswalk_east_west}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PedestrianView;
