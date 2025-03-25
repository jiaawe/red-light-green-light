import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  AlertTriangle,
  Truck,
  Bus,
  Bike,
  ArrowRight,
  Milestone,
  Gauge,
  Filter,
} from "lucide-react";

const VehicleList = ({ currentState }) => {
  const { vehicles } = currentState || {};

  if (!vehicles || vehicles.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-base flex items-center">
            <Car className="h-4 w-4 mr-2" />
            <span>Vehicles</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            No vehicles in the intersection
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort vehicles: "Approaching" first (distance >= 0), then "Crossing" (distance < 0)
  const sortedVehicles = [...vehicles].sort((a, b) => {
    // If 'a' is approaching and 'b' is crossing, 'a' comes first
    if (a.distance_to_intersection_m >= 0 && b.distance_to_intersection_m < 0) {
      return -1;
    }
    // If 'a' is crossing and 'b' is approaching, 'b' comes first
    if (a.distance_to_intersection_m < 0 && b.distance_to_intersection_m >= 0) {
      return 1;
    }
    // If both are approaching, sort by distance (smaller distance first)
    if (
      a.distance_to_intersection_m >= 0 &&
      b.distance_to_intersection_m >= 0
    ) {
      return a.distance_to_intersection_m - b.distance_to_intersection_m;
    }
    // If both are crossing, no specific order needed
    return 0;
  });

  // Count approaching and crossing vehicles
  const approachingCount = sortedVehicles.filter(
    (v) => v.distance_to_intersection_m >= 0
  ).length;
  const crossingCount = sortedVehicles.filter(
    (v) => v.distance_to_intersection_m < 0
  ).length;

  // Helper function to get vehicle icon based on type
  const getVehicleIcon = (type, emergency) => {
    if (emergency) return <AlertTriangle className="h-4 w-4 text-red-500" />;

    switch (type.toLowerCase()) {
      case "truck":
        return <Truck className="h-4 w-4 text-gray-600" />;
      case "bus":
        return <Bus className="h-4 w-4 text-gray-600" />;
      case "motorcycle":
        return <Bike className="h-4 w-4 text-gray-600" />;
      default:
        return <Car className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center">
            <Car className="h-4 w-4 mr-2" />
            <span>Vehicles</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Filter className="h-3 w-3" />
              <span>{approachingCount} approaching</span>
            </Badge>
            <Badge variant="success" className="flex items-center gap-1">
              <ArrowRight className="h-3 w-3" />
              <span>{crossingCount} crossing</span>
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[240px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead className="w-[60px]">ID</TableHead>
                <TableHead className="w-[100px]">
                  <span className="flex items-center gap-1">
                    <Car className="h-3 w-3" /> Type
                  </span>
                </TableHead>
                <TableHead>
                  <span className="flex items-center gap-1">
                    <Filter className="h-3 w-3" /> Lane
                  </span>
                </TableHead>
                <TableHead>
                  <span className="flex items-center gap-1">
                    <Gauge className="h-3 w-3" /> Speed
                  </span>
                </TableHead>
                <TableHead>
                  <span className="flex items-center gap-1">
                    <Milestone className="h-3 w-3" /> Distance
                  </span>
                </TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedVehicles.map((vehicle) => (
                <TableRow
                  key={vehicle.vehicle_id}
                  className={vehicle.emergency_vehicle ? "bg-red-50" : ""}
                >
                  <TableCell className="font-medium">
                    {vehicle.vehicle_id}
                  </TableCell>
                  <TableCell className="capitalize flex items-center gap-1">
                    {getVehicleIcon(
                      vehicle.vehicle_type,
                      vehicle.emergency_vehicle
                    )}
                    {vehicle.emergency_vehicle ? (
                      <Badge variant="destructive" className="capitalize">
                        {vehicle.vehicle_type}
                      </Badge>
                    ) : (
                      vehicle.vehicle_type
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{vehicle.lane_id}</TableCell>
                  <TableCell>
                    <span
                      className={
                        vehicle.speed_kmh > 40
                          ? "text-amber-600 font-medium"
                          : ""
                      }
                    >
                      {vehicle.speed_kmh} km/h
                    </span>
                  </TableCell>
                  <TableCell>
                    {vehicle.distance_to_intersection_m >= 0
                      ? `${vehicle.distance_to_intersection_m.toFixed(1)}m`
                      : ""}
                  </TableCell>
                  <TableCell>
                    {vehicle.distance_to_intersection_m < 0 ? (
                      <Badge
                        variant="success"
                        className="flex items-center gap-1"
                      >
                        <ArrowRight className="h-3 w-3" />
                        Crossing
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Milestone className="h-3 w-3" />
                        Approaching
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleList;
