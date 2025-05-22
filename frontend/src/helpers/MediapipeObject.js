import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
import { MonitorType } from "utils/constants";
const { FaceLandmarker, FilesetResolver,  ObjectDetector, PoseLandmarker} = vision;


class MediapipeObject{
    mediapipeListener_ = null
    detector = null;
    runningMode = "IMAGE";

    constructor(){
        
    }

    getModelOptions(modelType) {
        let option = {}
        if (modelType === MonitorType.FACE_MESH){
            option = {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                    delegate: "GPU"
                },
                outputFaceBlendshapes: true,
                runningMode: this.runningMode,
                numFaces: 1
            }
        } else if ( modelType === 'objectron'){
            option = {
                baseOptions: {
                  modelAssetPath: `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite`,
                  delegate: "GPU"
                },
                scoreThreshold: 0.5,
                categoryAllowlist: ["cell phone"],
                runningMode: this.runningMode
            }
        } else if (modelType === 'pose'){
            option = {
                baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
                delegate: "GPU"
                },
                runningMode: this.runningMode,
                numPoses: 2
            }
        }
        return option
    }

    init(modelType, mediapipeListener){
        return new Promise(async (resolve, reject) => {
            this.mediapipeListener_ = mediapipeListener

            const filesetResolver = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
                );

            try {
                if (modelType == MonitorType.FACE_MESH) {
                    this.detector = await FaceLandmarker.createFromOptions(filesetResolver, this.getModelOptions(MonitorType.FACE_MESH));
                }
                else if (modelType == MonitorType.OBJECTRON) {
                    this.detector = await ObjectDetector.createFromOptions(filesetResolver, this.getModelOptions(MonitorType.OBJECTRON));
                }
                else if (modelType == MonitorType.POSE) {
                    this.detector = await PoseLandmarker.createFromOptions(filesetResolver, this.getModelOptions(MonitorType.POSE));
            }
                resolve()
            }
            catch(e) {
                reject(e)
            }
        })

    }

    onSend(data) {
        const results = this.detector.detect(data);
        this.mediapipeListener_?.onResult(results)
    }
}

export default MediapipeObject