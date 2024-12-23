import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Student } from '../../../../model/student';
import { CommonModule } from '@angular/common';
import { AdminDataService } from '../../../service/admin-data.service';
import { catchError, tap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-student-data',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  providers:[provideAnimations()],
  templateUrl: './student-data.component.html',
  styleUrls: ['./student-data.component.css'],
})
export class StudentDataComponent implements OnInit {
  noOfStudents=0
  studentDetailsForm!: FormGroup;
  studentObj: Student = {
    _id: '',
    faculty_number: 0,
    faculty_name: '',
    joining_year: 0,
    birth_date: '',
    department: '',
    mobile: 0,
    email: '',
    password: '',
  };
  allFaculties: Student[] = [];

  @ViewChild('staticBackdrop') modal!: ElementRef;

  constructor(private fb: FormBuilder, private dataService: AdminDataService,private toastr:ToastrService) { }

  ngOnInit(): void {
    this.initializeForm();
    this.getAllFaculties();
   
  }

  private initializeForm() {
    this.studentDetailsForm = this.fb.group({
      faculty_name: ['', [Validators.required]],
      joining_year: ['', [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear())]],
      birth_date: ['', [Validators.required]],
      department: ['', [Validators.required]],
      mobile: ['', [Validators.required, Validators.pattern(/^\d{10,13}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }
  addNewFaculty() {
    if (this.studentDetailsForm.invalid) {
      Object.keys(this.studentDetailsForm.controls).forEach(field => {
        const control = this.studentDetailsForm.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
      return;
    }

    const formValues = this.studentDetailsForm.value;
    const newFaculty: Student = {
      ...formValues,
      faculty_number: this.getFacultyNumber()
    };


    this.dataService.addFaculty(newFaculty).pipe(
      tap(() => this.studentDetailsForm.reset()),
      catchError(this.handleError('addFaculty'))
    ).subscribe({
      next: () => {
        this.getAllFaculties();
        this.toastr.success('Student added successfully!',"Created");
      },
      error: () => {
        this.toastr.error('Failed to add student. Please try again.',"Failed");
      },
    });
  }
  // Error handling method
  private handleError<T>(operation = 'operation') {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return throwError(() => new Error(`${operation} failed`));
    };
  }

  getAllFaculties() {
    this.dataService.getAllFaculty().subscribe({
      next: (res) => {
        if (res.length === 0) {
          console.warn('No faculties found.');
          this.toastr.info('No faculties found in the database.');
        } else {
          this.noOfStudents=res.length
          this.allFaculties = res;
        }
      },
      error: (err) => {
        console.error('Error fetching faculties:', err);
        this.toastr.error('Failed to fetch faculty details. Please try again later.',"Failed");
      },
    });
  }

  private getFacultyNumber(): number {
    if (this.allFaculties.length === 0) {
      return 1; 
    }
    const maxFacultyNumber = Math.max(...this.allFaculties.map(faculty => faculty.faculty_number || 0));
    return maxFacultyNumber + 1; 
  }

  resetForm() {
    this.studentDetailsForm.reset();
  }
  getFaculty(student: Student) {
    this.studentDetailsForm = this.fb.group({
      _id: [student._id, Validators.required],
      faculty_number: [student.faculty_number, [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(20)
      ]],
      faculty_name: [student.faculty_name, [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]],
      joining_year: [student.joining_year, [
        Validators.required,
        Validators.pattern(/^\d{4}$/)
      ]],
      birth_date: [student.birth_date, [
        Validators.required
      ]],
      department: [student.department, [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]],
      mobile: [student.mobile, [
        Validators.required,
        Validators.pattern(/^[0-9]{10}$/) 
      ]],
      email: [student.email, [
        Validators.required,
        Validators.email
      ]]
    });
  }
  updateFaculty() {
    const formValues = this.studentDetailsForm.value;
    const editFaculty: Student = {
      ...formValues
    } as Student;
    this.dataService.updateFaculty(editFaculty).subscribe({
      next: (res) => {
        console.log('Student updated successfully:', res);

        this.studentDetailsForm.reset();

        this.getAllFaculties();

      },
      error: (err) => console.error('Error occurred while updating student:', err),
    });

  }

  deleteFaculty(student: Student) {
    if (window.confirm('Are you sure you want to delete ' + student.faculty_name)) {
      this.dataService.deleteFaculty(student._id).subscribe(res => {
        this.toastr.success("Student deleted Successfully","Deleted");
        this.getAllFaculties();

      }, err => {
        console.log("Error occured while deleting student");

      })
    }
  }
}
