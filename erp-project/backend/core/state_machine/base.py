"""
Base state machine implementation.
Simple state machine without external dependencies.
"""
from core.exceptions import StateTransitionError


class StateMachine:
    """
    Simple state machine class for managing order lifecycles.
    Can be extended for PO and SO state management.
    """
    states = []
    transitions = []
    initial_state = None
    
    def __init__(self, model, state_field='status'):
        """
        Initialize the state machine.
        
        Args:
            model: The Django model instance
            state_field: The field name that stores the state
        """
        self.model = model
        self.state_field = state_field
        self.state = getattr(model, state_field) or self.initial_state or (self.states[0] if self.states else None)
    
    @property
    def current_state(self):
        """Get the current state."""
        return self.state
    
    def can_transition_to(self, target_state):
        """
        Check if transition to target state is possible.
        """
        for transition in self.transitions:
            source = transition.get('source')
            dest = transition.get('dest')
            
            # Check if current state matches source
            if isinstance(source, list):
                source_match = self.current_state in source
            else:
                source_match = source == self.current_state or source == '*'
            
            if source_match and dest == target_state:
                return True
        return False
    
    def get_available_transitions(self):
        """
        Get list of available transitions from current state.
        """
        available = []
        for transition in self.transitions:
            source = transition.get('source')
            
            if source == '*' or source == self.current_state:
                available.append({
                    'trigger': transition.get('trigger'),
                    'destination': transition.get('dest'),
                })
            elif isinstance(source, list) and self.current_state in source:
                available.append({
                    'trigger': transition.get('trigger'),
                    'destination': transition.get('dest'),
                })
        return available
    
    def transition_to(self, new_state, save=True):
        """
        Transition to a new state.
        
        Args:
            new_state: The target state
            save: Whether to save the model after transition
        
        Raises:
            StateTransitionError: If transition is not valid
        """
        if not self.can_transition_to(new_state):
            raise StateTransitionError(
                f"Cannot transition from '{self.current_state}' to '{new_state}'"
            )
        
        old_state = self.state
        self.state = new_state
        setattr(self.model, self.state_field, new_state)
        
        if save:
            self.model.save(update_fields=[self.state_field])
        
        return old_state, new_state
    
    def force_state(self, state, save=True):
        """
        Force the state machine to a specific state (use with caution).
        """
        if state not in self.states:
            raise StateTransitionError(f"Invalid state: {state}")
        
        self.state = state
        setattr(self.model, self.state_field, state)
        
        if save:
            self.model.save(update_fields=[self.state_field])


class BaseStateMachineMixin:
    """
    Mixin to add state machine functionality to Django models.
    
    Usage:
        class MyModel(BaseStateMachineMixin, models.Model):
            status = models.CharField(...)
            
            STATE_MACHINE_CLASS = MyStateMachine
            STATE_FIELD = 'status'
    """
    STATE_MACHINE_CLASS = None
    STATE_FIELD = 'status'
    
    def get_state_machine(self):
        """Get or create state machine instance."""
        if not hasattr(self, '_state_machine'):
            if self.STATE_MACHINE_CLASS is None:
                raise NotImplementedError("STATE_MACHINE_CLASS must be defined")
            self._state_machine = self.STATE_MACHINE_CLASS(self, self.STATE_FIELD)
        return self._state_machine
    
    def can_transition_to(self, target_state):
        """Check if can transition to target state."""
        return self.get_state_machine().can_transition_to(target_state)
    
    def get_available_transitions(self):
        """Get available transitions from current state."""
        return self.get_state_machine().get_available_transitions()
    
    def transition_to(self, new_state, save=True):
        """Execute a state transition."""
        return self.get_state_machine().transition_to(new_state, save)
