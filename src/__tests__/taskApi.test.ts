import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from "../api/taskApi";

const mockTask = {
  id: 1,
  title: "Test",
  description: null,
  completed: false,
  createdAt: "2026-01-15T10:00:00Z",
  updatedAt: "2026-01-15T10:00:00Z",
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("taskApi", () => {
  describe("getTasks", () => {
    it("returns array of tasks on success", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve([mockTask]),
        }),
      );

      const tasks = await getTasks();
      expect(tasks).toEqual([mockTask]);
      expect(fetch).toHaveBeenCalledWith("/api/tasks");
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("throws an error when the response is not ok", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          text: () => Promise.resolve("Internal Server Error"),
        }),
      );

      await expect(getTasks()).rejects.toThrow(
        "HTTP 500: Internal Server Error",
      );
    });
  });

  describe("getTask", () => {
    it("returns a single task on success", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockTask),
        }),
      );

      const task = await getTask(1);
      expect(task).toEqual(mockTask);
      expect(fetch).toHaveBeenCalledWith("/api/tasks/1");
    });

    it("throws an error when the task is not found", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
          text: () => Promise.resolve("Not Found"),
        }),
      );

      await expect(getTask(999)).rejects.toThrow("HTTP 404: Not Found");
      expect(fetch).toHaveBeenCalledWith("/api/tasks/999");
    });
  });

  describe("createTask", () => {
    const payload = { title: "New task", description: "desc" };

    it("creates a task and returns it on success", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockTask),
        }),
      );

      const task = await createTask(payload);
      expect(task).toEqual(mockTask);
      expect(fetch).toHaveBeenCalledWith("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    });

    it("throws an error when creation fails", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          text: () => Promise.resolve("Bad Request"),
        }),
      );

      await expect(createTask(payload)).rejects.toThrow(
        "HTTP 400: Bad Request",
      );
    });
  });

  describe("updateTask", () => {
    const payload = { title: "Updated title" };

    it("updates a task and returns it on success", async () => {
      const updatedTask = { ...mockTask, title: "Updated title" };
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(updatedTask),
        }),
      );

      const task = await updateTask(1, payload);
      expect(task).toEqual(updatedTask);
      expect(fetch).toHaveBeenCalledWith("/api/tasks/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    });

    it("throws an error when update fails", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
          text: () => Promise.resolve("Not Found"),
        }),
      );

      await expect(updateTask(1, payload)).rejects.toThrow(
        "HTTP 404: Not Found",
      );
    });
  });

  describe("deleteTask", () => {
    it("resolves with no value on success", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
        }),
      );

      const result = await deleteTask(1);
      expect(result).toBeUndefined();
      expect(fetch).toHaveBeenCalledWith("/api/tasks/1", {
        method: "DELETE",
      });
    });

    it("throws an error when deletion fails", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 403,
          text: () => Promise.resolve("Forbidden"),
        }),
      );

      await expect(deleteTask(1)).rejects.toThrow("HTTP 403: Forbidden");
    });
  });
});
