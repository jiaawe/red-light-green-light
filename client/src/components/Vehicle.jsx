const Vehicle = ({ vehicle, position }) => {
  const { vehicle_id, vehicle_type, emergency_vehicle } = vehicle;
  const { x, y, rotation, zIndex } = position;

  // Vehicle color based on type
  const getVehicleColor = () => {
    switch (vehicle_type.toLowerCase()) {
      case "ambulance":
        return "bg-white";
      case "police":
        return "bg-blue-600";
      case "fire_truck":
        return "bg-red-600";
      case "suv":
        return "bg-gray-400";
      case "sedan":
        return "bg-blue-400";
      case "van":
        return "bg-yellow-600";
      default:
        return "bg-gray-600";
    }
  };

  // Get vehicle dimensions based on type
  const getVehicleDimensions = () => {
    switch (vehicle_type.toLowerCase()) {
      case "ambulance":
      case "fire_truck":
        return "w-[24px] h-[12px]";
      case "suv":
      case "van":
        return "w-[22px] h-[11px]";
      default:
        return "w-[20px] h-[10px]";
    }
  };

  const vehicleStyle = {
    transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
    transition: "transform 0.5s ease",
    zIndex: zIndex || 10,
  };

  return (
    <div
      className={`absolute ${getVehicleDimensions()} rounded-md ${getVehicleColor()} border border-gray-800/30 shadow-sm`}
      style={vehicleStyle}
      title={`${vehicle_id} - ${vehicle_type}`}
    >
      {/* Vehicle windshield */}
      <div className="absolute top-[2px] left-[12px] right-[2px] h-[3px] bg-blue-100 opacity-80 rounded-sm"></div>

      {/* Emergency vehicle lights */}
      {emergency_vehicle && (
        <div className="absolute -top-2 left-0 right-0 flex justify-center">
          <div className="w-[6px] h-[3px] bg-red-500 animate-pulse"></div>
          <div className="w-[6px] h-[3px] bg-blue-500 animate-pulse ml-[1px]"></div>
        </div>
      )}
    </div>
  );
};

export default Vehicle;
