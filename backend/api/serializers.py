from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Student, Internship, Room, RoomAllocation, MaintenanceRequest, Payment

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id','username','first_name','last_name','email','role')


class UserAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('id', 'username', 'password', 'first_name', 'last_name', 'email', 'role', 'is_active')

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    student_number = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('username','password','first_name','last_name','email','role','student_number')

    def validate(self, attrs):
        if attrs.get('role') == 'student' and not attrs.get('student_number'):
            raise serializers.ValidationError({'student_number': 'Student number is required for student registration.'})
        return attrs

    def create(self, validated_data):
        student_number = validated_data.pop('student_number', None)
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data.get('email','')
        )
        user.first_name = validated_data.get('first_name','')
        user.last_name = validated_data.get('last_name','')
        user.role = validated_data.get('role','student')
        user.set_password(validated_data['password'])
        user.save()
        if user.role == 'student' and student_number:
            Student.objects.create(user=user, student_number=student_number)
        return user


class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Student
        fields = '__all__'


class InternshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Internship
        fields = '__all__'


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = '__all__'


class RoomAllocationSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    room = RoomSerializer(read_only=True)
    student_id = serializers.IntegerField(write_only=True, required=False)
    room_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = RoomAllocation
        fields = ('id', 'room', 'student', 'assigned_by', 'assigned_date', 'student_id', 'room_id')
        read_only_fields = ('assigned_by', 'assigned_date')

    def create(self, validated_data):
        student_id = validated_data.pop('student_id', None)
        room_id = validated_data.pop('room_id', None)
        if not student_id or not room_id:
            raise serializers.ValidationError('student_id and room_id are required')
        student = Student.objects.get(pk=student_id)
        room = Room.objects.get(pk=room_id)
        if room.occupancy >= room.capacity:
            raise serializers.ValidationError('Room is full')
        if RoomAllocation.objects.filter(room=room, student=student).exists():
            raise serializers.ValidationError('Student is already assigned to this room')
        allocation = RoomAllocation.objects.create(
            student=student,
            room=room,
            assigned_by=self.context['request'].user
        )
        room.occupancy += 1
        room.save()
        return allocation


class MaintenanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceRequest
        fields = '__all__'


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
