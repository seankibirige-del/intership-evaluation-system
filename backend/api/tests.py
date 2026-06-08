from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Student, Room, RoomAllocation

User = get_user_model()


class StudentModelTest(TestCase):
    def test_create_student(self):
        u = User.objects.create_user(username='s1', password='pass')
        s = Student.objects.create(user=u, student_number='S1001')
        self.assertEqual(s.student_number, 'S1001')


class AuthApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_student_creates_profile(self):
        response = self.client.post('/api/auth/register/', {
            'username': 'student1',
            'password': 'pass123',
            'first_name': 'Test',
            'last_name': 'Student',
            'email': 'student1@example.com',
            'role': 'student',
            'student_number': 'S1001'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username='student1')
        self.assertEqual(user.role, 'student')
        self.assertTrue(hasattr(user, 'student_profile'))
        self.assertEqual(user.student_profile.student_number, 'S1001')

    def test_login_and_get_current_user(self):
        user = User.objects.create_user(username='student2', password='pass123', role='student')
        Student.objects.create(user=user, student_number='S1002')
        login_response = self.client.post('/api/auth/login/', {
            'username': 'student2',
            'password': 'pass123'
        }, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        me_response = self.client.get('/api/auth/me/')
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertEqual(me_response.data['username'], 'student2')


class AdminUserApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='admin', password='adminpass', role='admin')

    def test_admin_can_create_user(self):
        login_response = self.client.post('/api/auth/login/', {
            'username': 'admin',
            'password': 'adminpass'
        }, format='json')
        token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.post('/api/users/', {
            'username': 'newuser',
            'password': 'pass123',
            'first_name': 'New',
            'last_name': 'User',
            'email': 'newuser@example.com',
            'role': 'coordinator',
            'is_active': True
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username='newuser')
        self.assertEqual(user.role, 'coordinator')


class RoomAllocationApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='admin2', password='adminpass', role='admin')
        self.accommodation = User.objects.create_user(username='accom', password='pass123', role='accommodation')
        self.student_user = User.objects.create_user(username='student3', password='pass123', role='student')
        self.student_profile = Student.objects.create(user=self.student_user, student_number='S1003')
        self.room = Room.objects.create(room_number='R101', capacity=2)

    def test_accommodation_can_allocate_room(self):
        login_response = self.client.post('/api/auth/login/', {
            'username': 'accom',
            'password': 'pass123'
        }, format='json')
        token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.post(f'/api/rooms/{self.room.id}/allocate/', {
            'student_id': self.student_profile.id
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(RoomAllocation.objects.filter(student=self.student_profile, room=self.room).count(), 1)
        self.room.refresh_from_db()
        self.assertEqual(self.room.occupancy, 1)

    def test_student_can_view_allocations(self):
        RoomAllocation.objects.create(room=self.room, student=self.student_profile, assigned_by=self.admin)
        login_response = self.client.post('/api/auth/login/', {
            'username': 'student3',
            'password': 'pass123'
        }, format='json')
        token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get('/api/room-allocations/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
