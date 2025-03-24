import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SignalStatus = ({ currentState }) => {
  const { signal_status } = currentState;

  if (!signal_status) return null;

  // Group signals by direction
  const directions = [
    "Northbound",
    "Eastbound",
    "Southbound",
    "Westbound",
    "Crosswalk",
  ];

  // Function to get signal status color
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

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-base">Signal Status</CardTitle>
        {signal_status.emergency_preemption &&
          signal_status.emergency_preemption.active && (
            <div className="text-xs font-medium text-red-600 animate-pulse">
              Emergency Preemption Active
            </div>
          )}
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 gap-4">
          {directions.map((direction) => (
            <div
              key={direction}
              className="border rounded-md p-2 hover:bg-gray-50 transition-colors"
            >
              <h4 className="text-sm font-medium mb-2">{direction}</h4>
              <div className="flex flex-col space-y-2">
                {Object.entries(signal_status)
                  .filter(([key]) => key.startsWith(direction))
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between"
                    >
                      <span className="text-xs">
                        {key.replace(`${direction}_`, "")}
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full ${getStatusColor(
                          value
                        )}`}
                      ></div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p>
            Last changed:{" "}
            {new Date(signal_status.last_changed).toLocaleTimeString()}
          </p>
          {signal_status.next_timestamp && (
            <p>
              Next change:{" "}
              {new Date(signal_status.next_timestamp).toLocaleTimeString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SignalStatus;
