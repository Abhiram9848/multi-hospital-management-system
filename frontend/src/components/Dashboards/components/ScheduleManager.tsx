import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ScheduleManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isBlocked: boolean;
  reason?: string;
}

interface DoctorSchedule {
  doctorId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  availableHours: {
    start: string;
    end: string;
  };
  timeSlots: TimeSlot[];
  isAvailable: boolean;
}

const ScheduleManager: React.FC<ScheduleManagerProps> = ({ isOpen, onClose }) => {
  const [schedule, setSchedule] = useState<DoctorSchedule[]>([]);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const daysOfWeek = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  const currentDaySchedule = schedule.find(s => s.dayOfWeek === selectedDay) || {
    doctorId: '',
    dayOfWeek: selectedDay,
    availableHours: { start: '09:00', end: '17:00' },
    timeSlots: [],
    isAvailable: true
  };

  useEffect(() => {
    if (isOpen) {
      fetchSchedule();
    }
  }, [isOpen]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/schedules', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const backendSchedules = response.data.map((schedule: any) => ({
        doctorId: schedule.doctor,
        dayOfWeek: schedule.dayOfWeek,
        availableHours: schedule.availableHours,
        timeSlots: schedule.timeSlots,
        isAvailable: schedule.isAvailable
      }));

      setSchedule(backendSchedules);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = (start: string, end: string): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startTime = new Date(`2000-01-01T${start}`);
    const endTime = new Date(`2000-01-01T${end}`);
    
    let currentTime = startTime;
    let slotId = 1;

    while (currentTime < endTime) {
      const nextTime = new Date(currentTime);
      nextTime.setMinutes(currentTime.getMinutes() + 30); // 30-minute slots

      if (nextTime <= endTime) {
        slots.push({
          id: `slot-${slotId++}`,
          startTime: currentTime.toTimeString().slice(0, 5),
          endTime: nextTime.toTimeString().slice(0, 5),
          isBlocked: false
        });
      }
      currentTime = nextTime;
    }

    return slots;
  };

  const updateAvailableHours = (start: string, end: string) => {
    const updatedSchedule = schedule.map(daySchedule => 
      daySchedule.dayOfWeek === selectedDay
        ? {
            ...daySchedule,
            availableHours: { start, end },
            timeSlots: generateTimeSlots(start, end)
          }
        : daySchedule
    );
    setSchedule(updatedSchedule);
  };

  const toggleDayAvailability = () => {
    const updatedSchedule = schedule.map(daySchedule => 
      daySchedule.dayOfWeek === selectedDay
        ? { ...daySchedule, isAvailable: !daySchedule.isAvailable }
        : daySchedule
    );
    setSchedule(updatedSchedule);
  };

  const toggleTimeSlot = async (slotIndex: number, reason?: string) => {
    const currentSchedule = schedule.find(s => s.dayOfWeek === selectedDay);
    if (!currentSchedule) return;

    const slot = currentSchedule.timeSlots[slotIndex];
    const isBlocked = !slot.isBlocked;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/schedules/${selectedDay}/slot/${slotIndex}`,
        { isBlocked, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      const updatedSchedule = schedule.map(daySchedule => 
        daySchedule.dayOfWeek === selectedDay
          ? {
              ...daySchedule,
              timeSlots: daySchedule.timeSlots.map((slot, index) =>
                index === slotIndex
                  ? { ...slot, isBlocked, reason: isBlocked ? reason : undefined }
                  : slot
              )
            }
          : daySchedule
      );
      setSchedule(updatedSchedule);
    } catch (error) {
      console.error('Error toggling time slot:', error);
      alert('Error updating time slot. Please try again.');
    }
  };

  const blockTimeSlot = (slotIndex: number) => {
    const reason = prompt('Reason for blocking this time slot:');
    if (reason) {
      toggleTimeSlot(slotIndex, reason);
    }
  };

  const saveSchedule = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Save each day's schedule
      for (const daySchedule of schedule) {
        await axios.put(
          `http://localhost:5000/api/schedules/${daySchedule.dayOfWeek}`,
          {
            isAvailable: daySchedule.isAvailable,
            availableHours: daySchedule.availableHours,
            timeSlots: daySchedule.timeSlots
          },
          { headers }
        );
      }
      
      alert('Schedule saved successfully!');
      await fetchSchedule(); // Refresh the schedule
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Error saving schedule. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content schedule-manager-modal">
        <div className="modal-header">
          <h2>📅 Schedule Management</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="schedule-content">
          <div className="day-selector">
            <h3>Select Day:</h3>
            <div className="day-buttons">
              {daysOfWeek.map((day, index) => (
                <button
                  key={index}
                  className={`day-btn ${selectedDay === index ? 'active' : ''}`}
                  onClick={() => setSelectedDay(index)}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="loading-state">Loading schedule...</div>
          ) : (
            <div className="schedule-details">
              <div className="day-settings">
                <h3>{daysOfWeek[selectedDay]} Settings</h3>
                
                <div className="availability-toggle">
                  <label>
                    <input
                      type="checkbox"
                      checked={currentDaySchedule.isAvailable}
                      onChange={toggleDayAvailability}
                    />
                    Available on {daysOfWeek[selectedDay]}
                  </label>
                </div>

                {currentDaySchedule.isAvailable && (
                  <div className="working-hours">
                    <h4>Working Hours:</h4>
                    <div className="time-inputs">
                      <div className="time-input-group">
                        <label>Start Time:</label>
                        <input
                          type="time"
                          value={currentDaySchedule.availableHours.start}
                          onChange={(e) => updateAvailableHours(e.target.value, currentDaySchedule.availableHours.end)}
                        />
                      </div>
                      <div className="time-input-group">
                        <label>End Time:</label>
                        <input
                          type="time"
                          value={currentDaySchedule.availableHours.end}
                          onChange={(e) => updateAvailableHours(currentDaySchedule.availableHours.start, e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {currentDaySchedule.isAvailable && (
                <div className="time-slots-section">
                  <h4>Time Slots Management:</h4>
                  <p className="slots-info">Click on time slots to block/unblock them</p>
                  
                  <div className="time-slots-grid">
                    {currentDaySchedule.timeSlots.map((slot, index) => (
                      <div
                        key={`${slot.startTime}-${slot.endTime}`}
                        className={`time-slot ${slot.isBlocked ? 'blocked' : 'available'}`}
                        onClick={() => slot.isBlocked ? toggleTimeSlot(index) : blockTimeSlot(index)}
                      >
                        <div className="slot-time">
                          {slot.startTime} - {slot.endTime}
                        </div>
                        <div className="slot-status">
                          {slot.isBlocked ? (
                            <>
                              <span className="blocked-indicator">🚫 Blocked</span>
                              {slot.reason && <div className="block-reason">{slot.reason}</div>}
                            </>
                          ) : (
                            <span className="available-indicator">✅ Available</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="schedule-actions">
                <button
                  className="primary-btn"
                  onClick={saveSchedule}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : '💾 Save Schedule'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleManager;
