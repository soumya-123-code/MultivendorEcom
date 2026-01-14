"""
Authentication views for OTP-based login.
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import AnonRateThrottle
from drf_spectacular.utils import extend_schema, OpenApiResponse

from apps.accounts.serializers import (
    RequestOTPSerializer,
    VerifyOTPSerializer,
    TokenRefreshSerializer,
    LogoutSerializer,
)
from apps.accounts.services import AuthService
from core.utils.helpers import get_client_ip


class OTPRateThrottle(AnonRateThrottle):
    """Rate limiting for OTP requests."""
    rate = '5/minute'


class RequestOTPView(APIView):
    """
    Request OTP for email login.
    
    Send a 6-digit OTP to the provided email address.
    The OTP is valid for 5 minutes.
    """
    permission_classes = [AllowAny]
    throttle_classes = [OTPRateThrottle]
    
    @extend_schema(
        request=RequestOTPSerializer,
        responses={
            200: OpenApiResponse(description='OTP sent successfully'),
            400: OpenApiResponse(description='Validation error'),
            429: OpenApiResponse(description='Too many requests'),
        },
        tags=['Authentication']
    )
    def post(self, request):
        serializer = RequestOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        result = AuthService.request_otp(
            email=serializer.validated_data['email'],
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT')
        )
        
        return Response({
            'success': True,
            'data': result
        }, status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    """
    Verify OTP and get JWT tokens.
    
    Verify the OTP sent to email and receive access and refresh tokens.
    """
    permission_classes = [AllowAny]
    throttle_classes = [OTPRateThrottle]
    
    @extend_schema(
        request=VerifyOTPSerializer,
        responses={
            200: OpenApiResponse(description='OTP verified successfully'),
            400: OpenApiResponse(description='Invalid OTP'),
            401: OpenApiResponse(description='OTP expired or max attempts exceeded'),
        },
        tags=['Authentication']
    )
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        result = AuthService.verify_otp(
            email=serializer.validated_data['email'],
            otp=serializer.validated_data['otp'],
            ip_address=get_client_ip(request)
        )
        
        return Response({
            'success': True,
            'data': result
        }, status=status.HTTP_200_OK)


class TokenRefreshView(APIView):
    """
    Refresh access token.
    
    Use the refresh token to get a new access token.
    """
    permission_classes = [AllowAny]
    
    @extend_schema(
        request=TokenRefreshSerializer,
        responses={
            200: OpenApiResponse(description='Token refreshed successfully'),
            401: OpenApiResponse(description='Invalid refresh token'),
        },
        tags=['Authentication']
    )
    def post(self, request):
        serializer = TokenRefreshSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        result = AuthService.refresh_token(
            refresh_token=serializer.validated_data['refresh']
        )
        
        return Response({
            'success': True,
            'data': result
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    Logout user.
    
    Blacklist the refresh token to logout the user.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        request=LogoutSerializer,
        responses={
            200: OpenApiResponse(description='Logged out successfully'),
        },
        tags=['Authentication']
    )
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        result = AuthService.logout(
            user=request.user,
            refresh_token=serializer.validated_data.get('refresh')
        )
        
        return Response({
            'success': True,
            'data': result
        }, status=status.HTTP_200_OK)
