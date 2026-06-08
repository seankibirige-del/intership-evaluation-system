from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Student, Internship, Room, RoomAllocation, MaintenanceRequest, Payment
from .serializers import (
    UserSerializer, UserAdminSerializer, RegisterSerializer, StudentSerializer,
    InternshipSerializer, RoomSerializer, RoomAllocationSerializer, MaintenanceSerializer, PaymentSerializer
)
from .permissions import IsAdmin, IsCoordinator, IsAccommodation, IsFinance, IsAdminOrAccommodation
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class RegisterView(viewsets.GenericViewSet):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['post'])
    def register(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ('admin', 'coordinator'):
            return Student.objects.select_related('user').all()
        return Student.objects.filter(user=user)


class InternshipViewSet(viewsets.ModelViewSet):
    serializer_class = InternshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Internship.objects.select_related('student').all()
        if user.role in ('admin', 'coordinator'):
            return queryset
        if hasattr(user, 'student_profile'):
            return queryset.filter(student=user.student_profile)
        return queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        if hasattr(user, 'student_profile'):
            serializer.save(student=user.student_profile)
        else:
            serializer.save()


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrAccommodation]

    @action(detail=True, methods=['post'])
    def allocate(self, request, pk=None):
        room = self.get_object()
        student_id = request.data.get('student_id')
        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            return Response({'detail':'Student not found'}, status=status.HTTP_404_NOT_FOUND)
        if room.occupancy >= room.capacity:
            return Response({'detail':'Room full'}, status=status.HTTP_400_BAD_REQUEST)
        if RoomAllocation.objects.filter(room=room, student=student).exists():
            return Response({'detail':'Student is already assigned to this room.'}, status=status.HTTP_400_BAD_REQUEST)
        allocation = RoomAllocation.objects.create(
            room=room,
            student=student,
            assigned_by=request.user
        )
        room.occupancy += 1
        room.save()
        return Response({'detail':'Allocated','allocation_id': allocation.id}, status=status.HTTP_200_OK)


class RoomAllocationViewSet(viewsets.ModelViewSet):
    serializer_class = RoomAllocationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = RoomAllocation.objects.select_related('room', 'student').all()
        if user.role in ('admin', 'coordinator', 'accommodation'):
            return queryset
        if hasattr(user, 'student_profile'):
            return queryset.filter(student=user.student_profile)
        return queryset.none()

    def create(self, request, *args, **kwargs):
        if request.user.role not in ('admin', 'accommodation'):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        allocation = serializer.save()
        return Response(RoomAllocationSerializer(allocation).data, status=status.HTTP_201_CREATED)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserAdminSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get_queryset(self):
        return User.objects.all()


class MaintenanceViewSet(viewsets.ModelViewSet):
    serializer_class = MaintenanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = MaintenanceRequest.objects.select_related('student').all()
        if user.role in ('admin', 'coordinator', 'accommodation'):
            return queryset
        if hasattr(user, 'student_profile'):
            return queryset.filter(student=user.student_profile)
        return queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        if hasattr(user, 'student_profile'):
            serializer.save(student=user.student_profile)
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        req = self.get_object()
        assignee_id = request.data.get('assignee_id')
        try:
            assignee = User.objects.get(id=assignee_id)
        except User.DoesNotExist:
            return Response({'detail':'User not found'}, status=status.HTTP_404_NOT_FOUND)
        req.assigned_to = assignee
        req.status = 'in_progress'
        req.save()
        return Response({'detail':'Assigned'}, status=status.HTTP_200_OK)


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Payment.objects.select_related('student').all()
        if user.role in ('admin', 'coordinator', 'finance'):
            return queryset
        if hasattr(user, 'student_profile'):
            return queryset.filter(student=user.student_profile)
        return queryset.none()

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        if request.user.role not in ('admin', 'finance'):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        payment = self.get_object()
        payment.verified = True
        payment.save()
        return Response({'detail':'Verified'}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh = request.data.get('refresh')
        if not refresh:
            return Response({'detail':'Refresh token required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh)
            token.blacklist()
            return Response({'detail':'Logged out'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'detail':'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'detail':'Email required'}, status=status.HTTP_400_BAD_REQUEST)
        User = get_user_model()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail':'If the email exists, a reset token has been generated.'}, status=status.HTTP_200_OK)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        # In production, send email. Here return token for demo/testing.
        return Response({'uid':uid,'token':token}, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        if not uid or not token or not new_password:
            return Response({'detail':'uid, token and new_password are required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            uid_decoded = force_str(urlsafe_base64_decode(uid))
            User = get_user_model()
            user = User.objects.get(pk=uid_decoded)
        except Exception:
            return Response({'detail':'Invalid uid'}, status=status.HTTP_400_BAD_REQUEST)
        if not default_token_generator.check_token(user, token):
            return Response({'detail':'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save()
        return Response({'detail':'Password reset successful'}, status=status.HTTP_200_OK)
