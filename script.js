// Get references to elements
const newTasks = document.getElementById("new-tasks");
const pendingTasks = document.getElementById("pending-tasks");
const completedTasks = document.getElementById("completed-tasks");
const scheduledTasks = document.getElementById("scheduled-tasks");
const taskInput = document.getElementById("new-task-input");
const taskContent = document.getElementById("new-task-content");
const taskFile = document.getElementById("new-task-file");
const modal = document.getElementById("taskModal");
const addTaskBtn = document.getElementById("addTaskBtn");
const span = document.getElementsByClassName("close")[0];

// Categories to manage task movement
const categories = ["New", "Pending", "Completed", "Scheduled"];
let selectedTag = null;

// Initialize modal events
addTaskBtn.onclick = function () {
  modal.style.display = "block";
};

span.onclick = function () {
  closeModal();
};

window.onclick = function (event) {
  if (event.target == modal) {
    closeModal();
  }
};

// Initialize tag selector
function initializeTagSelector() {
  const tagOptions = document.querySelectorAll(".tag-option");
  tagOptions.forEach((option) => {
    option.addEventListener("click", () => {
      tagOptions.forEach((opt) => opt.classList.remove("selected"));
      option.classList.add("selected");
      selectedTag = option.dataset.tag;
    });
  });
}

// Modal and form handling
function closeModal() {
  modal.style.display = "none";
  resetForm();
}

function resetForm() {
  taskInput.value = "";
  taskContent.value = "";
  taskFile.value = "";
  selectedTag = null;
  document
    .querySelectorAll(".tag-option")
    .forEach((opt) => opt.classList.remove("selected"));
  document.querySelector(".file-text").textContent = "Choose a file";
}

// File input handling
document
  .getElementById("new-task-file")
  .addEventListener("change", function (e) {
    const fileName = e.target.files[0]?.name || "Choose a file";
    document.querySelector(".file-text").textContent = fileName;
  });

