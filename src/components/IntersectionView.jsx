import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Navigation,
  Car,
  Truck,
  Bus,
  Bike,
  Tractor,
  Clock,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  LayoutGrid,
  Maximize2,
  Minimize2,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const IntersectionView = ({ currentState, previousState }) => {
  const { vehicles = [], signal_status = {} } = currentState || {};
  const [animatingVehicles, setAnimatingVehicles] = useState([]);
  const animationFrameRef = useRef(null);

  // Update animating vehicles when current state changes
  useEffect(() => {
    if (!currentState || !previousState) {
      setAnimatingVehicles(vehicles);
      return;
    }

    // Track vehicles that were in the previous state but not in the current one
    const prevVehicleIds = new Set(
      previousState.vehicles?.map((v) => v.vehicle_id) || []
    );
    const currentVehicleIds = new Set(vehicles.map((v) => v.vehicle_id));

    // Vehicles that passed through intersection
    const passingVehicles = [...prevVehicleIds]
      .filter((id) => !currentVehicleIds.has(id))
      .map((id) => {
        const vehicle = previousState.vehicles.find((v) => v.vehicle_id === id);
        if (!vehicle) return null;

        // Create a copy with animation destination
        const direction = vehicle.lane_id.split("_")[0];
        const destination = vehicle.destination || vehicle.lane_id;

        return {
          ...vehicle,
          isAnimating: true,
          animationProgress: 0,
          animationDuration: 1000, // 1 second
          animationStartTime: Date.now(),
          exitDirection: destination.split("_")[0] || direction,
        };
      })
      .filter(Boolean);

    // Combine current vehicles with passing ones
    setAnimatingVehicles([...vehicles, ...passingVehicles]);
  }, [currentState, previousState, vehicles]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      const now = Date.now();

      // Update animation progress for each animating vehicle
      const updatedVehicles = animatingVehicles
        .map((vehicle) => {
          if (!vehicle.isAnimating) return vehicle;

          const elapsed = now - vehicle.animationStartTime;
          const progress = Math.min(1, elapsed / vehicle.animationDuration);

          return {
            ...vehicle,
            animationProgress: progress,
            // Remove completed animations
            isAnimating: progress < 1,
          };
        })
        .filter((v) => !v.isAnimating || v.animationProgress < 1);

      setAnimatingVehicles(updatedVehicles);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animatingVehicles]);

  const getVehiclePosition = (vehicle) => {
    const { lane_id, distance_to_intersection_m } = vehicle;
    const [direction, lane] = lane_id.split("_");

    if (distance_to_intersection_m < -350) {
      return null;
    }

    const CENTER_X = 250;
    const CENTER_Y = 250;

    // Road dimensions
    const ROAD_WIDTH = 120;
    const LANE_WIDTH = 20; // Each lane is 20px wide (3 lanes per direction)
    const CROSSWALK_OFFSET = 20; // Distance before crosswalk where vehicles stop

    // Scale factor for distance
    const scale = 0.8;

    // Adjust distance to stop before crosswalk when red light
    let adjustedDistance = distance_to_intersection_m;
    const isRedLight = signal_status[`${direction}_${lane}`] === "red";
    if (isRedLight && distance_to_intersection_m <= CROSSWALK_OFFSET / scale) {
      adjustedDistance = CROSSWALK_OFFSET / scale;
    }

    const distancePixels =
      adjustedDistance > 0
        ? Math.min(adjustedDistance * scale, 220)
        : Math.max(adjustedDistance * scale, -350); // Limit how far past intersection before removal

    let x = CENTER_X;
    let y = CENTER_Y;
    let rotation = 0;

    // Handle normal positioning
    if (!vehicle.isAnimating) {
      switch (direction) {
        case "Northbound":
          rotation = 270;
          y = CENTER_Y + ROAD_WIDTH / 2 + distancePixels;

          if (lane === "Left") {
            x = CENTER_X - LANE_WIDTH * 2.5; // Leftmost lane
          } else if (lane === "Straight") {
            x = CENTER_X - LANE_WIDTH * 1.5; // Middle lane
          } else if (lane === "Right") {
            x = CENTER_X - LANE_WIDTH * 0.5; // Rightmost lane
          }
          break;

        case "Southbound":
          rotation = 90;
          y = CENTER_Y - ROAD_WIDTH / 2 - distancePixels;

          if (lane === "Left") {
            x = CENTER_X + LANE_WIDTH * 2.5; // Leftmost lane
          } else if (lane === "Straight") {
            x = CENTER_X + LANE_WIDTH * 1.5; // Middle lane
          } else if (lane === "Right") {
            x = CENTER_X + LANE_WIDTH * 0.5; // Rightmost lane
          }
          break;

        case "Eastbound":
          rotation = 0;
          x = CENTER_X - ROAD_WIDTH / 2 - distancePixels;

          if (lane === "Left") {
            y = CENTER_Y - LANE_WIDTH * 2.5; // Leftmost lane
          } else if (lane === "Straight") {
            y = CENTER_Y - LANE_WIDTH * 1.5; // Middle lane
          } else if (lane === "Right") {
            y = CENTER_Y - LANE_WIDTH * 0.5; // Rightmost lane
          }
          break;

        case "Westbound":
          rotation = 180;
          x = CENTER_X + ROAD_WIDTH / 2 + distancePixels;

          if (lane === "Left") {
            y = CENTER_Y + LANE_WIDTH * 2.5; // Leftmost lane
          } else if (lane === "Straight") {
            y = CENTER_Y + LANE_WIDTH * 1.5; // Middle lane
          } else if (lane === "Right") {
            y = CENTER_Y + LANE_WIDTH * 0.5; // Rightmost lane
          }
          break;
      }

      return { x, y, rotation };
    }

    // Handle animation for vehicles passing through intersection
    const progress = vehicle.animationProgress;
    const startDirection = lane_id.split("_")[0];
    const endDirection = vehicle.exitDirection;

    // Starting position (at intersection entrance)
    let startX = CENTER_X;
    let startY = CENTER_Y;
    let startRotation = 0;

    switch (startDirection) {
      case "Northbound":
        startRotation = 270;
        startY = CENTER_Y + ROAD_WIDTH / 2;
        if (lane === "Left") {
          startX = CENTER_X - LANE_WIDTH * 2.5;
        } else if (lane === "Straight") {
          startX = CENTER_X - LANE_WIDTH * 1.5;
        } else if (lane === "Right") {
          startX = CENTER_X - LANE_WIDTH * 0.5;
        }
        break;
      case "Southbound":
        startRotation = 90;
        startY = CENTER_Y - ROAD_WIDTH / 2;
        if (lane === "Left") {
          startX = CENTER_X + LANE_WIDTH * 2.5;
        } else if (lane === "Straight") {
          startX = CENTER_X + LANE_WIDTH * 1.5;
        } else if (lane === "Right") {
          startX = CENTER_X + LANE_WIDTH * 0.5;
        }
        break;
      case "Eastbound":
        startRotation = 0;
        startX = CENTER_X - ROAD_WIDTH / 2;
        if (lane === "Left") {
          startY = CENTER_Y - LANE_WIDTH * 2.5;
        } else if (lane === "Straight") {
          startY = CENTER_Y - LANE_WIDTH * 1.5;
        } else if (lane === "Right") {
          startY = CENTER_Y - LANE_WIDTH * 0.5;
        }
        break;
      case "Westbound":
        startRotation = 180;
        startX = CENTER_X + ROAD_WIDTH / 2;
        if (lane === "Left") {
          startY = CENTER_Y + LANE_WIDTH * 2.5;
        } else if (lane === "Straight") {
          startY = CENTER_Y + LANE_WIDTH * 1.5;
        } else if (lane === "Right") {
          startY = CENTER_Y + LANE_WIDTH * 0.5;
        }
        break;
    }

    // Target position (exiting intersection)
    let endX = CENTER_X;
    let endY = CENTER_Y;
    let endRotation = startRotation;

    // Calculate end position based on the destination
    switch (endDirection) {
      case "Northbound":
        endRotation = 270;
        endY = CENTER_Y - ROAD_WIDTH / 2 - 50;
        endX = CENTER_X - LANE_WIDTH * 1.5; // Exit in the straight lane
        break;
      case "Southbound":
        endRotation = 90;
        endY = CENTER_Y + ROAD_WIDTH / 2 + 50;
        endX = CENTER_X + LANE_WIDTH * 1.5; // Exit in the straight lane
        break;
      case "Eastbound":
        endRotation = 0;
        endX = CENTER_X + ROAD_WIDTH / 2 + 50;
        endY = CENTER_Y - LANE_WIDTH * 1.5; // Exit in the straight lane
        break;
      case "Westbound":
        endRotation = 180;
        endX = CENTER_X - ROAD_WIDTH / 2 - 50;
        endY = CENTER_Y + LANE_WIDTH * 1.5; // Exit in the straight lane
        break;
    }

    // For left turns, create a curved path through the intersection
    if (lane === "Left") {
      // Use cubic bezier interpolation for a smooth curve
      const t = progress;
      const cp1x = startX;
      const cp1y = CENTER_Y;
      const cp2x = CENTER_X;
      const cp2y = endY;

      // Cubic Bezier formula
      x =
        Math.pow(1 - t, 3) * startX +
        3 * Math.pow(1 - t, 2) * t * cp1x +
        3 * (1 - t) * Math.pow(t, 2) * cp2x +
        Math.pow(t, 3) * endX;

      y =
        Math.pow(1 - t, 3) * startY +
        3 * Math.pow(1 - t, 2) * t * cp1y +
        3 * (1 - t) * Math.pow(t, 2) * cp2y +
        Math.pow(t, 3) * endY;

      // Gradually rotate
      rotation = startRotation + (endRotation - startRotation) * t;
    }
    // For right turns, create a tighter curve
    else if (lane === "Right") {
      const t = progress;
      // Different control points for right turns
      const cp1x =
        startDirection === "Northbound" || startDirection === "Southbound"
          ? startX
          : CENTER_X;
      const cp1y =
        startDirection === "Eastbound" || startDirection === "Westbound"
          ? startY
          : CENTER_Y;
      const cp2x =
        endDirection === "Northbound" || endDirection === "Southbound"
          ? endX
          : CENTER_X;
      const cp2y =
        endDirection === "Eastbound" || endDirection === "Westbound"
          ? endY
          : CENTER_Y;

      // Cubic Bezier for right turn
      x =
        Math.pow(1 - t, 3) * startX +
        3 * Math.pow(1 - t, 2) * t * cp1x +
        3 * (1 - t) * Math.pow(t, 2) * cp2x +
        Math.pow(t, 3) * endX;

      y =
        Math.pow(1 - t, 3) * startY +
        3 * Math.pow(1 - t, 2) * t * cp1y +
        3 * (1 - t) * Math.pow(t, 2) * cp2y +
        Math.pow(t, 3) * endY;

      // Gradually rotate for right turn
      rotation =
        startRotation + (((endRotation - startRotation + 360) % 360) - 180) * t;
    } else {
      // For straight movement, use linear interpolation
      x = startX + (endX - startX) * progress;
      y = startY + (endY - startY) * progress;
      rotation = startRotation;
    }

    return { x, y, rotation, opacity: 1 - progress * 0.5 };
  };

  const TrafficLight = ({ direction, type, status }) => {
    if (!status) return null;

    return (
      <div
        style={{
          position: "absolute",
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          backgroundColor: "black",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...getTrafficLightPosition(direction, type),
          zIndex: 30,
        }}
      >
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor:
              status === "green"
                ? "#10b981"
                : status === "yellow"
                ? "#f59e0b"
                : "#ef4444",
          }}
        ></div>
      </div>
    );
  };

  const getTrafficLightPosition = (direction, type) => {
    const positions = {
      Northbound: {
        Left: { top: "305px", left: "195px" },
        Straight: { top: "305px", left: "215px" },
        Right: { top: "305px", left: "235px" },
      },
      Southbound: {
        Left: { top: "185px", left: "295px" },
        Straight: { top: "185px", left: "275px" },
        Right: { top: "185px", left: "255px" },
      },
      Eastbound: {
        Left: { top: "195px", left: "185px" },
        Straight: { top: "215px", left: "185px" },
        Right: { top: "235px", left: "185px" },
      },
      Westbound: {
        Left: { top: "295px", left: "305px" },
        Straight: { top: "275px", left: "305px" },
        Right: { top: "255px", left: "305px" },
      },
    };

    return positions[direction][type];
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <LayoutGrid className="h-5 w-5 mr-2" />
            Intersection View
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Car className="h-3 w-3" />
              <span>{vehicles.length} vehicles</span>
            </Badge>
            <div className="text-sm text-gray-500 flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1" />
              {currentState?.timestamp
                ? new Date(currentState.timestamp).toLocaleTimeString()
                : ""}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "500px",
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "0.375rem",
            overflow: "hidden",
          }}
        >
          {/* Background color */}
          <div
            style={{
              position: "absolute",
              inset: "0",
              backgroundColor: "#e5e7eb",
            }}
          ></div>

          {/* Road layout - now wider for 6 lanes */}
          <div
            style={{
              position: "absolute",
              top: "190px",
              left: "0",
              right: "0",
              height: "120px",
              backgroundColor: "#1f2937",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              left: "190px",
              top: "0",
              bottom: "0",
              width: "120px",
              backgroundColor: "#1f2937",
            }}
          ></div>

          {/* Intersection box */}
          <div
            style={{
              position: "absolute",
              top: "190px",
              left: "190px",
              width: "120px",
              height: "120px",
              backgroundColor: "#374151",
            }}
          ></div>

          {/* Center dividers */}
          <div
            style={{
              position: "absolute",
              left: "0",
              top: "250px",
              right: "0",
              height: "2px",
              backgroundColor: "#fbbf24",
              zIndex: 5,
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              left: "250px",
              top: "0",
              bottom: "0",
              width: "2px",
              backgroundColor: "#fbbf24",
              zIndex: 5,
            }}
          ></div>

          {/* Lane dividers - Northbound (bottom half, 3 lanes) */}
          <div
            style={{
              position: "absolute",
              left: "190px",
              top: "310px",
              width: "1px",
              height: "190px",
              backgroundColor: "white",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              left: "210px",
              top: "310px",
              width: "1px",
              height: "190px",
              backgroundColor: "white",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              left: "230px",
              top: "310px",
              width: "1px",
              height: "190px",
              backgroundColor: "white",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              left: "270px",
              top: "310px",
              width: "1px",
              height: "190px",
              backgroundColor: "white",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              left: "290px",
              top: "310px",
              width: "1px",
              height: "190px",
              backgroundColor: "white",
            }}
          ></div>

          {/* Lane dividers - Southbound (top half, 3 lanes) */}
          <div
            style={{
              position: "absolute",
              left: "250px",
              top: "0",
              width: "1px",
              height: "190px",
              backgroundColor: "white",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              left: "270px",
              top: "0",
              width: "1px",
              height: "190px",
              backgroundColor: "white",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              left: "290px",
              top: "0",
              width: "1px",
              height: "190px",
              backgroundColor: "white",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              left: "310px",
              top: "0",
              width: "1px",
              height: "190px",
              backgroundColor: "white",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              left: "250px",
              top: "0",
              width: "1px",
              height: "190px",
              backgroundColor: "white",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              left: "230px",
              top: "0",
              width: "1px",
              height: "190px",
              backgroundColor: "white",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              left: "210px",
              top: "0",
              width: "1px",
              height: "190px",
              backgroundColor: "white",
            }}
          ></div>

          {/* Lane dividers - Eastbound (left half, 3 lanes) */}
          <div
            style={{
              position: "absolute",
              left: "250px",
              top: "0",
              width: "1px",
              height: "190px",
              backgroundColor: "white",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              left: "270px",
              top: "0",
              width: "1px",
              height: "190px",
              backgroundColor: "white",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              left: "290px",
              top: "0",
              width: "1px",
              height: "190px",
              backgroundColor: "white",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              left: "310px",
              top: "0",
              width: "1px",
              height: "190px",
              backgroundColor: "white",
            }}
          ></div>

          {/* Lane dividers - Eastbound (left half, 3 lanes) */}
          <div
            style={{
              position: "absolute",
              left: "0",
              top: "190px",
              width: "190px",
              height: "1px",
              backgroundColor: "white",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              left: "0",
              top: "210px",
              width: "190px",
              height: "1px",
              backgroundColor: "white",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              left: "0",
              top: "230px",
              width: "190px",
              height: "1px",
              backgroundColor: "white",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              left: "0",
              top: "250px",
              width: "190px",
              height: "1px",
              backgroundColor: "white",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              left: "0",
              top: "270px",
              width: "190px",
              height: "1px",
              backgroundColor: "white",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              left: "0",
              top: "290px",
              width: "190px",
              height: "1px",
              backgroundColor: "white",
            }}
          ></div>

          {/* Lane dividers - Westbound (right half, 3 lanes) */}
          <div
            style={{
              position: "absolute",
              left: "310px",
              top: "250px",
              width: "190px",
              height: "1px",
              backgroundColor: "white",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              left: "310px",
              top: "270px",
              width: "190px",
              height: "1px",
              backgroundColor: "white",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              left: "310px",
              top: "290px",
              width: "190px",
              height: "1px",
              backgroundColor: "white",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              left: "310px",
              top: "310px",
              width: "190px",
              height: "1px",
              backgroundColor: "white",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              left: "310px",
              top: "210px",
              width: "190px",
              height: "1px",
              backgroundColor: "white",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              left: "310px",
              top: "230px",
              width: "190px",
              height: "1px",
              backgroundColor: "white",
            }}
          ></div>

          {/* Road labels */}
          <div
            style={{
              position: "absolute",
              top: "165px",
              left: "20px",
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#4b5563",
            }}
          >
            Westbound
          </div>
          <div
            style={{
              position: "absolute",
              top: "165px",
              right: "20px",
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#4b5563",
            }}
          >
            Eastbound
          </div>
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "160px",
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#4b5563",
            }}
          >
            Southbound
          </div>
          <div
            style={{
              position: "absolute",
              bottom: "20px",
              left: "160px",
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#4b5563",
            }}
          >
            Northbound
          </div>

          {/* Crosswalks */}
          <div
            style={{
              position: "absolute",
              top: "180px",
              left: "190px",
              width: "120px",
              height: "10px",
              backgroundColor:
                signal_status.Crosswalk_North_South === "green"
                  ? "rgba(16, 185, 129, 0.2)"
                  : "rgba(239, 68, 68, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
            }}
          >
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: "3px",
                  height: "100%",
                  backgroundColor: "white",
                }}
              ></div>
            ))}
          </div>

          <div
            style={{
              position: "absolute",
              top: "310px",
              left: "190px",
              width: "120px",
              height: "10px",
              backgroundColor:
                signal_status.Crosswalk_North_South === "green"
                  ? "rgba(16, 185, 129, 0.2)"
                  : "rgba(239, 68, 68, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
            }}
          >
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: "3px",
                  height: "100%",
                  backgroundColor: "white",
                }}
              ></div>
            ))}
          </div>

          <div
            style={{
              position: "absolute",
              top: "190px",
              left: "180px",
              width: "10px",
              height: "120px",
              backgroundColor:
                signal_status.Crosswalk_East_West === "green"
                  ? "rgba(16, 185, 129, 0.2)"
                  : "rgba(239, 68, 68, 0.2)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-around",
            }}
          >
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: "100%",
                  height: "3px",
                  backgroundColor: "white",
                }}
              ></div>
            ))}
          </div>

          <div
            style={{
              position: "absolute",
              top: "190px",
              left: "310px",
              width: "10px",
              height: "120px",
              backgroundColor:
                signal_status.Crosswalk_East_West === "green"
                  ? "rgba(16, 185, 129, 0.2)"
                  : "rgba(239, 68, 68, 0.2)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-around",
            }}
          >
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: "100%",
                  height: "3px",
                  backgroundColor: "white",
                }}
              ></div>
            ))}
          </div>

          {/* Traffic Lights */}
          {["Northbound", "Southbound", "Eastbound", "Westbound"].map(
            (direction) =>
              ["Left", "Straight", "Right"].map((type) => (
                <TrafficLight
                  key={`${direction}_${type}`}
                  direction={direction}
                  type={type}
                  status={signal_status[`${direction}_${type}`]}
                />
              ))
          )}

          {/* Vehicles */}
          {animatingVehicles.map((vehicle) => {
            const position = getVehiclePosition(vehicle);
            if (!position) return null;
            return (
              <Vehicle
                key={vehicle.vehicle_id}
                vehicle={vehicle}
                position={position}
              />
            );
          })}

          {/* Direction arrows in lanes */}
          {/* Northbound */}
          <div
            style={{
              position: "absolute",
              top: "350px",
              left: "195px",
              fontSize: "16px",
              color: "white",
            }}
          >
            ↑
          </div>
          <div
            style={{
              position: "absolute",
              top: "350px",
              left: "215px",
              fontSize: "16px",
              color: "white",
            }}
          >
            ↑
          </div>
          <div
            style={{
              position: "absolute",
              top: "350px",
              left: "235px",
              fontSize: "16px",
              color: "white",
            }}
          >
            ↑
          </div>

          {/* Southbound */}
          <div
            style={{
              position: "absolute",
              top: "150px",
              left: "255px",
              fontSize: "16px",
              color: "white",
            }}
          >
            ↓
          </div>
          <div
            style={{
              position: "absolute",
              top: "150px",
              left: "275px",
              fontSize: "16px",
              color: "white",
            }}
          >
            ↓
          </div>
          <div
            style={{
              position: "absolute",
              top: "150px",
              left: "295px",
              fontSize: "16px",
              color: "white",
            }}
          >
            ↓
          </div>

          {/* Eastbound */}
          <div
            style={{
              position: "absolute",
              top: "190px",
              left: "150px",
              fontSize: "16px",
              color: "white",
            }}
          >
            →
          </div>
          <div
            style={{
              position: "absolute",
              top: "210px",
              left: "150px",
              fontSize: "16px",
              color: "white",
            }}
          >
            →
          </div>
          <div
            style={{
              position: "absolute",
              top: "230px",
              left: "150px",
              fontSize: "16px",
              color: "white",
            }}
          >
            →
          </div>

          {/* Westbound */}
          <div
            style={{
              position: "absolute",
              top: "250px",
              left: "350px",
              fontSize: "16px",
              color: "white",
            }}
          >
            ←
          </div>
          <div
            style={{
              position: "absolute",
              top: "270px",
              left: "350px",
              fontSize: "16px",
              color: "white",
            }}
          >
            ←
          </div>
          <div
            style={{
              position: "absolute",
              top: "290px",
              left: "350px",
              fontSize: "16px",
              color: "white",
            }}
          >
            ←
          </div>

          {/* Emergency preemption indicator */}
          {signal_status.emergency_preemption &&
            signal_status.emergency_preemption.active && (
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  backgroundColor: "#fee2e2",
                  color: "#b91c1c",
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: "500",
                  border: "1px solid #fecaca",
                  animation: "pulse 2s infinite",
                }}
              >
                Emergency Preemption:{" "}
                {signal_status.emergency_preemption.approach_direction}
              </div>
            )}

          {/* CSS Animations */}
          <style>
            {`
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
              }
            `}
          </style>
        </div>
      </CardContent>
    </Card>
  );
};

