import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  FiPlay,
  FiPause,
  FiSquare,
  FiClock,
  FiCoffee,
  FiCheckCircle,
} from "react-icons/fi";
import axios from "axios";
import { toast } from "react-toastify";

const TimerContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const TimerCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  padding: 48px;
  text-align: center;
  margin-bottom: 32px;
`;

const TimerDisplay = styled.div`
  font-size: 4rem;
  font-weight: 700;
  color: ${(props) => (props.isRunning ? "#28a745" : "#2c3e50")};
  font-family: "Courier New", monospace;
  margin-bottom: 32px;
  letter-spacing: 2px;

  @media (max-width: 768px) {
    font-size: 3rem;
  }
`;

const TimerControls = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 32px;
`;

const ControlButton = styled.button`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 24px;

  &.primary {
    background: ${(props) => (props.isRunning ? "#dc3545" : "#28a745")};
    color: white;

    &:hover {
      background: ${(props) => (props.isRunning ? "#c82333" : "#218838")};
      transform: scale(1.05);
    }
  }

  &.secondary {
    background: #6c757d;
    color: white;

    &:hover {
      background: #5a6268;
      transform: scale(1.05);
    }
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
  padding: 32px;
  margin-bottom: 32px;
`;

const PastTimersHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e9ecef;
`;

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

// Timeline components
const TimelineContainer = styled.div`
  margin-top: 24px;
  border-top: 1px solid #e9ecef;
  padding-top: 24px;
`;

const TimelineHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 16px;
`;

const TimelineTitle = styled.h4`
  margin: 0;
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 600;
`;

const ProjectFilter = styled.select`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  margin-left: 12px;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const TimelineView = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
`;

const TimelineDay = styled.div`
  margin-bottom: 24px;
`;

const TimelineDayHeader = styled.div`
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #dee2e6;
`;

const TimelineEntry = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 8px;
  background: white;
  border-radius: 6px;
  border-left: 4px solid
    ${(props) => (props.isBreak ? "#ff6b35" : props.color || "#28a745")};
`;

const TimelineTime = styled.div`
  font-family: "Courier New", monospace;
  font-size: 12px;
  color: #666;
  min-width: 120px;
`;

const TimelineContent = styled.div`
  flex: 1;
  margin-left: 12px;
`;

const TimelineProject = styled.div`
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
`;

const TimelineDuration = styled.div`
  font-family: "Courier New", monospace;
  font-size: 12px;
  color: #666;
  margin-left: 12px;
  min-width: 60px;
  text-align: right;
`;

const TimelineDescription = styled.div`
  font-size: 12px;
  color: #6c757d;
  margin-top: 2px;
`;

const EmptyTimeline = styled.div`
  text-align: center;
  padding: 32px;
  color: #6c757d;
  font-style: italic;
