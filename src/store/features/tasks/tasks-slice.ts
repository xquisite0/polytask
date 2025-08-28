import undoable, { groupByActionTypes } from 'redux-undo';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TaskRaw } from '~/components/tasks/types';
import { mockTasks } from '~/data/mock-tasks';

export interface TasksState {
  tasks: TaskRaw[];
  selectedTaskId: string | null;
}

const initialState: TasksState = {
  tasks: mockTasks,
  selectedTaskId: null,
};

export const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    addTask: (state, action: PayloadAction<TaskRaw>) => {
      state.tasks.unshift(action.payload);
    },
    updateTask: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<TaskRaw> }>,
    ) => {
      const { id, updates } = action.payload;
      const taskIndex = state.tasks.findIndex((task) => task.id === id);
      if (taskIndex !== -1) {
        state.tasks[taskIndex] = {
          ...state.tasks[taskIndex],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      const taskIdToDelete = action.payload;
      const currentIndex = state.tasks.findIndex(
        (task) => task.id === taskIdToDelete,
      );

      // If the task being deleted is currently selected, select the next task
      if (state.selectedTaskId === taskIdToDelete) {
        if (currentIndex !== -1 && state.tasks.length > 1) {
          // Try to select the next task, or the previous one if this is the last task
          const nextIndex =
            currentIndex < state.tasks.length - 1
              ? currentIndex + 1
              : currentIndex - 1;
          state.selectedTaskId = state.tasks[nextIndex].id;
        } else {
          // No other tasks available, clear selection
          state.selectedTaskId = null;
        }
      }

      // Remove the task from the list
      state.tasks = state.tasks.filter((task) => task.id !== taskIdToDelete);
    },
    // Assignee operations
    assignTask: (
      state,
      action: PayloadAction<{ id: string; assigneeId: string }>,
    ) => {
      const { id, assigneeId } = action.payload;
      const task = state.tasks.find((task) => task.id === id);
      if (task) {
        task.assigneeId = assigneeId;
        task.updatedAt = new Date().toISOString();
      }
    },
    // Labels operations
    addTaskLabel: (
      state,
      action: PayloadAction<{ id: string; label: string }>,
    ) => {
      const { id, label } = action.payload;
      const task = state.tasks.find((task) => task.id === id);
      if (task) {
        if (!task.labels) {
          task.labels = [];
        }
        if (!task.labels.includes(label)) {
          task.labels.push(label);
          task.updatedAt = new Date().toISOString();
        }
      }
    },
    removeTaskLabel: (
      state,
      action: PayloadAction<{ id: string; label: string }>,
    ) => {
      const { id, label } = action.payload;
      const task = state.tasks.find((task) => task.id === id);
      if (task && task.labels) {
        task.labels = task.labels.filter((l) => l !== label);
        task.updatedAt = new Date().toISOString();
      }
    },
    // Task selection operations
    setSelectedTask: (state, action: PayloadAction<string | null>) => {
      state.selectedTaskId = action.payload;
    },
    clearSelectedTask: (state) => {
      state.selectedTaskId = null;
    },
    selectTaskById: (state, action: PayloadAction<string>) => {
      state.selectedTaskId = action.payload;
    },
    resetTasks: (state) => {
      state.tasks = mockTasks;
      state.selectedTaskId = null;
    },
  },
});

export const {
  addTask,
  updateTask,
  deleteTask,
  assignTask,
  addTaskLabel,
  removeTaskLabel,
  setSelectedTask,
  clearSelectedTask,
  selectTaskById,
  resetTasks,
} = tasksSlice.actions;

const undoableTasks = undoable(tasksSlice.reducer, {
  groupBy: groupByActionTypes([selectTaskById.type]),
});

export default undoableTasks;
