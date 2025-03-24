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

const VehicleList = ({ currentState }) => {
  const { vehicles } = currentState || {};

  if (!vehicles || vehicles.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-base">Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            No vehicles in the intersection
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Vehicles</span>
          <Badge variant="secondary">{vehicles.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[240px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Lane</TableHead>
                <TableHead>Speed</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.vehicle_id}>
                  <TableCell className="font-medium">
                    {vehicle.vehicle_id}
                  </TableCell>
                  <TableCell className="capitalize">
                    {vehicle.emergency_vehicle ? (
                      <Badge variant="destructive" className="capitalize">
                        {vehicle.vehicle_type}
                      </Badge>
                    ) : (
                      vehicle.vehicle_type
                    )}
                  </TableCell>
                  <TableCell>{vehicle.lane_id}</TableCell>
                  <TableCell>{vehicle.speed_kmh} km/h</TableCell>
                  <TableCell>
                    {vehicle.distance_to_intersection_m.toFixed(1)}m
                  </TableCell>
                  <TableCell>
                    {vehicle.distance_to_intersection_m < 0 ? (
                      <Badge variant="success">Crossing</Badge>
                    ) : (
                      <Badge variant="outline">Approaching</Badge>
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
