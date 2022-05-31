import './App.css';
import Webcam from "react-webcam";
import ReactPlayer from 'react-player/lazy'
import { useCallback, useEffect, useRef, useState } from 'react';
import "@tensorflow/tfjs";
import {load} from '@tensorflow-models/posenet';
import { poseSimilarity } from 'posenet-similarity';

function App() {
  const webcamRef = useRef(null);
  const videoRef = useRef(null);
  const [detector, setDetector] = useState(null);
  const [videoPoses, setVideoPoses] = useState(undefined);
  const [weightedDistance, setWeightedDistance] = useState(0);
  const [timeToEstimate, setTimeToEstimate] = useState(0);

  const capture = useCallback(
    () => webcamRef.current.getScreenshot(),
    [webcamRef]
  );

  const estimatePose = useCallback(
    async () => {
      if (detector) {
        const screenShoot = capture();
        console.log({screenShoot});
        const pose = await detector.estimateSinglePose(screenShoot);
        console.log({pose});
        return pose;
      }
    },
    [detector, capture]
  );

  const onProgress = async ({playedSeconds}) => {
    try {
      const start = Date.now();
      const userPose = await estimatePose();
      console.log({userPose});
      const intPlayedSeconds = Math.round(playedSeconds);
      const videoPose = videoPoses[`${intPlayedSeconds}`];
      const newWeightedDistance = poseSimilarity(userPose, videoPose);
      console.log({newWeightedDistance});
      const end = Date.now();
      setTimeToEstimate(end - start);
      setWeightedDistance(newWeightedDistance);
    } catch (error) {
      console.error({error});
    }
  }
  
  useEffect(() => {
    (async () => {
      const newDetector = await load();
      setDetector(newDetector);
    })();

    (async () => {
      const result = await fetch('./result.json').then(res => res.json());
      setVideoPoses(result);
    })();

  }, []);

  // console.log(videoPoses);
  return (
    <div className="App">
      <div className='weight-distance'>
        {weightedDistance}
      </div>
      <div className='estimation-time'>
        {timeToEstimate}
      </div>
      <Webcam
        ref={webcamRef}
        height={720}
        width={1280}
      />
      <ReactPlayer
        progressInterval={1000}
        onProgress={onProgress}
        controls
        url={'test-video.mp4'}
        ref={videoRef}
      />
    </div>
  );
}

export default App;
