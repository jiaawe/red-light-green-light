import argparse
from collections import defaultdict, deque

import cv2
import numpy as np
from ultralytics import YOLO

import supervision as sv

SOURCE = np.array([
    (930, 1700),   # Bottom-left corner of the leftmost lane
    (2750, 1700),  # Bottom-right corner of the rightmost lane
    (2600, 50),    # Top-right taper of lane area
    (1550, 50)     # Top-left taper of lane area
])

TARGET_WIDTH = 25
TARGET_HEIGHT = 250

TARGET = np.array(
    [
        [0, 0],
        [TARGET_WIDTH - 1, 0],
        [TARGET_WIDTH - 1, TARGET_HEIGHT - 1],
        [0, TARGET_HEIGHT - 1],
    ]
)

class ViewTransformer:
    # This class is used to transform points from the original frame to a "bird's-eye" view
    def __init__(self, source: np.ndarray, target: np.ndarray) -> None:
        source = source.astype(np.float32)
        target = target.astype(np.float32)
        self.m = cv2.getPerspectiveTransform(source, target)  # Compute transformation matrix

    def transform_points(self, points: np.ndarray) -> np.ndarray:
        # Transform a set of points to the new perspective
        if points.size == 0:
            return points

        reshaped_points = points.reshape(-1, 1, 2).astype(np.float32)
        transformed_points = cv2.perspectiveTransform(reshaped_points, self.m)
        return transformed_points.reshape(-1, 2)

def parse_arguments() -> argparse.Namespace:
    # Setup command-line argument parsing
    parser = argparse.ArgumentParser(
        description="Vehicle Speed Estimation using Ultralytics and Supervision"
    )
    parser.add_argument(
        "--source_video_path",
        required=True,
        help="Path to the source video file",
        type=str,
    )
    parser.add_argument(
        "--target_video_path",
        required=True,
        help="Path to the target video file (output)",
        type=str,
    )
    parser.add_argument(
        "--confidence_threshold",
        default=0.30,
        help="Confidence threshold for the model",
        type=float,
    )
    parser.add_argument(
        "--iou_threshold", default=0.65, help="IOU threshold for the model", type=float
    )

    return parser.parse_args()

if __name__ == "__main__":
    # Main execution starts here
    args = parse_arguments()

    # Retrieve video information for fps/resolution
    video_info = sv.VideoInfo.from_video_path(video_path=args.source_video_path)

    # Load YOLO model using ultralytics
    model = YOLO("yolov8x.pt").to("mps")

    # ByteTrack for tracking objects across frames
    byte_track = sv.ByteTrack(
        frame_rate=video_info.fps, track_activation_threshold=args.confidence_threshold
    )

    # Decide thickness and text scale based on video resolution
    thickness = sv.calculate_optimal_line_thickness(
        resolution_wh=video_info.resolution_wh
    )
    text_scale = sv.calculate_optimal_text_scale(resolution_wh=video_info.resolution_wh)

    # Annotators for drawing boxes, labels, and traces
    box_annotator = sv.BoxAnnotator(thickness=thickness)
    label_annotator = sv.LabelAnnotator(
        text_scale=text_scale,
        text_thickness=thickness,
        text_position=sv.Position.BOTTOM_CENTER,
    )
    trace_annotator = sv.TraceAnnotator(
        thickness=thickness,
        trace_length=video_info.fps * 2,  # Trace length in frames
        position=sv.Position.BOTTOM_CENTER,
    )

    # Generator to read frames from the source video
    frame_generator = sv.get_video_frames_generator(source_path=args.source_video_path)

    # Define the region of interest (polygon) and view transformer
    polygon_zone = sv.PolygonZone(polygon=SOURCE)
    view_transformer = ViewTransformer(source=SOURCE, target=TARGET)

    # Store y-coordinates for each tracked ID to calculate speed
    coordinates = defaultdict(lambda: deque(maxlen=video_info.fps))

    with sv.VideoSink(args.target_video_path, video_info) as sink:
        # Iterate through frames
        for frame_index, frame in enumerate(frame_generator):
            frame_index += 1
            # if frame_index % 2 != 0:
            #     # Skip every other frame for performance
            #     continue

            # Run YOLO and get detections
            result = model(frame)[0]
            detections = sv.Detections.from_ultralytics(result)
            detections = detections[detections.confidence > args.confidence_threshold]

            # Only keep detections within the polygon zone
            detections = detections[polygon_zone.trigger(detections)]
            # Apply non-max suppression
            detections = detections.with_nms(threshold=args.iou_threshold)
            # Update trackers
            detections = byte_track.update_with_detections(detections=detections)

            print(detections)
            # Get the bottom-center anchor points of tracked objects
            points = detections.get_anchors_coordinates(
                anchor=sv.Position.BOTTOM_CENTER
            )
            # Transform those points to top-down view
            points = view_transformer.transform_points(points=points).astype(int)

            # Store y-coordinates to compute speed later
            for tracker_id, [_, y] in zip(detections.tracker_id, points):
                coordinates[tracker_id].append(y)

            # Create labels showing tracker ID and speed if enough data is available
            labels = []
            for tracker_id in detections.tracker_id:
                if len(coordinates[tracker_id]) < video_info.fps / 2:
                    # If not enough points, just show ID
                    labels.append(f"#{tracker_id}")
                else:
                    coordinate_start = coordinates[tracker_id][-1]
                    coordinate_end = coordinates[tracker_id][0]
                    distance = abs(coordinate_start - coordinate_end)
                    time = len(coordinates[tracker_id]) / video_info.fps
                    speed = distance / time * 3.6  # Convert from m/s to km/h approx
                    labels.append(f"#{tracker_id} {int(speed)} km/h")

            # Create copy of the frame for annotation
            annotated_frame = frame.copy()
            annotated_frame = trace_annotator.annotate(
                scene=annotated_frame, detections=detections
            )
            annotated_frame = box_annotator.annotate(
                scene=annotated_frame, detections=detections
            )
            annotated_frame = label_annotator.annotate(
                scene=annotated_frame, detections=detections, labels=labels
            )

            # Draw the polygon zone on the frame
            sv.draw_polygon(
                annotated_frame,
                polygon=SOURCE,
                color=sv.Color.RED
            )

            # Write annotated frame to output video
            sink.write_frame(annotated_frame)

            # Display the frame in a window
            cv2.imshow("frame", annotated_frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

        # Cleanup OpenCV windows after loop
        cv2.destroyAllWindows()