import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  History,
  Clock,
  Sun,
  Sunrise,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const HistoricalPatterns = ({ patterns }) => {
  if (!patterns) return null;

  // Map seasonal factors to appropriate icons
  const getFactorIcon = (factor) => {
    switch (factor.toLowerCase()) {
      case "weekday":
        return <Clock className="h-3 w-3 mr-1" />;
      case "weekend":
        return <Calendar className="h-3 w-3 mr-1" />;
      case "rush_hour":
        return <Sunrise className="h-3 w-3 mr-1" />;
      case "holiday":
        return <Sun className="h-3 w-3 mr-1" />;
      default:
        return <Users className="h-3 w-3 mr-1" />;
    }
  };

  // Determine trend color and style
  const isIncreasing = patterns.predicted_volume_trend === "increasing";
  const trendColor = isIncreasing ? "text-red-500" : "text-green-500";
  const trendBgColor = isIncreasing ? "bg-red-50" : "bg-green-50";
  const TrendIcon = isIncreasing ? TrendingUp : TrendingDown;

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-base flex items-center">
          <History className="h-4 w-4 mr-2" />
          Historical Patterns
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {/* Volume Trend Section */}
          <div
            className={`flex items-center justify-between p-2 rounded ${trendBgColor}`}
          >
            <div className="flex items-center">
              <BarChart3 className="h-4 w-4 text-gray-700 mr-2" />
              <span className="text-sm">Traffic Volume Trend</span>
            </div>
            <div className="flex items-center">
              <TrendIcon className={`h-4 w-4 ${trendColor} mr-1`} />
              <Badge
                variant={isIncreasing ? "destructive" : "success"}
                className="capitalize"
              >
                {patterns.predicted_volume_trend}
              </Badge>
            </div>
          </div>

          {/* Seasonal Factors Section */}
          {patterns.seasonal_factors &&
            patterns.seasonal_factors.length > 0 && (
              <div className="bg-blue-50 p-2 rounded">
                <div className="flex items-center mb-2">
                  <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800">
                    Seasonal Factors
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {patterns.seasonal_factors.map((factor, index) => (
                    <div
                      key={index}
                      className="flex items-center px-3 py-1 bg-white border border-blue-200 rounded-full text-xs shadow-sm"
                    >
                      {getFactorIcon(factor)}
                      <span className="capitalize">
                        {factor.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Historical Pattern Insight */}
          <div className="text-xs text-gray-600 border-t pt-3">
            <div className="flex items-start">
              <History className="h-3 w-3 mr-1 mt-0.5" />
              <span>
                {isIncreasing
                  ? "Traffic volume is higher than typical for this time period."
                  : "Traffic volume is lower than typical for this time period."}
                {patterns.seasonal_factors &&
                  patterns.seasonal_factors.includes("rush_hour") &&
                  " Rush hour conditions are in effect."}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HistoricalPatterns;