// Retrieve saved tasks from localStorage
function loadTasks() {
  // First check if we have a backup file stored
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".json";

  // Check if this is the first load
  if (!localStorage.getItem("initialized")) {
    // Set initialized flag
    localStorage.setItem("initialized", "true");

    // Prompt for backup file
    fileInput.click();

    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        loadFromJSON(e.target.files[0]);
      }
    });
  }

  // Continue with existing loadTasks logic
  categories.forEach((category) => {
    const tasks = JSON.parse(localStorage.getItem(category)) || [];
    tasks.forEach((task) => {
      addTaskToColumn(task, category);
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  // Initialize task lists
  initializeTagSelector();
  loadTasks();

  // Add create button event listener
  const createBtn = document.querySelector(".create-btn");
  if (createBtn) {
    createBtn.addEventListener("click", () => addTask("New"));
  } else {
    console.error("Create button not found");
  }
});

function animateNewTask(taskElement) {
  taskElement.style.opacity = "0";
  requestAnimationFrame(() => {
    taskElement.style.opacity = "1";
    taskElement.style.animation = "slideInFromLeft 0.4s ease-out forwards";
  });
}

function addTask(category) {
  const taskTitle = taskInput.value.trim();
  const taskText = taskContent.value.trim();
  const file = taskFile.files[0];
  const taskItem = document.createElement("li");
  taskItem.classList.add("task-item");
  animateNewTask(taskItem);

  if (taskTitle !== "" && taskText !== "" && selectedTag) {
    const task = {
      id: Date.now(),
      title: taskTitle,
      content: taskText,
      file: file ? URL.createObjectURL(file) : null,
      category: category,
      tag: selectedTag,
      createdAt: new Date().toISOString(),
    };

    addTaskToColumn(task, category);
    saveTaskToLocalStorage(task);
    closeModal();
  } else {
    // alert("Please fill in all required fields and select a tag!");
  }
  if (task.file) {
    const fileExtension = task.file.split(".").pop().toLowerCase();
    const fileType = getFileType(fileExtension);
    const fileName = task.file.split("/").pop();

    taskContent.innerHTML += `
        <a href="${
          task.file
        }" target="_blank" class="file-attachment file-type-${fileType}">
            <div class="file-icon">
                ${getFileIcon(fileType)}
            </div>
            <div class="file-details">
                <span class="file-name">${fileName}</span>
                <span class="file-size">Click to view</span>
            </div>
            <div class="download-icon">↓</div>
        </a>
    `;
  }
}

function getFileType(extension) {
  const imageTypes = ["jpg", "jpeg", "png", "gif", "webp"];
  const docTypes = ["doc", "docx", "txt", "rtf"];

  if (extension === "pdf") return "pdf";
  if (imageTypes.includes(extension)) return "image";
  if (docTypes.includes(extension)) return "doc";
  return "other";
}

function getFileIcon(type) {
  const icons = {
    pdf: "📄",
    image: "🖼️",
    doc: "📝",
    other: "📎",
  };
  return icons[type] || "📎";
}

// Create a task element and append it to the appropriate column
function addTaskToColumn(task, category) {
  const taskItem = document.createElement("li");
  taskItem.classList.add("task-item");
  taskItem.draggable = true;
  taskItem.id = `task-${task.id}`;
  taskItem.dataset.category = category;

  // Add the task title
  const taskTitle = document.createElement("div");
  taskTitle.classList.add("task-title");
  taskTitle.innerText = task.title;

  // Add tag to the task item
  const taskTag = document.createElement("span");
  taskTag.classList.add("task-tag");
  taskTag.classList.add(task.tag);
  taskTag.textContent = document.querySelector(
    `[data-tag="${task.tag}"] .tag-name`
  ).textContent;

  // Add content (initially hidden)
  const taskContent = document.createElement("div");
  taskContent.classList.add("task-content");

  const contentParagraph = document.createElement("p");
  contentParagraph.textContent = task.content;
  taskContent.appendChild(contentParagraph);

  // Add click event for editing content
  contentParagraph.addEventListener("click", (e) => {
    e.stopPropagation();

    // Create textarea
    const textarea = document.createElement("textarea");
    textarea.value = task.content;
    textarea.style.height = Math.max(100, contentParagraph.offsetHeight) + "px";

    // Replace paragraph with textarea
    taskContent.classList.add("editing");
    contentParagraph.replaceWith(textarea);
    textarea.focus();

    const saveChanges = () => {
      const newContent = textarea.value.trim();
      task.content = newContent;
      contentParagraph.textContent = newContent;
      taskContent.classList.remove("editing");
      textarea.replaceWith(contentParagraph);
      saveTaskToLocalStorage(task);
    };

    // Save on blur
    textarea.addEventListener("blur", saveChanges);

    // Save on Enter (but allow multiline with Shift+Enter)
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        textarea.blur();
      }
    });
  });

  if (task.file) {
    taskContent.innerHTML += `<a href="${task.file}" target="_blank" class="file-attachment">
            <span class="file-icon">📎</span>
            <span>View Attachment</span>
        </a>`;
  }

  // Add creation date
  const taskDate = document.createElement("div");
  taskDate.classList.add("task-date");
  taskDate.innerText = new Date(task.createdAt).toLocaleString();

  // Show content on hover
  taskTitle.addEventListener("mouseenter", () => {
    taskContent.classList.add("show");
  });

  // Toggle content on click
  taskTitle.addEventListener("click", () => {
    taskContent.classList.toggle("show");
  });

  // Enable content editing on click
  taskContent.addEventListener("click", (e) => {
    if (e.target.tagName !== "A") {
      // Prevent editing when clicking the file link
      const contentText = taskContent.querySelector("p");
      const editText = document.createElement("textarea");
      editText.value = contentText.innerText;
      taskContent.innerHTML = "";
      taskContent.appendChild(editText);
      editText.focus();

      editText.addEventListener("blur", () => {
        const updatedContent = editText.value.trim();
        task.content = updatedContent;
        contentText.innerText = updatedContent;
        taskContent.innerHTML = `<p>${updatedContent}</p>`;
        if (task.file) {
          taskContent.innerHTML += `<a href="${task.file}" target="_blank" class="file-attachment">
                        <span class="file-icon">📎</span>
                        <span>View Attachment</span>
                    </a>`;
        }
        saveTaskToLocalStorage(task);
      });
    }
  });

  // Handle content visibility
  taskItem.addEventListener("mouseenter", () => {
    if (!taskContent.classList.contains("editing")) {
      taskContent.classList.add("show");
    }
  });

  taskItem.addEventListener("mouseleave", (e) => {
    // Check if we're not currently editing
    if (!taskContent.classList.contains("editing")) {
      // Check if the related target is not a child of the task item
      if (!taskItem.contains(e.relatedTarget)) {
        taskContent.classList.remove("show");
      }
    }
  });

  // Prevent hiding content while editing
  taskContent.addEventListener("click", (e) => {
    if (taskContent.classList.contains("editing")) {
      e.stopPropagation();
    }
  });

  // Add drag events
  taskItem.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("taskId", task.id);
    taskItem.classList.add("dragging");
  });

  taskItem.addEventListener("dragend", () => {
    taskItem.classList.remove("dragging");
  });

  // Append elements to task item
  taskItem.appendChild(taskTag);
  taskItem.appendChild(taskTitle);
  taskItem.appendChild(taskContent);
  taskItem.appendChild(taskDate);

  // Append to appropriate column
  switch (category) {
    case "New":
      newTasks.appendChild(taskItem);
      break;
    case "Pending":
      pendingTasks.appendChild(taskItem);
      break;
    case "Completed":
      completedTasks.appendChild(taskItem);
      break;
    case "Scheduled":
      scheduledTasks.appendChild(taskItem);
      break;
  }
}

