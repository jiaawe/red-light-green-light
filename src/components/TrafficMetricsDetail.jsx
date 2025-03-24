import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TrafficMetricsDetail = ({ metrics }) => {
  if (!metrics) return null;

  const { congestion_level, historical_comparison } = metrics;

  // Determine the trend color and icon
  const trendIsUp = historical_comparison?.percent_difference > 0;
  const trendColor = trendIsUp ? "text-red-600" : "text-green-600";
  const TrendIcon = trendIsUp ? TrendingUp : TrendingDown;

  // Helper function to get congestion level icon and color
  const getCongestionInfo = (level) => {
    switch (level) {
      case "high":
        return {
          icon: AlertTriangle,
          color: "text-red-600",
          bgColor: "bg-red-50",
        };
      case "moderate":
        return {
          icon: AlertCircle,
          color: "text-amber-600",
          bgColor: "bg-amber-50",
        };
      default:
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-50",
        };
    }
  };

  const currentCongestion = getCongestionInfo(congestion_level);
  const typicalCongestion = getCongestionInfo(
    historical_comparison?.typical_congestion_level
  );

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-base flex items-center">
          <Activity className="h-4 w-4 mr-2" />
          Traffic Status
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {/* Current Congestion */}
          <div
            className={`flex items-center justify-between p-3 rounded ${currentCongestion.bgColor}`}
          >
            <div className="flex items-center">
              <BarChart2 className="h-4 w-4 text-gray-700 mr-2" />
              <span className="text-sm font-medium">Current Congestion</span>
            </div>
            <Badge
              variant="outline"
              className={`capitalize ${currentCongestion.color}`}
            >
              <currentCongestion.icon className="h-3 w-3 mr-1" />
              {congestion_level}
            </Badge>
          </div>

          {/* Historical Comparison */}
          {historical_comparison && (
            <div className="bg-gray-50 p-3 rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Historical Comparison
                </span>
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(
                    historical_comparison.timestamp
                  ).toLocaleTimeString()}
                </Badge>
              </div>

              <div className="space-y-2">
                {/* Typical Level */}
                <div className="flex items-center justify-between">
                  <span className="text-xs">Typical level</span>
                  <Badge
                    variant="outline"
                    className={`capitalize ${typicalCongestion.color}`}
                  >
                    <typicalCongestion.icon className="h-3 w-3 mr-1" />
                    {historical_comparison.typical_congestion_level}
                  </Badge>
                </div>

                {/* Percent Difference */}
                <div className="flex items-center justify-between">
                  <span className="text-xs">Difference from typical</span>
                  <div className={`flex items-center ${trendColor}`}>
                    <TrendIcon className="h-4 w-4 mr-1" />
                    <span className="text-xs font-medium">
                      {Math.abs(historical_comparison.percent_difference)}%
                      {trendIsUp ? " higher" : " lower"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Traffic Insight */}
          <div className="text-xs text-gray-600 border-t pt-3">
            <div className="flex items-start">
              <AlertCircle className="h-3 w-3 mr-1 mt-0.5" />
              <span>
                {congestion_level === "high"
                  ? "High congestion may cause significant delays. Consider alternative routes."
                  : congestion_level === "moderate"
                  ? "Moderate congestion present. Expect some delays in traffic flow."
                  : "Traffic is flowing smoothly with minimal congestion."}
                {trendIsUp
                  ? " Traffic is heavier than usual for this time."
                  : " Traffic is lighter than usual for this time."}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrafficMetricsDetail;
