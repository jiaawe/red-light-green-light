import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  Car,
  PersonStanding,
  Clock,
  PauseCircle,
  Users,
  Gauge,
  Battery,
  Leaf,
  Atom,
  AlertTriangle,
  BarChart,
} from "lucide-react";

const SimulationMetrics = ({ metrics }) => {
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-base flex items-center">
          <Activity className="h-4 w-4 mr-2" />
          <span>Simulation Results</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-5">
          {/* Throughput section */}
          <div className="bg-blue-50 p-3 rounded-md">
            <h3 className="text-sm font-medium mb-2 text-blue-700 flex items-center">
              <BarChart className="h-4 w-4 mr-1.5 text-blue-600" />
              Hourly Throughput
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-2 rounded-md text-center shadow-sm border border-blue-100">
                <div className="flex items-center justify-center mb-1">
                  <Car className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-lg font-bold text-blue-800">
                  {metrics.throughput_per_hour.vehicles}
                </div>
                <div className="text-xs text-gray-500">Vehicles</div>
              </div>
              <div className="bg-white p-2 rounded-md text-center shadow-sm border border-blue-100">
                <div className="flex items-center justify-center mb-1">
                  <PersonStanding className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-lg font-bold text-blue-800">
                  {metrics.throughput_per_hour.pedestrians}
                </div>
                <div className="text-xs text-gray-500">Pedestrians</div>
              </div>
              <div className="bg-white p-2 rounded-md text-center shadow-sm border border-blue-100">
                <div className="flex items-center justify-center mb-1">
                  <Gauge className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-lg font-bold text-blue-800">
                  {metrics.throughput_per_hour.total}
                </div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
            </div>
          </div>

          {/* Delay and queue metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-amber-50 p-2 rounded-md border border-amber-100">
              <div className="flex items-center mb-1">
                <Clock className="h-4 w-4 text-amber-600 mr-1.5" />
                <div className="text-sm font-medium text-amber-700">
                  Average Delay
                </div>
              </div>
              <div className="text-lg font-bold text-amber-800">
                {metrics.average_delay_per_vehicle.toFixed(1)}{" "}
                <span className="text-xs text-amber-600">sec/vehicle</span>
              </div>
            </div>
            <div className="bg-amber-50 p-2 rounded-md border border-amber-100">
              <div className="flex items-center mb-1">
                <PauseCircle className="h-4 w-4 text-amber-600 mr-1.5" />
                <div className="text-sm font-medium text-amber-700">
                  Total Stops
                </div>
              </div>
              <div className="text-lg font-bold text-amber-800">
                {metrics.total_stops}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-purple-50 p-2 rounded-md border border-purple-100">
              <div className="flex items-center mb-1">
                <Users className="h-4 w-4 text-purple-600 mr-1.5" />
                <div className="text-sm font-medium text-purple-700">
                  Max Queue
                </div>
              </div>
              <div className="text-lg font-bold text-purple-800">
                {metrics.max_queue_length}{" "}
                <span className="text-xs text-purple-600">vehicles</span>
              </div>
            </div>
            <div className="bg-purple-50 p-2 rounded-md border border-purple-100">
              <div className="flex items-center mb-1">
                <Users className="h-4 w-4 text-purple-600 mr-1.5" />
                <div className="text-sm font-medium text-purple-700">
                  Avg Queue
                </div>
              </div>
              <div className="text-lg font-bold text-purple-800">
                {metrics.average_queue_length.toFixed(1)}{" "}
                <span className="text-xs text-purple-600">vehicles</span>
              </div>
            </div>
          </div>

          {/* Emissions data */}
          <div className="bg-green-50 p-3 rounded-md">
            <h3 className="text-sm font-medium mb-2 text-green-700 flex items-center">
              <Leaf className="h-4 w-4 mr-1.5 text-green-600" />
              Carbon Emissions
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-white p-1.5 px-3 rounded border border-green-100">
                <span className="text-sm flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1.5 text-red-500" />
                  CO₂
                </span>
                <span className="font-medium">
                  {metrics.carbon_emissions.CO2_kg.toFixed(2)} kg
                </span>
              </div>
              <div className="flex justify-between items-center bg-white p-1.5 px-3 rounded border border-green-100">
                <span className="text-sm flex items-center">
                  <Atom className="h-3 w-3 mr-1.5 text-amber-500" />
                  NOₓ
                </span>
                <span className="font-medium">
                  {metrics.carbon_emissions.NOx_g.toFixed(2)} g
                </span>
              </div>
              <div className="flex justify-between items-center bg-white p-1.5 px-3 rounded border border-green-100">
                <span className="text-sm flex items-center">
                  <Atom className="h-3 w-3 mr-1.5 text-gray-500" />
                  Particulates
                </span>
                <span className="font-medium">
                  {metrics.carbon_emissions.particulates_g.toFixed(3)} g
                </span>
              </div>
            </div>
          </div>

          {/* Energy efficiency */}
          {/* <div className="bg-blue-50 p-3 rounded-md flex items-center justify-between">
            <div className="flex items-center">
              <Battery className="h-5 w-5 text-blue-600 mr-2" />
              <div className="text-sm font-medium text-blue-700">
                Energy Efficiency
              </div>
            </div>
            <div className="text-lg font-bold text-blue-800">
              {(metrics.energy_efficiency * 100).toFixed(1)}%
            </div>
          </div> */}
        </div>
      </CardContent>
    </Card>
  );
};

export default SimulationMetrics;