// Save task to localStorage
function saveTaskToLocalStorage(task) {
  const categoryTasks = JSON.parse(localStorage.getItem(task.category)) || [];
  const updatedTasks = categoryTasks.filter((t) => t.id !== task.id);
  updatedTasks.push(task);
  localStorage.setItem(task.category, JSON.stringify(updatedTasks));
}

// Handle drag events for task movement
function allowDrop(e) {
  e.preventDefault();
}

function drop(e) {
  e.preventDefault();

  const taskId = e.dataTransfer.getData("taskId");
  const taskItem = document.getElementById(`task-${taskId}`);
  const targetColumn = e.target.closest(".kanban-column");

  if (!targetColumn || !targetColumn.classList.contains("kanban-column"))
    return;

  const targetCategory =
    targetColumn.id.split("-")[0].charAt(0).toUpperCase() +
    targetColumn.id.split("-")[0].slice(1);

  // Remove task from current category in localStorage
  const currentCategory = taskItem.dataset.category;
  const tasksInCurrentCategory =
    JSON.parse(localStorage.getItem(currentCategory)) || [];
  const updatedTasks = tasksInCurrentCategory.filter((t) => t.id !== taskId);
  localStorage.setItem(currentCategory, JSON.stringify(updatedTasks));

  // Update task's category and save to new category
  taskItem.dataset.category = targetCategory;
  const task = {
    id: taskId,
    title: taskItem.querySelector(".task-title").innerText,
    content: taskItem.querySelector(".task-content p").innerText,
    file: taskItem.querySelector(".task-content a")
      ? taskItem.querySelector(".task-content a").href
      : null,
    category: targetCategory,
    tag: taskItem.querySelector(".task-tag").classList[1],
    createdAt: new Date().toISOString(),
  };

  // Add task to the new category
  const tasksInNewCategory =
    JSON.parse(localStorage.getItem(targetCategory)) || [];
  tasksInNewCategory.push(task);
  localStorage.setItem(targetCategory, JSON.stringify(tasksInNewCategory));

  // Move the task to the new column
  targetColumn.querySelector(".task-list").appendChild(taskItem);
}

// Initialize event listeners
document.querySelectorAll(".kanban-column").forEach((column) => {
  column.addEventListener("dragover", allowDrop);
  column.addEventListener("drop", drop);
});

