"""
AutoPart Bazaar - Gantt Chart Generator
Generates a professional Gantt chart image (PNG) for the project timeline.

Usage:
    python scripts/generate_gantt_chart.py

Output:
    AutoPartBazaar_Gantt.png  (in project root)

Requirements:
    pip install matplotlib
"""

import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime, timedelta

# ============================================================
# TASK DATA: (Category, Task Name, Start Date, Duration in days, Color)
# ============================================================
tasks = [
    # Phase 1: Planning & Analysis
    ("Planning & Analysis", "Requirement Gathering",         "2026-02-01", 7,  "#B0BEC5"),
    ("Planning & Analysis", "Feasibility Study",             "2026-02-08", 5,  "#B0BEC5"),
    ("Planning & Analysis", "Tech Stack Selection",          "2026-02-13", 4,  "#B0BEC5"),
    ("Planning & Analysis", "Project Setup & Git Repo",      "2026-02-17", 5,  "#B0BEC5"),

    # Phase 2: System Design
    ("System Design",       "DFD Level 0 & 1 Diagrams",      "2026-02-22", 5,  "#B0BEC5"),
    ("System Design",       "UML Class & Activity Diagrams", "2026-02-27", 5,  "#B0BEC5"),
    ("System Design",       "Database Schema Design",        "2026-03-04", 4,  "#B0BEC5"),

    # Phase 3: Backend Development
    ("Backend Development", "FastAPI Project Setup",         "2026-03-08", 3,  "#B0BEC5"),
    ("Backend Development", "SQLAlchemy Models & Alembic",   "2026-03-11", 5,  "#B0BEC5"),
    ("Backend Development", "JWT Authentication APIs",       "2026-03-16", 5,  "#B0BEC5"),
    ("Backend Development", "Product & Order REST APIs",     "2026-03-21", 6,  "#B0BEC5"),
    ("Backend Development", "Cart, Wishlist & Reviews APIs", "2026-03-27", 5,  "#B0BEC5"),
    ("Backend Development", "Admin & Seller Endpoints",      "2026-04-01", 4,  "#B0BEC5"),

    # Phase 4: Frontend Development
    ("Frontend Development","React + Vite Setup",            "2026-04-05", 3,  "#B0BEC5"),
    ("Frontend Development","Auth Context & Login Pages",    "2026-04-08", 4,  "#B0BEC5"),
    ("Frontend Development","Product List & Detail Pages",   "2026-04-12", 5,  "#B0BEC5"),
    ("Frontend Development","Cart & Checkout Pages",         "2026-04-17", 5,  "#B0BEC5"),
    ("Frontend Development","3D Car Garage (Three.js)",      "2026-04-22", 6,  "#B0BEC5"),
    ("Frontend Development","Admin Dashboard UI",            "2026-04-28", 5,  "#B0BEC5"),

    # Phase 5: AI & Integration
    ("AI & Integration",    "AI Recommendation (OpenRouter)","2026-05-03", 5,  "#B0BEC5"),
    ("AI & Integration",    "Parts Sync Service",            "2026-05-08", 4,  "#B0BEC5"),
    ("AI & Integration",    "Email Service (SMTP/OTP)",      "2026-05-12", 3,  "#B0BEC5"),
    ("AI & Integration",    "AWS S3 Image Upload",           "2026-05-15", 2,  "#B0BEC5"),

    # Phase 6: Testing & Deployment (Red bars - like the reference image)
    ("Testing & Deployment","Unit & Integration Testing",    "2026-05-17", 5,  "#E57373"),
    ("Testing & Deployment","End-to-End Testing",            "2026-05-22", 3,  "#E57373"),
    ("Testing & Deployment","Bug Fixes & UI Polish",         "2026-05-25", 3,  "#E57373"),
    ("Testing & Deployment","User Acceptance Testing",       "2026-05-28", 2,  "#E57373"),

    # Phase 7: Finalization
    ("Finalization",        "Documentation & Report",        "2026-05-29", 3,  "#757575"),
]

# ============================================================
# BUILD CHART
# ============================================================
fig, ax = plt.subplots(figsize=(16, 10))

# Convert dates and prepare data
y_labels = []
y_positions = []
current_category = None
category_positions = {}

# Plot tasks bottom-up so the order in 'tasks' reads top-down on the chart
for i, (category, task_name, start_str, duration, color) in enumerate(reversed(tasks)):
    y_pos = i
    start_date = datetime.strptime(start_str, "%Y-%m-%d")
    end_date = start_date + timedelta(days=duration)

    # Draw the bar
    ax.barh(
        y_pos,
        end_date - start_date,
        left=start_date,
        height=0.55,
        color=color,
        edgecolor="#37474F",
        linewidth=0.7,
    )

    # Add task label inside or next to the bar
    label_x = end_date + timedelta(days=0.5)
    ax.text(
        label_x,
        y_pos,
        task_name,
        va="center",
        ha="left",
        fontsize=8.5,
        color="#212121",
        fontweight="normal",
    )

    # Track category positions for left-side group labels
    if category not in category_positions:
        category_positions[category] = []
    category_positions[category].append(y_pos)

    y_positions.append(y_pos)
    y_labels.append("")  # blank because we'll write category labels manually

# ============================================================
# CATEGORY LABELS ON THE LEFT (grouped)
# ============================================================
ax.set_yticks(y_positions)
ax.set_yticklabels(y_labels)

# Draw bold category names on the left, centered against the group
for category, positions in category_positions.items():
    mid_y = sum(positions) / len(positions)
    ax.text(
        -0.085,
        mid_y,
        category,
        transform=ax.get_yaxis_transform(),
        ha="right",
        va="center",
        fontsize=10,
        fontweight="bold",
        color="#1A237E",
    )

# ============================================================
# X-AXIS: DATE FORMATTING (weekly ticks like reference image)
# ============================================================
ax.xaxis.set_major_locator(mdates.WeekdayLocator(byweekday=mdates.MO))
ax.xaxis.set_major_formatter(mdates.DateFormatter("%b %d"))
plt.setp(ax.get_xticklabels(), rotation=0, ha="center", fontsize=9)

# Vertical grid lines (light)
ax.grid(axis="x", color="#CFD8DC", linestyle="-", linewidth=0.5, alpha=0.7)
ax.set_axisbelow(True)

# Set chart date range
ax.set_xlim(datetime(2026, 1, 26), datetime(2026, 6, 5))

# ============================================================
# CLEAN UP CHART APPEARANCE
# ============================================================
# Remove top, right, left spines for clean look
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)
ax.spines["left"].set_visible(False)
ax.spines["bottom"].set_color("#90A4AE")

# Light background
ax.set_facecolor("#FAFAFA")
fig.patch.set_facecolor("white")

# Title
ax.set_title(
    "AutoPart Bazaar - Project Timeline",
    fontsize=16,
    fontweight="bold",
    color="#1A237E",
    pad=20,
)

# Tight layout with extra space on the left for category labels
plt.subplots_adjust(left=0.15, right=0.97, top=0.93, bottom=0.07)

# ============================================================
# SAVE OUTPUT
# ============================================================
output_path = "AutoPartBazaar_Gantt.png"
plt.savefig(output_path, dpi=200, bbox_inches="tight", facecolor="white")
print(f"Gantt chart saved to: {output_path}")

# Optional: show on screen
# plt.show()
