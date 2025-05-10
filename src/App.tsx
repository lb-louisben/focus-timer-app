import { useEffect, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const DEFAULT_DURATION = 90 * 60; // 90 minutes in seconds

export default function FocusApp() {
  const [mode, setMode] = useState<'focus' | 'breathing'>('focus');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATION);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalFocusToday, setTotalFocusToday] = useState(0);
  const [totalBreathsToday, setTotalBreathsToday] = useState(0);
  const [history, setHistory] = useState<{ date: string; focus: number; breath: number }[]>([]);
  const [breathCountdown, setBreathCountdown] = useState(10);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const breathTimer = useRef<NodeJS.Timeout | null>(null);

  const startTimer = () => {
    if (intervalRef.current) return;
    setStartTime(Date.now());
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    scheduleBreath();
  };

  const stopTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const scheduleBreath = () => {
    const delay = (3 + Math.random() * 2) * 60 * 1000;
    setTimeout(() => {
      playDing();
      setMode('breathing');
      setBreathCountdown(10);
      setTotalBreathsToday((c) => c + 1);
    }, delay);
  };

  const playDing = () => {
    const audio = new Audio('/ding.mp3');
    audio.play();
  };

  useEffect(() => {
    if (mode === 'breathing') {
      breathTimer.current = setInterval(() => {
        setBreathCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(breathTimer.current!);
            breathTimer.current = null;
            setMode('focus');
            scheduleBreath();
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [mode]);

  useEffect(() => {
    const date = new Date().toISOString().slice(0, 10);
    setHistory((prev) => {
      const entry = prev.find((d) => d.date === date);
      if (!entry) return [...prev, { date, focus: totalFocusToday, breath: totalBreathsToday }];
      entry.focus = totalFocusToday;
      entry.breath = totalBreathsToday;
      return [...prev];
    });
  }, [totalFocusToday, totalBreathsToday]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (intervalRef.current) setTotalFocusToday((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <Tabs defaultValue="today">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="today">今日专注</TabsTrigger>
        <TabsTrigger value="history">周/月记录</TabsTrigger>
      </TabsList>
      <TabsContent value="today">
        <Card className="mt-4 p-4">
          <CardContent>
            {mode === 'focus' ? (
              <>
                <h1 className="text-2xl font-bold">专注中：{formatTime(timeLeft)}</h1>
                <Progress value={((DEFAULT_DURATION - timeLeft) / DEFAULT_DURATION) * 100} className="my-4" />
                <div className="space-x-2">
                  <Button onClick={startTimer}>开始</Button>
                  <Button onClick={stopTimer}>暂停</Button>
                </div>
                <p className="mt-2">今日专注时长：{Math.floor(totalFocusToday / 60)} 分钟</p>
                <p>放空次数：{totalBreathsToday}</p>
              </>
            ) : (
              <div className="text-center">
                <h2 className="text-xl">放空中... {breathCountdown}s</h2>
                {breathCountdown === 1 && <p className="text-red-500">睁眼！继续专注</p>}
                <div className="animate-bounce w-32 h-32 mx-auto rounded-full bg-blue-200 mt-4" />
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="history">
        <Card className="mt-4 p-4">
          <CardContent>
            <h2 className="text-xl font-bold">历史记录</h2>
            <ul className="mt-2 space-y-1">
              {history.map((h) => (
                <li key={h.date}>
                  {h.date} - 专注: {Math.floor(h.focus / 60)} 分钟，放空: {h.breath} 次
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