// Add this to your existing JavaScript
document.addEventListener("DOMContentLoaded", function () {
  const darkModeToggle = document.getElementById("darkModeToggle");
  const body = document.body;

  // Check for saved dark mode preference
  const darkMode = localStorage.getItem("darkMode");
  if (darkMode === "enabled") {
    body.classList.add("dark-mode");
    darkModeToggle.querySelector(".toggle-icon").textContent = "🌜";
  }

  // Toggle dark mode
  darkModeToggle.addEventListener("click", () => {
    body.classList.toggle("dark-mode");

    // Update icon
    const icon = darkModeToggle.querySelector(".toggle-icon");
    if (body.classList.contains("dark-mode")) {
      icon.textContent = "🌜";
      localStorage.setItem("darkMode", "enabled");
    } else {
      icon.textContent = "🌞";
      localStorage.setItem("darkMode", null);
    }

    // Add animation effect
    icon.style.animation = "none";
    icon.offsetHeight; // Trigger reflow
    icon.style.animation = "rotate 0.5s ease";
  });
});

// Backup-related functions
const backupManager = {
  // Validate backup file structure
  isValidBackupFile(data) {
    try {
      // Check if data exists and is an object
      if (!data || typeof data !== "object") {
        console.log("Invalid data structure");
        return false;
      }

      // Check if tasks property exists
      if (!data.tasks || typeof data.tasks !== "object") {
        console.log("Missing or invalid tasks property");
        return false;
      }

      // Verify all categories exist
      const hasAllCategories = categories.every((category) => {
        const categoryExists = category in data.tasks;
        const isArray = Array.isArray(data.tasks[category]);
        if (!categoryExists || !isArray) {
          console.log(`Invalid category: ${category}`);
        }
        return categoryExists && isArray;
      });

      return hasAllCategories;
    } catch (error) {
      console.error("Error validating backup file:", error);
      return false;
    }
  },

  // Save current state to JSON file
  saveToJSON() {
    try {
      const data = {
        metadata: {
          timestamp: new Date().toISOString(),
          author: "GoCodeyialex",
          version: "1.0",
        },
        tasks: {},
        settings: {
          darkMode: localStorage.getItem("darkMode"),
        },
      };

      // Get all tasks from localStorage
      categories.forEach((category) => {
        const tasksString = localStorage.getItem(category);
        data.tasks[category] = tasksString ? JSON.parse(tasksString) : [];
      });

      // Create and download file
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Format filename with current date and time
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-");
      link.download = `kanban_backup_${dateStr}_${timeStr}.json`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log("Backup created successfully");
    } catch (error) {
      console.error("Error creating backup:", error);
      alert("Error creating backup: " + error.message);
    }
  },

  // Load data from JSON file
  loadFromJSON(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        console.log("Parsed backup data:", data);

        if (!this.isValidBackupFile(data)) {
          throw new Error(
            "Invalid backup file format. Please ensure this is a valid Kanban backup file."
          );
        }

        const timestamp = data.metadata?.timestamp
          ? new Date(data.metadata.timestamp).toLocaleString()
          : "Unknown";
        const author = data.metadata?.author || "Unknown";

        if (
          confirm(
            `Load backup from:\nDate: ${timestamp}\nAuthor: ${author}\n\nThis will replace all current data. Continue?`
          )
        ) {
          this.restoreFromData(data);
        }
      } catch (error) {
        console.error("Error loading backup:", error);
        alert("Error loading backup file: " + error.message);
      }
    };

    reader.onerror = () => {
      console.error("Error reading file");
      alert("Error reading file");
    };

    reader.readAsText(file);
  },

  // Restore data from backup
  restoreFromData(data) {
    try {
      // Clear existing data
      localStorage.clear();
      categories.forEach((category) => {
        const taskList = document.getElementById(
          `${category.toLowerCase()}-tasks`
        );
        if (taskList) {
          taskList.innerHTML = "";
        }
      });

      // Restore tasks
      categories.forEach((category) => {
        const tasks = data.tasks[category] || [];
        console.log(`Restoring ${tasks.length} tasks for ${category}`);
        localStorage.setItem(category, JSON.stringify(tasks));
        tasks.forEach((task) => {
          addTaskToColumn(task, category);
        });
      });

      // Restore settings
      if (data.settings?.darkMode) {
        localStorage.setItem("darkMode", data.settings.darkMode);
        if (data.settings.darkMode === "enabled") {
          document.body.classList.add("dark-mode");
        }
      }

      alert("Backup loaded successfully!");
      // refreshTaskLists();
    } catch (error) {
      console.error("Error restoring data:", error);
      alert("Error restoring data: " + error.message);
    }
  },
};