`;

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

  useEffect(() => {
    fetchTimelineData();
  }, [selectedProject]);

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
                    </TimelineDescription>
                  )}
                </TimelineContent>
                <TimelineDuration>
                  {formatTime(entry.duration || 0)}
                </TimelineDuration>
              </TimelineEntry>
            ))}
          </TimelineDay>
        ))
      ) : (
        <EmptyTimeline>
          No timeline data found for the selected period.
        </EmptyTimeline>
      )}
    </TimelineView>
  );
};

const Timer = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [runningEntry, setRunningEntry] = useState(null);
  const [pausedTime, setPausedTime] = useState(0); // Track accumulated time when paused
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeBreak, setActiveBreak] = useState(null);
  const [breakType, setBreakType] = useState("other");
  const [pastTimers, setPastTimers] = useState([]);
  const [showPastTimers, setShowPastTimers] = useState(true);
  const [showTimeline, setShowTimeline] = useState(false);
  const [selectedTimelineProject, setSelectedTimelineProject] = useState("");
  const [formData, setFormData] = useState({
    project: "",
    task: "",
    description: "",
  });
  const [selectedProject, setSelectedProject] = useState("");
  const [timelineData, setTimelineData] = useState({});
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  useEffect(() => {
    fetchProjects();
    checkRunningTimer();
    fetchPastTimers();
  }, []);

  useEffect(() => {
    if (formData.project) {
      fetchTasks(formData.project);
    } else {
      setTasks([]);
    }
  }, [formData.project]);

  useEffect(() => {
    let interval;
    if (isRunning && runningEntry && !activeBreak) {
      interval = setInterval(() => {
        if (pausedTime > 0 && runningEntry.resumeTime) {
          // If we resumed from a break, continue from pausedTime
          const resumeTime = new Date(runningEntry.resumeTime);
          const now = new Date();
          const additionalTime = Math.floor((now - resumeTime) / 1000);
          setElapsedTime(pausedTime + additionalTime);
        } else {
          // Normal counting from start
          const startTime = new Date(runningEntry.startTime);
          const now = new Date();
          setElapsedTime(Math.floor((now - startTime) / 1000));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, runningEntry, pausedTime, activeBreak]);

  useEffect(() => {
    fetchTimelineData();
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const response = await axios.get("/projects");
      setProjects(response.data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchTasks = async (projectId) => {
    try {
      const response = await axios.get(`/tasks?project=${projectId}`);
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
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
      fetchPastTimers(); // Refresh past timers after stopping
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
        breakType: breakType,
      });

      // Pause the timer and store the current elapsed time
      setIsRunning(false);
      setPausedTime(elapsedTime); // Store the time when we paused
      setActiveBreak(response.data);

      toast.success(
        `${
          breakType.charAt(0).toUpperCase() + breakType.slice(1)
        } break started! Timer paused.`
      );
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

      toast.success("Timer continued!");
    } catch (error) {
      toast.error("Failed to continue timer");
      console.error("Error continuing timer:", error);
    }
  };

  const fetchPastTimers = async () => {
    try {
      const response = await axios.get("/time-entries?limit=20");
      // Filter out currently running timer
      const pastEntries = response.data.timeEntries.filter(
        (entry) => !entry.isRunning
      );

      // Group by project+task combination and keep only the most recent entry for each combination
      const grouped = {};
      pastEntries.forEach((entry) => {
        const key = `${entry.project._id}-${entry.task?._id || "notask"}`;
        if (
          !grouped[key] ||
          new Date(entry.startTime) > new Date(grouped[key].startTime)
        ) {
          grouped[key] = entry;
        }
      });

      // Convert back to array and sort by most recent
      const uniqueEntries = Object.values(grouped)
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
        .slice(0, 10); // Keep only top 10

      setPastTimers(uniqueEntries);
    } catch (error) {
      console.error("Error fetching past timers:", error);
    }
  };

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
      {/* Past Timers Section */}
      <PastTimersCard>
        <PastTimersHeader>
          <PastTimersTitle>Recent Timers</PastTimersTitle>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <ToggleButton onClick={() => setShowTimeline(!showTimeline)}>
              {showTimeline ? "Show List" : "Show Timeline"}
            </ToggleButton>
            <ToggleButton onClick={() => setShowPastTimers(!showPastTimers)}>
              {showPastTimers ? "Hide" : "Show"}
            </ToggleButton>
          </div>
        </PastTimersHeader>

        {showPastTimers && !showTimeline && (
          <PastTimersList>
            {pastTimers.length > 0 ? (
              pastTimers.map((timer) => (
                <PastTimerItem key={timer._id}>
                  <PastTimerInfo>
                    <PastTimerProject>
                      <ProjectColorDot color={timer.project?.color} />
                      {timer.project?.name}
                      <TotalTimeForProject
                        projectId={timer.project._id}
                        taskId={timer.task?._id}
                      />
                    </PastTimerProject>
                    {timer.task && (
                      <PastTimerTask>Task: {timer.task.name}</PastTimerTask>
                    )}
                    {timer.description && (
                      <PastTimerDescription title={timer.description}>
                        {timer.description}
                      </PastTimerDescription>
                    )}
                    <PastTimerMeta>
                      <span>
                        {new Date(timer.startTime).toLocaleDateString()} •
                        {new Date(timer.startTime).toLocaleTimeString()} -
                        {timer.endTime &&
                          new Date(timer.endTime).toLocaleTimeString()}
                      </span>
                    </PastTimerMeta>
                  </PastTimerInfo>
                  <PastTimerActions>
                    <PastTimerDuration>
                      {formatTime(timer.duration)}
                    </PastTimerDuration>
                    <ContinueButton
                      onClick={() => continueTimer(timer)}
                      disabled={isRunning}
                    >
                      <FiPlay size={14} />
                      Continue
                    </ContinueButton>
                  </PastTimerActions>
                </PastTimerItem>
              ))
            ) : (
              <EmptyPastTimers>
                No past timers found. Start your first timer below!
              </EmptyPastTimers>
            )}
          </PastTimersList>
        )}

        {showPastTimers && showTimeline && (
          <TimelineContainer>
            <TimelineHeader>
              <TimelineTitle>Timeline View</TimelineTitle>
              <ProjectFilter
                value={selectedTimelineProject}
                onChange={(e) => setSelectedTimelineProject(e.target.value)}
              >
                <option value="">All Projects</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </ProjectFilter>
            </TimelineHeader>
            <Timeline selectedProject={selectedTimelineProject} />
          </TimelineContainer>
        )}
      </PastTimersCard>

      <TimerCard>
        <TimerDisplay isRunning={isRunning}>
          {formatTime(elapsedTime)}
        </TimerDisplay>
        <TimerControls>
          <ControlButton
            className="primary"
            isRunning={isRunning}
            onClick={isRunning ? stopTimer : startTimer}
            disabled={!isRunning && !formData.project}
          >
            {isRunning ? <FiPause /> : <FiPlay />}
          </ControlButton>
        </TimerControls>{" "}
        {runningEntry && (
          <CurrentActivity>
            <ActivityTitle>
              <FiClock style={{ marginRight: "8px" }} />
              Currently tracking: {runningEntry.project?.name}
            </ActivityTitle>
            <ActivityMeta>
              {runningEntry.task?.name && `Task: ${runningEntry.task.name} • `}
              Started: {new Date(runningEntry.startTime).toLocaleTimeString()}
            </ActivityMeta>
          </CurrentActivity>
        )}
        {/* Break Controls */}
        {runningEntry && (
          <BreakCard isOnBreak={!!activeBreak}>
            <BreakStatus isOnBreak={!!activeBreak}>
              <FiCoffee />
              {activeBreak ? "On Break" : "Ready for Break"}
            </BreakStatus>

            {activeBreak ? (
              <div>
                <div
                  style={{ marginTop: "8px", fontSize: "14px", color: "#666" }}
                >
                  Break Type: {activeBreak.breakType} • Started:{" "}
                  {new Date(activeBreak.startTime).toLocaleTimeString()}
                </div>
                <BreakControls>
                  <BreakButton className="end-break" onClick={endBreak}>
                    <FiCheckCircle size={16} />
                    End Break
                  </BreakButton>
                </BreakControls>
              </div>
            ) : (
              <BreakControls>
                <BreakTypeSelect
                  value={breakType}
                  onChange={(e) => setBreakType(e.target.value)}
                >
                  <option value="coffee">Coffee Break</option>
                  <option value="lunch">Lunch Break</option>
                  <option value="personal">Personal Break</option>
                  <option value="meeting">Meeting</option>
                  <option value="other">Other</option>
                </BreakTypeSelect>
                <BreakButton className="start-break" onClick={startBreak}>
                  <FiCoffee size={16} />
                  Start Break
                </BreakButton>
              </BreakControls>
            )}
          </BreakCard>
        )}
        {/* Resume Last Task - shown when no timer is running and no active break */}
        {!isRunning && !activeBreak && (
          <BreakCard>
            <BreakStatus>
              <FiClock />
              Quick Actions
            </BreakStatus>
            <BreakControls>
              <BreakButton className="end-break" onClick={resumeLastTask}>
                <FiPlay size={16} />
                Resume Last Task
              </BreakButton>
            </BreakControls>
          </BreakCard>
        )}
        <TimerForm>
          <FormGroup>
            <Label>Project *</Label>
            <Select
              value={formData.project}
              onChange={(e) => handleFormChange("project", e.target.value)}
              disabled={isRunning}
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Task (Optional)</Label>
            <Select
              value={formData.task}
              onChange={(e) => handleFormChange("task", e.target.value)}
              disabled={isRunning || !formData.project}
            >
              <option value="">Select a task</option>
              {tasks.map((task) => (
                <option key={task._id} value={task._id}>
                  {task.name}
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleFormChange("description", e.target.value)}
              placeholder="What are you working on?"
            />
          </FormGroup>
        </TimerForm>
      </TimerCard>
    </TimerContainer>
  );
};

export default Timer;
