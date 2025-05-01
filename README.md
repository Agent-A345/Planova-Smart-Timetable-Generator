## Planova – Smart Timetable Generator

Planova is a smart, web-based timetable generator built with Flask that automates the scheduling of subjects, rooms, labs, and faculty while ensuring conflict-free, workload-balanced, and visually optimized academic timetables.

## Features
1. **Dynamic Input Forms** – Add, edit, and remove subjects, rooms, labs, and faculty easily through an interactive interface.
2. **Clash-Free Timetable Generation** – Ensures no overlap of subjects, rooms, or faculty using smart backend logic.
3. **Lab & Batch Handling** – Supports lab sessions specific to batches with separate room and faculty allocations
4. **Workload Balancing** – Distributes teaching hours evenly among faculty across the week.
5. **Analysis Section** – Provides suggestions, detects gaps, and summarizes faculty workloads.
6. **View Filters** – Allows viewing of timetables by class, batch, or faculty.
7. **Dark Mode Toggle** – Offers a visually appealing dark mode for comfortable use.
8. **Export as Image** – Save the generated timetable as a high-quality image using html2canvas.

## Directory Structure
Planova/  
├── main.py  
├── app.py  
├── templates/  
│   └── index.html  
├── static/  
│   └── script.js

## 🛠️ Technologies Used

- **Python** – Core programming language for logic and backend processing.
- **Flask** – Lightweight web framework used for routing and API handling.
- **HTML5** – For building the structure of the user interface.
- **CSS3** – For styling the layout and appearance of the webpage.
- **JavaScript** – Handles dynamic user interactions and data rendering.
- **Bootstrap 5** – Provides a responsive and modern UI with minimal effort.
- **Font Awesome** – Used for clean and intuitive iconography (e.g., buttons).
- **html2canvas** – Allows exporting the timetable section as an image.
- **JSON** – Used for sending structured data between frontend and backend.

## Installation
1. **Clone the repository**:
```
git clone https://github.com/Agent-A345/Planova-Smart-Timetable-Generator.git
```
3. **(Optional) Create a virtual environment using**:
```
python -m venv venv
```
Activate it using:
- On Windows:
 ```
venv\Scripts\activate
```
- On Mac/Linux:
```
source venv/bin/activate
```
3. **Install all dependencies using**:
```
pip install -r requirements.txt
```
4. **Run the application using**:
```
python main.py
```
5. **Open your browser and visit**:
```
http://127.0.0.1:5000
```

## Usage
1. Launch the application.
2. Enter details like subjects, faculty, rooms, and labs using the interactive form.
3. Click Generate Timetable to automatically create a conflict-free weekly schedule.
4. Use the filters to view the timetable by class, batch, or faculty.
5. Review the analysis section for workload summaries, gap detection, and suggestions.
6. Click Save as Image to download the generated timetable layout.

## TimeTable Logic
Planova uses a rule-based and randomized scheduling approach that intelligently fills each time slot based on multiple constraints. It ensures:
- No clashes between subjects, rooms, or faculty members
- Even distribution of theory and lab sessions across the week
- Priority handling for lunch breaks and lab batches
- Balanced workload assignment to prevent faculty overload

## Analysis Section
After generating a timetable, Planova provides a built-in analysis panel that offers:
- **Faculty Workload Summary** – Total hours allocated per faculty across the week
- **Batch-wise Gap Detection** – Highlights empty slots or inefficient spacing in batch schedules
- **Suggestions for Optimization** – Recommends changes to improve balance and reduce idle time

## Future Improvements
While Planova currently runs as a lightweight, input-driven tool, several enhancements are planned to make it more powerful and production-ready:
- **Database Integration** – Persist subjects, rooms, faculty, and past timetables using SQLite or PostgreSQL
- **User Authentication** – Add role-based login for admins, faculty, and coordinators
- **Multi-week Support** – Extend scheduling beyond a single week to cover academic terms

## License
This project is licensed under the Apache License 2.0.
