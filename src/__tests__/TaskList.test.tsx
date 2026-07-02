import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TaskList } from "../components/TaskList";
import type { Task } from "../types/task";

vi.mock("../components/TaskItem", () => ({
  TaskItem: ({ task, onToggle, onDelete, onEdit }: any) => (
    <div data-testid={`task-item-${task.id}`}>
      <span>{task.title}</span>
      <button onClick={() => onToggle(task.id)}>toggle</button>
      <button onClick={() => onDelete(task.id)}>delete</button>
      <button onClick={() => onEdit(task.id, { title: "edited" })}>edit</button>
    </div>
  ),
}));

const mockTasks: Task[] = [
  {
    id: 1,
    title: "Première tâche",
    description: "Description 1",
    completed: false,
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-01-15T10:00:00Z",
  },
  {
    id: 2,
    title: "Deuxième tâche",
    description: null,
    completed: true,
    createdAt: "2026-01-16T10:00:00Z",
    updatedAt: "2026-01-16T10:00:00Z",
  },
];

describe("TaskList", () => {
  it("shows loading state", () => {
    render(
      <TaskList
        tasks={[]}
        loading={true}
        error={null}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByTestId("loading")).toBeInTheDocument();
    expect(screen.getByText("Chargement des tâches...")).toBeInTheDocument();
  });

  it("shows error state and does not render the task list", () => {
    render(
      <TaskList
        tasks={[]}
        loading={false}
        error="Erreur réseau"
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByTestId("error")).toBeInTheDocument();
    expect(screen.getByText("Erreur : Erreur réseau")).toBeInTheDocument();
    expect(screen.queryByTestId("task-list")).not.toBeInTheDocument();
  });

  it("shows empty state when there are no tasks", () => {
    render(
      <TaskList
        tasks={[]}
        loading={false}
        error={null}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByTestId("empty")).toBeInTheDocument();
    expect(screen.getByText("Aucune tâche")).toBeInTheDocument();
    expect(
      screen.getByText("Commencez par ajouter votre première tâche !"),
    ).toBeInTheDocument();
  });

  it("prioritizes loading over error and empty states", () => {
    render(
      <TaskList
        tasks={[]}
        loading={true}
        error="Erreur réseau"
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByTestId("loading")).toBeInTheDocument();
    expect(screen.queryByTestId("error")).not.toBeInTheDocument();
  });

  it("prioritizes error over empty state", () => {
    render(
      <TaskList
        tasks={[]}
        loading={false}
        error="Erreur réseau"
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByTestId("error")).toBeInTheDocument();
    expect(screen.queryByTestId("empty")).not.toBeInTheDocument();
  });

  it("renders list of tasks", () => {
    render(
      <TaskList
        tasks={mockTasks}
        loading={false}
        error={null}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByTestId("task-list")).toBeInTheDocument();
    expect(screen.getByText("Première tâche")).toBeInTheDocument();
    expect(screen.getByText("Deuxième tâche")).toBeInTheDocument();
    expect(screen.getByText("2 tâches")).toBeInTheDocument();
  });

  it("uses singular form when there is only one task", () => {
    render(
      <TaskList
        tasks={[mockTasks[0]]}
        loading={false}
        error={null}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText("1 tâche")).toBeInTheDocument();
  });

  it("displays the correct completed task count (plural)", () => {
    render(
      <TaskList
        tasks={mockTasks}
        loading={false}
        error={null}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    // 1 seule tâche terminée dans mockTasks -> singulier
    expect(screen.getByText("1 terminée")).toBeInTheDocument();
  });

  it("displays the completed count in plural when more than one task is completed", () => {
    const allCompleted = mockTasks.map((t) => ({ ...t, completed: true }));
    render(
      <TaskList
        tasks={allCompleted}
        loading={false}
        error={null}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText("2 terminées")).toBeInTheDocument();
  });

  it("displays 0 terminée when no task is completed", () => {
    const noneCompleted = mockTasks.map((t) => ({ ...t, completed: false }));
    render(
      <TaskList
        tasks={noneCompleted}
        loading={false}
        error={null}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText("0 terminée")).toBeInTheDocument();
  });

  it("renders one TaskItem per task with a stable key/testid", () => {
    render(
      <TaskList
        tasks={mockTasks}
        loading={false}
        error={null}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByTestId("task-item-1")).toBeInTheDocument();
    expect(screen.getByTestId("task-item-2")).toBeInTheDocument();
  });

  it("calls onToggle with the correct task id", () => {
    const onToggle = vi.fn();
    render(
      <TaskList
        tasks={mockTasks}
        loading={false}
        error={null}
        onToggle={onToggle}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId("task-item-2").querySelector("button")!);
    expect(onToggle).toHaveBeenCalledWith(2);
  });

  it("calls onDelete with the correct task id", () => {
    const onDelete = vi.fn();
    render(
      <TaskList
        tasks={mockTasks}
        loading={false}
        error={null}
        onToggle={vi.fn()}
        onDelete={onDelete}
        onEdit={vi.fn()}
      />,
    );
    fireEvent.click(
      screen.getByTestId("task-item-1").querySelectorAll("button")[1],
    );
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it("calls onEdit with the correct task id and payload", () => {
    const onEdit = vi.fn();
    render(
      <TaskList
        tasks={mockTasks}
        loading={false}
        error={null}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={onEdit}
      />,
    );
    fireEvent.click(
      screen.getByTestId("task-item-1").querySelectorAll("button")[2],
    );
    expect(onEdit).toHaveBeenCalledWith(1, { title: "edited" });
  });
});
