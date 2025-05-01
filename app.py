from flask import Flask, render_template, request, jsonify
import random
import logging
import copy
import math
from collections import Counter, defaultdict

app = Flask(__name__)
logging.basicConfig(level=logging.DEBUG)

class TimeTableGenerator:
    def __init__(self):
        self.days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        self.time_slots = [
            '9:00-10:00', '10:00-11:00', '11:00-12:00',
            '12:00-1:00', '1:00-2:00', '2:00-3:00',
            '3:00-4:00', '4:00-5:00'
        ]
        self.lunch_slot = '12:00-1:00'

    def is_lunch_time(self, slot):
        return slot == self.lunch_slot

    def check_theory_workload(self, faculty_hours, day, faculty):
        # Basic check - no more than 2 theory classes per day for a faculty
        return faculty_hours['theory'][day].get(faculty, 0) < 2
        
    def get_faculty_total_workload(self, faculty_hours, faculty):
        """Calculate total workload for a faculty across all days"""
        total = 0
        for day in self.days:
            total += faculty_hours['theory'][day].get(faculty, 0)
            total += faculty_hours['lab'][day].get(faculty, 0)
        return total
        
    def get_least_loaded_faculty(self, subject, faculty_hours):
        """Find the faculty with the least total workload who can teach this subject"""
        faculty_loads = [(f, self.get_faculty_total_workload(faculty_hours, f)) 
                        for f in subject['faculty']]
        if not faculty_loads:
            return None
        return min(faculty_loads, key=lambda x: x[1])[0]

    def check_lab_workload(self, faculty_hours, day, faculty):
        # Basic check - no more than 4 lab hours per day for a faculty
        return faculty_hours['lab'][day].get(faculty, 0) < 4

    def is_slot_available(self, timetable, day, slot, batch=None):
        if batch is not None:
            return (
                batch in timetable[day][slot] and 
                timetable[day][slot][batch] is None and 
                not self.is_lunch_time(self.time_slots[slot])
            )
        else:
            return (
                'whole_class' in timetable[day][slot] and 
                timetable[day][slot]['whole_class'] is None and 
                not self.is_lunch_time(self.time_slots[slot])
            )

    def is_subject_consecutive(self, timetable, day, slot, subject_name, batch=None):
        # Check previous slot
        if slot > 0:
            prev_slot = timetable[day][slot - 1]
            if batch is not None:
                if batch in prev_slot and prev_slot[batch] is not None:
                    if prev_slot[batch].get('subject') == subject_name:
                        return True
            else:
                if 'whole_class' in prev_slot and prev_slot['whole_class'] is not None:
                    if prev_slot['whole_class'].get('subject') == subject_name:
                        return True
                
        # Check next slot
        if slot < len(self.time_slots) - 1:
            next_slot = timetable[day][slot + 1]
            if batch is not None:
                if batch in next_slot and next_slot[batch] is not None:
                    if next_slot[batch].get('subject') == subject_name:
                        return True
            else:
                if 'whole_class' in next_slot and next_slot['whole_class'] is not None:
                    if next_slot['whole_class'].get('subject') == subject_name:
                        return True
                
        return False

    def has_gap(self, timetable, day, slot, batch=None):
        # Check if this slot would create or maintain a gap
        if slot > 0 and slot < len(self.time_slots) - 1:
            if batch is not None:
                prev_slot_filled = batch in timetable[day][slot - 1] and timetable[day][slot - 1][batch] is not None
                next_slot_filled = batch in timetable[day][slot + 1] and timetable[day][slot + 1][batch] is not None
            else:
                prev_slot_filled = 'whole_class' in timetable[day][slot - 1] and timetable[day][slot - 1]['whole_class'] is not None
                next_slot_filled = 'whole_class' in timetable[day][slot + 1] and timetable[day][slot + 1]['whole_class'] is not None
            
            return not prev_slot_filled and next_slot_filled
        return False

    def find_gap_slots(self, timetable, day, batch=None):
        gaps = []
        for slot in range(1, len(self.time_slots) - 1):
            if self.is_slot_available(timetable, day, slot, batch):
                prev_filled = False
                next_filled = False
                
                if batch is not None:
                    prev_filled = batch in timetable[day][slot - 1] and timetable[day][slot - 1][batch] is not None
                    next_filled = batch in timetable[day][slot + 1] and timetable[day][slot + 1][batch] is not None
                else:
                    prev_filled = 'whole_class' in timetable[day][slot - 1] and timetable[day][slot - 1]['whole_class'] is not None
                    next_filled = 'whole_class' in timetable[day][slot + 1] and timetable[day][slot + 1]['whole_class'] is not None
                
                if prev_filled and next_filled:
                    gaps.append(slot)
        return gaps

    def can_schedule_other_subject(self, subjects, current_subject, timetable, day, slot, faculty_hours, rooms, batch=None):
        for subject in subjects:
            if subject['hours'] > 0 and subject['name'] != current_subject:
                for faculty in subject['faculty']:
                    if self.check_theory_workload(faculty_hours, day, faculty):
                        available_rooms = [r for r in rooms if r['capacity'] >= subject['students']]
                        if available_rooms:
                            return True
        return False

    def find_best_slot(self, timetable, day, subject, subjects, faculty_hours, rooms, batch=None):
        # First priority: Fill existing gaps
        gap_slots = self.find_gap_slots(timetable, day, batch)
        if gap_slots:
            return gap_slots[0]
            
        # Second priority: Find slot next to existing classes
        for slot in range(1, len(self.time_slots)):  # Start from 1 to preserve 9 AM slot
            if self.is_slot_available(timetable, day, slot, batch):
                # Check if slot is adjacent to an existing class
                has_adjacent = False
                
                if batch is not None:
                    has_adjacent = (
                        (slot > 0 and batch in timetable[day][slot - 1] and timetable[day][slot - 1][batch] is not None) or
                        (slot < len(self.time_slots) - 1 and batch in timetable[day][slot + 1] and timetable[day][slot + 1][batch] is not None)
                    )
                else:
                    has_adjacent = (
                        (slot > 0 and 'whole_class' in timetable[day][slot - 1] and timetable[day][slot - 1]['whole_class'] is not None) or
                        (slot < len(self.time_slots) - 1 and 'whole_class' in timetable[day][slot + 1] and timetable[day][slot + 1]['whole_class'] is not None)
                    )
                
                if has_adjacent:
                    # Check if we can avoid consecutive lectures
                    if not self.is_subject_consecutive(timetable, day, slot, subject['name'], batch):
                        return slot
                    # If consecutive, check if we can schedule something else
                    elif not self.can_schedule_other_subject(subjects, subject['name'], 
                                                           timetable, day, slot, faculty_hours, rooms, batch):
                        return slot

        # Third priority: Any available slot (except 9 AM)
        for slot in range(1, len(self.time_slots)):
            if self.is_slot_available(timetable, day, slot, batch):
                return slot
                
        return None

    def can_schedule_lab(self, timetable, day, start_slot, batch):
        if start_slot >= len(self.time_slots) - 1:
            return False
            
        lunch_index = self.time_slots.index(self.lunch_slot)
        
        # Don't schedule labs that would span across lunch time
        if start_slot < lunch_index and start_slot + 1 >= lunch_index:
            return False
            
        # Check if both slots are available for the given batch
        for i in range(2):  # Check both slots for the 2-hour lab
            current_slot = start_slot + i
            
            # If the batch slot is filled, check if it's a theory class (with_whole_class)
            # Lab sessions can overlap other labs but not theory classes
            if batch in timetable[day][current_slot] and timetable[day][current_slot][batch] is not None:
                # If it's a theory class or already has a lab, can't schedule
                if timetable[day][current_slot][batch].get('with_whole_class', False) or \
                   timetable[day][current_slot][batch].get('type') == 'lab':
                    return False
            
            if self.is_lunch_time(self.time_slots[current_slot]):
                return False
                
        return True
    
    def are_all_batches_free(self, timetable, day, slot, num_batches):
        """Check if all batches are free at a given slot"""
        for batch_idx in range(1, num_batches + 1):
            batch_name = f'batch_{batch_idx}'
            if not (
                batch_name in timetable[day][slot] and 
                timetable[day][slot][batch_name] is None
            ):
                return False
        return True
    
    def generate_timetable(self, subjects, faculties, rooms, labs, num_batches, students_per_batch):
        # Initialize timetable with slots for whole class and each batch
        timetable = {day: [] for day in self.days}
        
        for day in self.days:
            for _ in range(len(self.time_slots)):
                slot_dict = {'whole_class': None}
                for batch_idx in range(1, num_batches + 1):
                    slot_dict[f'batch_{batch_idx}'] = None
                timetable[day].append(slot_dict)
        
        faculty_hours = {
            'theory': {day: {} for day in self.days},
            'lab': {day: {} for day in self.days}
        }

        # Set lunch break for all batches
        lunch_index = self.time_slots.index(self.lunch_slot)
        for day in self.days:
            timetable[day][lunch_index]['whole_class'] = {
                'subject': 'Lunch Break',
                'type': 'break',
                'faculty': None,
                'room': None
            }
            
            for batch_idx in range(1, num_batches + 1):
                batch_name = f'batch_{batch_idx}'
                timetable[day][lunch_index][batch_name] = {
                    'subject': 'Lunch Break',
                    'type': 'break',
                    'faculty': None,
                    'room': None
                }

        # First, ensure each day starts with a whole-class session at 9 AM
        used_subjects = set()
        for day in self.days:
            available_subjects = [s for s in subjects if s['name'] not in used_subjects]
            if not available_subjects:  # If we run out, reset the list
                available_subjects = subjects.copy()
                used_subjects.clear()
                
            if available_subjects:
                subject = random.choice(available_subjects)
                # Use the least loaded faculty who can teach this subject
                faculty = self.get_least_loaded_faculty(subject, faculty_hours) or random.choice(subject['faculty'])
                available_rooms = [r for r in rooms if r['capacity'] >= subject['students']]
                
                if available_rooms and self.check_theory_workload(faculty_hours, day, faculty):
                    room = random.choice(available_rooms)
                    timetable[day][0]['whole_class'] = {
                        'subject': subject['name'],
                        'faculty': faculty,
                        'room': room['name'],
                        'type': 'theory'
                    }
                    
                    # Mark the slot as used for all batches
                    for batch_idx in range(1, num_batches + 1):
                        batch_name = f'batch_{batch_idx}'
                        timetable[day][0][batch_name] = {
                            'subject': subject['name'],
                            'faculty': faculty,
                            'room': room['name'],
                            'type': 'theory',
                            'with_whole_class': True
                        }
                    
                    faculty_hours['theory'][day][faculty] = 1
                    subject['hours'] -= 1
                    used_subjects.add(subject['name'])

        # Schedule Lab sessions batch-wise - Supporting multiple labs per batch
        # Each lab subject can now be scheduled multiple times for the same batch
        lab_list = labs.copy()
        
        # Create a more balanced distribution of labs across batches
        batch_lab_assignments = {}
        for batch_idx in range(1, num_batches + 1):
            batch_lab_assignments[f'batch_{batch_idx}'] = []
            
        # Distribute labs more evenly among batches
        for lab_idx, lab in enumerate(lab_list):
            for batch_idx in range(1, num_batches + 1):
                batch_name = f'batch_{batch_idx}'
                # Make a copy of the lab for each batch with full hours
                batch_lab = lab.copy()
                batch_lab_assignments[batch_name].append(batch_lab)
        
        # Schedule labs for each batch
        for batch_idx in range(1, num_batches + 1):
            batch_name = f'batch_{batch_idx}'
            
            # Process each lab assigned to this batch
            for lab in batch_lab_assignments[batch_name]:
                hours_needed = lab['hours']
                
                # Process lab hours in 2-hour blocks
                while hours_needed >= 2:
                    scheduled = False
                    available_days = self.days.copy()
                    random.shuffle(available_days)
                    
                    for day in available_days:
                        # Use the least loaded faculty who can teach this lab
                        faculty = self.get_least_loaded_faculty(lab, faculty_hours) or random.choice(lab['faculty'])
                        
                        if self.check_lab_workload(faculty_hours, day, faculty):
                            for slot in range(1, len(self.time_slots) - 1):
                                if self.can_schedule_lab(timetable, day, slot, batch_name):
                                    # Ensure the whole class slot is free for all batches
                                    can_schedule = True
                                    for i in range(2):  # Check both slots for the 2-hour lab
                                        current_slot = slot + i
                                        if timetable[day][current_slot]['whole_class'] is not None and \
                                           timetable[day][current_slot]['whole_class']['type'] != 'lab_session':
                                            can_schedule = False
                                            break
                                    
                                    if can_schedule:
                                        # Schedule the 2-hour lab for the current batch
                                        for i in range(2):
                                            current_slot = slot + i
                                            
                                            # First ensure 'whole_class' is marked as lab_session
                                            if timetable[day][current_slot]['whole_class'] is None:
                                                timetable[day][current_slot]['whole_class'] = {
                                                    'type': 'lab_session',
                                                    'subject': 'Lab Sessions',
                                                }
                                                
                                            # Set the lab for this batch
                                            timetable[day][current_slot][batch_name] = {
                                                'subject': lab['name'],
                                                'faculty': faculty,
                                                'room': lab['room'],
                                                'type': 'lab'
                                            }
                                                
                                        # Update faculty hours
                                        if faculty not in faculty_hours['lab'][day]:
                                            faculty_hours['lab'][day][faculty] = 0
                                        faculty_hours['lab'][day][faculty] += 2
                                        
                                        hours_needed -= 2
                                        scheduled = True
                                        break
                                    
                        if scheduled:
                            break
                    
                    if not scheduled:
                        # If we can't schedule more lab sessions, break
                        break

        # Distribute remaining theory hours
        remaining_subjects = [s for s in subjects if s['hours'] > 0]
        
        # First try to prioritize filling the 9 AM slots if not already filled
        for day in self.days:
            if timetable[day][0]['whole_class'] is None and remaining_subjects:
                for subject in remaining_subjects:
                    # Use the least loaded faculty who can teach this subject
                    faculty = self.get_least_loaded_faculty(subject, faculty_hours) or random.choice(subject['faculty'])
                    if self.check_theory_workload(faculty_hours, day, faculty):
                        available_rooms = [r for r in rooms if r['capacity'] >= subject['students']]
                        if available_rooms:
                            room = random.choice(available_rooms)
                            timetable[day][0]['whole_class'] = {
                                'subject': subject['name'],
                                'faculty': faculty,
                                'room': room['name'],
                                'type': 'theory'
                            }
                            
                            # Mark the slot as used for all batches
                            for batch_idx in range(1, num_batches + 1):
                                batch_name = f'batch_{batch_idx}'
                                timetable[day][0][batch_name] = {
                                    'subject': subject['name'],
                                    'faculty': faculty,
                                    'room': room['name'],
                                    'type': 'theory',
                                    'with_whole_class': True
                                }
                            
                            faculty_hours['theory'][day][faculty] = faculty_hours['theory'][day].get(faculty, 0) + 1
                            subject['hours'] -= 1
                            break
                        
        # Continue scheduling theory classes in remaining slots
        while True:
            # Update remaining subjects
            remaining_subjects = [s for s in subjects if s['hours'] > 0]
            if not remaining_subjects:
                break
                
            # Shuffle subjects and days for a more balanced distribution
            random.shuffle(remaining_subjects)
            
            subject = remaining_subjects[0]
            scheduled = False
            
            for day in self.days:
                # Use the least loaded faculty who can teach this subject
                faculty = self.get_least_loaded_faculty(subject, faculty_hours) or random.choice(subject['faculty'])
                
                if self.check_theory_workload(faculty_hours, day, faculty):
                    best_slot = self.find_best_slot(timetable, day, subject, subjects, faculty_hours, rooms)
                    
                    if best_slot is not None:
                        # Make sure all batches are available
                        all_batches_free = self.are_all_batches_free(timetable, day, best_slot, num_batches)
                        
                        if all_batches_free:
                            available_rooms = [r for r in rooms if r['capacity'] >= subject['students']]
                            if available_rooms:
                                room = random.choice(available_rooms)
                                
                                # Schedule theory class for whole class
                                timetable[day][best_slot]['whole_class'] = {
                                    'subject': subject['name'],
                                    'faculty': faculty,
                                    'room': room['name'],
                                    'type': 'theory'
                                }
                                
                                # Mark the slot as used for all batches
                                for batch_idx in range(1, num_batches + 1):
                                    batch_name = f'batch_{batch_idx}'
                                    timetable[day][best_slot][batch_name] = {
                                        'subject': subject['name'],
                                        'faculty': faculty,
                                        'room': room['name'],
                                        'type': 'theory',
                                        'with_whole_class': True
                                    }
                                
                                faculty_hours['theory'][day][faculty] = faculty_hours['theory'][day].get(faculty, 0) + 1
                                subject['hours'] -= 1
                                scheduled = True
                                break
            
            # If we can't schedule any more classes, break
            if not scheduled:
                break
                
        return timetable
        
    def analyze_timetable(self, timetable, subjects, faculties):
        """
        Analyze the timetable and provide suggestions for improvements
        Returns a dictionary with analysis results
        """
        analysis = {
            'faculty_workload': {},
            'class_distribution': {},
            'gap_analysis': {},
            'suggestions': []
        }
        
        # Analyze faculty workload
        all_faculty_loads = defaultdict(int)
        day_faculty_loads = {day: defaultdict(int) for day in self.days}
        
        for day in self.days:
            for slot_idx, slot_data in enumerate(timetable[day]):
                # Skip lunch slots
                if self.is_lunch_time(self.time_slots[slot_idx]):
                    continue
                    
                whole_class = slot_data.get('whole_class')
                if whole_class and whole_class.get('type') == 'theory':
                    faculty = whole_class.get('faculty')
                    if faculty:
                        all_faculty_loads[faculty] += 1
                        day_faculty_loads[day][faculty] += 1
                
                # Check batch-specific assignments
                for batch_key, batch_data in slot_data.items():
                    if batch_key == 'whole_class' or batch_data is None:
                        continue
                        
                    if not batch_data.get('with_whole_class', False) and batch_data.get('type') == 'lab':
                        faculty = batch_data.get('faculty')
                        if faculty:
                            all_faculty_loads[faculty] += 1
                            day_faculty_loads[day][faculty] += 1
        
        # Calculate faculty workload statistics
        total_loads = list(all_faculty_loads.values())
        if total_loads:
            avg_load = sum(total_loads) / len(total_loads)
            min_load = min(total_loads)
            max_load = max(total_loads)
            
            analysis['faculty_workload'] = {
                'average': round(avg_load, 1),
                'min': min_load,
                'max': max_load,
                'by_faculty': dict(all_faculty_loads),
                'by_day': {day: dict(loads) for day, loads in day_faculty_loads.items()}
            }
            
            # Add suggestions for faculty workload
            if max_load - min_load > 3:
                overloaded = [f for f, load in all_faculty_loads.items() if load > avg_load + 1.5]
                underloaded = [f for f, load in all_faculty_loads.items() if load < avg_load - 1.5]
                
                if overloaded and underloaded:
                    analysis['suggestions'].append(
                        f"Consider redistributing classes from {', '.join(overloaded)} " +
                        f"to {', '.join(underloaded)} for more balanced workload."
                    )
        
        # Analyze gaps in the timetable
        gaps_by_day = {}
        total_gaps = 0
        
        for day in self.days:
            day_gaps = {'whole_class': 0}
            
            # Initialize batch-specific gap counters
            for batch_key in timetable[day][0]:
                if batch_key != 'whole_class':
                    day_gaps[batch_key] = 0
            
            # Count gaps (slots between scheduled classes)
            for batch_key in day_gaps:
                has_started = False
                has_ended = False
                prev_empty = False
                
                for slot_idx in range(len(self.time_slots)):
                    if self.is_lunch_time(self.time_slots[slot_idx]):
                        continue
                        
                    slot_data = timetable[day][slot_idx].get(batch_key)
                    
                    if slot_data is not None:
                        if has_started and not has_ended:
                            # We found a class after a gap
                            if prev_empty:
                                day_gaps[batch_key] += 1
                                total_gaps += 1
                        
                        has_started = True
                        prev_empty = False
                    else:
                        prev_empty = True
            
            gaps_by_day[day] = day_gaps
        
        analysis['gap_analysis'] = {
            'total_gaps': total_gaps,
            'by_day': gaps_by_day
        }
        
        # Add suggestions for gaps
        if total_gaps > 0:
            analysis['suggestions'].append(
                f"There are {total_gaps} gaps in the timetable. Consider generating again " +
                "or manually adjusting to reduce gaps between classes."
            )
            
        # Add general suggestions
        if not analysis['suggestions']:
            analysis['suggestions'].append(
                "The timetable looks well-balanced with no significant issues detected."
            )
            
        return analysis

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate():
    try:
        # Validate request
        if not request.is_json:
            app.logger.error("Invalid request format, expected JSON")
            return jsonify({"error": "Invalid request format, expected JSON"}), 400
        
        data = request.get_json()
        if data is None:
            app.logger.error("Failed to parse JSON data")
            return jsonify({"error": "Failed to parse JSON data"}), 400
            
        app.logger.debug(f"Received data: {data}")
        
        # Validate required fields
        subjects = data.get('subjects', [])
        faculties = data.get('faculties', [])
        rooms = data.get('rooms', [])
        labs = data.get('labs', [])
        num_batches = data.get('num_batches', 1)
        students_per_batch = data.get('students_per_batch', 0)
        
        if not subjects:
            return jsonify({"error": "At least one subject is required"}), 400
            
        if not rooms:
            return jsonify({"error": "At least one room is required"}), 400
            
        if num_batches < 1:
            return jsonify({"error": "Number of batches must be at least 1"}), 400
            
        if students_per_batch < 1:
            return jsonify({"error": "Students per batch must be at least 1"}), 400
        
        # Generate timetable
        generator = TimeTableGenerator()
        timetable = generator.generate_timetable(
            subjects,
            faculties,
            rooms,
            labs,
            num_batches,
            students_per_batch
        )
        
        # Validate timetable structure before returning
        if not timetable or not all(day in timetable for day in generator.days):
            app.logger.error("Failed to generate complete timetable")
            return jsonify({"error": "Failed to generate complete timetable"}), 500
        
        # Analyze the timetable and get suggestions
        analysis = generator.analyze_timetable(timetable, subjects, faculties)
            
        app.logger.debug("Timetable generated successfully")
        return jsonify({
            "timetable": timetable,
            "analysis": analysis
        })
    except KeyError as ke:
        app.logger.error(f"Missing required data: {str(ke)}")
        return jsonify({"error": f"Missing required data: {str(ke)}"}), 400
    except ValueError as ve:
        app.logger.error(f"Invalid data format: {str(ve)}")
        return jsonify({"error": f"Invalid data format: {str(ve)}"}), 400
    except Exception as e:
        app.logger.error(f"Error generating timetable: {str(e)}")
        return jsonify({"error": f"Error generating timetable: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)