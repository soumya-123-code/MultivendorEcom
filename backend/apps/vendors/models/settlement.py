"""
Vendor Settlement and Payout models.
"""
from django.db import models
from django.conf import settings
from core.models import BaseModel


class VendorLedger(BaseModel):
    """
    Running ledger for vendor transactions.
    Tracks all credits (orders) and debits (payouts, fees, refunds).
    """
    ENTRY_TYPE_CHOICES = [
        ('credit', 'Credit'),
        ('debit', 'Debit'),
    ]

    REFERENCE_TYPE_CHOICES = [
        ('order', 'Order'),
        ('refund', 'Refund'),
        ('payout', 'Payout'),
        ('commission', 'Commission'),
        ('fee', 'Platform Fee'),
        ('adjustment', 'Adjustment'),
        ('chargeback', 'Chargeback'),
        ('bonus', 'Bonus'),
    ]

    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.CASCADE,
        related_name='ledger_entries'
    )

    entry_type = models.CharField(max_length=20, choices=ENTRY_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    balance_after = models.DecimalField(max_digits=12, decimal_places=2)

    reference_type = models.CharField(max_length=30, choices=REFERENCE_TYPE_CHOICES)
    reference_id = models.PositiveIntegerField(null=True, blank=True)
    reference_number = models.CharField(max_length=100, blank=True, null=True)

    description = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = 'vendor ledger entry'
        verbose_name_plural = 'vendor ledger entries'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['vendor', 'created_at']),
            models.Index(fields=['vendor', 'entry_type']),
            models.Index(fields=['reference_type', 'reference_id']),
        ]

    def __str__(self):
        return f"{self.vendor.store_name} - {self.entry_type} - {self.amount}"


class VendorSettlement(BaseModel):
    """
    Settlement record for a period.
    Groups multiple orders for payout.
    """
    SETTLEMENT_STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('processing', 'Processing'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('biweekly', 'Bi-Weekly'),
        ('monthly', 'Monthly'),
    ]

    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.CASCADE,
        related_name='settlements'
    )

    settlement_number = models.CharField(max_length=50, unique=True)
    period_start = models.DateField()
    period_end = models.DateField()
    frequency = models.CharField(
        max_length=20,
        choices=FREQUENCY_CHOICES,
        default='weekly'
    )

    # Order summary
    orders_count = models.PositiveIntegerField(default=0)
    items_count = models.PositiveIntegerField(default=0)

    # Financial summary
    gross_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text='Total order amount before deductions'
    )
    commission_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text='Platform commission'
    )
    commission_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text='Average commission rate for period'
    )

    # Deductions
    refunds_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text='Total refunds in period'
    )
    chargebacks_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    fees_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text='Platform fees, shipping deductions, etc.'
    )
    adjustments_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text='Manual adjustments (positive or negative)'
    )

    # Tax on commission
    tax_on_commission = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text='GST on commission'
    )
    tds_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text='TDS deducted'
    )

    # Final amounts
    net_payable = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text='Amount to be paid to vendor'
    )
    net_paid = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text='Amount actually paid'
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=SETTLEMENT_STATUS_CHOICES,
        default='draft'
    )

    # Workflow
    finalized_at = models.DateTimeField(null=True, blank=True)
    finalized_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='finalized_settlements'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_settlements'
    )
    paid_at = models.DateTimeField(null=True, blank=True)

    # Notes
    notes = models.TextField(blank=True, null=True)
    internal_notes = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = 'vendor settlement'
        verbose_name_plural = 'vendor settlements'
        ordering = ['-period_end', '-created_at']
        indexes = [
            models.Index(fields=['vendor', 'status']),
            models.Index(fields=['vendor', 'period_start', 'period_end']),
            models.Index(fields=['status', 'created_at']),
        ]

    def __str__(self):
        return f"{self.settlement_number} - {self.vendor.store_name}"

    def calculate_totals(self):
        """Calculate settlement totals from vendor orders."""
        from apps.sales_orders.models import VendorOrder

        orders = VendorOrder.objects.filter(
            vendor=self.vendor,
            settlement=self,
            status='delivered'
        )

        self.orders_count = orders.count()
        self.items_count = sum(o.items.count() for o in orders)
        self.gross_amount = sum(o.total_amount for o in orders)
        self.commission_amount = sum(o.commission_amount for o in orders)

        if self.gross_amount > 0:
            self.commission_rate = (self.commission_amount / self.gross_amount) * 100

        self.net_payable = (
            self.gross_amount
            - self.commission_amount
            - self.refunds_amount
            - self.chargebacks_amount
            - self.fees_amount
            + self.adjustments_amount
            - self.tax_on_commission
            - self.tds_amount
        )

        self.save()

    def generate_settlement_number(self):
        """Generate unique settlement number."""
        import uuid
        prefix = self.vendor.store_slug[:3].upper() if self.vendor.store_slug else 'STL'
        return f"{prefix}-{self.period_end.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"


