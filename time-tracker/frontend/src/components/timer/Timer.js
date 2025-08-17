// Note: This file is currently superseded by TimerPage.js. Kept for reference.
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  FiPlay,
  FiPause,
  FiClock,
  FiCoffee,
  FiCheckCircle,
  FiTag,
  FiDollarSign,
} from "react-icons/fi";
import axios from "axios";
import { toast } from "react-toastify";

const TimerContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

// Tracker bar (single section like Clockify)
const TrackerCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 16px 20px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  align-items: center;
  margin-bottom: 24px;
`;

const TrackerLeft = styled.div`
  min-width: 0;
`;

const DescriptionInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 8px;
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  }
`;

const InlineRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const InlineSelect = styled.select`
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  min-width: 180px;
  &:focus { outline: none; border-color: #3b82f6; }
`;

const InlineIcon = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  padding: 6px 8px;
  border: 1px dashed #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
`;

const TimerDisplay = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: ${(props) => (props.isRunning ? "#dc2626" : "#16a34a")};
  font-family: "Courier New", monospace;
  letter-spacing: 1px;
  text-align: right;
`;

const TimerControls = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const ControlButton = styled.button`
  min-width: 80px;
  height: 40px;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 600;
  gap: 8px;

  &.primary {
    background: ${(props) => (props.isRunning ? "#ef4444" : "#22c55e")};
    color: white;

    &:hover {
      background: ${(props) => (props.isRunning ? "#dc2626" : "#16a34a")};
    }
  }

  &.secondary {
    background: #6c757d;
    color: white;

  &:hover { background: #5a6268; }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const TimerForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 400px;
  margin: 0 auto;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  text-align: left;
`;

const Label = styled.label`
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
`;

const Select = styled.select`
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }
`;

const Textarea = styled.textarea`
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }
`;

const CurrentActivity = styled.div`
  background: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  text-align: left;
`;

const ActivityTitle = styled.div`
  font-weight: 600;
  color: #1976d2;
  margin-bottom: 8px;
`;

const ActivityMeta = styled.div`
  color: #666;
  font-size: 14px;
`;

const BreakCard = styled.div`
  background: ${(props) => (props.isOnBreak ? "#fff3cd" : "#f8f9fa")};
  border: 1px solid ${(props) => (props.isOnBreak ? "#ffeaa7" : "#e9ecef")};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  text-align: left;
`;

const BreakControls = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
  align-items: center;
`;

const BreakButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;

  &.start-break {
    background: #ff6b35;
    color: white;

    &:hover {
      background: #e55a2b;
    }
  }

  &.end-break {
    background: #28a745;
    color: white;

    &:hover {
      background: #218838;
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const BreakTypeSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const BreakStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: ${(props) => (props.isOnBreak ? "#d68910" : "#28a745")};
`;

const PastTimersCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 32px;
`;

// Clockify-like entries list styles
const EntriesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const WeekHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0 4px;
  color: #6b7280;
  font-size: 14px;
`;

const WeekTotal = styled.div`
  font-weight: 600;
  color: #111827;
`;

const DayGroup = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
`;

const DayHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
`;

const DayTitle = styled.div`
  font-weight: 600;
  color: #111827;
`;

const DayTotal = styled.div`
  font-family: "Courier New", monospace;
  color: #374151;
`;

const EntriesList = styled.div`
  display: flex;
  flex-direction: column;
`;

const EntryRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;

  &:last-child {
    border-bottom: none;
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
  }
`;

const EntryLeft = styled.div`
  min-width: 0;
`;

const EntryTitle = styled.div`
  color: #111827;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EntrySubtitle = styled.div`
  color: #6b7280;
  font-size: 12px;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EntryTimeRange = styled.div`
  color: #6b7280;
  font-size: 12px;
  min-width: 140px;
  text-align: right;
`;

const EntryDuration = styled.div`
  font-family: "Courier New", monospace;
  font-weight: 600;
  color: #111827;
  min-width: 90px;
  text-align: right;
`;

// We keep minimal header; week header rendered inside list

const PastTimersTitle = styled.h3`
  margin: 0;
  color: #2c3e50;
  font-size: 1.25rem;
  font-weight: 600;
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: #f8f9fa;
    color: #495057;
  }
`;

const PastTimersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
`;

const PastTimerItem = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.2s;

  &:hover {
    background: #e9ecef;
    border-color: #d1d5db;
  }
`;

const PastTimerInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const PastTimerProject = styled.div`
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PastTimerTask = styled.div`
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 4px;
`;

const PastTimerDescription = styled.div`
  font-size: 14px;
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
`;

const PastTimerMeta = styled.div`
  font-size: 12px;
  color: #9ca3af;
  display: flex;
  gap: 16px;
`;

const PastTimerActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 16px;
`;

const PastTimerDuration = styled.div`
  font-family: "Courier New", monospace;
  font-weight: 600;
  color: #28a745;
  font-size: 14px;
  text-align: right;
  min-width: 80px;
`;

const ContinueButton = styled.button`
  padding: 8px 16px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: #218838;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ProjectColorDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${(props) => props.color || "#6c757d"};
`;

const EmptyPastTimers = styled.div`
  text-align: center;
  padding: 32px;
  color: #6c757d;
  font-style: italic;
`;

const TotalTimeDisplay = styled.span`
  font-size: 12px;
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: 8px;
`;

// Timeline components removed in the new design

// Component for displaying total time
const TotalTimeForProject = ({ projectId, taskId }) => {
  const [totalTime, setTotalTime] = useState("00:00:00");

  useEffect(() => {
    const fetchTotalTime = async () => {
      try {
        const params = new URLSearchParams({ project: projectId, limit: 1000 });
        if (taskId) params.append("task", taskId);

        const response = await axios.get(`/time-entries?${params}`);
        const totalSeconds = response.data.timeEntries.reduce(
          (total, entry) => total + entry.duration,
          0
        );
        setTotalTime(formatTime(totalSeconds));
      } catch (error) {
        console.error("Error calculating total time:", error);
        setTotalTime("00:00:00");
      }
    };

    fetchTotalTime();
  }, [projectId, taskId]);

  return <TotalTimeDisplay>Total: {totalTime}</TotalTimeDisplay>;
};

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