// Function to handle file selection
function handleFileSelect() {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".json";

  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith(".json")) {
        alert("Please select a valid JSON file");
        return;
      }
      console.log("Loading file:", file.name);
      backupManager.loadFromJSON(file);
    }
  };

  fileInput.click();
}

// Initialize backup functionality
document.addEventListener("DOMContentLoaded", function () {
  const backupBtn = document.getElementById("backupBtn");
  const loadBackupBtn = document.getElementById("loadBackupBtn");

  if (backupBtn) {
    backupBtn.addEventListener("click", () => {
      try {
        backupManager.saveToJSON();
      } catch (error) {
        console.error("Error in backup:", error);
        alert("Error creating backup: " + error.message);
      }
    });
  }

  if (loadBackupBtn) {
    loadBackupBtn.addEventListener("click", () => {
      try {
        handleFileSelect();
      } catch (error) {
        console.error("Error in load:", error);
        alert("Error loading backup: " + error.message);
      }
    });
  }
});

// Update the addTaskToColumn function to handle restored tasks
function addTaskToColumn(task, category) {
  const taskItem = document.createElement("li");
  taskItem.classList.add("task-item");
  taskItem.draggable = true;
  taskItem.id = `task-${task.id || Date.now()}`;
  taskItem.dataset.category = category;

  // Create task header container
  const taskHeader = document.createElement("div");
  taskHeader.classList.add("task-header");

  // Create title container
  const taskTitleContainer = document.createElement("div");
  taskTitleContainer.classList.add("task-title-container");

  // Add the task title
  const taskTitle = document.createElement("div");
  taskTitle.classList.add("task-title");
  taskTitle.innerText = task.title;

  // Create delete button
  const deleteButton = document.createElement("button");
  deleteButton.classList.add("delete-task-btn");
  deleteButton.innerHTML = "×"; // Use × symbol for delete
  deleteButton.title = "Delete task";
  deleteButton.onclick = (e) => {
    e.stopPropagation(); // Prevent task expansion when clicking delete
    deleteTask(task.id || taskItem.id.replace("task-", ""), category);
  };

  // Add tag to the task item
  const taskTag = document.createElement("span");
  taskTag.classList.add("task-tag");
  taskTag.classList.add(task.tag);
  taskTag.textContent =
    document.querySelector(`[data-tag="${task.tag}"] .tag-name`)?.textContent ||
    task.tag;

  // Add content
  const taskContent = document.createElement("div");
  taskContent.classList.add("task-content");

  // Create content wrapper to separate text content from file attachment
  const contentWrapper = document.createElement("div");
  contentWrapper.classList.add("content-wrapper");

  const contentParagraph = document.createElement("p");
  contentParagraph.textContent = task.content;
  contentWrapper.appendChild(contentParagraph);
  taskContent.appendChild(contentWrapper);

  // Add click event for editing content
  contentParagraph.addEventListener("click", (e) => {
    e.stopPropagation();

    if (!taskContent.classList.contains("editing")) {
      // Create textarea for editing
      const textarea = document.createElement("textarea");
      textarea.value = task.content;
      textarea.classList.add("content-editor");

      // Match height to content
      textarea.style.height = `${contentParagraph.offsetHeight}px`;
      textarea.style.minHeight = "100px";

      // Replace only the paragraph with textarea
      contentParagraph.replaceWith(textarea);
      taskContent.classList.add("editing");
      textarea.focus();

      // Handle save on blur
      textarea.addEventListener("blur", saveContent);

      // Handle save on Enter (but allow new lines with Shift+Enter)
      textarea.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          saveContent();
        }
      });

      function saveContent() {
        const newContent = textarea.value.trim();
        if (newContent !== "") {
          task.content = newContent;
          contentParagraph.textContent = newContent;
          taskContent.classList.remove("editing");
          textarea.replaceWith(contentParagraph);

          // Save to localStorage
          const tasks = JSON.parse(localStorage.getItem(category)) || [];
          const taskIndex = tasks.findIndex((t) => t.id === task.id);
          if (taskIndex !== -1) {
            tasks[taskIndex] = task;
            localStorage.setItem(category, JSON.stringify(tasks));
          }
        }
      }
    }
  });
  if (task.file) {
    const fileAttachment = document.createElement("a");
    fileAttachment.href = task.file;
    fileAttachment.target = "_blank";
    fileAttachment.classList.add("file-attachment");
    fileAttachment.innerHTML = `
      <span class="file-icon">📎</span>
      <span>View Attachment</span>
  `;
    taskContent.appendChild(fileAttachment);
  }

  // Add creation date
  const taskDate = document.createElement("div");
  taskDate.classList.add("task-date");
  taskDate.innerText = new Date(task.createdAt || Date.now()).toLocaleString();

  // Add event listeners
  taskTitle.addEventListener("click", () => {
    taskContent.classList.toggle("show");
  });

  // Add drag events
  taskItem.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData(
      "taskId",
      task.id || taskItem.id.replace("task-", "")
    );
    taskItem.classList.add("dragging");
  });

  taskItem.addEventListener("dragend", () => {
    taskItem.classList.remove("dragging");
  });

  // Assemble the task item
  taskTitleContainer.appendChild(taskTag);
  taskTitleContainer.appendChild(taskTitle);
  taskHeader.appendChild(taskTitleContainer);
  taskHeader.appendChild(deleteButton);

  taskItem.appendChild(taskHeader);
  taskItem.appendChild(taskContent);
  taskItem.appendChild(taskDate);

  // Append to appropriate column
  const taskList = document.getElementById(`${category.toLowerCase()}-tasks`);
  if (taskList) {
    taskList.appendChild(taskItem);
    console.log(`Added task to ${category}:`, task);
  } else {
    console.error(`Could not find task list for category: ${category}`);
  }
}

