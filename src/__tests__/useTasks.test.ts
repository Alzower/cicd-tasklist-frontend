import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTasks } from "../hooks/useTasks";
import * as taskApi from "../api/taskApi";
import type { Task } from "../types/task";

vi.mock("../api/taskApi");

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 1,
  title: "Tâche",
  description: null,
  completed: false,
  createdAt: "2026-01-15T10:00:00Z",
  updatedAt: "2026-01-15T10:00:00Z",
  ...overrides,
});

describe("useTasks", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads tasks on mount and sets loading correctly", async () => {
    const tasks = [makeTask({ id: 1 }), makeTask({ id: 2 })];
    vi.mocked(taskApi.getTasks).mockResolvedValue(tasks);

    const { result } = renderHook(() => useTasks());
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tasks).toEqual(tasks);
    expect(result.current.error).toBeNull();
  });

  it("sets an error message when loading fails", async () => {
    vi.mocked(taskApi.getTasks).mockRejectedValue(new Error("HTTP 500: boom"));

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("HTTP 500: boom");
    expect(result.current.tasks).toEqual([]);
  });

  it("falls back to a generic message when the thrown error is not an Error instance", async () => {
    vi.mocked(taskApi.getTasks).mockRejectedValue("not an error");

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Une erreur est survenue");
  });

  it("addTask prepends the newly created task", async () => {
    vi.mocked(taskApi.getTasks).mockResolvedValue([makeTask({ id: 1 })]);
    const newTask = makeTask({ id: 2, title: "Nouvelle" });
    vi.mocked(taskApi.createTask).mockResolvedValue(newTask);

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addTask({ title: "Nouvelle" });
    });

    expect(taskApi.createTask).toHaveBeenCalledWith({ title: "Nouvelle" });
    expect(result.current.tasks).toEqual([newTask, makeTask({ id: 1 })]);
  });

  it("editTask replaces the matching task with the updated one", async () => {
    const original = makeTask({ id: 1, title: "Avant" });
    vi.mocked(taskApi.getTasks).mockResolvedValue([original]);
    const updated = makeTask({ id: 1, title: "Après" });
    vi.mocked(taskApi.updateTask).mockResolvedValue(updated);

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.editTask(1, { title: "Après" });
    });

    expect(taskApi.updateTask).toHaveBeenCalledWith(1, { title: "Après" });
    expect(result.current.tasks).toEqual([updated]);
  });

  it("removeTask deletes the task and filters it out of state", async () => {
    vi.mocked(taskApi.getTasks).mockResolvedValue([
      makeTask({ id: 1 }),
      makeTask({ id: 2 }),
    ]);
    vi.mocked(taskApi.deleteTask).mockResolvedValue(undefined);

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.removeTask(1);
    });

    expect(taskApi.deleteTask).toHaveBeenCalledWith(1);
    expect(result.current.tasks).toEqual([makeTask({ id: 2 })]);
  });

  it("toggleComplete flips the completed flag via updateTask", async () => {
    vi.mocked(taskApi.getTasks).mockResolvedValue([
      makeTask({ id: 1, completed: false }),
    ]);
    const updated = makeTask({ id: 1, completed: true });
    vi.mocked(taskApi.updateTask).mockResolvedValue(updated);

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.toggleComplete(1);
    });

    expect(taskApi.updateTask).toHaveBeenCalledWith(1, { completed: true });
    expect(result.current.tasks).toEqual([updated]);
  });

  it("toggleComplete does nothing when the task id is not found", async () => {
    vi.mocked(taskApi.getTasks).mockResolvedValue([makeTask({ id: 1 })]);

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.toggleComplete(999);
    });
  });

  it("loadTasks can be called again manually to refresh the list", async () => {
    vi.mocked(taskApi.getTasks)
      .mockResolvedValueOnce([makeTask({ id: 1 })])
      .mockResolvedValueOnce([makeTask({ id: 1 }), makeTask({ id: 2 })]);

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tasks).toHaveLength(1);

    await act(async () => {
      await result.current.loadTasks();
    });

    expect(result.current.tasks).toHaveLength(2);
  });
});
