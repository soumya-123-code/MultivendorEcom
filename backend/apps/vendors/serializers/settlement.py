"""
Vendor Settlement serializers.
"""
from rest_framework import serializers
from apps.vendors.models import VendorSettlement, VendorPayout, VendorLedger, CommissionRecord


class VendorLedgerSerializer(serializers.ModelSerializer):
    """Vendor ledger entry serializer."""

    class Meta:
        model = VendorLedger
        fields = [
            'id', 'vendor', 'entry_type', 'amount', 'balance_after',
            'reference_type', 'reference_id', 'reference_number',
            'description', 'notes', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class VendorSettlementSerializer(serializers.ModelSerializer):
    """Full settlement serializer."""
    vendor_name = serializers.CharField(source='vendor.store_name', read_only=True)

    class Meta:
        model = VendorSettlement
        fields = [
            'id', 'vendor', 'vendor_name', 'settlement_number',
            'period_start', 'period_end', 'frequency',
            'orders_count', 'items_count',
            'gross_amount', 'commission_amount', 'commission_rate',
            'refunds_amount', 'chargebacks_amount', 'fees_amount',
            'adjustments_amount', 'tax_on_commission', 'tds_amount',
            'net_payable', 'net_paid', 'status',
            'finalized_at', 'approved_at', 'paid_at',
            'notes', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'settlement_number', 'created_at', 'updated_at']


class VendorSettlementListSerializer(serializers.ModelSerializer):
    """Minimal settlement serializer for lists."""
    vendor_name = serializers.CharField(source='vendor.store_name', read_only=True)

    class Meta:
        model = VendorSettlement
        fields = [
            'id', 'vendor', 'vendor_name', 'settlement_number',
            'period_start', 'period_end',
            'orders_count', 'gross_amount', 'net_payable',
            'status', 'created_at',
        ]


class VendorPayoutSerializer(serializers.ModelSerializer):
    """Full payout serializer."""
    vendor_name = serializers.CharField(source='vendor.store_name', read_only=True)
    settlement_number = serializers.CharField(source='settlement.settlement_number', read_only=True)

    class Meta:
        model = VendorPayout
        fields = [
            'id', 'vendor', 'vendor_name', 'settlement', 'settlement_number',
            'payout_number', 'amount', 'currency', 'payment_method',
            'bank_name', 'bank_account_number', 'bank_ifsc', 'bank_account_holder',
            'upi_id', 'bank_reference', 'transaction_id', 'transaction_date',
            'status', 'failure_reason',
            'initiated_at', 'completed_at',
            'notes', 'created_at',
        ]
        read_only_fields = ['id', 'payout_number', 'created_at']


class CommissionRecordSerializer(serializers.ModelSerializer):
    """Commission record serializer."""
    vendor_name = serializers.CharField(source='vendor.store_name', read_only=True)
    order_number = serializers.CharField(source='vendor_order.order_number', read_only=True)

    class Meta:
        model = CommissionRecord
        fields = [
            'id', 'vendor', 'vendor_name', 'vendor_order', 'order_number',
            'settlement', 'order_amount', 'commission_rate', 'commission_amount',
            'tax_rate', 'tax_amount', 'is_settled', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class SettlementApprovalSerializer(serializers.Serializer):
    """Serializer for settlement approval actions."""
    notes = serializers.CharField(required=False, allow_blank=True)


class PayoutInitiateSerializer(serializers.Serializer):
    """Serializer for initiating payout."""
    payment_method = serializers.ChoiceField(choices=VendorPayout.PAYMENT_METHOD_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)
