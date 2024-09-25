import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { MdAlarm } from 'react-icons/md';
import Lottie from "lottie-react";
import TimerIcon from "../../../assets/AnimationTimer.json";

const Timer = () => {
  const [totalTime, setTotalTime] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [hovering, setHovering] = useState(false);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  
  const setProgress = (percent) => {
    const offset = ((100 - percent) / 100) * circumference;
    return offset;
  };
  const progressStyle = {
    strokeDasharray: `${circumference} ${circumference}`,
    strokeDashoffset: setProgress((seconds / totalTime) * 100)
  };
  
  useEffect(() => {
    if (isActive && seconds > 0) {
      const intervalId = setInterval(() => {
        setSeconds(seconds => seconds - 1);
      }, 1000);
      return () => clearInterval(intervalId);
    } else if (seconds === 0 && isActive) {
      completeTimer();
    }
  }, [seconds, isActive]);

  const completeTimer = () => {
    setIsActive(false);
    Swal.fire({
      title: '時間到!',
      text: '設定的時間已經結束囉~',
      icon: 'success',
      confirmButtonColor: '#5BA491'
    });
  };

  const handleSetTime = async () => {
    const { value: result, isConfirmed } = await Swal.fire({
      title: '設定時間',
      html: `
        <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
          <input id="minutes" type="number" min="0" max="59" step="1" value="0" class="swal2-input" style="width: 100px;" placeholder="分鐘"> 分鐘
          <input id="seconds" type="number" min="0" max="59" step="1" value="0" class="swal2-input" style="width: 100px;" placeholder="秒數"> 秒鐘
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true, // 顯示取消按鈕
      confirmButtonText: '設定', // 確認按鈕文字
      cancelButtonText: '取消', // 取消按鈕文字
      confirmButtonColor: '#5BA491', // 確認按鈕顏色
      cancelButtonColor: '#d33', // 取消按鈕顏色
      preConfirm: () => {
        const minutes = Swal.getPopup().querySelector('#minutes').value;
        const seconds = Swal.getPopup().querySelector('#seconds').value;
        const totalSeconds = parseInt(minutes) * 60 + parseInt(seconds);
        if (totalSeconds < 15) {
          Swal.showValidationMessage('設定的時間必須至少為 15 秒');
          return false;
        }
        return {
          minutes: minutes,
          seconds: seconds
        };
      }
    });
  
    if (isConfirmed && result) {
      const totalSecs = parseInt(result.minutes) * 60 + parseInt(result.seconds);
      setSeconds(totalSecs);
      setTotalTime(totalSecs);
      setIsActive(true);
    }
  };
  
  

  const progressWidth = totalTime > 0 ? `${(seconds / totalTime) * 100}%` : '0%';

  const handleMouseEnter = () => {
    setHovering(true);
  };

  const handleMouseLeave = () => {
    setHovering(false);
  };
  return (
    <div className="fixed bottom-32 right-9 flex flex-col items-center justify-center">
      <div className="relative z-10"> {/* SVG will be on top */}
        {isActive && (
          <>
          <div className="text-lg font-semibold text-gray-700">
           {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
        </div>
          <svg width="80" height="80" className=" mt-10 absolute transform -translate-x-1/4  -translate-y-1/2">
            <circle
              stroke="lightgray"
              fill="transparent"
              strokeWidth="4"
              r={radius}
              cx="40"
              cy="40"
            />
            <circle
              stroke="#5BA491"
              fill="transparent"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={progressStyle.strokeDashoffset}
              r={radius}
              cx="40"
              cy="40"
              className="transition-all duration-1000 ease-in-out"
              transform="rotate(-90 40 40)" // Rotate the circle to start at the top
            />
          </svg>
          </>
        )}
      </div>
      <button onClick={handleSetTime} className="relative z-0 transition duration-300 scale-100 hover:scale-110">
        <Lottie
          className="w-20"
          animationData={TimerIcon}
          loop={false}
          autoplay={false}
        />
      </button>
    </div>
  );
};

export default Timer;