// Update the loadTasks function
function loadTasks() {
  console.log("Loading tasks..."); // Debug log
  categories.forEach((category) => {
    try {
      const tasksString = localStorage.getItem(category);
      const tasks = tasksString ? JSON.parse(tasksString) : [];
      console.log(`Loading ${tasks.length} tasks for ${category}`); // Debug log

      tasks.forEach((task) => {
        addTaskToColumn(task, category);
      });
    } catch (error) {
      console.error(`Error loading tasks for ${category}:`, error);
    }
  });
}

// Function to trigger file input
function triggerFileInput() {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".json";

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      loadFromJSON(e.target.files[0]);
    }
  });

  fileInput.click();
}

// Initialize backup functionality
document.addEventListener("DOMContentLoaded", function () {
  // Add backup button functionality
  const backupBtn = document.getElementById("backupBtn");
  const loadBackupBtn = document.getElementById("loadBackupBtn");

  if (backupBtn) {
    backupBtn.addEventListener("click", saveToJSON);
  }

  if (loadBackupBtn) {
    loadBackupBtn.addEventListener("click", triggerFileInput);
  }
});

// Function to delete task
function deleteTask(taskId, category) {
  try {
    // Get the task element
    const taskElement = document.getElementById(`task-${taskId}`);
    if (!taskElement) {
      console.error("Task element not found:", taskId);
      return;
    }

    // Show confirmation dialog
    const confirmDelete = confirm("Are you sure you want to delete this task?");
    if (!confirmDelete) return;

    // Add deletion animation
    taskElement.classList.add("deleting");

    // Remove task from localStorage and DOM after animation
    setTimeout(() => {
      // Remove from localStorage
      const tasksString = localStorage.getItem(category);
      const tasks = tasksString ? JSON.parse(tasksString) : [];
      const updatedTasks = tasks.filter((task) => task.id !== taskId);
      localStorage.setItem(category, JSON.stringify(updatedTasks));

      // Remove from DOM
      taskElement.remove();

      console.log(`Task ${taskId} deleted from ${category}`);
    }, 300); // Match this with CSS animation duration
  } catch (error) {
    console.error("Error deleting task:", error);
    alert("Error deleting task: " + error.message);
  }
}

// Initialize tag selector and load tasks
initializeTagSelector();
loadTasks();
