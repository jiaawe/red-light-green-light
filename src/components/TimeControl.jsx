import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Timer,
  Clock,
  BrainCircuit,
  FastForward,
  RotateCcw,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TimeControl = ({
  states,
  currentTimestamp,
  onTimestampChange,
  playing,
  onPlayToggle,
  currentState,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

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
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(intervalId);
  }, [playing, states, onTimestampChange, onPlayToggle, playbackSpeed]);

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

  const handleSpeedChange = () => {
    // Cycle between 1x, 2x, 3x speeds
    setPlaybackSpeed((prev) => (prev >= 3 ? 1 : prev + 1));
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    onTimestampChange(states[0].timestamp);
  };

  if (!states || states.length === 0) return null;

  // Calculate progress percentage
  const progress = ((currentIndex + 1) / states.length) * 100;

  // Format the current timestamp to show date and time
  const formattedTimestamp = currentTimestamp
    ? new Date(currentTimestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "";

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center">
            <Timer className="h-4 w-4 mr-2" />
            <span>Simulation Control</span>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {progress.toFixed(0)}% complete
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-md">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="h-4 w-4 mr-2 text-slate-500" />
              <span className="text-sm font-medium">{formattedTimestamp}</span>
            </div>

            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestart}
                title="Restart simulation"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevClick}
                disabled={currentIndex <= 0}
                title="Previous step"
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                variant={playing ? "default" : "outline"}
                size="sm"
                onClick={onPlayToggle}
                className={
                  playing ? "bg-blue-600 hover:bg-blue-700 text-white" : ""
                }
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
                title="Next step"
              >
                <SkipForward className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSpeedChange}
                title="Change playback speed"
              >
                <FastForward className="h-4 w-4 mr-1" />
                {playbackSpeed}x
              </Button>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                <span>
                  Step {currentIndex + 1} of {states.length}
                </span>
              </div>
              <span>{Math.round(progress)}%</span>
            </div>

            <Slider
              value={[currentIndex]}
              max={states.length - 1}
              min={0}
              step={1}
              onValueChange={handleSliderChange}
              className="mt-2"
            />

            <div className="flex justify-between text-xs text-gray-500 mt-2">
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

          {(currentState?.reasoning || states[currentIndex]?.reasoning) && (
            <div className="mt-2 text-xs bg-blue-50 p-3 rounded border border-blue-100">
              <div className="flex items-start">
                <BrainCircuit className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                <div>
                  <span className="font-medium text-blue-700">Reasoning: </span>
                  <span className="text-gray-700">
                    {currentState?.reasoning || states[currentIndex]?.reasoning}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeControl;
