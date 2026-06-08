from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, StudentViewSet, InternshipViewSet, RoomViewSet, RoomAllocationViewSet, MaintenanceViewSet, PaymentViewSet,
    UserViewSet, LogoutView, PasswordResetView, PasswordResetConfirmView, CurrentUserView
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r'students', StudentViewSet, basename='students')
router.register(r'internships', InternshipViewSet, basename='internships')
router.register(r'rooms', RoomViewSet, basename='rooms')
router.register(r'room-allocations', RoomAllocationViewSet, basename='roomallocations')
router.register(r'maintenance', MaintenanceViewSet, basename='maintenance')
router.register(r'payments', PaymentViewSet, basename='payments')
router.register(r'users', UserViewSet, basename='users')

urlpatterns = [
    path('auth/register/', RegisterView.as_view({'post':'register'})),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='auth_logout'),
    path('auth/me/', CurrentUserView.as_view(), name='auth_me'),
    path('auth/password-reset/', PasswordResetView.as_view(), name='password_reset'),
    path('auth/password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('', include(router.urls)),
]
