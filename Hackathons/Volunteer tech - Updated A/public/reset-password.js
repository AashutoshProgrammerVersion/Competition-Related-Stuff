document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const form = document.getElementById('resetPasswordForm');
    
    if (!token) {
        showError('Invalid reset link. Please request a new password reset.');
        if (form) form.style.display = 'none';
        return;
    }

    if (form) {
        document.getElementById('resetToken').value = token;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const password = form.querySelector('[name="password"]').value;
            const confirmPassword = form.querySelector('[name="confirmPassword"]').value;
            const submitButton = form.querySelector('button[type="submit"]');
            
            try {
                if (password !== confirmPassword) {
                    throw new Error('Passwords do not match');
                }

                if (password.length < 6) {
                    throw new Error('Password must be at least 6 characters long');
                }

                submitButton.disabled = true;
                submitButton.textContent = 'Resetting...';
                
                const response = await fetch('http://localhost:3000/api/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, password })
                });

                const data = await response.json();
                
                if (response.ok && data.success) {
                    showSuccess('Password reset successful! Redirecting to login...');
                    setTimeout(() => {
                        window.location.href = 'index.html#login';
                    }, 2000);
                } else {
                    throw new Error(data.message || 'Failed to reset password');
                }
            } catch (error) {
                showError(error.message);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Reset Password';
            }
        });
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        insertMessage(errorDiv);
    }

    function showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        insertMessage(successDiv);
    }

    function insertMessage(messageDiv) {
        const container = document.querySelector('.form-container');
        const existingMessage = container.querySelector('.error-message, .success-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        container.insertBefore(messageDiv, form);
    }
});
