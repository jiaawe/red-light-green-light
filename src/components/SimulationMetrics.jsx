import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SimulationMetrics = ({ metrics }) => {
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-base">Simulation Metrics</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {/* Throughput section */}
          <div>
            <h3 className="font-medium mb-2">Throughput (per hour)</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 p-2 rounded text-center">
                <div className="text-lg font-bold">
                  {metrics.throughput_per_hour.vehicles}
                </div>
                <div className="text-xs text-gray-500">Vehicles</div>
              </div>
              <div className="bg-gray-50 p-2 rounded text-center">
                <div className="text-lg font-bold">
                  {metrics.throughput_per_hour.pedestrians}
                </div>
                <div className="text-xs text-gray-500">Pedestrians</div>
              </div>
              <div className="bg-gray-50 p-2 rounded text-center">
                <div className="text-lg font-bold">
                  {metrics.throughput_per_hour.total}
                </div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
            </div>
          </div>

          {/* Delay and queue metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-1">Average Delay</div>
              <div className="text-lg font-bold">
                {metrics.average_delay_per_vehicle.toFixed(1)}{" "}
                <span className="text-xs text-gray-500">sec/vehicle</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Total Stops</div>
              <div className="text-lg font-bold">{metrics.total_stops}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-1">Max Queue</div>
              <div className="text-lg font-bold">
                {metrics.max_queue_length}{" "}
                <span className="text-xs text-gray-500">vehicles</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Avg Queue</div>
              <div className="text-lg font-bold">
                {metrics.average_queue_length.toFixed(1)}{" "}
                <span className="text-xs text-gray-500">vehicles</span>
              </div>
            </div>
          </div>

          {/* Emissions data */}
          <div>
            <h3 className="font-medium mb-2">Carbon Emissions</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">CO₂</span>
                <span className="font-medium">
                  {metrics.carbon_emissions.CO2_kg.toFixed(2)} kg
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">NOₓ</span>
                <span className="font-medium">
                  {metrics.carbon_emissions.NOx_g.toFixed(2)} g
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Particulates</span>
                <span className="font-medium">
                  {metrics.carbon_emissions.particulates_g.toFixed(3)} g
                </span>
              </div>
            </div>
          </div>

          {/* Energy efficiency */}
          <div>
            <div className="text-sm font-medium mb-1">Energy Efficiency</div>
            <div className="text-lg font-bold">
              {(metrics.energy_efficiency * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimulationMetrics;
