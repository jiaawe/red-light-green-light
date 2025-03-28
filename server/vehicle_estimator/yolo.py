import argparse
import cv2
import numpy as np
import supervision as sv
from collections import defaultdict, deque
from ultralytics import YOLO
from view_transformer import ViewTransformer

YOLO_PATH = "yolov8x.pt"
DEVICE = "mps" # Change to cuda if needed

# Sample Video Lanes
# The overall area of interest is defined by the polygon with the following vertices:
SOURCE = np.array([
    (930, 1700),   # Bottom-left corner of the leftmost lane
    (2750, 1700),  # Bottom-right corner of the rightmost lane
    (2600, 50),    # Top-right taper of lane area
    (1550, 50)     # Top-left taper of lane area
])

# Lane-specific polygons and bounding box colour choice
LANES = {
    "Northbound_Right": {
        "polygon": np.array([
            (930, 1700),
            (1390, 1700),
            (1750, 50),
            (1550, 50)
        ]),
        "color": sv.Color.GREEN
    },
    "Northbound_Straight": {
        "polygon": np.array([
            (1430, 1700),
            (1800, 1700),
            (2050, 50),
            (1790, 50)
        ]),
        "color": sv.Color.BLUE
    },
    "Northbound_Straight2": {
        "polygon": np.array([
            (1850, 1700),
            (2150, 1700),
            (2350, 50),
            (2080, 50)
        ]),
        "color": sv.Color.YELLOW
    },
    "Northbound_Left": {
        "polygon": np.array([
            (2200, 1700),
            (2550, 1700),
            (2600, 50),
            (2380, 50)
        ]),
        "color": sv.Color.WHITE
    }
}

# Real Life Distance Metrics (in meters)
TARGET_WIDTH = 10
TARGET_HEIGHT = 30

TARGET = np.array(
    [
        [0, 0],
        [TARGET_WIDTH - 1, 0],
        [TARGET_WIDTH - 1, TARGET_HEIGHT - 1],
        [0, TARGET_HEIGHT - 1],
    ]
)

# Creating Polygon Zones for each lane
lane_zones = {
    lane_name: sv.PolygonZone(polygon=lane_data["polygon"])
    for lane_name, lane_data in LANES.items()
}

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
    model = YOLO(YOLO_PATH).to(DEVICE)

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
        text_scale=text_scale-0.4,
        text_thickness=thickness-2,
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

    # Store vehicle counts for each lane
    lane_counts = {lane_name: 0 for lane_name in LANES}

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

            # Reset lane counts for each frame
            for k, v in lane_counts.items():
                lane_counts[k] = 0
            
            # Count vehicles in each lane
            for lane_name, zone in lane_zones.items():
                lane_detections = detections[zone.trigger(detections)]
                lane_counts[lane_name] = len(lane_detections)

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
            # sv.draw_polygon(
            #     annotated_frame,
            #     polygon=SOURCE,
            #     color=sv.Color.RED
            # )

            # Draw lane polygons
            for lane_name, lane_data in LANES.items():
                sv.draw_polygon(
                    annotated_frame,
                    polygon=lane_data["polygon"],
                    color=lane_data["color"],
                    thickness=4
                )

            # Display lane counts on the frame
            y_offset = 50
            for lane, count in lane_counts.items():
                text = f"{lane}: {count}"
                cv2.putText(
                    annotated_frame,
                    text,
                    (50, y_offset),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (255, 255, 255),
                    2
                )
                y_offset += 50

            # Write annotated frame to output video
            sink.write_frame(annotated_frame)

            # Display the frame in a window
            cv2.imshow("frame", annotated_frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

        # Cleanup OpenCV windows after loop
        cv2.destroyAllWindows()