document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
        showError('Invalid reset link. Please request a new password reset.');
        return;
    }

    document.getElementById('resetToken').value = token;

    document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const password = e.target.querySelector('[name="password"]').value;
        const confirmPassword = e.target.querySelector('[name="confirmPassword"]').value;
        const submitButton = e.target.querySelector('button[type="submit"]');
        const messageDiv = document.getElementById('resetMessage') || createMessageDiv();

        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Resetting...';
            
            const response = await fetch('http://localhost:3000/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                showSuccess('Password reset successful! Redirecting to login...');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                showError(data.message || 'Failed to reset password');
            }
        } catch (error) {
            showError('Network error. Please try again.');
            console.error('Error:', error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Reset Password';
        }
    });

    function createMessageDiv() {
        const div = document.createElement('div');
        div.id = 'resetMessage';
        document.getElementById('resetPasswordForm').insertBefore(div, document.querySelector('button'));
        return div;
    }

    function showError(message) {
        const messageDiv = document.getElementById('resetMessage') || createMessageDiv();
        messageDiv.className = 'error-message';
        messageDiv.textContent = message;
    }

    function showSuccess(message) {
        const messageDiv = document.getElementById('resetMessage') || createMessageDiv();
        messageDiv.className = 'success-message';
        messageDiv.textContent = message;
    }
});