class VendorPayout(BaseModel):
    """
    Actual payment record to vendor.
    """
    PAYOUT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('reversed', 'Reversed'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('bank_transfer', 'Bank Transfer'),
        ('upi', 'UPI'),
        ('neft', 'NEFT'),
        ('rtgs', 'RTGS'),
        ('imps', 'IMPS'),
        ('cheque', 'Cheque'),
    ]

    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.CASCADE,
        related_name='payouts'
    )
    settlement = models.ForeignKey(
        VendorSettlement,
        on_delete=models.CASCADE,
        related_name='payouts'
    )

    payout_number = models.CharField(max_length=50, unique=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR')

    payment_method = models.CharField(
        max_length=30,
        choices=PAYMENT_METHOD_CHOICES,
        default='bank_transfer'
    )

    # Bank details (snapshot at time of payout)
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    bank_account_number = models.CharField(max_length=50, blank=True, null=True)
    bank_ifsc = models.CharField(max_length=20, blank=True, null=True)
    bank_account_holder = models.CharField(max_length=200, blank=True, null=True)
    upi_id = models.CharField(max_length=100, blank=True, null=True)

    # Transaction details
    bank_reference = models.CharField(max_length=100, blank=True, null=True)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    transaction_date = models.DateTimeField(null=True, blank=True)

    # Status
    status = models.CharField(
        max_length=20,
        choices=PAYOUT_STATUS_CHOICES,
        default='pending'
    )
    failure_reason = models.TextField(blank=True, null=True)

    # Workflow
    initiated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='initiated_payouts'
    )
    initiated_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    notes = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = 'vendor payout'
        verbose_name_plural = 'vendor payouts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['vendor', 'status']),
            models.Index(fields=['settlement']),
            models.Index(fields=['status', 'created_at']),
        ]

    def __str__(self):
        return f"{self.payout_number} - {self.vendor.store_name} - {self.amount}"

    def snapshot_bank_details(self):
        """Snapshot vendor's bank details at time of payout."""
        vendor = self.vendor
        self.bank_name = vendor.bank_name
        self.bank_account_number = vendor.bank_account_number
        self.bank_ifsc = vendor.bank_ifsc
        self.bank_account_holder = vendor.bank_account_holder
        self.save(update_fields=[
            'bank_name', 'bank_account_number', 'bank_ifsc', 'bank_account_holder'
        ])


class CommissionRecord(BaseModel):
    """
    Individual commission record for tracking.
    Created for each order/transaction.
    """
    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.CASCADE,
        related_name='commission_records'
    )
    vendor_order = models.ForeignKey(
        'sales_orders.VendorOrder',
        on_delete=models.CASCADE,
        related_name='commission_records',
        null=True,
        blank=True
    )
    settlement = models.ForeignKey(
        VendorSettlement,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='commission_records'
    )

    order_amount = models.DecimalField(max_digits=12, decimal_places=2)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2)
    commission_amount = models.DecimalField(max_digits=12, decimal_places=2)

    # Tax on commission
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    is_settled = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'commission record'
        verbose_name_plural = 'commission records'
        ordering = ['-created_at']

    def __str__(self):
        return f"Commission - {self.vendor.store_name} - {self.commission_amount}"
