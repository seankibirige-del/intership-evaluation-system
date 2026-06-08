from django.contrib import admin
from .models import User, Student, Internship, Room, RoomAllocation, MaintenanceRequest, Payment

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username','email','role','is_staff')


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('student_number','user','faculty','course','year_of_study')


@admin.register(Internship)
class InternshipAdmin(admin.ModelAdmin):
    list_display = ('student','company_name','status','start_date','end_date')


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('room_number','block','capacity','occupancy')


@admin.register(RoomAllocation)
class RoomAllocationAdmin(admin.ModelAdmin):
    list_display = ('room','student','assigned_by','assigned_date')


@admin.register(MaintenanceRequest)
class MaintenanceAdmin(admin.ModelAdmin):
    list_display = ('title','student','status','priority','date_submitted')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('student','amount','reference','payment_date','verified')
