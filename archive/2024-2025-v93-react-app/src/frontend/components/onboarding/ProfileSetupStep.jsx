import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

export function ProfileSetupStep({ onSubmit, isSubmitting }) {
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });
  
  const [formError, setFormError] = useState(null);
  const password = watch('password');
  
  const submitForm = (data) => {
    setFormError(null);
    
    // Remove confirmPassword before submitting
    const { confirmPassword, ...profileData } = data;
    
    try {
      onSubmit(profileData);
    } catch (err) {
      setFormError(err.message || 'Failed to complete profile setup');
    }
  };
  
  return (
    <div className="profile-setup-container">
      <h2>Create Your Profile</h2>
      <p className="setup-instructions">
        Please provide your information to complete the account setup.
      </p>
      
      <form onSubmit={handleSubmit(submitForm)} className="profile-form">
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            type="text"
            {...register('name', { 
              required: 'Name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' }
            })}
          />
          {errors.name && <span className="error-message">{errors.name.message}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
          />
          {errors.email && <span className="error-message">{errors.email.message}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            {...register('password', { 
              required: 'Password is required',
              minLength: { value: 8, message: 'Password must be at least 8 characters' },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                message: 'Password must include uppercase, lowercase, number and special character'
              }
            })}
          />
          {errors.password && <span className="error-message">{errors.password.message}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword', { 
              required: 'Please confirm your password',
              validate: value => value === password || 'Passwords do not match'
            })}
          />
          {errors.confirmPassword && <span className="error-message">{errors.confirmPassword.message}</span>}
        </div>
        
        {formError && <div className="form-error">{formError}</div>}
        
        <button 
          type="submit" 
          className="submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Account...' : 'Complete Setup'}
        </button>
      </form>
    </div>
  );
}

export default ProfileSetupStep;