const Vehicle = ({ vehicle, position }) => {
  const { vehicle_id, vehicle_type, emergency_vehicle } = vehicle;
  const { x, y, rotation, opacity = 1 } = position;

  const getVehicleColor = () => {
    switch (vehicle_type.toLowerCase()) {
      case "ambulance":
        return "#ffffff";
      case "police":
        return "#2563eb";
      case "fire_truck":
        return "#dc2626";
      case "suv":
        return "#9ca3af";
      case "sedan":
        return "#60a5fa";
      case "van":
        return "#d97706";
      default:
        return "#4b5563";
    }
  };

  const getVehicleDimensions = () => {
    switch (vehicle_type.toLowerCase()) {
      case "ambulance":
      case "fire_truck":
        return { width: "24px", height: "12px" };
      case "suv":
      case "van":
        return { width: "22px", height: "11px" };
      default:
        return { width: "20px", height: "10px" };
    }
  };

  const dimensions = getVehicleDimensions();

  const vehicleStyle = {
    position: "absolute",
    left: `${x}px`,
    top: `${y}px`,
    width: dimensions.width,
    height: dimensions.height,
    backgroundColor: getVehicleColor(),
    borderRadius: "2px",
    border: "1px solid rgba(31, 41, 55, 0.5)",
    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
    transition: vehicle.isAnimating ? "none" : "all 0.5s ease",
    zIndex: 25,
    opacity: opacity,
  };

  return (
    <div style={vehicleStyle} title={`${vehicle_id} - ${vehicle_type}`}>
      <div
        style={{
          position: "absolute",
          top: "2px",
          left: "60%",
          right: "2px",
          height: "3px",
          backgroundColor: "rgba(219, 234, 254, 0.8)",
          borderRadius: "1px",
        }}
      ></div>

      {emergency_vehicle && (
        <div
          style={{
            position: "absolute",
            top: "-6px",
            left: "0",
            right: "0",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "6px",
              height: "3px",
              backgroundColor: "#ef4444",
              animation: "pulse 0.5s infinite",
            }}
          ></div>
          <div
            style={{
              width: "6px",
              height: "3px",
              backgroundColor: "#3b82f6",
              marginLeft: "2px",
              animation: "pulse 0.5s infinite",
            }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default IntersectionView;
