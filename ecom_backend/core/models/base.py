"""
Base models for all entities in the system.
"""
from django.db import models
from django.conf import settings


class TimeStampedModel(models.Model):
    """
    An abstract base class model that provides self-updating
    created_at and updated_at fields.
    """
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class BaseModel(TimeStampedModel):
    """
    An abstract base class model that provides self-updating
    created_at, updated_at fields, along with created_by, updated_by
    and is_active fields.
    """
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_created',
        editable=False
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_updated',
        editable=False
    )
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        # Get the user from kwargs if provided
        user = kwargs.pop('user', None)
        
        if user and user.is_authenticated:
            if not self.pk:
                self.created_by = user
            self.updated_by = user
        
        super().save(*args, **kwargs)


class SoftDeleteModel(BaseModel):
    """
    An abstract base class model that provides soft delete functionality.
    """
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_deleted'
    )

    class Meta:
        abstract = True

    def delete(self, *args, **kwargs):
        """Soft delete the object instead of actually deleting."""
        from django.utils import timezone
        
        user = kwargs.pop('user', None)
        hard_delete = kwargs.pop('hard_delete', False)
        
        if hard_delete:
            super().delete(*args, **kwargs)
        else:
            self.is_deleted = True
            self.deleted_at = timezone.now()
            if user and user.is_authenticated:
                self.deleted_by = user
            self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by'])

    def restore(self):
        """Restore a soft-deleted object."""
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by = None
        self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by'])


class OrderedModel(models.Model):
    """
    An abstract base class model that provides ordering functionality.
    """
    display_order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        abstract = True
        ordering = ['display_order']
