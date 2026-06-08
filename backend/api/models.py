from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('coordinator', 'Internship Coordinator'),
        ('accommodation', 'Accommodation Officer'),
        ('finance', 'Finance Officer'),
        ('admin', 'System Administrator'),
    )
    role = models.CharField(max_length=32, choices=ROLE_CHOICES, default='student')


class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    student_number = models.CharField(max_length=32, unique=True)
    phone = models.CharField(max_length=32, blank=True)
    faculty = models.CharField(max_length=128, blank=True)
    course = models.CharField(max_length=128, blank=True)
    year_of_study = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.student_number} - {self.user.get_full_name()}"


class Internship(models.Model):
    STATUS_CHOICES = (('pending','Pending'),('approved','Approved'),('rejected','Rejected'),('in_progress','In Progress'),('completed','Completed'))
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='internships')
    company_name = models.CharField(max_length=255)
    company_address = models.TextField(blank=True)
    supervisor = models.CharField(max_length=255, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='pending')


class Room(models.Model):
    room_number = models.CharField(max_length=32, unique=True)
    block = models.CharField(max_length=64, blank=True)
    capacity = models.PositiveIntegerField(default=1)
    occupancy = models.PositiveIntegerField(default=0)

    @property
    def is_available(self):
        return self.occupancy < self.capacity


class RoomAllocation(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='allocations')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='room_allocations')
    assigned_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    assigned_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('room', 'student')

    def __str__(self):
        return f"{self.student.student_number} -> {self.room.room_number}"


class MaintenanceRequest(models.Model):
    PRIORITY_CHOICES = (('low','Low'),('medium','Medium'),('high','High'))
    STATUS_CHOICES = (('pending','Pending'),('in_progress','In Progress'),('resolved','Resolved'),('closed','Closed'))
    student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, related_name='maintenance_requests')
    title = models.CharField(max_length=255)
    description = models.TextField()
    priority = models.CharField(max_length=16, choices=PRIORITY_CHOICES, default='medium')
    date_submitted = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='pending')
    assigned_to = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)


class Payment(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reference = models.CharField(max_length=128, unique=True)
    payment_date = models.DateTimeField(auto_now_add=True)
    verified = models.BooleanField(default=False)
