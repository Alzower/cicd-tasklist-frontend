import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TaskItem } from "../components/TaskItem";
import type { Task } from "../types/task";

const baseTask: Task = {
  id: 1,
  title: "Faire les courses",
  description: "Lait, œufs, pain",
  completed: false,
  createdAt: "2026-01-15T10:00:00Z",
  updatedAt: "2026-01-15T10:00:00Z",
};

describe("TaskItem", () => {
  it("renders title, description and formatted date", () => {
    render(
      <TaskItem
        task={baseTask}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText("Faire les courses")).toBeInTheDocument();
    expect(screen.getByText("Lait, œufs, pain")).toBeInTheDocument();
    expect(screen.getByText("15 janvier 2026")).toBeInTheDocument();
  });

  it("does not render a description paragraph when description is null", () => {
    render(
      <TaskItem
        task={{ ...baseTask, description: null }}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.queryByText("Lait, œufs, pain")).not.toBeInTheDocument();
  });

  it("applies the task-completed class when completed", () => {
    render(
      <TaskItem
        task={{ ...baseTask, completed: true }}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByTestId("task-item")).toHaveClass("task-completed");
  });

  it("checkbox reflects completed state and has correct aria-label", () => {
    render(
      <TaskItem
        task={baseTask}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    const checkbox = screen.getByLabelText(
      'Marquer "Faire les courses" comme terminée',
    ) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it("calls onToggle with the task id when checkbox is clicked", () => {
    const onToggle = vi.fn();
    render(
      <TaskItem
        task={baseTask}
        onToggle={onToggle}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    fireEvent.click(
      screen.getByLabelText('Marquer "Faire les courses" comme terminée'),
    );
    expect(onToggle).toHaveBeenCalledWith(1);
  });

  describe("editing", () => {
    it("enters edit mode with pre-filled values when clicking edit", () => {
      render(
        <TaskItem
          task={baseTask}
          onToggle={vi.fn()}
          onDelete={vi.fn()}
          onEdit={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByLabelText("Modifier"));
      expect(screen.getByLabelText("Modifier le titre")).toHaveValue(
        "Faire les courses",
      );
      expect(screen.getByLabelText("Modifier la description")).toHaveValue(
        "Lait, œufs, pain",
      );
    });

    it("cancel restores original values, hides the form and does not call onEdit", () => {
      const onEdit = vi.fn();
      render(
        <TaskItem
          task={baseTask}
          onToggle={vi.fn()}
          onDelete={vi.fn()}
          onEdit={onEdit}
        />,
      );
      fireEvent.click(screen.getByLabelText("Modifier"));
      fireEvent.change(screen.getByLabelText("Modifier le titre"), {
        target: { value: "Titre modifié" },
      });
      fireEvent.click(screen.getByText("Annuler"));

      expect(onEdit).not.toHaveBeenCalled();
      expect(
        screen.queryByLabelText("Modifier le titre"),
      ).not.toBeInTheDocument();
      expect(screen.getByText("Faire les courses")).toBeInTheDocument();
    });

    it("save calls onEdit with trimmed title/description and closes the form", () => {
      const onEdit = vi.fn();
      render(
        <TaskItem
          task={baseTask}
          onToggle={vi.fn()}
          onDelete={vi.fn()}
          onEdit={onEdit}
        />,
      );
      fireEvent.click(screen.getByLabelText("Modifier"));
      fireEvent.change(screen.getByLabelText("Modifier le titre"), {
        target: { value: "  Nouveau titre  " },
      });
      fireEvent.change(screen.getByLabelText("Modifier la description"), {
        target: { value: "  Nouvelle description  " },
      });
      fireEvent.click(screen.getByText("Enregistrer"));

      expect(onEdit).toHaveBeenCalledWith(1, {
        title: "Nouveau titre",
        description: "Nouvelle description",
      });
      expect(
        screen.queryByLabelText("Modifier le titre"),
      ).not.toBeInTheDocument();
    });

    it("save sends description: undefined when description is blank", () => {
      const onEdit = vi.fn();
      render(
        <TaskItem
          task={baseTask}
          onToggle={vi.fn()}
          onDelete={vi.fn()}
          onEdit={onEdit}
        />,
      );
      fireEvent.click(screen.getByLabelText("Modifier"));
      fireEvent.change(screen.getByLabelText("Modifier la description"), {
        target: { value: "   " },
      });
      fireEvent.click(screen.getByText("Enregistrer"));

      expect(onEdit).toHaveBeenCalledWith(1, {
        title: "Faire les courses",
        description: undefined,
      });
    });

    it("does not call onEdit and keeps the form open when title is blank", () => {
      const onEdit = vi.fn();
      render(
        <TaskItem
          task={baseTask}
          onToggle={vi.fn()}
          onDelete={vi.fn()}
          onEdit={onEdit}
        />,
      );
      fireEvent.click(screen.getByLabelText("Modifier"));
      fireEvent.change(screen.getByLabelText("Modifier le titre"), {
        target: { value: "   " },
      });
      fireEvent.click(screen.getByText("Enregistrer"));

      expect(onEdit).not.toHaveBeenCalled();
      expect(screen.getByLabelText("Modifier le titre")).toBeInTheDocument();
    });
  });

  describe("delete confirmation", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("requires a second click to actually delete, and shows a warning icon in between", () => {
      const onDelete = vi.fn();
      render(
        <TaskItem
          task={baseTask}
          onToggle={vi.fn()}
          onDelete={onDelete}
          onEdit={vi.fn()}
        />,
      );
      const deleteButton = screen.getByLabelText("Supprimer");

      fireEvent.click(deleteButton);
      expect(onDelete).not.toHaveBeenCalled();
      expect(screen.getByText("⚠️")).toBeInTheDocument();

      fireEvent.click(deleteButton);
      expect(onDelete).toHaveBeenCalledWith(1);
    });

    it("resets the confirmation state after 3 seconds", () => {
      render(
        <TaskItem
          task={baseTask}
          onToggle={vi.fn()}
          onDelete={vi.fn()}
          onEdit={vi.fn()}
        />,
      );
      const deleteButton = screen.getByLabelText("Supprimer");

      fireEvent.click(deleteButton);
      expect(screen.getByText("⚠️")).toBeInTheDocument();

      vi.advanceTimersByTime(3000);
    });
  });
});
