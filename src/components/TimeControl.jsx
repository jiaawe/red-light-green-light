import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, SkipBack } from "lucide-react";

const TimeControl = ({
  states,
  currentTimestamp,
  onTimestampChange,
  playing,
  onPlayToggle,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const index = states.findIndex(
      (state) => state.timestamp === currentTimestamp
    );
    setCurrentIndex(index >= 0 ? index : 0);
  }, [currentTimestamp, states]);

  useEffect(() => {
    let intervalId;
    if (playing) {
      intervalId = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          if (nextIndex < states.length) {
            onTimestampChange(states[nextIndex].timestamp);
            return nextIndex;
          } else {
            onPlayToggle();
            return prevIndex;
          }
        });
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [playing, states, onTimestampChange, onPlayToggle]);

  const handleSliderChange = (value) => {
    const index = value[0];
    if (index >= 0 && index < states.length) {
      setCurrentIndex(index);
      onTimestampChange(states[index].timestamp);
    }
  };

  const handlePrevClick = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prevIndex) => prevIndex - 1);
      onTimestampChange(states[currentIndex - 1].timestamp);
    }
  };

  const handleNextClick = () => {
    if (currentIndex < states.length - 1) {
      setCurrentIndex((prevIndex) => prevIndex + 1);
      onTimestampChange(states[currentIndex + 1].timestamp);
    }
  };

  if (!states || states.length === 0) return null;

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-base">Simulation Control</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevClick}
              disabled={currentIndex <= 0}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              variant={playing ? "default" : "outline"}
              size="sm"
              onClick={onPlayToggle}
            >
              {playing ? (
                <Pause className="h-4 w-4 mr-1" />
              ) : (
                <Play className="h-4 w-4 mr-1" />
              )}
              {playing ? "Pause" : "Play"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextClick}
              disabled={currentIndex >= states.length - 1}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <Slider
              value={[currentIndex]}
              max={states.length - 1}
              min={0}
              step={1}
              onValueChange={handleSliderChange}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>
                {states[0]?.timestamp
                  ? new Date(states[0].timestamp).toLocaleTimeString()
                  : ""}
              </span>
              <span>
                {states[states.length - 1]?.timestamp
                  ? new Date(
                      states[states.length - 1].timestamp
                    ).toLocaleTimeString()
                  : ""}
              </span>
            </div>
          </div>

          <div className="pt-1 text-center">
            <div className="text-sm font-medium">
              {currentTimestamp
                ? new Date(currentTimestamp).toLocaleTimeString()
                : ""}
            </div>
            <div className="text-xs text-gray-500">
              Step {currentIndex + 1} of {states.length}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeControl;
