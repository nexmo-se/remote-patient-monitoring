/* global VideoFrame */
import { FaceLandmarker, PoseLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";

class MediapipeTransformer {
   
    mediapipePorcess_ = null
    mediapipeResult_ = null
    
    resultCanvas_ ;
    resultCtx_ = null

    mediapipeCanvas_;
    mediapipeCtx_ = null

    modelType_ = null
    constructor(){
        this.resultCanvas_ = new OffscreenCanvas(1, 1)
        let ctx = this.resultCanvas_.getContext('2d', {alpha: false, desynchronized: true})
        if(ctx){
            this.resultCtx_ = ctx
        }else {
            throw new Error('Unable to create OffscreenCanvasRenderingContext2D');
        }

        this.mediapipeCanvas_ = new OffscreenCanvas(1, 1)
        ctx = this.mediapipeCanvas_.getContext('2d', {alpha: false, desynchronized: true})
        if(ctx){
            this.mediapipeCtx_ = ctx
        }else {
            throw new Error('Unable to create OffscreenCanvasRenderingContext2D');
        }
    }

    onResult(result) {
        // if(result instanceof ImageBitmap){
        //     this.mediapipeSelfieResult_ = result
        //     return
        // }
        this.mediapipeResult_ = result
    }
    
    init(modelType, mediapipePorcess){
        return new Promise((resolve, reject) => {
            this.modelType_ = modelType
            this.mediapipePorcess_ = mediapipePorcess
            resolve()
        })
    }

    async start() {

    }

    transform(frame, controller) {
        if(this.resultCanvas_.width != frame.displayWidth || this.resultCanvas_.height != frame.displayHeight){
            this.resultCanvas_.width = frame.displayWidth
            this.resultCanvas_.height = frame.displayHeight
        }
        if(this.mediapipeCanvas_.width != frame.displayWidth || this.mediapipeCanvas_.height != frame.displayHeight){
            this.mediapipeCanvas_.width = frame.displayWidth
            this.mediapipeCanvas_.height = frame.displayHeight
        }
        let timestamp = frame.timestamp
        createImageBitmap(frame).then( image => {
            frame.close()
            this.processFrame(image, timestamp ? timestamp : Date.now(), controller)
            
        }).catch(e => {
            console.error(e)
            controller.enqueue(frame)
        })
    }

    async processFrame(image, timestamp, controller){
        this.mediapipeProcess(image)
        if(this.mediapipeResult_ && this.resultCtx_){
            this.resultCtx_.save()
            this.resultCtx_.clearRect(0, 0, this.resultCanvas_.width, this.resultCanvas_.height)
            this.resultCtx_.drawImage(image,
                0,
                0,
                image.width,
                image.height,
                0,
                0,
                this.resultCanvas_.width,
                this.resultCanvas_.height)

            if( this.modelType_ === 'face_mesh'){
                this.drawFaceMash()
            } else if( this.modelType_ === 'hands'){
                this.drawHands()
            }
            else if( this.modelType_ === 'objectron' ){
                this.drawObjectron()
            } else if(this.modelType_ === 'pose'){
                this.drawPose()
            }
            this.resultCtx_.restore()
            // @ts-ignore
            controller.enqueue(new VideoFrame(this.resultCanvas_, {timestamp, alpha: 'discard'}))
        }else {
            controller.enqueue(new VideoFrame(image, {timestamp, alpha: 'discard'}))
        }
        image.close()
    }

    mediapipeProcess(image){
        this.mediapipeCtx_.clearRect(0, 0, this.mediapipeCanvas_.width, this.mediapipeCanvas_.height)
        this.mediapipeCtx_?.drawImage(
            image,
            0,
            0,
            image.width,
            image.height,
            0,
            0,
            this.mediapipeCanvas_.width,
            this.mediapipeCanvas_.height
        )
        this.mediapipePorcess_?.onSend(this.mediapipeCanvas_.transferToImageBitmap())
    }

    drawFaceMash() {
        let result = this.mediapipeResult_
        const drawingUtils = new DrawingUtils(this.resultCtx_);
        for (const landmarks of result.faceLandmarks) {
            drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_TESSELATION,
            { color: "#C0C0C070", lineWidth: 1 }
            );
            drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
            { color: "#FF3030" }
            );
            drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
            { color: "#FF3030" }
            );
            drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
            { color: "#30FF30" }
            );
            drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
            { color: "#30FF30" }
            );
            drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
            { color: "#E0E0E0" }
            );
            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, {
            color: "#E0E0E0"
            });
            drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
            { color: "#FF3030" }
            );
            drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
            { color: "#30FF30" }
            );
        }
    }

    drawObjectron() {
        let result = this.mediapipeResult_
        for (let detection of result.detections) {
            // Extract bounding box dimensions
            const x = detection.boundingBox.originX;
            const y = detection.boundingBox.originY;
            const width = detection.boundingBox.width;
            const height = detection.boundingBox.height;

            // Label and confidence
            const label = detection.categories[0].categoryName;
            const confidence = Math.round(parseFloat(detection.categories[0].score) * 100);
            const text = `${label} - ${confidence}%`;

            // Draw bounding box
            this.resultCtx_.strokeStyle = '#00FFFF'; // cyan color
            this.resultCtx_.lineWidth = 2;
            this.resultCtx_.strokeRect(x, y, width, height);

            // Draw text
            this.resultCtx_.fillStyle = '#FFFFFF';
            this.resultCtx_.fillText(text, x + 2, y - 4);
        }
    }

    drawPose() {
        const drawingUtils = new DrawingUtils(this.resultCtx_);
        let result = this.mediapipeResult_

        for (const landmark of result.landmarks) {
            drawingUtils.drawLandmarks(landmark, {
            radius: (data) => DrawingUtils.lerp(data.from.z, -0.15, 0.1, 5, 1)
            });
            drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);
        }
    }

    connect(connectors) {
      for (const connector of connectors) {
        const from = connector[0];
        const to = connector[1];
        if (from && to) {
          if (from.visibility && to.visibility &&
              (from.visibility < 0.1 || to.visibility < 0.1)) {
            continue;
          }
          this.resultCtx_?.beginPath();
          this.resultCtx_?.moveTo(from.x * this.resultCanvas_.width, from.y * this.resultCanvas_.height);
          this.resultCtx_?.lineTo(to.x * this.resultCanvas_.width, to.y * this.resultCanvas_.height);
          this.resultCtx_?.stroke();
        }
      }
    }

    async flush() {
    }
}
export default MediapipeTransformer