// Timeline component for showing timer and break entries
const Timeline = ({ selectedProject }) => {
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(false);

  // removed: timeline effect

  const fetchTimelineData = async () => {
    setLoading(true);
    try {
      // Fetch time entries
      const timeEntriesParams = new URLSearchParams({ limit: 100 });
      if (selectedProject) timeEntriesParams.append("project", selectedProject);

      const timeEntriesResponse = await axios.get(
        `/time-entries?${timeEntriesParams}`
      );

      // Fetch breaks
      const breaksParams = new URLSearchParams({ limit: 100 });
      if (selectedProject) breaksParams.append("project", selectedProject);

      const breaksResponse = await axios.get(`/breaks?${breaksParams}`);

      // Combine and sort by date
      const combined = [
        ...timeEntriesResponse.data.timeEntries.map((entry) => ({
          ...entry,
          type: "timer",
          timestamp: entry.startTime,
        })),
        ...breaksResponse.data.breaks.map((breakEntry) => ({
          ...breakEntry,
          type: "break",
          timestamp: breakEntry.startTime,
        })),
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Group by date
      const grouped = combined.reduce((acc, entry) => {
        const date = new Date(entry.timestamp).toDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(entry);
        return acc;
      }, {});

      setTimelineData(grouped);
    } catch (error) {
      console.error("Error fetching timeline data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRange = (startTime, endTime) => {
    const start = new Date(startTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const end = endTime
      ? new Date(endTime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "ongoing";
    return `${start} - ${end}`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        Loading timeline...
      </div>
    );
  }

  return (
    <TimelineView>
      {Object.keys(timelineData).length > 0 ? (
        Object.entries(timelineData).map(([date, entries]) => (
          <TimelineDay key={date}>
            <TimelineDayHeader>{date}</TimelineDayHeader>
            {entries.map((entry, index) => (
              <TimelineEntry
                key={`${entry.type}-${entry._id}-${index}`}
                isBreak={entry.type === "break"}
                color={entry.project?.color}
              >
                <TimelineTime>
                  {formatTimeRange(
                    entry.startTime || entry.timestamp,
                    entry.endTime
                  )}
                </TimelineTime>
                <TimelineContent>
                  <TimelineProject>
                    {entry.type === "break"
                      ? `Break - ${entry.breakType}`
                      : `${entry.project?.name}${
                          entry.task ? ` - ${entry.task.name}` : ""
                        }`}
                  </TimelineProject>
                  {entry.description && (
                    <TimelineDescription>
                      {entry.description}
                    // Timeline component removed in the new design
      });
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      const groupsMap = entries.reduce((acc, e) => {
        const d = new Date(e.startTime);
        // Today/Yesterday labels for current week
        const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
        const key = sameDay(d, today) ? 'Today' : sameDay(d, yesterday) ? 'Yesterday' : formatter.format(d);
        if (!acc[key]) acc[key] = { key, date: d, items: [], total: 0 };
        acc[key].items.push(e);
        acc[key].total += e.duration || 0;
        return acc;
      }, {});

      // sort days descending (latest first), and inside items by start desc
      const groups = Object.values(groupsMap)
        .sort((a, b) => b.date - a.date)
        .map((g) => ({
          ...g,
          items: g.items.sort((a, b) => new Date(b.startTime) - new Date(a.startTime)),
        }));

      const weekTotal = entries.reduce((s, e) => s + (e.duration || 0), 0);
      setWeekEntries({ groups, weekTotal, loading: false });
    } catch (err) {
      console.error('Error fetching week entries', err);
      setWeekEntries({ groups: [], weekTotal: 0, loading: false });
    }
  };

  // Last week range (previous Mon-Sun)
  const getLastWeekRange = () => {
    const { start, end } = getCurrentWeekRange();
    const lastStart = new Date(start);
    const lastEnd = new Date(end);
    lastStart.setDate(start.getDate() - 7);
    lastEnd.setDate(end.getDate() - 7);
    return { start: lastStart, end: lastEnd };
  };

  const fetchLastWeekEntries = async () => {
    setLastWeekEntries((prev) => ({ ...prev, loading: true }));
    try {
      const { start, end } = getLastWeekRange();
      const params = new URLSearchParams({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        limit: 200,
      });
      const res = await axios.get(`/time-entries?${params.toString()}`);
      const entries = res.data.timeEntries.filter((e) => !e.isRunning);

      const formatter = new Intl.DateTimeFormat(undefined, {
        weekday: 'short', month: 'short', day: '2-digit'
      });

      const groupsMap = entries.reduce((acc, e) => {
        const d = new Date(e.startTime);
        const key = formatter.format(d);
        if (!acc[key]) acc[key] = { key, date: d, items: [], total: 0 };
        acc[key].items.push(e);
        acc[key].total += e.duration || 0;
        return acc;
      }, {});

      const groups = Object.values(groupsMap)
        .sort((a, b) => b.date - a.date)
        .map((g) => ({
          ...g,
          items: g.items.sort((a, b) => new Date(b.startTime) - new Date(a.startTime)),
        }));

      const weekTotal = entries.reduce((s, e) => s + (e.duration || 0), 0);
      setLastWeekEntries({ groups, weekTotal, loading: false });
    } catch (err) {
      console.error('Error fetching last week entries', err);
      setLastWeekEntries({ groups: [], weekTotal: 0, loading: false });
    }
  };

  const checkRunningTimer = async () => {
    try {
      const response = await axios.get("/time-entries/running");
      if (response.data) {
        setRunningEntry(response.data);

        // Check if there's an active break for this timer
        try {
          const breakResponse = await axios.get("/breaks/active");
          if (
            breakResponse.data &&
            breakResponse.data.timeEntry === response.data._id
          ) {
            // Timer is paused due to active break
            setIsRunning(false);
            setActiveBreak(breakResponse.data);
            // Calculate elapsed time up to when break started
            const startTime = new Date(response.data.startTime);
            const breakStartTime = new Date(breakResponse.data.startTime);
            setPausedTime(Math.floor((breakStartTime - startTime) / 1000));
            setElapsedTime(Math.floor((breakStartTime - startTime) / 1000));
          } else {
            // Timer is running normally
            setIsRunning(true);
            const startTime = new Date(response.data.startTime);
            const now = new Date();
            setElapsedTime(Math.floor((now - startTime) / 1000));
            setPausedTime(0);
          }
        } catch (breakError) {
          // No active break, timer is running normally
          setIsRunning(true);
          const startTime = new Date(response.data.startTime);
          const now = new Date();
          setElapsedTime(Math.floor((now - startTime) / 1000));
          setPausedTime(0);
        }

        // Populate form with running entry data
        setFormData({
          project: response.data.project._id,
          task: response.data.task?._id || "",
          description: response.data.description || "",
        });
      }
    } catch (error) {
      // No running timer
    }
  };

  // This function is now handled within checkRunningTimer for better integration
  const checkActiveBreak = async () => {
    try {
      const response = await axios.get("/breaks/active");
      if (response.data && !runningEntry) {
        // Only set active break if there's no running timer context
        setActiveBreak(response.data);
      }
    } catch (error) {
      // No active break
    }
  };

  const startTimer = async () => {
    if (!formData.project) {
      toast.error("Please select a project");
      return;
    }

    try {
      const response = await axios.post("/time-entries", {
        project: formData.project,
        task: formData.task || null,
        description: formData.description,
        startTime: new Date().toISOString(),
        duration: 0,
      });

      setRunningEntry(response.data);
      setIsRunning(true);
      setElapsedTime(0);
      setPausedTime(0); // Reset paused time for new timer
  setActiveBreak(null); // Ensure no active break state
  fetchWeekEntries();
  fetchLastWeekEntries();
      toast.success("Timer started!");
    } catch (error) {
      toast.error("Failed to start timer");
      console.error("Error starting timer:", error);
    }
  };

  const stopTimer = async () => {
    if (!runningEntry) return;

    try {
      await axios.post(`/time-entries/${runningEntry._id}/stop`);
      setIsRunning(false);
      setRunningEntry(null);
      setElapsedTime(0);
      setPausedTime(0); // Reset paused time
      setActiveBreak(null); // Clear any active break
      setFormData({ project: "", task: "", description: "" });
  fetchWeekEntries();
  fetchLastWeekEntries();
      toast.success("Timer stopped!");
    } catch (error) {
      toast.error("Failed to stop timer");
      console.error("Error stopping timer:", error);
    }
  };
  const updateDescription = async () => {
    if (!runningEntry) return;

    try {
      await axios.put(`/time-entries/${runningEntry._id}`, {
        description: formData.description,
      });
      toast.success("Description updated!");
    } catch (error) {
      toast.error("Failed to update description");
      console.error("Error updating description:", error);
    }
  };

  const startBreak = async () => {
    if (!runningEntry) {
      toast.error("No active timer to start break on");
      return;
    }

    try {
      // Start the break without stopping the timer
      const response = await axios.post("/breaks/start", {
        timeEntryId: runningEntry._id,
        breakType: 'other',
      });

      // Pause the timer and store the current elapsed time
      setIsRunning(false);
      setPausedTime(elapsedTime); // Store the time when we paused
      setActiveBreak(response.data);

  toast.success('Break started! Timer paused.');
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to start break");
      console.error("Error starting break:", error);
    }
  };

  const endBreak = async () => {
    if (!activeBreak) return;

    try {
      await axios.put(`/breaks/end/${activeBreak._id}`);
      setActiveBreak(null);

      // Resume the timer from where it left off
      if (runningEntry) {
        setIsRunning(true);
        // Set resume time for calculation - update the running entry with resume time
        const resumeTime = new Date().toISOString();
        setRunningEntry((prev) => ({
          ...prev,
          resumeTime: resumeTime,
        }));
        // Keep the paused time for continued calculation
      }

      toast.success("Break ended! Timer resumed.");
    } catch (error) {
      toast.error("Failed to end break");
      console.error("Error ending break:", error);
    }
  };

  const continueTimer = async (pastEntry) => {
    if (isRunning) {
      toast.error("Please stop the current timer first");
      return;
    }

    try {
      // Start a new timer with the same project, task, and description
      const response = await axios.post("/time-entries", {
        project: pastEntry.project._id,
        task: pastEntry.task?._id || null,
        description: pastEntry.description || "",
        startTime: new Date().toISOString(),
        duration: 0,
      });

      setRunningEntry(response.data);
      setIsRunning(true);
      setElapsedTime(0);

      // Update form data
      setFormData({
        project: pastEntry.project._id,
        task: pastEntry.task?._id || "",
        description: pastEntry.description || "",
      });

      // Fetch tasks for the selected project
      if (pastEntry.project._id) {
        fetchTasks(pastEntry.project._id);
      }

  fetchWeekEntries();
  fetchLastWeekEntries();
      toast.success("Timer continued!");
    } catch (error) {
      toast.error("Failed to continue timer");
      console.error("Error continuing timer:", error);
    }
  };

  // Removed compact past-timers fetching (not used in new UI)

  const fetchTimelineData = async () => {
    setLoadingTimeline(true);
    try {
      // Fetch time entries
      const timeEntriesParams = new URLSearchParams({ limit: 100 });
      if (selectedProject) timeEntriesParams.append("project", selectedProject);

      const timeEntriesResponse = await axios.get(
        `/time-entries?${timeEntriesParams}`
      );

      // Fetch breaks
      const breaksParams = new URLSearchParams({ limit: 100 });
      if (selectedProject) breaksParams.append("project", selectedProject);

      const breaksResponse = await axios.get(`/breaks?${breaksParams}`);

      // Combine and sort by date
      const combined = [
        ...timeEntriesResponse.data.timeEntries.map((entry) => ({
          ...entry,
          type: "timer",
          timestamp: entry.startTime,
        })),
        ...breaksResponse.data.breaks.map((breakEntry) => ({
          ...breakEntry,
          type: "break",
          timestamp: breakEntry.startTime,
        })),
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Group by date
      const grouped = combined.reduce((acc, entry) => {
        const date = new Date(entry.timestamp).toDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(entry);
        return acc;
      }, {});

      setTimelineData(grouped);
    } catch (error) {
      console.error("Error fetching timeline data:", error);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const formatTimeRange = (startTime, endTime) => {
    const start = new Date(startTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const end = endTime
      ? new Date(endTime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "ongoing";
    return `${start} - ${end}`;
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === "description" && runningEntry) {
      // Debounce description updates
      clearTimeout(window.descriptionTimeout);
      window.descriptionTimeout = setTimeout(updateDescription, 1000);
    }
  };

  const resumeLastTask = async () => {
    if (isRunning) {
      toast.error("Please stop the current timer first");
      return;
    }

    try {
      // Get the most recent completed time entry
      const response = await axios.get("/time-entries?limit=1");
      const lastEntry = response.data.timeEntries[0];

      if (!lastEntry) {
        toast.error("No previous task to resume");
        return;
      }

      // Start a new timer with the same project, task, and description
      const newTimerResponse = await axios.post("/time-entries", {
        project: lastEntry.project._id,
        task: lastEntry.task?._id || null,
        description: lastEntry.description || "",
        startTime: new Date().toISOString(),
        duration: 0,
      });

      setRunningEntry(newTimerResponse.data);
      setIsRunning(true);
      setElapsedTime(0);

      // Update form data
      setFormData({
        project: lastEntry.project._id,
        task: lastEntry.task?._id || "",
        description: lastEntry.description || "",
      });

      // Fetch tasks for the selected project
      if (lastEntry.project._id) {
        fetchTasks(lastEntry.project._id);
      }

  fetchWeekEntries();
  fetchLastWeekEntries();
      toast.success(
        `Resumed: ${lastEntry.project.name}${
          lastEntry.task ? ` - ${lastEntry.task.name}` : ""
        }`
      );
    } catch (error) {
      toast.error("Failed to resume last task");
      console.error("Error resuming last task:", error);
    }
  };

  return (
    <TimerContainer>
      {/* Tracker bar */}
      <TrackerCard>
        <TrackerLeft>
          <DescriptionInput
            value={formData.description}
            onChange={(e) => handleFormChange('description', e.target.value)}
            placeholder="What are you working on?"
          />
          <InlineRow>
            <InlineSelect
              value={formData.project}
              onChange={(e) => handleFormChange('project', e.target.value)}
              disabled={isRunning}
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </InlineSelect>
            <InlineSelect
              value={formData.task}
              onChange={(e) => handleFormChange('task', e.target.value)}
              disabled={isRunning || !formData.project}
            >
              <option value="">Select task</option>
              {tasks.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </InlineSelect>
            <InlineIcon><FiTag size={14}/> tags</InlineIcon>
            <InlineIcon><FiDollarSign size={14}/> billable</InlineIcon>
          </InlineRow>
        </TrackerLeft>
        <div>
          <TimerDisplay isRunning={isRunning}>{formatTime(elapsedTime)}</TimerDisplay>
          <TimerControls>
            {runningEntry && !activeBreak ? (
              <ControlButton className="secondary" onClick={startBreak}><FiCoffee/> Break</ControlButton>
            ) : null}
            {activeBreak ? (
              <ControlButton className="secondary" onClick={endBreak}><FiCheckCircle/> End break</ControlButton>
            ) : null}
            <ControlButton
              className="primary"
              isRunning={isRunning}
              onClick={isRunning ? stopTimer : startTimer}
              disabled={!isRunning && !formData.project}
            >
              {isRunning ? (<><FiPause/> Stop</>) : (<><FiPlay/> Start</>)}
            </ControlButton>
          </TimerControls>
        </div>
      </TrackerCard>

      {/* Past Timers Section */}
      <PastTimersCard>
        <PastTimersTitle style={{margin:'0 0 12px', fontSize:'16px'}}>This week</PastTimersTitle>

  <EntriesContainer>
            <WeekHeader>
              <div></div>
              <WeekTotal>{formatTime(weekEntries.weekTotal)}</WeekTotal>
            </WeekHeader>

            {weekEntries.loading ? (
              <EmptyPastTimers>Loading week entries…</EmptyPastTimers>
            ) : weekEntries.groups.length === 0 ? (
              <EmptyPastTimers>No entries this week.</EmptyPastTimers>
            ) : (
              weekEntries.groups.map((g) => (
                <DayGroup key={g.key}>
                  <DayHeaderRow>
                    <DayTitle>{g.key}</DayTitle>
                    <DayTotal>{formatTime(g.total)}</DayTotal>
                  </DayHeaderRow>
                  <EntriesList>
                    {g.items.map((timer) => (
                      <EntryRow key={timer._id}>
                        <EntryLeft>
                          <EntryTitle>
                            {timer.project?.name}
                            {timer.task ? ` · ${timer.task.name}` : ""}
                          </EntryTitle>
                          {timer.description && (
                            <EntrySubtitle title={timer.description}>
                              {timer.description}
                            </EntrySubtitle>
                          )}
                        </EntryLeft>
                        <EntryTimeRange>
                          {new Date(timer.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {" - "}
                          {timer.endTime ? new Date(timer.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                        </EntryTimeRange>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <EntryDuration>{formatTime(timer.duration || 0)}</EntryDuration>
                          <ContinueButton onClick={() => continueTimer(timer)} disabled={isRunning}>
                            <FiPlay size={14} />
                            Continue
                          </ContinueButton>
                        </div>
                      </EntryRow>
                    ))}
                  </EntriesList>
                </DayGroup>
              ))
            )}
          </EntriesContainer>
      </PastTimersCard>

      {/* Last Week Section */}
      <PastTimersCard>
        <PastTimersTitle style={{margin:'0 0 12px', fontSize:'16px'}}>Last week</PastTimersTitle>
        <EntriesContainer>
          <WeekHeader>
            <div></div>
            <WeekTotal>{formatTime(lastWeekEntries.weekTotal)}</WeekTotal>
          </WeekHeader>

          {lastWeekEntries.loading ? (
            <EmptyPastTimers>Loading last week…</EmptyPastTimers>
          ) : lastWeekEntries.groups.length === 0 ? (
            <EmptyPastTimers>No entries last week.</EmptyPastTimers>
          ) : (
            lastWeekEntries.groups.map((g) => (
              <DayGroup key={`last-${g.key}`}>
                <DayHeaderRow>
                  <DayTitle>{g.key}</DayTitle>
                  <DayTotal>{formatTime(g.total)}</DayTotal>
                </DayHeaderRow>
                <EntriesList>
                  {g.items.map((timer) => (
                    <EntryRow key={timer._id}>
                      <EntryLeft>
                        <EntryTitle>
                          {timer.project?.name}
                          {timer.task ? ` · ${timer.task.name}` : ""}
                        </EntryTitle>
                        {timer.description && (
                          <EntrySubtitle title={timer.description}>
                            {timer.description}
                          </EntrySubtitle>
                        )}
                      </EntryLeft>
                      <EntryTimeRange>
                        {new Date(timer.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {" - "}
                        {timer.endTime ? new Date(timer.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                      </EntryTimeRange>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <EntryDuration>{formatTime(timer.duration || 0)}</EntryDuration>
                        <ContinueButton onClick={() => continueTimer(timer)} disabled={isRunning}>
                          <FiPlay size={14} />
                          Continue
                        </ContinueButton>
                      </div>
                    </EntryRow>
                  ))}
                </EntriesList>
              </DayGroup>
            ))
          )}
        </EntriesContainer>
      </PastTimersCard>
    </TimerContainer>
  );
};

export default Timer;
