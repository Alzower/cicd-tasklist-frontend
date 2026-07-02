import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TaskForm } from "../components/TaskForm";

describe("TaskForm", () => {
  it("renders create mode by default", () => {
    render(<TaskForm onSubmit={vi.fn()} />);
    expect(screen.getByText("Nouvelle tâche")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ajouter" })).toBeInTheDocument();
  });

  it("renders edit mode with matching header and button label", () => {
    render(<TaskForm onSubmit={vi.fn()} mode="edit" />);
    expect(screen.getByText("Modifier la tâche")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Modifier" }),
    ).toBeInTheDocument();
  });

  it("prefills fields from initialValues", () => {
    render(
      <TaskForm
        onSubmit={vi.fn()}
        mode="edit"
        initialValues={{
          title: "Titre existant",
          description: "Desc existante",
        }}
      />,
    );
    expect(screen.getByLabelText("Titre")).toHaveValue("Titre existant");
    expect(screen.getByLabelText("Description")).toHaveValue("Desc existante");
  });

  it("shows a validation error and does not call onSubmit when title is empty", () => {
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Le titre est requis");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("clears the validation error as soon as the user types in the title", () => {
    render(<TaskForm onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Titre"), {
      target: { value: "A" },
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("submits trimmed title and description", () => {
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("Titre"), {
      target: { value: "  Ma tâche  " },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "  Ma description  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Ma tâche",
      description: "Ma description",
    });
  });

  it("submits description: undefined when description is left blank", () => {
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("Titre"), {
      target: { value: "Ma tâche" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Ma tâche",
      description: undefined,
    });
  });

  it("resets fields after submit in create mode", () => {
    render(<TaskForm onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Titre"), {
      target: { value: "Ma tâche" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));

    expect(screen.getByLabelText("Titre")).toHaveValue("");
  });

  it("does not reset fields after submit in edit mode", () => {
    render(
      <TaskForm
        onSubmit={vi.fn()}
        mode="edit"
        initialValues={{ title: "Titre existant" }}
      />,
    );
    fireEvent.change(screen.getByLabelText("Titre"), {
      target: { value: "Titre modifié" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));

    expect(screen.getByLabelText("Titre")).toHaveValue("Titre modifié");
  });

  it("does not render a cancel button when onCancel is not provided", () => {
    render(<TaskForm onSubmit={vi.fn()} />);
    expect(screen.queryByText("Annuler")).not.toBeInTheDocument();
  });

  it("renders a cancel button and calls onCancel when provided", () => {
    const onCancel = vi.fn();
    render(<TaskForm onSubmit={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Annuler"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
